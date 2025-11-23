import { Ad, User, Category, City, Image, Message, Favorite } from '@prisma/client';

export type { Ad, User, Category, City, Image, Message, Favorite };

export type AdWithRelations = Ad & {
  images: Image[];
  category: Category;
  city: City;
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  _count?: {
    favorites: number;
    views: number;
  };
};

export type UserWithStats = User & {
  _count?: {
    ads: number;
    favorites: number;
  };
};

export interface AdFilters {
  search?: string;
  categoryId?: string;
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: 'NEW' | 'USED';
  currency?: 'USD' | 'EUR' | 'RUB' | 'MDL';
  dateFrom?: Date;
  minAdRating?: number;
  minSellerRating?: number;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

