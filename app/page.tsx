import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { searchAds } from '@/services/search.service';
import { sanitizeSearchQuery, sanitizeUrlParam } from '@/lib/sanitize';
import HomePageClient from './HomePageClient';

// SEO metadata for homepage
export const metadata: Metadata = {
  title: 'Marketplace - Buy and Sell Everything | PMR',
  description: 'Find great deals on new and used items. Buy and sell electronics, cars, furniture, and more in your local area. Trusted marketplace with verified sellers.',
  keywords: 'marketplace, buy, sell, classifieds, electronics, cars, furniture, local ads, PMR',
  openGraph: {
    title: 'Marketplace - Buy and Sell Everything',
    description: 'Find great deals on new and used items. Buy and sell electronics, cars, furniture, and more in your local area.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace - Buy and Sell Everything',
    description: 'Find great deals on new and used items. Buy and sell electronics, cars, furniture, and more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

interface PageProps {
  searchParams: {
    search?: string;
    categoryId?: string;
    cityId?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    currency?: string;
    dateFilter?: string;
    minAdRating?: string;
    minSellerRating?: string;
    sortBy?: 'createdAt' | 'price';
    sortOrder?: 'asc' | 'desc';
    page?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  // Calculate date filter
  let dateFilter = undefined;
  if (searchParams.dateFilter) {
    const now = new Date();
    switch (searchParams.dateFilter) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo;
        break;
    }
  }

  // Sanitize search parameters
  const sanitizedSearch = searchParams.search ? sanitizeSearchQuery(searchParams.search) : undefined;
  const sanitizedCategoryId = searchParams.categoryId ? sanitizeUrlParam(searchParams.categoryId) : undefined;
  const sanitizedCityId = searchParams.cityId ? sanitizeUrlParam(searchParams.cityId) : undefined;

  const [result, categories, cities, vipAds] = await Promise.all([
    searchAds({
      search: sanitizedSearch,
      categoryId: sanitizedCategoryId,
      cityId: sanitizedCityId,
      minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
      condition: searchParams.condition as 'NEW' | 'USED' | undefined,
      currency: searchParams.currency as 'USD' | 'EUR' | 'RUB' | 'MDL' | undefined,
      dateFrom: dateFilter,
      minAdRating: searchParams.minAdRating ? parseInt(searchParams.minAdRating) : undefined,
      minSellerRating: searchParams.minSellerRating ? parseInt(searchParams.minSellerRating) : undefined,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 12,
      sortBy: searchParams.sortBy || 'createdAt',
      sortOrder: searchParams.sortOrder || 'desc',
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.city.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.ad.findMany({
      where: {
        isVip: true,
        status: 'APPROVED',
        OR: [
          { vipExpiresAt: null },
          { vipExpiresAt: { gte: new Date() } },
        ],
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        category: true,
        city: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const initialFilters = {
    search: sanitizedSearch || '',
    categoryId: sanitizedCategoryId || '',
    cityId: sanitizedCityId || '',
    condition: searchParams.condition || '',
    minPrice: searchParams.minPrice || '',
    maxPrice: searchParams.maxPrice || '',
    sortBy: searchParams.sortBy || 'createdAt',
    sortOrder: searchParams.sortOrder || 'desc',
    minSellerRating: searchParams.minSellerRating || '',
    minAdRating: searchParams.minAdRating || '',
  };

  return (
    <HomePageClient
      result={result}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        children: category.children.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
        })),
      }))}
      cities={cities.map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
      }))}
      initialFilters={initialFilters}
      vipAds={vipAds}
    />
  );
}


