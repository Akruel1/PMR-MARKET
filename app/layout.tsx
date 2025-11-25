import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/providers/SessionProvider';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Toaster } from 'react-hot-toast';
import LicenseSync from '@/components/LicenseSync';
import CSRFToken from '@/components/CSRFToken';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PMR Market',
  description: 'Купля-продажа товаров и услуг в Приднестровье',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen bg-dark-bg text-dark-text">
        <SessionProvider>
          <LocaleProvider>
            <CSRFToken />
            <LicenseSync />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster position="top-right" />
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

