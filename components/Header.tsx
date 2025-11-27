'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Heart, MessageCircle, User, Search, MapPin, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Logo from './Logo';
import MessageNotificationBadge from './MessageNotificationBadge';

const LINKS = [
  { href: '/ads/new', label: 'Разместить' },
  { href: '/favorites', label: 'Избранное' },
  { href: '/help', label: 'Помощь' },
  { href: '/contact', label: 'Контакты' },
];

export default function Header() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Тирасполь');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cities, setCities] = useState<string[]>(['Тирасполь', 'Бендеры', 'Рыбница', 'Дубоссары']);
  
  const cityMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load cities from API
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          const data = await response.json();
          setCities(data.map((city: { name: string }) => city.name));
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    }
    fetchCities();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityMenuRef.current && !cityMenuRef.current.contains(event.target as Node)) {
        setCityOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lock body scroll when user menu is open on mobile
  useEffect(() => {
    if (userMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [userMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-dark-bg2/70 bg-[#080b12]/80 backdrop-blur-xl">
      <div className="container-custom flex flex-col gap-3 py-4 md:flex-row md:items-center md:gap-6">
        {/* Logo - всегда слева */}
        <div className="flex items-center justify-between gap-4 md:justify-start md:flex-shrink-0">
          <Logo />
          <div className="flex items-center gap-2 md:hidden">
            <button
              className="rounded-full border border-neutral-800 p-2 text-neutral-300"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search bar - в центре на десктопе */}
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:max-w-2xl">
          <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-neutral-800 bg-dark-bg2/80 p-3 shadow-inner shadow-black/30 sm:flex-row sm:items-center sm:px-4 sm:py-2 sm:gap-0">
            <div className="flex flex-1 items-center">
              <Search className="mr-3 h-4 w-4 shrink-0 text-neutral-500" />
              <input
                placeholder="Search products, regions..."
                className="flex-1 min-w-0 bg-transparent text-sm text-dark-text placeholder:text-neutral-500 focus:outline-none"
              />
            </div>
            <div className="relative shrink-0 sm:ml-2" ref={cityMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCityOpen((prev) => !prev);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-full bg-dark-bg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 transition hover:text-white sm:w-auto"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary-300" />
                <span className="truncate">City: {selectedCity}</span>
              </button>
              {cityOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setCityOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-[70] mt-2 w-48 max-h-64 overflow-y-auto rounded-2xl border border-neutral-800 bg-dark-bg shadow-xl">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCity(city);
                          setCityOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-dark-textSecondary hover:bg-dark-bg2 transition"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation links and user profile - справа на десктопе */}
        <div className="flex items-center justify-end gap-4 md:flex-shrink-0">
          <div className="hidden items-center gap-3 text-sm text-dark-textSecondary md:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 transition hover:text-white whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen((prev) => !prev);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-blue-500 px-2.5 py-2 text-sm text-white transition hover:border-blue-400 md:justify-start md:gap-3 md:px-4 md:py-2.5 md:min-w-[200px]"
                >
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name || 'User'} width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-purple-500 text-base lowercase text-white">
                      {(session.user.name?.[0] || session.user.email?.[0] || 'u').toLowerCase()}
                    </div>
                  )}
                  <div className="hidden flex-col items-start md:flex">
                    <span className="text-sm leading-tight truncate max-w-[150px]">{session.user.name || 'Profile'}</span>
                    {session.user.email && (
                      <>
                        <span className="text-xs text-neutral-300 leading-tight truncate max-w-[150px]">{session.user.email.split('@')[0]}</span>
                        <span className="text-xs text-neutral-400 leading-tight truncate max-w-[150px]">{session.user.email}</span>
                      </>
                    )}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[60] sm:bg-transparent bg-black/50"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="fixed left-4 bottom-4 right-4 sm:absolute sm:right-0 sm:top-full sm:left-auto sm:bottom-auto sm:mt-2 sm:w-56 z-[70] max-w-[calc(100vw-2rem)] sm:max-w-none rounded-2xl border border-neutral-900 bg-[#05070f] p-4 sm:p-3 text-sm text-white shadow-xl">
                      <p className="px-3 py-2 text-xs uppercase tracking-[0.3em] text-neutral-500">Account</p>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 sm:py-2 text-sm text-neutral-300 hover:bg-dark-bg transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                        Профиль
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 sm:py-2 text-sm text-neutral-300 hover:bg-dark-bg transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                        Избранное
                      </Link>
                      <Link
                        href="/messages"
                        className="relative flex items-center gap-3 rounded-xl px-3 py-3 sm:py-2 text-sm text-neutral-300 hover:bg-dark-bg transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                        Сообщения
                        <MessageNotificationBadge />
                      </Link>
                      {session.user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 rounded-xl px-3 py-3 sm:py-2 text-sm text-neutral-300 hover:bg-dark-bg transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                          Админ-панель
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 sm:py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition"
                      >
                        <LogOut className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                        Выйти
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-full border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-sm font-semibold text-primary-200 transition hover:bg-primary-500/20"
              >
                Регистрация
              </Link>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-900 bg-dark-bg2 p-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-dark-textSecondary">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 transition hover:bg-dark-bg"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

