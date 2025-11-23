'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{ id: string; url: string }>;
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSlide, setAutoSlide] = useState(true);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (!autoSlide || isFullscreen || images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoSlide, isFullscreen, images.length]);

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
    setAutoSlide(false);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
    setAutoSlide(false);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    setAutoSlide(false);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  if (images.length === 0) {
    return (
      <div className="relative w-full h-96 bg-dark-bg2 rounded-lg flex items-center justify-center">
        <span className="text-neutral-500">No images</span>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="relative w-full bg-dark-bg2 rounded-lg overflow-hidden group">
        <div className="relative aspect-video">
          <Image
            src={images[selectedIndex].url}
            alt={`${title} - Image ${selectedIndex + 1}`}
            fill
            className="object-contain cursor-pointer"
            onClick={openFullscreen}
            sizes="(max-width: 768px) 100vw, 80vw"
            unoptimized={images[selectedIndex].url.includes('placeholder.com')}
          />
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => {
                  setSelectedIndex(index);
                  setAutoSlide(false);
                }}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-primary-500 scale-105'
                    : 'border-transparent hover:border-neutral-600'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={img.url.includes('placeholder.com')}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10"
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="relative w-full h-full max-w-7xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full">
              <Image
                src={images[selectedIndex].url}
                alt={`${title} - Fullscreen ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized={images[selectedIndex].url.includes('placeholder.com')}
              />

              {/* Fullscreen navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-lg">
                    {selectedIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

















