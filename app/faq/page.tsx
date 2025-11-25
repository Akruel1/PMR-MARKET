'use client';

import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <HelpCircle className="h-20 w-20 text-primary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            Часто задаваемые вопросы
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Найдите ответы на популярные вопросы о PMR Market
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-2">
              1. Что такое PMR Market?
            </h2>
            <p className="text-dark-textSecondary leading-relaxed">
              PMR Market — это онлайн-площадка объявлений для жителей Приднестровья. Здесь вы можете покупать, продавать и обмениваться товарами и услугами в вашем городе.
            </p>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-2">
              2. Как разместить объявление?
            </h2>
            <p className="text-dark-textSecondary leading-relaxed">
              Просто зарегистрируйтесь, выберите категорию, добавьте фото, описание и цену — и ваше объявление появится на сайте.
            </p>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-2">
              3. Сколько стоит размещение?
            </h2>
            <p className="text-dark-textSecondary leading-relaxed">
              Размещение базовых объявлений бесплатно. Дополнительные функции (поднятие в топ, продвижение) доступны по отдельным тарифам.
            </p>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-2">
              4. Как связаться с продавцом?
            </h2>
            <p className="text-dark-textSecondary leading-relaxed">
              На странице объявления указаны контактные данные продавца или кнопка «Написать».
            </p>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-2">
              5. Как пожаловаться на объявление?
            </h2>
            <p className="text-dark-textSecondary leading-relaxed">
              Если вы заметили подозрительное объявление — нажмите «Пожаловаться» и опишите проблему. Мы оперативно проверим обращение.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






















