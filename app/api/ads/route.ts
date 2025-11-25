import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AdStatus, Currency, AdCondition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { searchAds } from '@/services/search.service';
import { handleApiError, withErrorHandling } from '@/lib/error-handler';
import { sanitizeInput, validateInputSecurity } from '@/lib/sanitize';
import { sendAdModerationNotificationToAdmins } from '@/lib/telegram';

const createAdSchema = z.object({
  title: z.string().min(3).max(200).refine(
    (val) => validateInputSecurity(val).safe,
    { message: 'Title contains unsafe content' }
  ),
  description: z.string().min(10).max(5000).refine(
    (val) => validateInputSecurity(val).safe,
    { message: 'Description contains unsafe content' }
  ),
  price: z.preprocess((value) => Number(value), z.number().positive().max(1000000)),
  currency: z.nativeEnum(Currency),
  condition: z.nativeEnum(AdCondition),
  cityId: z.string().min(1).max(50),
  categoryId: z.string().min(1).max(50),
  latitude: z.preprocess(
    (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
    z.number().min(-90).max(90).optional()
  ),
  longitude: z.preprocess(
    (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
    z.number().min(-180).max(180).optional()
  ),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  expiresAt: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      return new Date(value as string);
    },
    z.date().optional()
  ),
});

function parseNumber(param: string | null): number | undefined {
  if (!param) return undefined;
  const parsed = Number(param);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDateFilter(filter?: string | null): Date | undefined {
  if (!filter) return undefined;
  const now = new Date();
  switch (filter) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    }
    default:
      return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const result = await searchAds({
      search: params.get('search') || undefined,
      categoryId: params.get('categoryId') || undefined,
      cityId: params.get('cityId') || undefined,
      minPrice: parseNumber(params.get('minPrice')),
      maxPrice: parseNumber(params.get('maxPrice')),
      condition: (params.get('condition') as 'NEW' | 'USED') || undefined,
      currency: (params.get('currency') as Currency) || undefined,
      dateFrom: parseDateFilter(params.get('dateFilter')),
      minAdRating: parseNumber(params.get('minAdRating')),
      minSellerRating: parseNumber(params.get('minSellerRating')),
      sortBy: (params.get('sortBy') as 'createdAt' | 'price') || 'createdAt',
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseNumber(params.get('page')) || 1,
      limit: parseNumber(params.get('limit')) || 12,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireAuth();
  const body = await request.json();

  // Дополнительная проверка размера тела запроса
  const bodyString = JSON.stringify(body);
  if (bodyString.length > 50000) { // 50KB лимит
    throw new Error('Request body too large');
  }

  const data = createAdSchema.parse(body);
  
  // Санитизация данных
  data.title = sanitizeInput(data.title);
  data.description = sanitizeInput(data.description);

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { licenseAccepted: true, banned: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.banned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }

    if (!dbUser.licenseAccepted) {
      return NextResponse.json({ error: 'Please accept the user agreement before posting' }, { status: 403 });
    }

    // Check if category is "Отдых и события" (entertainment-events)
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      include: { parent: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const isEntertainmentParent = category.slug === 'entertainment-events';
    const isEntertainmentChild = category.parent?.slug === 'entertainment-events';
    const isEntertainmentCategory = isEntertainmentParent || isEntertainmentChild;

    // Validate entertainment category requirements
    if (isEntertainmentCategory) {
      // Check if subcategory is selected (must have parent, cannot select parent directly)
      if (isEntertainmentParent || !category.parentId) {
        return NextResponse.json({ 
          error: 'Для категории "Отдых и события" необходимо выбрать подкатегорию' 
        }, { status: 400 });
      }

      // Validate expiresAt is provided
      if (!data.expiresAt) {
        return NextResponse.json({ 
          error: 'Для категории "Отдых и события" необходимо указать время размещения объявления' 
        }, { status: 400 });
      }

      // Validate 48 hours limit
      const now = new Date();
      const maxExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      if (data.expiresAt > maxExpiry) {
        return NextResponse.json({ 
          error: 'Время размещения не может превышать 48 часов от текущего момента' 
        }, { status: 400 });
      }

      if (data.expiresAt <= now) {
        return NextResponse.json({ 
          error: 'Время размещения должно быть в будущем' 
        }, { status: 400 });
      }

      // Check 1 ad per day limit (exclude VIP users)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const entertainmentParent = category.parent?.slug === 'entertainment-events' 
        ? category.parent 
        : category;

      const todayAdsCount = await prisma.ad.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: todayStart,
          },
          category: {
            OR: [
              { id: entertainmentParent.id },
              { parentId: entertainmentParent.id },
            ],
          },
          isVip: false, // VIP users can post more
        },
      });

      if (todayAdsCount >= 1) {
        return NextResponse.json({ 
          error: 'В категории "Отдых и события" разрешено размещать только 1 объявление в день. Для размещения большего количества объявлений свяжитесь с нами: @pmrmarketsupport или pmrmarket@proton.me' 
        }, { status: 403 });
      }
    }

    // Create ad with temporary unique slug
    const tempSlug = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const ad = await prisma.ad.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        condition: data.condition,
        status: AdStatus.PENDING,
        cityId: data.cityId,
        categoryId: data.categoryId,
        latitude: data.latitude,
        longitude: data.longitude,
        expiresAt: data.expiresAt,
        slug: tempSlug,
        userId: user.id,
        images: {
          create: data.imageUrls.map((url, index) => ({
            url,
            order: index,
          })),
        },
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        city: true,
      },
    });

    // Update slug with ID to ensure uniqueness and match URL format
    const baseSlug = slugify(data.title);
    const finalSlug = `${baseSlug}-${ad.id}`;
    
    const updatedAd = await prisma.ad.update({
      where: { id: ad.id },
      data: { slug: finalSlug },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        city: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification to admins about new ad for moderation
    try {
      await sendAdModerationNotificationToAdmins(
        updatedAd.id,
        updatedAd.title,
        updatedAd.user?.name || 'Неизвестный пользователь',
        updatedAd.user?.email || 'Неизвестный email',
        updatedAd.category?.name || 'Неизвестная категория',
        updatedAd.city?.name || 'Неизвестный город',
        Number(updatedAd.price),
        updatedAd.currency
      );
    } catch (telegramError) {
      // Don't fail the ad creation if telegram notification fails
      console.error('Failed to send admin notification:', telegramError);
    }

    return NextResponse.json(updatedAd, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating ad:', error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
});
