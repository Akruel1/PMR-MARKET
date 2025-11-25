import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/error-handler';
import { sanitizeInput } from '@/lib/sanitize';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  // Sanitize input
  const sanitizedQuery = sanitizeInput(query);
  
  try {
    // Search in ad titles and descriptions
    const ads = await prisma.ad.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            title: {
              contains: sanitizedQuery,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: sanitizedQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        title: true,
      },
      take: 10,
      distinct: ['title'],
    });

    // Search in categories
    const categories = await prisma.category.findMany({
      where: {
        name: {
          contains: sanitizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        slug: true,
      },
      take: 5,
    });

    // Search in cities
    const cities = await prisma.city.findMany({
      where: {
        name: {
          contains: sanitizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        slug: true,
      },
      take: 5,
    });

    // Combine and format suggestions
    const suggestions = [
      ...ads.map(ad => ({
        type: 'ad',
        text: ad.title,
        value: ad.title,
      })),
      ...categories.map(category => ({
        type: 'category',
        text: category.name,
        value: category.name,
        slug: category.slug,
      })),
      ...cities.map(city => ({
        type: 'city',
        text: city.name,
        value: city.name,
        slug: city.slug,
      })),
    ];

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, 10);

    return NextResponse.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Error in autocomplete search:', error);
    return NextResponse.json({ suggestions: [] });
  }
});
