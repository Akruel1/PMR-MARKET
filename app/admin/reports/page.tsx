import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { Flag, User, FileText, CheckCircle2, Clock } from 'lucide-react';
import ReportActionButtons from '@/components/ReportActionButtons';

export default async function AdminReportsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/');
  }

  const [adReports, userReports, stats] = await Promise.all([
    prisma.report.findMany({
      where: { status: 'PENDING' },
      include: {
        ad: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            category: true,
            city: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.userReport.findMany({
      where: { status: 'PENDING' },
      include: {
        reportedUser: { select: { id: true, name: true, email: true, banned: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.userReport.count({ where: { status: 'PENDING' } }),
      prisma.userReport.count({ where: { status: 'RESOLVED' } }),
    ]),
  ]);

  const [pendingAdReports, resolvedAdReports, pendingUserReports, resolvedUserReports] = stats;

  return (
    <div className="space-y-10 py-10">
      <section className="rounded-[32px] border border-neutral-900 bg-gradient-to-br from-[#05070f] via-[#070b15] to-[#0c1525] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary-300">PMR Market</p>
            <h1 className="text-4xl font-semibold text-white">Жалобы и модерация</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Просматривайте и обрабатывайте жалобы на объявления и пользователей.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-800 px-6 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
          >
            ← Назад к панели
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[28px] border border-neutral-900 bg-[#05070f] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-300" />
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Жалобы на объявления</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{pendingAdReports}</p>
        </div>
        <div className="rounded-[28px] border border-neutral-900 bg-[#05070f] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-red-300" />
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Жалобы на пользователей</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-red-300">{pendingUserReports}</p>
        </div>
        <div className="rounded-[28px] border border-neutral-900 bg-[#05070f] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Обработано объявлений</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">{resolvedAdReports}</p>
        </div>
        <div className="rounded-[28px] border border-neutral-900 bg-[#05070f] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Обработано пользователей</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">{resolvedUserReports}</p>
        </div>
      </section>

      {/* Ad Reports */}
      <section className="space-y-4 rounded-[32px] border border-neutral-900 bg-[#05070f] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-300" />
              Жалобы на объявления
            </h2>
            <p className="text-sm text-neutral-500">Объявления, на которые поступили жалобы</p>
          </div>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
            {pendingAdReports} ожидают
          </span>
        </div>
        <div className="divide-y divide-neutral-900">
          {adReports.map((report) => (
            <div key={report.id} className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-400" />
                    <Link
                      href={`/ads/${report.ad.slug}-${report.ad.id}`}
                      className="font-semibold text-primary-200 hover:text-white"
                    >
                      {report.ad.title}
                    </Link>
                  </div>
                  <p className="text-sm text-neutral-400">{report.reason}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span>
                      Категория: <span className="text-neutral-300">{report.ad.category.name}</span>
                    </span>
                    <span>
                      Город: <span className="text-neutral-300">{report.ad.city.name}</span>
                    </span>
                    <span>
                      Продавец: <span className="text-neutral-300">{report.ad.user.name || report.ad.user.email}</span>
                    </span>
                    <span>
                      Жалобщик: <span className="text-neutral-300">{report.user.name || report.user.email}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ReportActionButtons reportId={report.id} type="ad" />
                </div>
              </div>
            </div>
          ))}
          {!adReports.length && (
            <div className="py-6 text-center text-sm text-neutral-500">
              Нет жалоб на объявления, ожидающих обработки 🎉
            </div>
          )}
        </div>
      </section>

      {/* User Reports */}
      <section className="space-y-4 rounded-[32px] border border-neutral-900 bg-[#05070f] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <User className="h-6 w-6 text-red-300" />
              Жалобы на пользователей
            </h2>
            <p className="text-sm text-neutral-500">Пользователи, на которых поступили жалобы</p>
          </div>
          <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">
            {pendingUserReports} ожидают
          </span>
        </div>
        <div className="divide-y divide-neutral-900">
          {userReports.map((report) => (
            <div key={report.id} className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-400" />
                    <Link
                      href={`/profile?userId=${report.reportedUser.id}`}
                      className="font-semibold text-primary-200 hover:text-white"
                    >
                      {report.reportedUser.name || report.reportedUser.email}
                    </Link>
                    {report.reportedUser.banned && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">Заблокирован</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400">{report.reason}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span>
                      Жалобщик: <span className="text-neutral-300">{report.reporter.name || report.reporter.email}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ReportActionButtons reportId={report.id} type="user" />
                </div>
              </div>
            </div>
          ))}
          {!userReports.length && (
            <div className="py-6 text-center text-sm text-neutral-500">
              Нет жалоб на пользователей, ожидающих обработки 🎉
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


