import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // время окна в миллисекундах
  uniqueTokenPerInterval: number; // максимальное количество запросов
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store для rate limiting (в production лучше использовать Redis)
const store: RateLimitStore = {};

/**
 * Rate limiting функция
 */
export function rateLimit(config: RateLimitConfig) {
  return {
    check: (request: NextRequest, limit: number = config.uniqueTokenPerInterval, token?: string) => {
      // Получаем IP адрес или используем переданный токен
      const identifier = token || getClientIP(request) || 'anonymous';
      
      const now = Date.now();
      const windowStart = now - config.interval;
      
      // Очищаем старые записи
      Object.keys(store).forEach(key => {
        if (store[key].resetTime < windowStart) {
          delete store[key];
        }
      });
      
      // Проверяем текущий лимит
      if (!store[identifier]) {
        store[identifier] = {
          count: 1,
          resetTime: now + config.interval,
        };
        return { success: true, remaining: limit - 1 };
      }
      
      if (store[identifier].count >= limit) {
        return { 
          success: false, 
          remaining: 0,
          resetTime: store[identifier].resetTime 
        };
      }
      
      store[identifier].count++;
      return { 
        success: true, 
        remaining: limit - store[identifier].count 
      };
    }
  };
}

/**
 * Получение IP адреса клиента
 */
function getClientIP(request: NextRequest): string | null {
  // Проверяем различные заголовки для получения реального IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return request.ip || null;
}

// Предустановленные конфигурации
export const rateLimitConfigs = {
  // Строгий лимит для аутентификации
  auth: rateLimit({
    interval: 15 * 60 * 1000, // 15 минут
    uniqueTokenPerInterval: 5, // 5 попыток входа за 15 минут
  }),
  
  // Лимит для API запросов
  api: rateLimit({
    interval: 60 * 1000, // 1 минута
    uniqueTokenPerInterval: 60, // 60 запросов в минуту
  }),
  
  // Лимит для создания контента
  create: rateLimit({
    interval: 60 * 1000, // 1 минута
    uniqueTokenPerInterval: 10, // 10 создания в минуту
  }),
  
  // Лимит для загрузки файлов
  upload: rateLimit({
    interval: 60 * 1000, // 1 минута
    uniqueTokenPerInterval: 20, // 20 загрузок в минуту
  }),
  
  // Лимит для поиска
  search: rateLimit({
    interval: 60 * 1000, // 1 минута
    uniqueTokenPerInterval: 100, // 100 поисковых запросов в минуту
  }),
};

/**
 * Middleware для проверки rate limit
 */
export function createRateLimitMiddleware(limiter: ReturnType<typeof rateLimit>, limit?: number) {
  return (request: NextRequest) => {
    const result = limiter.check(request, limit);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetTime: result.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime! - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': limit?.toString() || '60',
            'X-RateLimit-Remaining': result.remaining.toString(),
          },
        }
      );
    }
    
    return null; // Продолжить выполнение
  };
}


