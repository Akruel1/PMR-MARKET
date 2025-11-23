'use client';

import { useState } from 'react';
import { Copy, Check, MessageCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface AccountCodeDisplayProps {
  accountCode: string;
}

export default function AccountCodeDisplay({ accountCode }: AccountCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-dark-bg2 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary-500" />
          Код аккаунта для Telegram бота
        </h3>
        <div className="group relative">
          <HelpCircle className="h-4 w-4 text-neutral-500 cursor-help" />
          <div className="absolute right-0 top-6 w-64 p-2 bg-dark-bg border border-neutral-700 rounded-lg text-xs text-dark-textSecondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Используйте этот код для связи вашего Telegram аккаунта с ботом @PMR_MARKET_BOT. Код виден только вам.
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-dark-bg border border-neutral-600 rounded-lg px-4 py-3 flex items-center justify-between">
          <code className="text-2xl font-mono font-bold text-primary-500 tracking-wider">
            {accountCode}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-neutral-700 transition-colors"
            title="Скопировать код"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5 text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      <div className="text-sm text-neutral-500 space-y-1">
        <p>• Этот код нужен для подключения Telegram бота</p>
        <p>• Откройте бота <Link href="https://t.me/PMR_MARKET_BOT" target="_blank" className="text-primary-500 hover:underline">@PMR_MARKET_BOT</Link> и отправьте этот код</p>
        <p>• После подключения вы будете получать уведомления о новых сообщениях и объявлениях</p>
      </div>
    </div>
  );
}












