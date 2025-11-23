'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-dark-bg px-4 py-16 text-center text-dark-text">
      <div className="max-w-xl space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-primary-200">Ошибка 404</p>
        <h1 className="text-4xl font-bold text-dark-text">Страница не найдена</h1>
        <p className="text-dark-textSecondary">
          Возможно, объявление было удалено или вы ошиблись адресом. Попробуйте вернуться на главную или воспользуйтесь поиском.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            <Home className="h-5 w-5" />
            На главную
          </Link>
          <Link
            href="/?focus=search"
            className="inline-flex items-center gap-2 rounded-full border border-primary-500 px-6 py-3 font-semibold text-primary-200 transition hover:bg-primary-500 hover:text-white"
          >
            <Search className="h-5 w-5" />
            Попробовать поиск
          </Link>
        </div>
      </div>
    </main>
  );
}





