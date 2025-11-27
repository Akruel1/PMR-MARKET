'use client';

import { FileText, CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <FileText className="h-20 w-20 text-primary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            Условия использования
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Правила и условия использования платформы PMR Market
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Используя PMR Market, вы подтверждаете, что размещаете только достоверные и законные объявления.
              </p>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Не публикуете контент, нарушающий авторские права, законы ПМР или нормы морали.
              </p>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Не используете платформу для мошенничества, рекламы запрещённых товаров или услуг.
              </p>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Shield className="h-6 w-6 text-secondary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-textSecondary leading-relaxed">
                Понимаете, что администрация имеет право удалить или отредактировать объявления, нарушающие правила сайта.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border border-primary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <FileText className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <p className="text-dark-text leading-relaxed">
                Администрация не несёт ответственности за сделки между пользователями, но может помочь в разрешении спорных ситуаций.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
























