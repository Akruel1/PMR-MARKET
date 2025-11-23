'use client';

import { useState } from 'react';
import { MessageSquare, Package, Heart, Settings } from 'lucide-react';
import Link from 'next/link';

interface ProfileTabsProps {
  activeTab: 'ads' | 'favorites' | 'messages';
  userId: string;
  isOwner: boolean;
}

export default function ProfileTabs({ activeTab, userId, isOwner }: ProfileTabsProps) {
  const tabs = [
    {
      id: 'ads' as const,
      label: 'Объявления',
      icon: Package,
      href: `/profile?userId=${userId}`,
    },
    {
      id: 'favorites' as const,
      label: 'Избранное',
      icon: Heart,
      href: `/profile?userId=${userId}&tab=favorites`,
    },
    ...(isOwner
      ? [
          {
            id: 'messages' as const,
            label: 'Сообщения',
            icon: MessageSquare,
            href: '/messages',
          },
        ]
      : []),
  ];

  return (
    <div className="flex gap-2 border-b border-neutral-900">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'border-primary-500 text-primary-300'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}



