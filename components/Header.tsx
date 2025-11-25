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

  return (
    <header className="sticky top-0 z-50 border-b border-dark-bg2/70 bg-[#080b12]/80 backdrop-blur-xl">
      <div className="container-custom flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex items-center justify-between gap-4 -ml-[120px]"> {/* Сдвиг влево на 3-4 см */}
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

        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 rounded-2xl border border-neutral-800 bg-dark-bg2/80 px-4 py-2 shadow-inner shadow-black/30">
            <Search className="mr-3 mt-1 h-4 w-4 text-neutral-500" />
            <input
              placeholder="Search products, regions..."
              className="flex-1 bg-transparent text-sm text-dark-text placeholder:text-neutral-500 focus:outline-none"
            />
            <div className="relative" ref={cityMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCityOpen((prev) => !prev);
                }}
                className="flex items-center gap-1 rounded-full bg-dark-bg px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 transition hover:text-white"
              >
                <MapPin className="h-4 w-4 text-primary-300" />
                City: {selectedCity}
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

          <div className="hidden items-center gap-2 text-sm text-dark-textSecondary md:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-blue-500 px-4 py-2.5 min-w-[200px] text-sm text-white transition hover:border-blue-400"
                >
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name || 'User'} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-base lowercase text-white">
                      {(session.user.name?.[0] || session.user.email?.[0] || 'u').toLowerCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm leading-tight">{session.user.name || 'Profile'}</span>
                    {session.user.email && (
                      <>
                        <span className="text-xs text-neutral-300 leading-tight">{session.user.email.split('@')[0]}</span>
                        <span className="text-xs text-neutral-400 leading-tight">{session.user.email}</span>
                      </>
                    )}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-[70] mt-2 w-56 rounded-2xl border border-neutral-900 bg-[#05070f] p-3 text-sm text-white shadow-xl">
                      <p className="px-3 py-2 text-xs uppercase tracking-[0.3em] text-neutral-500">Account</p>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-neutral-300 hover:bg-dark-bg transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Профиль
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-neutral-300 hover:bg-dark-bg transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4" />
                        Избранное
                      </Link>
                      <Link
                        href="/messages"
                        className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-neutral-300 hover:bg-dark-bg transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Сообщения
                        <MessageNotificationBadge />
                      </Link>
                      {session.user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-neutral-300 hover:bg-dark-bg transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Админ-панель
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-400 hover:bg-red-500/10 transition"
                      >
                        <LogOut className="h-4 w-4" />
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

