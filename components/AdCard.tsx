'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MapPin, Clock } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import AdminDeleteButton from './AdminDeleteButton';
import type { AdWithRelations } from '@/types';

interface AdCardProps {
  ad: AdWithRelations;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });

const RELATIVE_TIME_RANGES: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
];

function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = Date.now();
  const diff = date.getTime() - now;
  const diffAbs = Math.abs(diff);

  for (const range of RELATIVE_TIME_RANGES) {
    if (diffAbs >= range.ms || range.unit === 'second') {
      const value = Math.round(diff / range.ms);
      return relativeTimeFormatter.format(value, range.unit);
    }
  }

  return relativeTimeFormatter.format(0, 'second');
}

function formatPrice(value?: number | null, currency: string = 'USD') {
  if (value === null || value === undefined) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${value} ${currency}`;
  }
}

export default function AdCard({ ad }: AdCardProps) {
  const coverImage = ad.images?.[0]?.url ?? '/logo.png';
  const href = ad.slug ? `/ads/${ad.slug}-${ad.id}` : `/ads/${ad.id}`;
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleCardClick = () => {
    router.push(href);
  };

  const isVip = ad.isVip && (!ad.vipExpiresAt || new Date(ad.vipExpiresAt) >= new Date());

  return (
    <div
      onClick={handleCardClick}
      className={`group flex h-full flex-col overflow-hidden rounded-[32px] border-2 ${
        isVip
          ? 'border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-[#0b101c] shadow-[0_20px_45px_rgba(234,179,8,0.3)]'
          : 'border-neutral-900 bg-[#0b101c] shadow-[0_20px_45px_rgba(0,0,0,0.45)]'
      } transition hover:-translate-y-1 hover:border-primary-500 cursor-pointer relative`}
    >
      {isVip && (
        <div className="absolute top-4 left-4 z-10 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          VIP
        </div>
      )}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={coverImage}
          alt={ad.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
          {ad.category?.name || 'Featured'}
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
            {ad.condition === 'NEW' ? 'New' : 'Used'}
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton adId={ad.id} />
          </div>
          {isAdmin && (
            <div onClick={(e) => e.stopPropagation()}>
              <AdminDeleteButton
                adId={ad.id}
                adTitle={ad.title}
                variant="icon"
                onDeleted={() => router.refresh()}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">{ad.title}</h3>
            <p className="text-sm text-neutral-400 line-clamp-2">{ad.description}</p>
          </div>
          <span className="text-right text-lg font-bold text-white">{formatPrice(ad.price, ad.currency ?? 'USD')}</span>
        </div>

        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-400" />
            {ad.city?.name || 'PMR'}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-400" />
            {formatRelativeTime(ad.createdAt)}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#080c16] p-3 text-sm text-neutral-400">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Seller</p>
            <p className="text-white">{ad.user?.name ?? 'Unknown'}</p>
          </div>
          <Link
            href={ad.userId ? `/messages?userId=${ad.userId}&adId=${ad.id}` : '/messages'}
            onClick={(e) => e.stopPropagation()}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600"
          >
            Связаться
          </Link>
        </div>
      </div>
    </div>
  );
}

