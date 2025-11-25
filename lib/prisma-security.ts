import { Prisma } from '@prisma/client';
import { detectSQLInjection, validateInputSecurity } from './sanitize';

/**
 * Безопасный wrapper для Prisma запросов
 */
export class SecurePrisma {
  /**
   * Валидация параметров поиска
   */
  static validateSearchParams(params: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        const security = validateInputSecurity(value);
        if (!security.safe) {
          console.warn(`Unsafe input detected for ${key}:`, security.threats);
          continue; // Пропускаем небезопасные параметры
        }
        validated[key] = value;
      } else if (typeof value === 'number' && !isNaN(value)) {
        validated[key] = value;
      } else if (typeof value === 'boolean') {
        validated[key] = value;
      } else if (value === null || value === undefined) {
        validated[key] = value;
      }
    }
    
    return validated;
  }
  
  /**
   * Безопасное построение WHERE условий
   */
  static buildSafeWhereClause(filters: Record<string, any>): Prisma.AdWhereInput {
    const validatedFilters = this.validateSearchParams(filters);
    const where: Prisma.AdWhereInput = {};
    
    // Только разрешенные поля для фильтрации
    const allowedFields = [
      'categoryId', 'cityId', 'userId', 'status', 'condition', 'currency'
    ];
    
    for (const [key, value] of Object.entries(validatedFilters)) {
      if (allowedFields.includes(key) && value !== undefined) {
        (where as any)[key] = value;
      }
    }
    
    // Специальная обработка для поиска по тексту
    if (validatedFilters.search && typeof validatedFilters.search === 'string') {
      const searchTerm = validatedFilters.search.trim();
      if (searchTerm.length > 0 && searchTerm.length <= 200) {
        where.OR = [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }
    }
    
    // Диапазон цен
    if (validatedFilters.minPrice !== undefined || validatedFilters.maxPrice !== undefined) {
      where.price = {};
      if (validatedFilters.minPrice !== undefined && validatedFilters.minPrice >= 0) {
        where.price.gte = validatedFilters.minPrice;
      }
      if (validatedFilters.maxPrice !== undefined && validatedFilters.maxPrice >= 0) {
        where.price.lte = validatedFilters.maxPrice;
      }
    }
    
    return where;
  }
  
  /**
   * Безопасное построение ORDER BY
   */
  static buildSafeOrderBy(sortBy?: string, sortOrder?: string): Prisma.AdOrderByWithRelationInput[] {
    const allowedSortFields = ['createdAt', 'price', 'viewsCount', 'title'];
    const allowedSortOrders = ['asc', 'desc'];
    
    const field = allowedSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
    const order = allowedSortOrders.includes(sortOrder || '') ? sortOrder : 'desc';
    
    return [{ [field!]: order }];
  }
  
  /**
   * Валидация пагинации
   */
  static validatePagination(page?: number, limit?: number): { skip: number; take: number } {
    const validPage = Math.max(1, Math.min(page || 1, 1000)); // Максимум 1000 страниц
    const validLimit = Math.max(1, Math.min(limit || 12, 100)); // Максимум 100 элементов
    
    return {
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    };
  }
  
  /**
   * Безопасный select для пользовательских данных
   */
  static getSafeUserSelect(): Prisma.UserSelect {
    return {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      // Исключаем чувствительные данные
      email: false,
      role: false,
      banned: false,
      telegramChatId: false,
      accountCode: false,
    };
  }
  
  /**
   * Проверка прав доступа к объявлению
   */
  static async checkAdAccess(
    prisma: any,
    adId: string,
    userId: string,
    action: 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { userId: true, status: true },
    });
    
    if (!ad) return false;
    
    // Владелец может делать все
    if (ad.userId === userId) return true;
    
    // Для чтения - только одобренные объявления
    if (action === 'read' && ad.status === 'APPROVED') return true;
    
    return false;
  }
}


