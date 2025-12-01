'use client';

import { useEffect, useState } from 'react';

/**
 * Компонент для автоматической установки CSRF токена в запросы
 */
export default function CSRFToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Получаем CSRF токен из cookie
    const getCSRFToken = () => {
      const cookies = document.cookie.split(';');
      const csrfCookie = cookies.find(cookie => 
        cookie.trim().startsWith('csrf-token=')
      );
      return csrfCookie ? csrfCookie.split('=')[1] : null;
    };

    // Устанавливаем токен
    const csrfToken = getCSRFToken();
    setToken(csrfToken);

    // Если токена нет, запрашиваем его
    if (!csrfToken) {
      fetch('/api/csrf-token', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
          if (data.token) {
            setToken(data.token);
          }
        })
        .catch(console.error);
    }

    // Перехватываем все fetch запросы и добавляем CSRF токен
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Добавляем CSRF токен только для API запросов (кроме GET)
      if (url.includes('/api/') && init?.method && init.method !== 'GET') {
        const currentToken = getCSRFToken();
        if (currentToken) {
          init.headers = {
            ...init.headers,
            'X-CSRF-Token': currentToken,
          };
        }
      }
      
      return originalFetch.call(this, input, init);
    };

    // Восстанавливаем оригинальный fetch при размонтировании
    return () => {
      if (typeof window !== 'undefined') {
        window.fetch = originalFetch;
      }
    };
  }, []);

  // Компонент невидимый, только для логики
  return null;
}

/**
 * Хук для получения CSRF токена
 */
export function useCSRFToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const getToken = () => {
      const cookies = document.cookie.split(';');
      const csrfCookie = cookies.find(cookie => 
        cookie.trim().startsWith('csrf-token=')
      );
      return csrfCookie ? csrfCookie.split('=')[1] : null;
    };

    setToken(getToken());
  }, []);

  return token;
}


