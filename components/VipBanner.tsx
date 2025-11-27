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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showInfoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showInfoModal]);

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
        <div className="relative h-28 sm:h-32 rounded-xl sm:rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 via-yellow-800/20 to-yellow-900/20 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {allItems.map((item, index) => {
              if ('isInfo' in item && item.isInfo) {
                return (
                  <div
                    key="info"
                    className="min-w-full flex items-center justify-center px-4 sm:px-8 cursor-pointer active:bg-yellow-900/10 transition"
                    onClick={() => setShowInfoModal(true)}
                  >
                    <div className="flex items-center gap-2 sm:gap-4 text-white">
                      <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold truncate">VIP объявления</h3>
                        <p className="text-xs sm:text-sm text-yellow-200 truncate">Нажмите, чтобы узнать, как сюда попасть</p>
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
                  className="min-w-full flex items-center gap-3 sm:gap-6 px-4 sm:px-8 hover:bg-yellow-900/10 active:bg-yellow-900/20 transition"
                >
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={coverImage}
                      alt={ad.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-yellow-500 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      VIP
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-lg font-semibold text-white truncate">{ad.title}</h3>
                    <p className="text-xs sm:text-sm text-yellow-200 truncate hidden sm:block">{ad.description}</p>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
                      <span className="text-base sm:text-xl font-bold text-yellow-400">
                        {formatPrice(Number(ad.price), ad.currency ?? 'USD')}
                      </span>
                      <span className="text-xs sm:text-sm text-neutral-300 truncate">{ad.city?.name || 'PMR'}</span>
                    </div>
                  </div>
                  <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Navigation dots */}
          {allItems.length > 1 && (
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2">
              {allItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition ${
                    index === currentIndex
                      ? 'w-6 sm:w-8 bg-yellow-400'
                      : 'w-1.5 sm:w-2 bg-yellow-400/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="relative max-w-2xl w-full rounded-2xl border-2 border-yellow-500 bg-[#0b101c] p-4 sm:p-6 md:p-8 my-auto">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-neutral-400 hover:text-white z-10"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-yellow-400" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">VIP объявления</h2>
              </div>

              <div className="space-y-3 sm:space-y-4 text-neutral-300">
                <p className="text-sm sm:text-base md:text-lg">
                  VIP объявления — это платная услуга, которая позволяет вашему объявлению выделяться среди других.
                </p>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 sm:p-4 space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-400">Преимущества VIP:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm sm:text-base">
                    <li>Золотая обводка и пометка VIP</li>
                    <li>Отображение во всех категориях</li>
                    <li>Приоритетное размещение в списке</li>
                    <li>Повышенная видимость для покупателей</li>
                  </ul>
                </div>

                <div className="bg-dark-bg2 border border-neutral-700 rounded-xl p-3 sm:p-4 space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Стоимость:</h3>
                  <p className="text-sm sm:text-base">
                    Цена зависит от времени нахождения объявления в VIP-статусе:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm sm:text-base">
                    <li>1 день — от 50 RUB</li>
                    <li>3 дня — от 120 RUB</li>
                    <li>7 дней — от 250 RUB</li>
                    <li>30 дней — от 900 RUB</li>
                  </ul>
                </div>

                <div className="bg-primary-900/20 border border-primary-500/30 rounded-xl p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-primary-400 mb-2">Как оформить:</h3>
                  <p className="mb-3 text-sm sm:text-base">
                    Свяжитесь с нами для оформления VIP-статуса:
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    <a
                      href="https://t.me/pmrmarketsupport"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm md:text-base text-white font-semibold hover:bg-primary-600 transition w-full justify-center"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.174 1.858-.924 6.33-1.304 8.392-.17.94-.504 1.254-.827 1.285-.699.062-1.229-.461-1.906-.903-1.056-.691-1.653-1.12-2.678-1.794-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559.099.014.19.064.263.157.09.117.123.274.09.431z"/>
                      </svg>
                      Telegram: @pmrmarketsupport
                    </a>
                    <a
                      href="mailto:pmrmarket@proton.me"
                      className="inline-flex items-center gap-2 rounded-xl bg-secondary-500 px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm md:text-base text-white font-semibold hover:bg-secondary-600 transition w-full justify-center"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      Email: pmrmarket@proton.me
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

