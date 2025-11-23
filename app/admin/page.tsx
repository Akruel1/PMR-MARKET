import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import AdminActions from './AdminActions';

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/');
  }

  const [pendingAds, approvedAds, rejectedAds, stats] = await Promise.all([
    prisma.ad.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        city: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ad.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.ad.findMany({
      where: { status: 'REJECTED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    Promise.all([
      prisma.ad.count(),
      prisma.ad.count({ where: { status: 'PENDING' } }),
      prisma.ad.count({ where: { status: 'APPROVED' } }),
      prisma.ad.count({ where: { status: 'REJECTED' } }),
      prisma.user.count(),
    ]),
  ]);

  const [totalAds, pendingCount, approvedCount, rejectedCount, totalUsers] = stats;

  const statCards = [
    { label: 'Всего объявлений', value: totalAds },
    { label: 'На модерации', value: pendingCount, accent: 'text-amber-300' },
    { label: 'Одобрено', value: approvedCount, accent: 'text-emerald-300' },
    { label: 'Отклонено', value: rejectedCount, accent: 'text-red-300' },
    { label: 'Пользователей', value: totalUsers },
  ];

  return (
    <div className="space-y-10 py-10">
      <section className="rounded-[32px] border border-neutral-900 bg-gradient-to-br from-[#05070f] via-[#070b15] to-[#0c1525] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary-300">PMR Market</p>
            <h1 className="text-4xl font-semibold text-white">Панель модератора</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Управляйте объявлениями, пользователями и Telegram-рассылками из одного места.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/reports"
              className="inline-flex items-center justify-center rounded-2xl border border-amber-500 px-6 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500 hover:text-white"
            >
              🚩 Жалобы
            </Link>
            <Link
              href="/admin/broadcast"
              className="inline-flex items-center justify-center rounded-2xl border border-primary-500 px-6 py-3 text-sm font-semibold text-primary-200 transition hover:bg-primary-500 hover:text-white"
            >
              📢 Рассылка в Telegram
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[28px] border border-neutral-900 bg-[#05070f] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${card.accent || ''}`}>{card.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-[32px] border border-neutral-900 bg-[#05070f] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">На модерации</h2>
            <p className="text-sm text-neutral-500">Объявления ожидают проверки</p>
          </div>
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm text-neutral-300">{pendingCount} шт.</span>
        </div>
        <div className="divide-y divide-neutral-900">
          {pendingAds.map((ad) => (
            <div key={ad.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Link 
                  href={`/admin/ads/${ad.id}`}
                  className="text-white hover:text-primary-400 transition font-semibold"
                >
                  {ad.title}
                </Link>
                <p className="text-sm text-neutral-500">
                  {ad.category.name} • {ad.city.name} • {new Date(ad.createdAt).toLocaleDateString('ru-RU')}
                </p>
                <p className="text-sm text-neutral-500">Продавец: {ad.user.name || ad.user.email}</p>
              </div>
              <AdminActions adId={ad.id} adTitle={ad.title} />
            </div>
          ))}
          {!pendingAds.length && (
            <div className="py-6 text-center text-sm text-neutral-500">Очередь модерации пуста 🎉</div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-6">
          <h3 className="text-xl font-semibold text-white">Недавно одобрено</h3>
          <div className="mt-4 space-y-3">
            {approvedAds.map((ad) => (
              <div key={ad.id} className="rounded-2xl border border-neutral-900 bg-[#070b15] p-4">
                <Link href={`/ads/${ad.slug}-${ad.id}`} className="font-semibold text-primary-200 hover:text-white">
                  {ad.title}
                </Link>
                <p className="text-sm text-neutral-500">
                  {ad.user.name || ad.user.email} • {new Date(ad.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-6">
          <h3 className="text-xl font-semibold text-white">Недавно отклонено</h3>
          <div className="mt-4 space-y-3">
            {rejectedAds.map((ad) => (
              <div key={ad.id} className="rounded-2xl border border-neutral-900 bg-[#070b15] p-4">
                <p className="font-semibold text-white">{ad.title}</p>
                <p className="text-sm text-neutral-500">
                  {ad.user.name || ad.user.email} • {new Date(ad.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
            {!rejectedAds.length && <p className="text-sm text-neutral-500">Отклонённых объявлений пока нет.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

