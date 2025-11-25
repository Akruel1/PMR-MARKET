import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { ensureUserAccountCode } from '@/lib/account-code';
import AdCard from '@/components/AdCard';
import ProfileAdCard from '@/components/ProfileAdCard';
import SellerRating from '@/components/SellerRating';
import ReportUserButton from '@/components/ReportUserButton';
import BanUserButton from '@/components/BanUserButton';
import AccountCodeDisplay from '@/components/AccountCodeDisplay';
import ProfileTabs from '@/components/ProfileTabs';
import type { AdWithRelations } from '@/types';

function formatDate(date: Date | null | undefined) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { userId?: string; tab?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = searchParams?.userId || session?.user?.id;
  const activeTab = (searchParams?.tab || 'ads') as 'ads' | 'favorites' | 'messages';

  if (!userId) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          ads: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) {
    redirect('/');
  }

  const isOwner = session?.user?.id === userId;

  let accountCode: string | null = null;
  if (isOwner) {
    accountCode = await ensureUserAccountCode(userId);
  } else if (user.accountCode) {
    accountCode = user.accountCode;
  }

  // Fetch data based on active tab
  let myAds: any[] = [];
  let favorites: any[] = [];

  if (activeTab === 'ads' || !isOwner) {
    myAds = await prisma.ad.findMany({
      where: {
        userId,
        ...(isOwner ? {} : { status: 'APPROVED' }),
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        category: true,
        city: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (activeTab === 'favorites' && isOwner) {
    const favoritesData = await prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        ad: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            category: true,
            city: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                favorites: true,
                views: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    favorites = favoritesData.map((fav) => fav.ad);
  }

  return (
    <div className="space-y-10 py-10">
      <section className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 gap-4">
            {user.image ? (
              <img src={user.image} alt={user.name ?? 'User'} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-500/10 text-3xl font-semibold text-primary-200">
                {user.name?.[0] || 'U'}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                {isOwner ? 'My profile' : 'Seller profile'}
              </p>
              <h1 className="text-3xl font-semibold text-white">{user.name || 'Пользователь'}</h1>
              <p className="text-sm text-neutral-400">{user.email}</p>
              <SellerRating userId={user.id} />
              <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                <span>На платформе с {formatDate(user.createdAt)}</span>
                <span>{user._count.ads} объявл.</span>
                <span>{user._count.favorites} избранных</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isOwner && session?.user && (
              <>
                <Link
                  href={`/messages?userId=${user.id}`}
                  className="rounded-2xl border border-neutral-800 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-500"
                >
                  Написать
                </Link>
                <ReportUserButton userId={user.id} userName={user.name || user.email || 'User'} />
                {session.user.role === 'ADMIN' && (
                  <BanUserButton userId={user.id} userName={user.name || user.email || 'User'} />
                )}
              </>
            )}
            {isOwner && (
              <Link
                href="/ads/new"
                className="rounded-2xl bg-primary-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600"
              >
                + Новое объявление
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-900 bg-[#080c16] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Активные объявления</p>
            <p className="text-3xl font-semibold text-white">{user._count.ads}</p>
          </div>
          <div className="rounded-2xl border border-neutral-900 bg-[#080c16] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Избранное</p>
            <p className="text-3xl font-semibold text-white">{user._count.favorites}</p>
          </div>
          <div className="rounded-2xl border border-neutral-900 bg-[#080c16] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Статус</p>
            <p className="text-lg font-semibold text-white">{user.banned ? 'Заблокирован' : 'Активен'}</p>
          </div>
        </div>

        {isOwner && accountCode && (
          <div className="mt-6 rounded-[28px] border border-neutral-900 bg-[#070b15] p-5">
            <AccountCodeDisplay accountCode={accountCode} />
          </div>
        )}
      </section>

      {/* Tabs */}
      {isOwner && (
        <section>
          <ProfileTabs activeTab={activeTab} userId={userId} isOwner={isOwner} />
        </section>
      )}

      {/* Content based on tab */}
      <section>
        {activeTab === 'messages' && isOwner ? (
          <div className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-8 text-center">
            <p className="text-neutral-400 mb-4">Перейдите в раздел сообщений</p>
            <Link
              href="/messages"
              className="inline-flex items-center justify-center rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              Открыть сообщения
            </Link>
          </div>
        ) : activeTab === 'favorites' && isOwner ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Избранное</p>
                <h2 className="text-2xl font-semibold text-white">Мои избранные объявления</h2>
              </div>
            </div>
            {favorites.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favorites.map((ad) => (
                  <AdCard key={ad.id} ad={ad as AdWithRelations} />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-dashed border-neutral-800 bg-[#05070f] py-16 text-center">
                <p className="text-lg text-neutral-400">У вас пока нет избранных объявлений.</p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600"
                >
                  Найти объявления
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Объявления</p>
                <h2 className="text-2xl font-semibold text-white">
                  {isOwner ? 'Мои публикации' : 'Объявления продавца'}
                </h2>
              </div>
              {isOwner && (
                <Link
                  href="/ads/new"
                  className="rounded-2xl border border-neutral-800 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-500"
                >
                  Добавить объявление
                </Link>
              )}
            </div>

            {myAds.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myAds.map((ad) => (
                  <ProfileAdCard key={ad.id} ad={ad as AdWithRelations} isOwner={isOwner} />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-dashed border-neutral-800 bg-[#05070f] py-16 text-center">
                <p className="text-lg text-neutral-400">
                  {isOwner ? 'У вас ещё нет объявлений.' : 'У продавца пока нет активных объявлений.'}
                </p>
                {isOwner && (
                  <Link
                    href="/ads/new"
                    className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600"
                  >
                    Создать объявление
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
