import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { MapPin, Calendar, User } from 'lucide-react';
import ImageGallery from '@/app/ads/[slug]/ImageGallery';
import AdminAdActions from './AdminAdActions';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminAdDetailPage({ params }: PageProps) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const ad = await prisma.ad.findUnique({
    where: { id: params.id },
    include: {
      images: {
        orderBy: { order: 'asc' },
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
    },
  });

  if (!ad) {
    notFound();
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-dark-text">Модерация объявления</h1>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg font-semibold ${
              ad.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
              ad.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {ad.status === 'PENDING' ? 'Ожидает модерации' :
               ad.status === 'APPROVED' ? 'Одобрено' :
               'Отклонено'}
            </div>
            {ad.isVip && (!ad.vipExpiresAt || new Date(ad.vipExpiresAt) >= new Date()) && (
              <div className="px-4 py-2 rounded-lg font-semibold bg-yellow-500/20 text-yellow-500 flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                VIP
                {ad.vipExpiresAt && (
                  <span className="text-xs">
                    (до {new Date(ad.vipExpiresAt).toLocaleDateString('ru-RU')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Images Gallery */}
          <div className="mb-6">
            <ImageGallery images={ad.images} title={ad.title} />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-dark-text mb-4">
            {ad.title}
          </h2>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-dark-text mb-2">Описание</h3>
            <p className="text-dark-textSecondary whitespace-pre-wrap">
              {ad.description}
            </p>
          </div>

          {/* Details */}
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-semibold text-dark-text mb-4">Детали</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-dark-text">Цена:</span>
                <span className="text-primary-500 font-bold text-xl">
                  {formatPrice(Number(ad.price), ad.currency)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-dark-text">Состояние:</span>
                <span className="text-dark-textSecondary">
                  {ad.condition === 'NEW' ? 'Новое' : 'Б/у'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-neutral-500" />
                <span className="text-dark-textSecondary">{ad.city.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-neutral-500" />
                <span className="text-dark-textSecondary">
                  {new Date(ad.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-dark-text">Категория:</span>
                <span className="text-dark-textSecondary">{ad.category.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            {/* User Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Информация о пользователе</h3>
              <div className="flex items-center space-x-3 mb-4">
                {ad.user.image ? (
                  <Image
                    src={ad.user.image}
                    alt={ad.user.name || 'User'}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                    {ad.user.name?.charAt(0).toUpperCase() || ad.user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-dark-text">
                    {ad.user.name || 'Без имени'}
                  </p>
                  <p className="text-sm text-neutral-500">{ad.user.email}</p>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <AdminAdActions 
              adId={ad.id} 
              adStatus={ad.status} 
              adTitle={ad.title}
              isVip={ad.isVip}
              vipExpiresAt={ad.vipExpiresAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

