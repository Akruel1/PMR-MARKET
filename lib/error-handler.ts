import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Безопасная обработка ошибок - не раскрывает внутреннюю информацию
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Логируем полную ошибку для разработчиков
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  // Возвращаем безопасные сообщения пользователям
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Переданные данные не соответствуют требованиям',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }
  
  if (error instanceof Error) {
    // Известные безопасные ошибки
    const safeErrors = [
      'Unauthorized',
      'User not found',
      'Category not found',
      'Ad not found',
      'Access denied',
      'Invalid credentials',
      'Account is banned',
      'Rate limit exceeded',
    ];
    
    const isSafeError = safeErrors.some(safe => 
      error.message.toLowerCase().includes(safe.toLowerCase())
    );
    
    if (isSafeError) {
      return NextResponse.json(
        { error: error.message },
        { status: getStatusFromError(error.message) }
      );
    }
  }
  
  // Для всех остальных ошибок возвращаем общее сообщение
  return NextResponse.json(
    { 
      error: 'Internal Server Error',
      message: 'Произошла внутренняя ошибка сервера. Попробуйте позже.',
    },
    { status: 500 }
  );
}

/**
 * Определение HTTP статуса по сообщению ошибки
 */
function getStatusFromError(message: string): number {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('access denied')) {
    return 401;
  }
  
  if (lowerMessage.includes('banned') || lowerMessage.includes('forbidden')) {
    return 403;
  }
  
  if (lowerMessage.includes('not found')) {
    return 404;
  }
  
  if (lowerMessage.includes('rate limit')) {
    return 429;
  }
  
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 400;
  }
  
  return 500;
}

/**
 * Логирование ошибок с контекстом
 */
export function logError(
  error: unknown, 
  context: string, 
  additionalData?: Record<string, any>
): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    additionalData,
  };
  
  // В production следует использовать профессиональную систему логирования
  console.error('🔥 ERROR:', JSON.stringify(errorData, null, 2));
  
  // Здесь можно добавить отправку в систему мониторинга (Sentry, LogRocket и т.д.)
}

/**
 * Wrapper для безопасного выполнения API функций
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context || fn.name, { args });
      return handleApiError(error, context);
    }
  };
}


