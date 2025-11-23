'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, X } from 'lucide-react';
import type { AdWithRelations } from '@/types';

interface VipBannerProps {
  vipAds: AdWithRelations[];
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

export default function VipBanner({ vipAds }: VipBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Add info banner as last item
  const allItems = [
    ...vipAds.slice(0, 2), // First 2 VIP ads
    { id: 'info', isInfo: true }, // Info banner
  ];

  useEffect(() => {
    if (allItems.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allItems.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [allItems.length]);

  if (allItems.length === 0) return null;

  const currentItem = allItems[currentIndex];

  return (
    <>
      <div className="relative mx-auto max-w-6xl px-4 mb-6 overflow-hidden">
        <div className="relative h-32 rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 via-yellow-800/20 to-yellow-900/20 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {allItems.map((item, index) => {
              if ('isInfo' in item && item.isInfo) {
                return (
                  <div
                    key="info"
                    className="min-w-full flex items-center justify-center px-8 cursor-pointer"
                    onClick={() => setShowInfoModal(true)}
                  >
                    <div className="flex items-center gap-4 text-white">
                      <Crown className="h-8 w-8 text-yellow-400" />
                      <div>
                        <h3 className="text-lg font-bold">VIP объявления</h3>
                        <p className="text-sm text-yellow-200">Нажмите, чтобы узнать, как сюда попасть</p>
                      </div>
                    </div>
                  </div>
                );
              }

              const ad = item as AdWithRelations & { isVip?: boolean; vipExpiresAt?: Date | null };
              const coverImage = ad.images?.[0]?.url ?? '/logo.png';
              const href = ad.slug ? `/ads/${ad.slug}-${ad.id}` : `/ads/${ad.id}`;

              return (
                <Link
                  key={ad.id}
                  href={href}
                  className="min-w-full flex items-center gap-6 px-8 hover:bg-yellow-900/10 transition"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={coverImage}
                      alt={ad.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                      VIP
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{ad.title}</h3>
                    <p className="text-sm text-yellow-200 truncate">{ad.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xl font-bold text-yellow-400">
                        {formatPrice(ad.price, ad.currency ?? 'USD')}
                      </span>
                      <span className="text-sm text-neutral-300">{ad.city?.name || 'PMR'}</span>
                    </div>
                  </div>
                  <Crown className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Navigation dots */}
          {allItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {allItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition ${
                    index === currentIndex
                      ? 'w-8 bg-yellow-400'
                      : 'w-2 bg-yellow-400/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="relative max-w-2xl w-full rounded-2xl border-2 border-yellow-500 bg-[#0b101c] p-8">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Crown className="h-10 w-10 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">VIP объявления</h2>
              </div>

              <div className="space-y-4 text-neutral-300">
                <p className="text-lg">
                  VIP объявления — это платная услуга, которая позволяет вашему объявлению выделяться среди других.
                </p>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-yellow-400">Преимущества VIP:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Золотая обводка и пометка VIP</li>
                    <li>Отображение во всех категориях</li>
                    <li>Приоритетное размещение в списке</li>
                    <li>Повышенная видимость для покупателей</li>
                  </ul>
                </div>

                <div className="bg-dark-bg2 border border-neutral-700 rounded-xl p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white">Стоимость:</h3>
                  <p>
                    Цена зависит от времени нахождения объявления в VIP-статусе:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>1 день — от 50 MDL</li>
                    <li>3 дня — от 120 MDL</li>
                    <li>7 дней — от 250 MDL</li>
                    <li>30 дней — от 900 MDL</li>
                  </ul>
                </div>

                <div className="bg-primary-900/20 border border-primary-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-primary-400 mb-2">Как оформить:</h3>
                  <p className="mb-3">
                    Свяжитесь с нами в Telegram для оформления VIP-статуса:
                  </p>
                  <a
                    href="https://t.me/PMR_MARKET_BOT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-white font-semibold hover:bg-primary-600 transition"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.174 1.858-.924 6.33-1.304 8.392-.17.94-.504 1.254-.827 1.285-.699.062-1.229-.461-1.906-.903-1.056-.691-1.653-1.12-2.678-1.794-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559.099.014.19.064.263.157.09.117.123.274.09.431z"/>
                    </svg>
                    Открыть Telegram-бота
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

