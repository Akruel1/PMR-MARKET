'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Check } from 'lucide-react';

export default function LicensePage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!accepted || !scrolledToBottom) return;

    // Mark license as accepted (will be saved after Google OAuth)
    localStorage.setItem('licenseAccepted', 'true');
    localStorage.setItem('licenseAcceptedAt', new Date().toISOString());

    // Redirect to Google OAuth
    signIn('google', { 
      callbackUrl: '/',
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-dark-bg2 border border-neutral-700 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-dark-text mb-6 text-center">
          Лицензионное соглашение Пользователя
        </h1>

        <div
          className="max-h-96 overflow-y-auto mb-6 text-dark-textSecondary space-y-4 pr-4"
          onScroll={handleScroll}
        >
          <p className="text-sm text-neutral-500">
            Дата вступления в силу: {new Date().toLocaleDateString('ru-RU')}
          </p>

          <p>
            Настоящее Лицензионное соглашение (далее – «Соглашение») регулирует отношения между
            пользователем (далее – «Вы» или «Пользователь») и владельцем сайта PMR Market (далее
            – «Сервис») в отношении использования Сервиса, размещения объявлений, взаимодействия с
            другими пользователями и доступа к функционалу сайта.
          </p>

          <p>
            Используя Сервис, Вы автоматически соглашаетесь с условиями настоящего Соглашения. Если
            Вы не согласны с условиями, Вы обязаны прекратить использование Сервиса.
          </p>

          <h2 className="text-xl font-semibold text-dark-text mt-6">1. Определения</h2>
          <p>
            <strong>Сервис</strong> – веб-сайт PMR Market, мобильные приложения и другие интерфейсы,
            предоставляющие функционал публикации, поиска и просмотра объявлений.
          </p>
          <p>
            <strong>Объявление</strong> – информация о товаре или услуге, размещаемая Пользователем
            на Сервисе.
          </p>
          <p>
            <strong>Контент Пользователя</strong> – любые тексты, изображения, видео и другие
            материалы, загружаемые Пользователем в рамках использования Сервиса.
          </p>

          <h2 className="text-xl font-semibold text-dark-text mt-6">2. Регистрация и учетная запись</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Для использования Сервиса требуется регистрация через Google-аккаунт или иные доступные способы.</li>
            <li>Вы обязаны предоставлять точные и актуальные данные при регистрации.</li>
            <li>Вы несёте ответственность за сохранность пароля и доступа к своей учетной записи.</li>
          </ul>

          <h2 className="text-xl font-semibold text-dark-text mt-6">3. Права и обязанности Пользователя</h2>
          <p className="font-semibold">Пользователь имеет право:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>создавать, редактировать и удалять собственные объявления;</li>
            <li>просматривать и связываться с другими Пользователями;</li>
            <li>использовать функционал Сервиса в соответствии с условиями Соглашения.</li>
          </ul>

          <p className="font-semibold mt-4">Пользователь обязуется:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>не публиковать незаконный, оскорбительный, порнографический или нарушающий права третьих лиц контент;</li>
            <li>не использовать Сервис для мошенничества, спама, фишинга или других противоправных действий;</li>
            <li>соблюдать требования законодательства своей страны и законодательства, регулирующего деятельность Сервиса.</li>
          </ul>

          <h2 className="text-xl font-semibold text-dark-text mt-6">4. Права и обязанности Сервиса</h2>
          <p className="font-semibold">Сервис имеет право:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>приостанавливать или блокировать учетную запись Пользователя в случае нарушения условий Соглашения;</li>
            <li>удалять или изменять контент, который нарушает правила Сервиса или законодательство;</li>
            <li>вносить изменения в функционал, дизайн и условия использования Сервиса.</li>
          </ul>

          <p className="font-semibold mt-4">Сервис обязуется:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>обеспечивать работу платформы в пределах технических возможностей;</li>
            <li>защищать персональные данные Пользователей в соответствии с Политикой конфиденциальности;</li>
            <li>предоставлять актуальную информацию о функциях Сервиса и способах использования.</li>
          </ul>

          <h2 className="text-xl font-semibold text-dark-text mt-6">5. Лицензия на использование контента</h2>
          <p>
            Пользователь предоставляет Сервису неисключительную, бесплатную, бессрочную, мировую
            лицензию на использование, хранение, копирование и распространение контента в рамках
            работы Сервиса.
          </p>
          <p>
            Контент Пользователя может использоваться Сервисом для продвижения платформы,
            аналитики и улучшения функционала, при этом авторские права остаются у Пользователя.
          </p>

          <h2 className="text-xl font-semibold text-dark-text mt-6">6. Ограничение ответственности</h2>
          <p>Сервис не несет ответственность за:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>точность информации, размещаемой Пользователями;</li>
            <li>действия третьих лиц, в том числе нарушение ими авторских прав или мошеннические схемы;</li>
            <li>временные технические сбои или недоступность платформы.</li>
          </ul>
          <p>Сервис не предоставляет гарантии коммерческого результата или дохода от использования платформы.</p>

          <h2 className="text-xl font-semibold text-dark-text mt-6">7. Прекращение использования</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Пользователь может прекратить использование Сервиса в любой момент, удалив свою учетную запись.</li>
            <li>Сервис имеет право заблокировать или удалить учетную запись при нарушении условий Соглашения.</li>
          </ul>

          <h2 className="text-xl font-semibold text-dark-text mt-6">8. Изменение условий</h2>
          <p>
            Сервис оставляет за собой право изменять настоящее Соглашение в любое время. Изменения
            вступают в силу с момента публикации на сайте. Продолжение использования Сервиса после
            изменений считается согласием с ними.
          </p>

          <h2 className="text-xl font-semibold text-dark-text mt-6">9. Применимое законодательство и спорные вопросы</h2>
          <p>
            Настоящее Соглашение регулируется законодательством Приднестровской Молдавской Республики (ПМР).
          </p>
          <p>
            Все споры, возникающие в связи с настоящим Соглашением, разрешаются путем переговоров,
            а при невозможности достижения согласия – в судебном порядке в соответствии с
            законодательством.
          </p>

          <p className="mt-6 font-semibold">
            Пользуясь Сервисом, Вы подтверждаете, что прочли, поняли и согласны с условиями
            настоящего Лицензионного соглашения.
          </p>
        </div>

        <div className="flex items-center space-x-3 mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!scrolledToBottom}
              className="w-5 h-5 rounded border-neutral-600 bg-dark-bg text-primary-500 focus:ring-primary-500"
            />
            <span className="text-dark-textSecondary">
              Я прочитал(а) и согласен(на) с условиями Лицензионного соглашения
            </span>
          </label>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleAccept}
            disabled={!accepted || !scrolledToBottom}
            className="px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Check className="h-5 w-5" />
            <span>Принять и войти через Google</span>
          </button>
        </div>

        {!scrolledToBottom && (
          <p className="text-sm text-neutral-500 text-center mt-4">
            Пожалуйста, прокрутите до конца документа, чтобы принять соглашение
          </p>
        )}
      </div>
    </div>
  );
}

