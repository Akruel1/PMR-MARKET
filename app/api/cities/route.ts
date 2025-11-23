import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cities - Get all cities
export async function GET(request: NextRequest) {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

// POST /api/cities - Create a new city (dynamic city creation)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'City name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const cityName = name.trim();
    const slug = cityName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if city already exists
    const existing = await prisma.city.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new city
    const city = await prisma.city.create({
      data: {
        name: cityName,
        slug,
      },
    });

    return NextResponse.json(city, { status: 201 });
  } catch (error: any) {
    console.error('Error creating city:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      // Try to find the existing city
      const { name } = await request.json();
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const existing = await prisma.city.findUnique({
        where: { slug },
      });
      
      if (existing) {
        return NextResponse.json(existing);
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create city' },
      { status: 500 }
    );
  }
}
