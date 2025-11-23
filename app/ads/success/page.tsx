'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Home, Eye } from 'lucide-react';

export default function AdSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'approved' | 'pending' | null>(null);
  const adId = searchParams.get('adId');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'approved') {
      setStatus('approved');
    } else if (statusParam === 'pending') {
      setStatus('pending');
    } else {
      // Default to pending if no status
      setStatus('pending');
    }
  }, [searchParams]);

  if (!status) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin text-primary-500">⏳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
          {status === 'approved' ? (
            <>
              <h1 className="text-3xl font-bold text-dark-text mb-4">
                Объявление успешно добавлено!
              </h1>
              <p className="text-lg text-dark-textSecondary mb-8">
                Ваше объявление было опубликовано и доступно для просмотра.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-dark-text mb-4">
                Объявление отправлено на модерацию
              </h1>
              <p className="text-lg text-dark-textSecondary mb-8">
                Ваше объявление отправлено на проверку модератором. После одобрения оно будет опубликовано.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="btn-primary flex items-center space-x-2 px-6 py-3"
          >
            <Home className="h-5 w-5" />
            <span>Вернуться на главную</span>
          </Link>
          
          {adId && (
            <Link
              href={`/ads/${adId}`}
              className="btn-secondary flex items-center space-x-2 px-6 py-3"
            >
              <Eye className="h-5 w-5" />
              <span>Просмотреть объявление</span>
            </Link>
          )}
        </div>

        <div className="mt-8 p-6 bg-dark-bg2 rounded-lg border border-neutral-700">
          <h2 className="text-xl font-semibold text-dark-text mb-4">
            Что дальше?
          </h2>
          <div className="text-left space-y-2 text-dark-textSecondary">
            {status === 'approved' ? (
              <>
                <p>• Ваше объявление уже доступно для просмотра</p>
                <p>• Пользователи могут связаться с вами через сообщения</p>
                <p>• Вы можете управлять объявлением в своем профиле</p>
              </>
            ) : (
              <>
                <p>• Объявление отправлено на модерацию</p>
                <p>• Обычно модерация занимает до 24 часов</p>
                <p>• Вы получите уведомление после проверки</p>
                <p>• Вы можете проверить статус в своем профиле</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

















