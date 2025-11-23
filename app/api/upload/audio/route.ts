import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadImage } from '@/services/cloudinary.service';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return NextResponse.json(
        { error: 'Audio upload service not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (audio)
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // Validate file size (10MB for audio)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    try {
      const result = await uploadImage(file, {
        folder: 'pmr-market/audio',
        resourceType: 'video', // Cloudinary uses 'video' for audio files
        format: 'webm', // Preserve original format
      });

      if (!result?.secure_url) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
      }

      return NextResponse.json({ url: result.secure_url, duration: result.duration });
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return NextResponse.json(
        { error: error.message || 'Upload failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload audio' },
      { status: 500 }
    );
  }
}

