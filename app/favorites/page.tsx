import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdCard from '@/components/AdCard';
import { AdWithRelations } from '@/types';
import { Heart } from 'lucide-react';

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  const ads = favorites.map((fav) => fav.ad as AdWithRelations);

  return (
    <div className="space-y-10 py-10">
      <section className="rounded-[32px] border border-neutral-900 bg-gradient-to-br from-[#05070f] via-[#070b15] to-[#0c1525] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary-500/10 p-4">
            <Heart className="h-8 w-8 text-primary-300 fill-primary-500" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary-300">PMR Market</p>
            <h1 className="text-4xl font-semibold text-white">Избранное</h1>
            <p className="mt-2 text-sm text-neutral-400">
              {ads.length > 0 ? `${ads.length} ${ads.length === 1 ? 'объявление' : ads.length < 5 ? 'объявления' : 'объявлений'}` : 'Пока ничего не добавлено'}
            </p>
          </div>
        </div>
      </section>

      {ads.length > 0 ? (
        <section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-[32px] border border-dashed border-neutral-800 bg-[#05070f] py-16 text-center">
          <Heart className="mx-auto h-16 w-16 text-neutral-700 mb-4" />
          <p className="text-xl font-semibold text-white mb-2">Нет избранных объявлений</p>
          <p className="text-neutral-400 mb-6">
            Добавляйте понравившиеся объявления в избранное, чтобы не потерять их
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600"
          >
            Найти объявления
          </a>
        </section>
      )}
    </div>
  );
}













