'use client';

import Link from 'next/link';
import { Trash2, Home } from 'lucide-react';

export default function AdDeletedPage() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Trash2 className="h-24 w-24 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-dark-text mb-4">
            Объявление удалено
          </h1>
          <p className="text-lg text-dark-textSecondary mb-8">
            Объявление было успешно удалено. Владелец объявления получит уведомление.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="btn-primary flex items-center space-x-2 px-6 py-3"
          >
            <Home className="h-5 w-5" />
            <span>Вернуться на главную</span>
          </Link>
          
          <Link
            href="/admin"
            className="btn-secondary flex items-center space-x-2 px-6 py-3"
          >
            <span>Админ панель</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

















