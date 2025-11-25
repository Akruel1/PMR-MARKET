'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, BellRing, MessageSquare } from 'lucide-react';
import FloatingParticles from '@/components/FloatingParticles';

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Верифицированные сделки',
    description: 'Google-аккаунт + лицензионное соглашение защищают от спама и фейков.',
  },
  {
    icon: MessageSquare,
    title: 'Сообщения и отзывы',
    description: 'Общайтесь в защищённых чатах и оставляйте отзывы после сделки.',
  },
  {
    icon: BellRing,
    title: 'Уведомления в Telegram',
    description: 'Получайте оповещения от бота о новых сообщениях и статусе объявлений.',
  },
  {
    icon: Lock,
    title: 'Единый вход',
    description: 'Никаких паролей — вход по Google с автоматической синхронизацией профиля.',
  },
];

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04060c]">
      <FloatingParticles />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-6xl gap-8 rounded-[40px] border border-neutral-900 bg-[#070b15]/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.75)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-primary-300">Join PMR Market</p>
              <h1 className="text-4xl font-semibold text-white">Войдите, чтобы публиковать и продавать</h1>
              <p className="text-base text-neutral-400">
                Регистрация через Google занимает меньше минуты. После входа вы сможете публиковать объявления,
                получать уведомления от Telegram-бота и управлять профилем.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-[28px] border border-neutral-900 bg-[#05070f] p-6">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 rounded-2xl bg-white/90 px-6 py-4 text-lg font-semibold text-black transition hover:bg-white"
              >
                <Image src="/logo.png" alt="Google" width={20} height={20} className="h-5 w-5" />
                Войти через Google
              </button>
              <p className="text-sm text-neutral-500">
                Нажимая на кнопку, вы подтверждаете, что прочли{' '}
                <Link href="/license" className="text-primary-300 hover:text-white">
                  пользовательское соглашение
                </Link>
                .
              </p>
              <div className="rounded-2xl border border-neutral-900 bg-[#080c16] p-4 text-sm text-neutral-400">
                <p className="font-semibold text-white">Почему мы используем Google OAuth?</p>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  <li>Быстрая регистрация без паролей</li>
                  <li>Меньше спама и фейковых аккаунтов</li>
                  <li>Единый профиль для веба и Telegram-бота</li>
                </ul>
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-900 bg-[#060914] p-6 text-sm text-neutral-500">
              <p>
                Уже читали условия?{' '}
                <Link href="/license" className="text-primary-300 hover:text-white">
                  Откройте соглашение
                </Link>{' '}
                ещё раз, чтобы принять перед входом.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-900 bg-[#05070f] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Что даёт аккаунт</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Полный доступ к экосистеме</h2>
            <p className="mt-2 text-sm text-neutral-400">
              После регистрации вы сможете публиковать объявления, подключать Telegram-бота и получать приоритетную
              модерацию.
            </p>
            <div className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4 rounded-2xl border border-neutral-900 bg-[#080c16] p-4">
                  <div className="rounded-2xl bg-primary-500/10 p-3 text-primary-200">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{benefit.title}</p>
                    <p className="text-sm text-neutral-400">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-neutral-900 bg-[#070b15] p-4 text-sm text-neutral-400">
              <p className="font-semibold text-white">Нужна помощь?</p>
              <p>
                Напишите в{' '}
                <Link href="https://t.me/pmrmarketsupport" className="text-primary-300 hover:text-white">
                  Telegram: @pmrmarketsupport
                </Link>{' '}
                или на email pmrmarket@proton.me, и мы включим ваш аккаунт вручную.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





