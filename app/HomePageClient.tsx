'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Search,
  CirclePlus,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PaginatedResponse, AdWithRelations } from '@/types';
import AdCard from '@/components/AdCard';
import Pagination from '@/components/Pagination';
import FloatingParticles from '@/components/FloatingParticles';
import VipBanner from '@/components/VipBanner';

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

type CityOption = {
  id: string;
  name: string;
  slug: string;
};

interface InitialFilters {
  search: string;
  categoryId: string;
  cityId: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
  minSellerRating: string;
  minAdRating: string;
}

interface HomePageClientProps {
  result: PaginatedResponse<AdWithRelations>;
  categories: CategoryOption[];
  cities: CityOption[];
  initialFilters: InitialFilters;
  vipAds: AdWithRelations[];
}

const FEATURED_CATEGORY_SLUGS = ['electronics', 'fashion', 'home-goods', 'local-produce', 'services', 'automotive'];

const conditionOptions = [
  { value: '', label: 'Любое' },
  { value: 'NEW', label: 'Новое' },
  { value: 'USED', label: 'Б/У' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Сначала новые' },
  { value: 'price-asc', label: 'По цене (возрастание)' },
  { value: 'price-desc', label: 'По цене (убывание)' },
];

export default function HomePageClient({
  result,
  categories,
  cities,
  initialFilters,
  vipAds,
}: HomePageClientProps) {
  const hasAds = result.data.length > 0;
  const totalPages = Math.max(1, result.pagination.totalPages || 1);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(initialFilters.search);
  const [priceRange, setPriceRange] = useState({
    min: initialFilters.minPrice,
    max: initialFilters.maxPrice,
  });

  useEffect(() => {
    setSearchValue(initialFilters.search);
    setPriceRange({
      min: initialFilters.minPrice,
      max: initialFilters.maxPrice,
    });
  }, [initialFilters]);

  const applyFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
          if (!value) {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        });

        params.delete('page');
        const queryString = params.toString();
        router.push(queryString ? `/?${queryString}` : '/');
      });
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    applyFilters({ search: searchValue.trim() || undefined });
  };

  const handlePriceApply = () => {
    applyFilters({
      minPrice: priceRange.min || undefined,
      maxPrice: priceRange.max || undefined,
    });
  };

  const clearFilters = () => {
    router.push('/');
  };

  const childToParentMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((parent) => {
      parent.children.forEach((child) => {
        map.set(child.id, parent.id);
      });
    });
    return map;
  }, [categories]);

  const selectedParentId = useMemo(() => {
    if (!initialFilters.categoryId) return null;
    if (categories.some((category) => category.id === initialFilters.categoryId)) {
      return initialFilters.categoryId;
    }
    return childToParentMap.get(initialFilters.categoryId) ?? null;
  }, [categories, childToParentMap, initialFilters.categoryId]);

  const selectedParentCategory = useMemo(() => {
    if (!selectedParentId) return null;
    return categories.find((category) => category.id === selectedParentId) ?? null;
  }, [categories, selectedParentId]);

  const featuredCategories = useMemo(() => {
    if (!categories.length) return [];
    const slugMap = new Map<string, CategoryOption>();
    categories.forEach((category) => slugMap.set(category.slug, category));

    const ordered: CategoryOption[] = FEATURED_CATEGORY_SLUGS.map((slug) => slugMap.get(slug)).filter(
      (category): category is CategoryOption => Boolean(category)
    );

    categories.forEach((category) => {
      if (ordered.length >= 6) return;
      if (!ordered.includes(category)) {
        ordered.push(category);
      }
    });

    return ordered.length ? ordered : categories.slice(0, 6);
  }, [categories]);

  const isParentActive = useCallback(
    (categoryId: string) => !!selectedParentId && selectedParentId === categoryId,
    [selectedParentId]
  );

  return (
    <div className="space-y-10 relative z-10">
      {/* Background pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0),
            linear-gradient(90deg, transparent 79px, rgba(255, 255, 255, 0.04) 81px, rgba(255, 255, 255, 0.04) 82px, transparent 84px),
            linear-gradient(rgba(255, 255, 255, 0.04) 79px, transparent 81px, transparent 82px, rgba(255, 255, 255, 0.04) 84px)
          `,
          backgroundSize: '50px 50px, 120px 120px, 120px 120px',
          backgroundPosition: '0 0, 0 0, 0 0'
        }}
      />
      <section className="relative overflow-hidden border-b border-neutral-900 bg-gradient-to-br from-dark-bg via-dark-bg2 to-[#0c101b]">
        <FloatingParticles />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 text-center lg:py-16">
          <p className="mx-auto flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-primary-200">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm transform rotate-45"></div>
            </div>
            PMR Market
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-dark-text md:text-5xl">
              PMR Market — найдёшь всё, что рядом
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-dark-textSecondary">
              Техника, одежда, мебель и услуги по всем городам ПМР. Пользуйся живым поиском и фильтрами, чтобы за пару секунд найти именно то, что нужно.
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-neutral-800 bg-dark-bg/70 p-4 shadow-lg shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Поиск товаров, регионов, производителей..."
                  className="w-full rounded-2xl border border-neutral-800 bg-dark-bg2 py-4 pl-12 pr-4 text-base text-dark-text placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {isPending ? 'Поиск...' : 'Найти'}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-300" />
                {initialFilters.cityId
                  ? `Город: ${cities.find((city) => city.id === initialFilters.cityId)?.name ?? 'Выбран'}`
                  : 'Все города ПМР'}
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                <span>Сделки | Безопасность | Telegram уведомления</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-dark-bg2/80 p-4 text-left">
              <p className="text-sm text-neutral-400">Активных объявлений</p>
              <p className="text-3xl font-bold text-dark-text">{result.pagination.total}</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-dark-bg2/80 p-4 text-left">
              <p className="text-sm text-neutral-400">Страница</p>
              <p className="text-3xl font-bold text-dark-text">
                {result.pagination.page}
                <span className="text-base font-medium text-neutral-500"> / {totalPages}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-dark-bg2/80 p-4 text-left">
              <p className="text-sm text-neutral-400">За сегодня добавлено</p>
              <p className="text-3xl font-bold text-dark-text">
                {result.data.filter((ad) => {
                  const createdAt = new Date(ad.createdAt);
                  const today = new Date();
                  return createdAt.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 pb-16">
        <VipBanner vipAds={vipAds} />
        
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-500">
              Featured categories
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
              Сбросить фильтры
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {featuredCategories.map((category) => {
              const active = isParentActive(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    applyFilters({
                      categoryId: active ? undefined : category.id,
                    })
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? 'bg-primary-500 text-white shadow shadow-primary-500/40'
                      : 'bg-dark-bg2 text-dark-textSecondary hover:bg-dark-bg'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {selectedParentCategory && selectedParentCategory.children.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-800 bg-dark-bg2/60 p-4">
              <p className="text-sm font-semibold text-dark-text">Подкатегории:</p>
              {selectedParentCategory.children.map((child) => {
                const active = initialFilters.categoryId === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={() =>
                      applyFilters({
                        categoryId: child.id,
                      })
                    }
                    className={`rounded-full px-3 py-1 text-sm transition ${
                      active
                        ? 'bg-primary-500/80 text-white'
                        : 'bg-dark-bg text-dark-textSecondary hover:bg-dark-bg'
                    }`}
                  >
                    {child.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 rounded-3xl border border-neutral-900 bg-dark-bg/80 p-6 shadow-inner shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-dark-textSecondary">
              <SlidersHorizontal className="h-5 w-5 text-primary-400" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Фильтры
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-dark-textSecondary">
                Город
                <select
                  value={initialFilters.cityId}
                  onChange={(e) =>
                    applyFilters({
                      cityId: e.target.value || undefined,
                    })
                  }
                  className="rounded-xl border border-neutral-800 bg-dark-bg2 px-3 py-2 text-sm text-dark-text focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Все города</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-dark-bg2 px-3 py-2">
                {conditionOptions.map((option) => {
                  const active = initialFilters.condition === option.value;
                  return (
                    <button
                      key={option.value || 'all'}
                      onClick={() =>
                        applyFilters({
                          condition: option.value || undefined,
                        })
                      }
                      className={`rounded-xl px-3 py-1 text-sm transition ${
                        active
                          ? 'bg-primary-500 text-white'
                          : 'text-dark-textSecondary hover:text-dark-text'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-dark-bg2 px-3 py-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                  placeholder="Мин"
                  className="w-20 bg-transparent text-sm text-dark-text placeholder:text-neutral-500 focus:outline-none"
                />
                <span className="text-neutral-600">—</span>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                  placeholder="Макс"
                  className="w-20 bg-transparent text-sm text-dark-text placeholder:text-neutral-500 focus:outline-none"
                />
                <button
                  onClick={handlePriceApply}
                  className="rounded-xl bg-primary-500/20 px-3 py-1 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/40"
                >
                  Применить
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-dark-textSecondary">
                Сортировка
                <select
                  value={initialFilters.sortBy === 'price' ? (initialFilters.sortOrder === 'asc' ? 'price-asc' : 'price-desc') : initialFilters.sortBy}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'price-asc') {
                      applyFilters({
                        sortBy: 'price',
                        sortOrder: 'asc',
                      });
                    } else if (value === 'price-desc') {
                      applyFilters({
                        sortBy: 'price',
                        sortOrder: 'desc',
                      });
                    } else {
                      applyFilters({
                        sortBy: value,
                        sortOrder: undefined,
                      });
                    }
                  }}
                  className="rounded-xl border border-neutral-800 bg-dark-bg2 px-3 py-2 text-sm text-dark-text focus:border-primary-500 focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-dark-textSecondary">
                Рейтинг продавца
                <select
                  value={initialFilters.minSellerRating || ''}
                  onChange={(e) =>
                    applyFilters({
                      minSellerRating: e.target.value || undefined,
                    })
                  }
                  className="rounded-xl border border-neutral-800 bg-dark-bg2 px-3 py-2 text-sm text-dark-text focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Любой</option>
                  <option value="1">1+ звезд</option>
                  <option value="2">2+ звезд</option>
                  <option value="3">3+ звезд</option>
                  <option value="4">4+ звезд</option>
                  <option value="5">5 звезд</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-dark-textSecondary">
                Рейтинг объявления
                <select
                  value={initialFilters.minAdRating || ''}
                  onChange={(e) =>
                    applyFilters({
                      minAdRating: e.target.value || undefined,
                    })
                  }
                  className="rounded-xl border border-neutral-800 bg-dark-bg2 px-3 py-2 text-sm text-dark-text focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Любой</option>
                  <option value="1">1+ звезд</option>
                  <option value="2">2+ звезд</option>
                  <option value="3">3+ звезд</option>
                  <option value="4">4+ звезд</option>
                  <option value="5">5 звезд</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Search className="h-4 w-4" />
            <span>
              Найдено {result.pagination.total} объявлений •{' '}
              {initialFilters.categoryId
                ? categories.find((category) => category.id === initialFilters.categoryId)?.name
                : 'Все категории'}
            </span>
          </div>
          <Link
            href="/ads/new"
            className="inline-flex items-center gap-2 rounded-full border border-primary-500 px-5 py-2 text-sm font-semibold text-primary-200 transition hover:bg-primary-500 hover:text-white"
          >
            <CirclePlus className="h-4 w-4" />
            Разместить объявление
          </Link>
        </div>

        {hasAds ? (
          <>
            <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                // Mix VIP ads randomly into the list
                const vipAdIds = new Set(vipAds.map(ad => ad.id));
                const regularAds = result.data.filter(ad => !vipAdIds.has(ad.id));
                const activeVipAds = vipAds.filter(ad => !ad.vipExpiresAt || new Date(ad.vipExpiresAt) >= new Date());
                
                // Randomly insert VIP ads (1-2 per page)
                const mixedAds = [...regularAds];
                const vipCount = Math.min(Math.floor(Math.random() * 2) + 1, activeVipAds.length);
                
                for (let i = 0; i < vipCount && activeVipAds.length > 0; i++) {
                  const randomVip = activeVipAds[Math.floor(Math.random() * activeVipAds.length)];
                  const insertIndex = Math.floor(Math.random() * (mixedAds.length + 1));
                  mixedAds.splice(insertIndex, 0, randomVip);
                }
                
                return mixedAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ));
              })()}
            </div>
            <Pagination currentPage={result.pagination.page} totalPages={totalPages} />
          </>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-800 bg-dark-bg2/60 px-8 py-16 text-center">
            <p className="text-2xl font-semibold text-dark-text">Ничего не нашли</p>
            <p className="mt-2 text-dark-textSecondary">
              Попробуйте изменить фильтры поиска или создайте собственное объявление.
            </p>
            <Link
              href="/ads/new"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-white transition hover:bg-primary-600"
            >
              <CirclePlus className="h-4 w-4" />
              Создать объявление
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

