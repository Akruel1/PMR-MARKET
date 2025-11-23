'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Keeps user license acceptance state in sync between localStorage and the DB.
 * - Redirects авторизованных пользователей без принятой лицензии на /license
 * - После OAuth, когда localStorage уже содержит флаг, отправляет POST на /api/auth/license-accept
 */
export default function LicenseSync() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const localAccepted = typeof window !== 'undefined' && localStorage.getItem('licenseAccepted') === 'true';

    // If user is logged in but license не подтверждена → отправляем на страницу соглашения
    if (!localAccepted && !session.user.licenseAccepted && pathname !== '/license') {
      router.push('/license');
      return;
    }

    // Если пользователь уже принял лицензию на клиенте, синхронизируем с БД
    if (!session.user.licenseAccepted && localAccepted && !syncing) {
      setSyncing(true);
      fetch('/api/auth/license-accept', { method: 'POST' })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to sync license acceptance');
          }
          return res.json();
        })
        .then(() => update?.())
        .catch((error) => {
          console.error(error);
        })
        .finally(() => setSyncing(false));
    }
  }, [session, pathname, router, syncing, update]);

  return null;
}





