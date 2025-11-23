'use client';

import { ShoppingBag, Target, MapPin, Zap, Shield, MessageSquare, TrendingUp, Heart, Mail, Send } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg2">
      {/* Hero Section */}
      <div className="container-custom py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="mb-6">
            <ShoppingBag className="h-20 w-20 text-primary-500 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-dark-text mb-4">
            <span className="text-primary-500">PMR</span> <span className="text-secondary-500">Market</span>
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Современная площадка объявлений для жителей Приднестровья
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <section className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text mb-3">
                  О нас — PMR Market
                </h2>
                <p className="text-dark-textSecondary leading-relaxed mb-4">
                  PMR Market — это современная площадка объявлений, созданная для того, чтобы жители Приднестровья могли покупать, продавать и обмениваться товарами и услугами быстро, удобно и безопасно.
                </p>
                <p className="text-dark-textSecondary leading-relaxed">
                  Мы объединяем людей, бизнес и частных продавцов в одном месте, делая процесс поиска нужного товара максимально простым и понятным.
                </p>
                <p className="text-dark-textSecondary leading-relaxed mt-4">
                  На PMR Market вы можете разместить объявления в различных категориях — от электроники и недвижимости до одежды, автомобилей и услуг.
                </p>
              </div>
            </div>
          </section>

          {/* Mission */}
          <section className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border border-primary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text mb-3">
                  Наша миссия
                </h2>
                <p className="text-dark-textSecondary leading-relaxed text-lg">
                  Создать удобный, надёжный и прозрачный маркетплейс, где каждый может легко найти то, что ему нужно, или выгодно продать свой товар без лишних посредников.
                </p>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-6 text-center">
              Почему выбирают нас
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <div className="flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Платформа для ПМР
                  </h3>
                  <p className="text-dark-textSecondary">
                    Адаптированная под города и регионы ПМР
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Удобный интерфейс
                  </h3>
                  <p className="text-dark-textSecondary">
                    Быстрый поиск и навигация по объявлениям
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-secondary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Безопасность
                  </h3>
                  <p className="text-dark-textSecondary">
                    Безопасные сделки и проверенные продавцы
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Прямое общение
                  </h3>
                  <p className="text-dark-textSecondary">
                    Чат и контактные данные для связи
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300 md:col-span-2">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Постоянное развитие
                  </h3>
                  <p className="text-dark-textSecondary">
                    Новые функции для удобства пользователей
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Community */}
          <section className="bg-gradient-to-br from-secondary-900/20 to-primary-900/20 border border-secondary-700/30 rounded-lg p-8 shadow-xl">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Heart className="h-8 w-8 text-secondary-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text mb-3">
                  Мы за честные сделки
                </h2>
                <p className="text-dark-textSecondary leading-relaxed mb-4">
                  PMR Market — это не просто сайт объявлений. Это сообщество людей, которым важно качество, доверие и прозрачность.
                </p>
                <p className="text-dark-textSecondary leading-relaxed">
                  Мы внимательно следим за контентом и стремимся сделать площадку безопасной для всех пользователей.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-dark-bg2 border border-neutral-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-dark-text mb-6 text-center">
              Связаться с нами
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4 p-6 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <div className="flex-shrink-0">
                  <Mail className="h-8 w-8 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Email
                  </h3>
                  <a 
                    href="mailto:support@pmrmarket.com" 
                    className="text-primary-500 hover:text-primary-400 transition-colors duration-300"
                  >
                    support@pmrmarket.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-dark-bg rounded-lg border border-neutral-800 hover:border-primary-500 transition-all duration-300">
                <div className="flex-shrink-0">
                  <Send className="h-8 w-8 text-secondary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-2">
                    Telegram
                  </h3>
                  <a 
                    href="https://t.me/pmrmarket_support" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-500 hover:text-secondary-400 transition-colors duration-300"
                  >
                    @pmrmarket_support
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-8">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-300 transform hover:scale-105 text-lg font-semibold"
            >
              <span>Начать покупки</span>
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
















