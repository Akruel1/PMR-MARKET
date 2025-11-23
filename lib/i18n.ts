export type Locale = 'ru' | 'en';

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Locale, Translations> = {
  ru: {
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успешно',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.close': 'Закрыть',
    
    // Navigation
    'nav.home': 'Главная',
    'nav.ads': 'Объявления',
    'nav.messages': 'Сообщения',
    'nav.profile': 'Профиль',
    'nav.favorites': 'Избранное',
    'nav.admin': 'Админ',
    'nav.signin': 'Войти',
    'nav.signout': 'Выйти',
    
    // Ads
    'ads.create': 'Создать объявление',
    'ads.edit': 'Редактировать объявление',
    'ads.title': 'Заголовок',
    'ads.description': 'Описание',
    'ads.price': 'Цена',
    'ads.category': 'Категория',
    'ads.city': 'Город',
    'ads.condition': 'Состояние',
    'ads.condition.new': 'Новое',
    'ads.condition.used': 'Б/У',
    'ads.images': 'Изображения',
    'ads.contact': 'Связаться',
    'ads.favorite': 'В избранное',
    'ads.report': 'Пожаловаться',
    
    // Messages
    'messages.title': 'Сообщения',
    'messages.send': 'Отправить',
    'messages.placeholder': 'Введите сообщение...',
    'messages.empty': 'Нет сообщений',
    
    // Profile
    'profile.title': 'Профиль',
    'profile.ads': 'Мои объявления',
    'profile.favorites': 'Избранное',
    'profile.settings': 'Настройки',
    
    // Admin
    'admin.title': 'Панель администратора',
    'admin.moderate': 'Модерация',
    'admin.reports': 'Жалобы',
    'admin.users': 'Пользователи',
    
    // Auth
    'auth.signin': 'Войти',
    'auth.signout': 'Выйти',
    'auth.signin.google': 'Войти через Google',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    
    // Navigation
    'nav.home': 'Home',
    'nav.ads': 'Ads',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'nav.favorites': 'Favorites',
    'nav.admin': 'Admin',
    'nav.signin': 'Sign In',
    'nav.signout': 'Sign Out',
    
    // Ads
    'ads.create': 'Create Ad',
    'ads.edit': 'Edit Ad',
    'ads.title': 'Title',
    'ads.description': 'Description',
    'ads.price': 'Price',
    'ads.category': 'Category',
    'ads.city': 'City',
    'ads.condition': 'Condition',
    'ads.condition.new': 'New',
    'ads.condition.used': 'Used',
    'ads.images': 'Images',
    'ads.contact': 'Contact',
    'ads.favorite': 'Add to Favorites',
    'ads.report': 'Report',
    
    // Messages
    'messages.title': 'Messages',
    'messages.send': 'Send',
    'messages.placeholder': 'Type a message...',
    'messages.empty': 'No messages',
    
    // Profile
    'profile.title': 'Profile',
    'profile.ads': 'My Ads',
    'profile.favorites': 'Favorites',
    'profile.settings': 'Settings',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.moderate': 'Moderation',
    'admin.reports': 'Reports',
    'admin.users': 'Users',
    
    // Auth
    'auth.signin': 'Sign In',
    'auth.signout': 'Sign Out',
    'auth.signin.google': 'Sign in with Google',
  },
};

/**
 * Get translation for a key
 * @param key - Translation key (e.g., 'nav.home')
 * @param locale - Locale ('ru' or 'en')
 * @param values - Optional values to replace in the translation
 * @returns Translated string or the key if not found
 */
export function t(key: string, locale: Locale = 'ru', values?: Record<string, string | number>): string {
  const keys = key.split('.');
  let translation: any = translations[locale] || translations.ru;
  
  for (const k of keys) {
    if (translation && typeof translation === 'object' && k in translation) {
      translation = translation[k];
    } else {
      // Fallback to Russian if key not found
      translation = translations.ru;
      for (const fallbackKey of keys) {
        if (translation && typeof translation === 'object' && fallbackKey in translation) {
          translation = translation[fallbackKey];
        } else {
          return key; // Return key if not found in any locale
        }
      }
      break;
    }
  }
  
  if (typeof translation !== 'string') {
    return key;
  }
  
  // Replace placeholders with values
  if (values) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
      return values[placeholder]?.toString() || match;
    });
  }
  
  return translation;
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.ru;
}
