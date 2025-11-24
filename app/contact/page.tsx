'use client';

import { Mail, Send, MapPin, Clock, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <MessageSquare className="h-20 w-20 text-primary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            Контакты
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Нужна помощь или хотите предложить сотрудничество? Свяжитесь с нами любым удобным способом
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-4">
              <Mail className="h-8 w-8 text-primary-500 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-dark-text">
                  Email
                </h2>
                <a 
                  href="mailto:support@pmrmarket.com" 
                  className="text-primary-500 hover:text-primary-400 transition-colors duration-300 text-lg"
                >
                  support@pmrmarket.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-4">
              <Send className="h-8 w-8 text-secondary-500 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-dark-text">
                  Telegram
                </h2>
                <a 
                  href="https://t.me/pmrmarket_support" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-500 hover:text-secondary-400 transition-colors duration-300 text-lg"
                >
                  @pmrmarket_support
                </a>
              </div>
            </div>
          </div>

          <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-4">
              <MapPin className="h-8 w-8 text-accent flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-dark-text">
                  Адрес
                </h2>
                <p className="text-dark-textSecondary text-lg">
                  Тирасполь, Приднестровье
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border border-primary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-primary-500 flex-shrink-0" />
              <p className="text-dark-text leading-relaxed">
                Мы стараемся отвечать на обращения в течение 24 часов.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



















