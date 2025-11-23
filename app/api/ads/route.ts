import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AdStatus, Currency, AdCondition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { searchAds } from '@/services/search.service';

const createAdSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price: z.preprocess((value) => Number(value), z.number().positive()),
  currency: z.nativeEnum(Currency),
  condition: z.nativeEnum(AdCondition),
  cityId: z.string().min(1),
  categoryId: z.string().min(1),
  latitude: z.preprocess(
    (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
    z.number().optional()
  ),
  longitude: z.preprocess(
    (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
    z.number().optional()
  ),
  imageUrls: z.array(z.string().url()).min(1).max(10),
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const data = createAdSchema.parse(body);

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
      },
    });

    return NextResponse.json(updatedAd, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating ad:', error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
