'use client';

import { Shield, Lock, Database, Key, Eye, FileCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <Shield className="h-20 w-20 text-secondary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            Политика конфиденциальности
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Мы ценим вашу приватность и бережно относимся к вашим данным
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Lock className="h-6 w-6 text-secondary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Мы не передаем ваши персональные данные третьим лицам без вашего согласия.
              </p>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Database className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Информация, предоставленная вами (имя, телефон, email), используется исключительно для работы сервиса.
              </p>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Key className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Мы применяем современные методы защиты данных и регулярно обновляем систему безопасности.
              </p>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Eye className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Вы можете запросить удаление или изменение своих данных, обратившись в службу поддержки.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary-900/20 to-primary-900/20 border border-secondary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <FileCheck className="h-6 w-6 text-secondary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-text leading-relaxed">
                Используя сайт PMR Market, вы соглашаетесь с условиями данной политики.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
























