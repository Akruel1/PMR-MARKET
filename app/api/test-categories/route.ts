import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing categories API...');
    
    const categories = await prisma.category.findMany({
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' },
      ],
    });

    console.log(`📊 Found ${categories.length} categories in database`);
    
    return NextResponse.json({
      success: true,
      count: categories.length,
      categories: categories,
      message: `Found ${categories.length} categories`
    });
  } catch (error: any) {
    console.error('❌ Error in test-categories API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}


