import { prisma } from '@/lib/prisma';
import { AdFilters, PaginatedResponse, AdWithRelations } from '@/types';

/**
 * Search ads using PostgreSQL full-text search
 */
export async function searchAds(
  filters: AdFilters
): Promise<PaginatedResponse<AdWithRelations>> {
  const {
    search,
    categoryId,
    cityId,
    minPrice,
    maxPrice,
    condition,
    currency,
    dateFrom,
    minAdRating,
    minSellerRating,
    status,
    userId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;
  const take = limit;

  // Build where clause
  const where: any = {};

  if (status) {
    where.status = status;
  } else {
    // Default: only show approved ads unless user is viewing their own
    if (!userId) {
      where.status = 'APPROVED';
    }
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (cityId) {
    where.cityId = cityId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  if (condition) {
    where.condition = condition;
  }

  if (currency) {
    where.currency = currency;
  }

  if (dateFrom) {
    where.createdAt = {
      gte: dateFrom,
    };
  }

  // Full-text search using raw SQL for PostgreSQL tsvector
  if (search && search.trim()) {
    // Use ILIKE for simple search (works without tsvector)
    // For production, you can switch to tsvector for better performance
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Order by
  const orderBy: any = {};
  if (sortBy === 'price') {
    orderBy.price = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  // Execute queries with reviews for rating filtering
  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
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
        reviews: {
          select: {
            adRating: true,
            sellerRating: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.ad.count({ where }),
  ]);

  // Filter by ratings after fetching (because we need aggregated ratings)
  let filteredAds = ads;
  
  if (minAdRating !== undefined) {
    filteredAds = filteredAds.filter((ad) => {
      if (ad.reviews.length === 0) return false;
      const avgRating = ad.reviews.reduce((sum, r) => sum + r.adRating, 0) / ad.reviews.length;
      return avgRating >= minAdRating;
    });
  }

  if (minSellerRating !== undefined) {
    // Get seller ratings for all unique user IDs
    const userIds = [...new Set(filteredAds.map(ad => ad.userId))];
    const sellerRatingsMap = new Map<string, number>();
    
    for (const userId of userIds) {
      const sellerReviews = await prisma.review.findMany({
        where: { reviewedUserId: userId },
        select: { sellerRating: true },
      });
      if (sellerReviews.length > 0) {
        const avgRating = sellerReviews.reduce((sum, r) => sum + r.sellerRating, 0) / sellerReviews.length;
        sellerRatingsMap.set(userId, avgRating);
      }
    }
    
    filteredAds = filteredAds.filter((ad) => {
      const sellerRating = sellerRatingsMap.get(ad.userId);
      if (!sellerRating) return false;
      return sellerRating >= minSellerRating;
    });
  }

  // Adjust total count if filtering by ratings
  const adjustedTotal = (minAdRating !== undefined || minSellerRating !== undefined) 
    ? filteredAds.length 
    : total;

  return {
    data: filteredAds as AdWithRelations[],
    pagination: {
      page,
      limit,
      total: adjustedTotal,
      totalPages: Math.ceil(adjustedTotal / limit),
    },
  };
}

/**
 * Advanced full-text search using PostgreSQL tsvector (requires migration)
 * Use this if you've run the fulltext search migration
 */
export async function searchAdsFullText(
  filters: AdFilters
): Promise<PaginatedResponse<AdWithRelations>> {
  const {
    search,
    categoryId,
    cityId,
    minPrice,
    maxPrice,
    status,
    userId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;
  const take = limit;

  // Build base conditions for raw SQL
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`a.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  } else if (!userId) {
    conditions.push(`a.status = 'APPROVED'`);
  }

  if (categoryId) {
    conditions.push(`a."categoryId" = $${paramIndex}`);
    params.push(categoryId);
    paramIndex++;
  }

  if (cityId) {
    conditions.push(`a."cityId" = $${paramIndex}`);
    params.push(cityId);
    paramIndex++;
  }

  if (userId) {
    conditions.push(`a."userId" = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  if (minPrice !== undefined) {
    conditions.push(`a.price >= $${paramIndex}`);
    params.push(minPrice.toString());
    paramIndex++;
  }

  if (maxPrice !== undefined) {
    conditions.push(`a.price <= $${paramIndex}`);
    params.push(maxPrice.toString());
    paramIndex++;
  }

  // Full-text search with tsvector
  if (search && search.trim()) {
    conditions.push(`a.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
    params.push(search);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort order
  let orderClause = '';
  if (sortBy === 'price') {
    orderClause = `ORDER BY a.price ${sortOrder.toUpperCase()}`;
  } else {
    orderClause = `ORDER BY a."createdAt" ${sortOrder.toUpperCase()}`;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*)::int as count
    FROM "Ad" a
    ${whereClause}
  `;

  // Main query
  const mainQuery = `
    SELECT 
      a.*,
      json_agg(DISTINCT jsonb_build_object(
        'id', img.id,
        'url', img.url,
        'adId', img."adId",
        'order', img."order",
        'createdAt', img."createdAt"
      ) ORDER BY img."order") FILTER (WHERE img.id IS NOT NULL) as images,
      json_build_object(
        'id', cat.id,
        'name', cat.name,
        'slug', cat.slug,
        'createdAt', cat."createdAt",
        'updatedAt', cat."updatedAt"
      ) as category,
      json_build_object(
        'id', city.id,
        'name', city.name,
        'slug', city.slug,
        'createdAt', city."createdAt",
        'updatedAt', city."updatedAt"
      ) as city,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'image', u.image
      ) as user
    FROM "Ad" a
    LEFT JOIN "Image" img ON a.id = img."adId"
    LEFT JOIN "Category" cat ON a."categoryId" = cat.id
    LEFT JOIN "City" city ON a."cityId" = city.id
    LEFT JOIN "User" u ON a."userId" = u.id
    ${whereClause}
    GROUP BY a.id, cat.id, city.id, u.id
    ${orderClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(take.toString(), skip.toString());

  const [countResult, adsResult] = await Promise.all([
    prisma.$queryRawUnsafe<[{ count: number }]>(countQuery, ...params.slice(0, -2)),
    prisma.$queryRawUnsafe<any[]>(mainQuery, ...params),
  ]);

  const total = countResult[0]?.count || 0;

  // Transform results to match AdWithRelations type
  const ads = adsResult.map((row: any) => ({
    ...row,
    images: row.images || [],
    category: row.category,
    city: row.city,
    user: row.user,
  }));

  return {
    data: ads as AdWithRelations[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

