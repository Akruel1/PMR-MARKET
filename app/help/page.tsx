'use client';

import { LifeBuoy, FileText, DollarSign, MessageSquare, Flag, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <LifeBuoy className="h-20 w-20 text-primary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            Центр помощи
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Добро пожаловать в Центр помощи PMR Market! Здесь вы найдёте ответы и инструкции по работе с сайтом
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-dark-text mb-6">
              Основные темы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <FileText className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Управление объявлениями
                  </h3>
                  <p className="text-dark-textSecondary">
                    Как разместить или удалить объявление
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <DollarSign className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Оплата услуг
                  </h3>
                  <p className="text-dark-textSecondary">
                    Как пополнить баланс и оплатить продвижение
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <MessageSquare className="h-6 w-6 text-secondary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Общение с продавцами
                  </h3>
                  <p className="text-dark-textSecondary">
                    Как связаться с продавцом
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <Flag className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Модерация
                  </h3>
                  <p className="text-dark-textSecondary">
                    Как пожаловаться на нарушение
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300 md:col-span-2">
                <KeyRound className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Безопасность аккаунта
                  </h3>
                  <p className="text-dark-textSecondary">
                    Как восстановить доступ к аккаунту
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary-900/20 to-primary-900/20 border border-secondary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Mail className="h-8 w-8 text-secondary-500 flex-shrink-0" />
              <div>
                <p className="text-dark-text leading-relaxed mb-2">
                  Если вы не нашли нужную информацию — напишите нам в поддержку, и мы обязательно поможем.
                </p>
                <div className="space-y-2">
                  <a 
                    href="mailto:pmrmarket@proton.me" 
                    className="text-primary-500 hover:text-primary-400 transition-colors duration-300 font-semibold block"
                  >
                    Email: pmrmarket@proton.me
                  </a>
                  <a 
                    href="https://t.me/pmrmarketsupport" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-500 hover:text-secondary-400 transition-colors duration-300 font-semibold block"
                  >
                    Telegram: @pmrmarketsupport
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





















