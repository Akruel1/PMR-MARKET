'use client';

import { FileText, CheckCircle, AlertCircle, Shield, Users } from 'lucide-react';

export default function UserAgreementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <FileText className="h-20 w-20 text-primary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            Пользовательское соглашение
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Соглашение между пользователем и платформой PMR Market
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Users className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Регистрация и аккаунт</h3>
                <p className="text-dark-textSecondary leading-relaxed">
                  Регистрируясь на платформе PMR Market, вы подтверждаете, что предоставленная информация является достоверной. 
                  Вы несете ответственность за безопасность своего аккаунта и обязуетесь не передавать данные для входа третьим лицам.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Размещение объявлений</h3>
                <p className="text-dark-textSecondary leading-relaxed">
                  При размещении объявлений вы гарантируете, что товары и услуги соответствуют описанию, 
                  не нарушают законодательство ПМР и права третьих лиц. Все объявления проходят модерацию перед публикацией.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Ответственность</h3>
                <p className="text-dark-textSecondary leading-relaxed">
                  Платформа PMR Market является посредником между покупателями и продавцами. 
                  Мы не несем ответственности за качество товаров, достоверность описаний и выполнение сделок между пользователями.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <Shield className="h-6 w-6 text-secondary-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. Безопасность и конфиденциальность</h3>
                <p className="text-dark-textSecondary leading-relaxed">
                  Мы обязуемся защищать ваши персональные данные в соответствии с политикой конфиденциальности. 
                  При этом вы соглашаетесь на обработку предоставленных данных для функционирования платформы.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border border-primary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <FileText className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5. Изменения в соглашении</h3>
                <p className="text-dark-text leading-relaxed">
                  Администрация оставляет за собой право вносить изменения в настоящее соглашение. 
                  О существенных изменениях пользователи будут уведомлены через платформу или по электронной почте.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

