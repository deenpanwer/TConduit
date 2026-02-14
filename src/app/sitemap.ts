import { MetadataRoute } from 'next'
import { legalSections } from '@/lib/legal-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.traconomics.com';

  // Static routes
  const staticRoutes = [
    '/',
    '/2',
    '/legal',
    '/time-tracking',
    '/trac-diary',
    '/hired',
    '/problems',
    '/search',
    '/thank-you',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  // Dynamic legal routes
  const legalRoutes = legalSections.flatMap(section => 
    section.items.map((item: any) => ({
      url: `${baseUrl}/legal/${item.id}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as 'yearly',
      priority: 0.5,
    }))
  );

  return [
    ...staticRoutes,
    ...legalRoutes,
  ];
}
