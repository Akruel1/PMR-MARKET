import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://pmrmarket.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile',
          '/messages',
          '/favorites',
          '/ads/new',
          '/ads/edit/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile',
          '/messages',
          '/favorites',
          '/ads/new',
          '/ads/edit/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

















