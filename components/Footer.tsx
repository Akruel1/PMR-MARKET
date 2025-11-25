'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import FooterParticles from './FooterParticles';

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-neutral-900 bg-[#05070f]">
      <FooterParticles />
      <div className="relative container-custom z-10 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Telegram Bot</h3>
            <p className="text-sm text-neutral-400">
              Подпишитесь на Telegram-бота, чтобы получать уведомления о новых категориях и предложениях.
            </p>
            <a
              href="https://t.me/PMR_MARKET_BOT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.174 1.858-.924 6.33-1.304 8.392-.17.94-.504 1.254-.827 1.285-.699.062-1.229-.461-1.906-.903-1.056-.691-1.653-1.12-2.678-1.794-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559.099.014.19.064.263.157.09.117.123.274.09.431z"/>
              </svg>
              Открыть Telegram-бота
            </a>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-400">
              <Link href="/about" className="hover:text-white">
                О нас
              </Link>
              <Link href="/help" className="hover:text-white">
                Помощь
              </Link>
              <Link href="/contact" className="hover:text-white">
                Контакты
              </Link>
              <Link href="/faq" className="hover:text-white">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white">Правовая информация</h4>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-neutral-400">
              <Link href="/terms" className="hover:text-white">
                Условия использования
              </Link>
              <Link href="/user-agreement" className="hover:text-white">
                Пользовательское соглашение
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Политика конфиденциальности
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Info</h4>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-400" />
                <a href="mailto:pmrmarket@proton.me" className="hover:text-white">
                  pmrmarket@proton.me
                </a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.174 1.858-.924 6.33-1.304 8.392-.17.94-.504 1.254-.827 1.285-.699.062-1.229-.461-1.906-.903-1.056-.691-1.653-1.12-2.678-1.794-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559.099.014.19.064.263.157.09.117.123.274.09.431z"/>
                </svg>
                <a href="https://t.me/pmrmarketsupport" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  @pmrmarketsupport
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-900 pt-6 text-center text-xs uppercase tracking-[0.3em] text-neutral-500">
          © {new Date().getFullYear()} PMR Market. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
