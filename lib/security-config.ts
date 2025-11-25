/**
 * Конфигурация безопасности приложения
 */
export const securityConfig = {
  // Rate limiting
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 5, // 5 попыток
    },
    api: {
      windowMs: 60 * 1000, // 1 минута
      max: 60, // 60 запросов
    },
    upload: {
      windowMs: 60 * 1000, // 1 минута
      max: 20, // 20 загрузок
    },
    create: {
      windowMs: 60 * 1000, // 1 минута
      max: 10, // 10 создания
    },
  },

  // Валидация файлов
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 10,
  },

  // Ограничения контента
  content: {
    maxTitleLength: 200,
    maxDescriptionLength: 5000,
    maxSearchLength: 200,
    maxMessageLength: 2000,
  },

  // Безопасность паролей (если будет добавлена регистрация)
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // CORS настройки
  cors: {
    allowedOrigins: [
      'https://pmrmarket.com',
      'https://www.pmrmarket.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  },

  // CSP настройки
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        'https://accounts.google.com',
        'https://apis.google.com'
      ],
      'style-src': [
        "'self'", 
        "'unsafe-inline'", 
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'", 
        'https://fonts.gstatic.com'
      ],
      'img-src': [
        "'self'", 
        'data:', 
        'https:', 
        'blob:'
      ],
      'connect-src': [
        "'self'", 
        'https://api.cloudinary.com',
        'https://res.cloudinary.com',
        'https://accounts.google.com'
      ],
      'frame-src': [
        "'self'", 
        'https://accounts.google.com'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
    },
  },

  // Логирование
  logging: {
    logSuspiciousActivity: true,
    logFailedAuth: true,
    logRateLimitExceeded: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  },
};

/**
 * Проверка конфигурации безопасности
 */
export function validateSecurityConfig(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Проверяем наличие необходимых переменных окружения
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Проверяем настройки production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
      issues.push('NEXTAUTH_URL must use HTTPS in production');
    }

    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      issues.push('NEXTAUTH_SECRET should be at least 32 characters long');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}


