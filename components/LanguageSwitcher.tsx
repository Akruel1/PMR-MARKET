'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<'en' | 'ru'>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('locale') as 'en' | 'ru' | null;
    if (saved) {
      setLocale(saved);
    }
  }, []);

  const switchLanguage = (newLocale: 'en' | 'ru') => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
    // Trigger a re-render by reloading or using a context
    window.dispatchEvent(new Event('localechange'));
  };

  return (
    <div className="relative group">
      <button
        className="btn-icon flex items-center space-x-1"
        onClick={() => switchLanguage(locale === 'en' ? 'ru' : 'en')}
      >
        <Globe className="h-5 w-5" />
        <span className="font-medium text-sm">{locale.toUpperCase()}</span>
      </button>
    </div>
  );
}

