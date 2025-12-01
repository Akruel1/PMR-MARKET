'use client';

import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShow(false);
  };

  const handleDecline = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cookieConsent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-bg2 border-t border-neutral-700 shadow-lg">
      <div className="container-custom py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3 flex-1">
            <Cookie className="h-6 w-6 text-primary-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-dark-text mb-1">
                Мы используем cookies
              </h3>
              <p className="text-sm text-dark-textSecondary">
                Этот сайт использует cookies для улучшения пользовательского опыта, анализа трафика и персонализации контента. 
                Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
                <Link href="/privacy" className="text-primary-500 hover:underline">
                  политикой конфиденциальности
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm rounded-lg bg-dark-bg border border-neutral-700 text-dark-textSecondary hover:bg-neutral-800 transition-colors"
            >
              Отклонить
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Принять
            </button>
            <button
              onClick={() => setShow(false)}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-800 transition-colors"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





























