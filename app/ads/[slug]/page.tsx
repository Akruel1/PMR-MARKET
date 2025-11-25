import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import ImageGallery from './ImageGallery';
import FavoriteButton from '@/components/FavoriteButton';
import SellerRating from '@/components/SellerRating';
import ReportButton from '@/components/ReportButton';
import AdminDeleteButton from '@/components/AdminDeleteButton';
import AdminVipButton from '@/components/AdminVipButton';
import ReviewsSection from '@/components/ReviewsSection';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, MapPin, ShieldCheck, Tag } from 'lucide-react';

interface PageProps {
  params: { slug: string };
}

const cuidRegex = /^c[a-z0-9]{24}$/i;

function parseSlugParam(param: string) {
  const match = param.match(/(.*)-([a-z0-9]{25})$/i);
  if (match && cuidRegex.test(match[2])) {
    return {
      slug: match[1],
      id: match[2],
    };
  }
  return {
    slug: param,
    id: undefined,
  };
}

async function getAd(slugParam: string) {
  const { slug, id } = parseSlugParam(slugParam);

  // Try to find by full slug first (slug-id format)
  let ad = await prisma.ad.findFirst({
    where: {
      OR: [
        { slug: slugParam }, // Try exact match first
        { slug }, // Try parsed slug
        ...(id ? [{ id }] : []), // Try by ID if available
      ],
    },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      category: true,
      city: true,
      user: true,
      tags: {
        include: { tag: true },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          favorites: true,
          views: true,
        },
      },
    },
  });

  return ad;
}

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const ad = await getAd(params.slug);
  if (!ad) {
    return {
      title: 'Объявление не найдено | PMR Market',
    };
  }

  return {
    title: `${ad.title} | PMR Market`,
    description: ad.description.slice(0, 160),
    openGraph: {
      title: ad.title,
      description: ad.description.slice(0, 160),
      images: ad.images.map((img) => img.url),
    },
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default async function AdDetailsPage({ params }: PageProps) {
  const ad = await getAd(params.slug);
  if (!ad) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: ad.category?.name || 'Category', href: `/?categoryId=${ad.categoryId}` },
    { label: ad.title },
  ];

  return (
    <div className="container-custom py-10 space-y-10">
      <nav className="flex items-center gap-2 text-sm text-neutral-500">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.label} className="flex items-center gap-2">
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-white">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-white">{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && <span className="text-neutral-700">/</span>}
          </span>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <ImageGallery
            images={ad.images.length ? ad.images : [{ id: 'placeholder', url: '/logo.png' }]}
            title={ad.title}
          />

          <div className="rounded-[32px] border border-neutral-900 bg-[#0b101c] p-8 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.35em] text-primary-300">Featured</span>
                {ad.isVip && (!ad.vipExpiresAt || new Date(ad.vipExpiresAt) >= new Date()) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 px-3 py-1 text-xs font-semibold text-yellow-400">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    VIP
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-semibold text-white">{ad.title}</h1>
              <p className="text-lg text-neutral-300">{ad.description}</p>
            </div>

            <div className="grid gap-4 rounded-3xl border border-neutral-900 bg-[#080c16] p-4 text-sm text-neutral-400 md:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Location</p>
                <p className="text-white">{ad.city?.name || 'PMR'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Condition</p>
                <p className="text-white">{ad.condition === 'NEW' ? 'New' : 'Used'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Posted</p>
                <p className="text-white">{formatDate(ad.createdAt)}</p>
              </div>
            </div>

            {ad.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                <Tag className="h-4 w-4 text-primary-400" />
                {ad.tags.map(({ tag }) => (
                  <span key={tag.id} className="rounded-full bg-dark-bg2 px-3 py-1">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-neutral-900 bg-[#0f1423] p-8 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">Price</p>
              <p className="text-4xl font-semibold text-white">{formatPrice(Number(ad.price), ad.currency ?? 'USD')}</p>
              <p className="text-sm text-neutral-500 mt-1">Secure payment via PMR Market</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/messages?userId=${ad.userId}&adId=${ad.id}`}
                className="flex-1 rounded-2xl bg-primary-500 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary-600"
              >
                Связаться
              </Link>
              <FavoriteButton
                adId={ad.id}
                variant="cta"
                className="flex-1 rounded-2xl border border-neutral-800 bg-[#0b101c] px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white hover:border-primary-500"
              />
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-neutral-800 space-y-3">
                <AdminVipButton
                  adId={ad.id}
                  adTitle={ad.title}
                  isVip={ad.isVip}
                  vipExpiresAt={ad.vipExpiresAt}
                  status={ad.status}
                />
                <AdminDeleteButton
                  adId={ad.id}
                  adTitle={ad.title}
                />
              </div>
            )}

            <div className="rounded-2xl border border-neutral-800 bg-[#080c16] p-4 text-sm text-neutral-400 space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary-400" />
                <span>Buyer protection on every order</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary-400" />
                <span>Verified seller and community-rated</span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary-400" />
                <span>Return within 7 days if not as described</span>
              </div>
            </div>

            <ReportButton adId={ad.id} />
          </div>

          <div className="rounded-[32px] border border-neutral-900 bg-[#0b101c] p-8 shadow-[0_20px_45px_rgba(0,0,0,0.45)] space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Seller</p>
            <h3 className="text-2xl font-semibold text-white">{ad.user?.name || 'Unknown Seller'}</h3>
            {ad.user?.id && <SellerRating userId={ad.user.id} />}
            <div className="grid gap-3 text-sm text-neutral-400">
              <div className="flex items-center justify-between">
                <span>Registered</span>
                <span>{ad.user?.createdAt ? formatDate(ad.user.createdAt) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Favorites</span>
                <span>{ad._count.favorites}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Views</span>
                <span>{ad._count.views}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/messages?adId=${ad.id}`}
                className="flex-1 rounded-2xl bg-primary-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary-600"
              >
                Send message
              </Link>
              <Link
                href={`/profile?userId=${ad.userId}`}
                className="flex-1 rounded-2xl border border-neutral-800 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-primary-500"
              >
                View profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ReviewsSection adId={ad.id} sellerId={ad.userId} />
    </div>
  );
}

