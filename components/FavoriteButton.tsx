'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';

interface FavoriteButtonProps {
  adId: string;
  className?: string;
  variant?: 'icon' | 'cta';
}

export default function FavoriteButton({
  adId,
  className = '',
  variant = 'icon',
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkFavorite();
    }
  }, [session, adId]);

  const checkFavorite = async () => {
    try {
      const response = await fetch(`/api/favorites/${adId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const toggleFavorite = async () => {
    if (!session?.user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/favorites/${adId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
        toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites');
      } else {
        throw new Error('Failed to toggle favorite');
      }
    } catch (error) {
      toast.error('Failed to update favorite');
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    variant === 'cta'
      ? 'flex items-center justify-center gap-2 rounded-2xl border border-neutral-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em]'
      : 'flex items-center justify-center rounded-full w-8 h-8';

  const stateClasses =
    isFavorite && variant === 'cta'
      ? 'bg-red-500/20 text-red-200 border-red-500'
      : isFavorite
        ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-110'
        : variant === 'cta'
          ? 'bg-[#0b101c] text-white hover:border-primary-500'
          : 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:scale-110';

  const buttonClasses = `${baseClasses} ${stateClasses} ${className || ''}`;

  if (!session?.user) {
    if (variant === 'cta') {
      return (
        <button
          disabled
          className="w-full rounded-2xl border border-neutral-800 bg-dark-bg2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500"
          title="Sign in to add favorites"
        >
          <Heart className="h-5 w-5 inline mr-2" />
          <span>Sign in to add to Favorites</span>
        </button>
      );
    }
    return (
      <button
        disabled
        className="flex items-center justify-center rounded-full w-8 h-8 bg-black/40 backdrop-blur-sm text-white opacity-50 cursor-not-allowed"
        title="Sign in to add favorites"
      >
        <Heart className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={loading}
      className={buttonClasses}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
      {variant === 'cta' && (
        <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
      )}
    </button>
  );
}

