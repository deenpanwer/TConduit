import { MetadataRoute } from 'next'
import { legalSections } from '@/lib/legal-data';
import { COMPETITORS_CONFIG } from '@/lib/data/competitor-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.heytracai.com';

  // Primary public routes
  const primaryRoutes = [
    '/',
    '/2',
    '/about',
    '/contact',
    '/pricing',
    '/features',
    '/changelog',
    '/partner',
    '/time-tracking',
    '/trac-diary',
    '/hired',
    '/problems',
    '/reviews',
    '/thank-you',
    '/cancellation-refund-policy',
    '/ownership-statement',
    '/privacy-policy',
    '/terms-of-service',
    '/legal',
    '/best-employee-monitoring-software-pakistan',
    '/best-employee-monitoring-software-india',
    '/best-employee-productivity-tracking-dubai',
    '/alternative',
    '/best-ems-software',
    '/best-lead-finder',
  ];

  // 19 Public Marketing Apps Routes (Keyword-targeted Gem Landing Pages)
  const appsRoutes = [
    '/apps/accounting',
    '/apps/ats',
    '/apps/chats',
    '/apps/crm',
    '/apps/dashboard',
    '/apps/email',
    '/apps/forms',
    '/apps/hiring',
    '/apps/inventory',
    '/apps/lead-hunter',
    '/apps/leaderboards',
    '/apps/leads-enrich',
    '/apps/manufacturing',
    '/apps/pos',
    '/apps/procurement',
    '/apps/sales',
    '/apps/shifts',
    '/apps/tasks',
    '/apps/time-tracking',
  ];

  // Combine and format static routes
  const staticRoutes = [...primaryRoutes, ...appsRoutes].map((route) => {
    let priority = 0.8;
    let changeFrequency: 'monthly' | 'weekly' | 'daily' | 'yearly' = 'monthly';

    if (route === '/') {
      priority = 1.0;
      changeFrequency = 'daily';
    } else if (route.startsWith('/legal') || route.includes('policy') || route === '/ownership-statement') {
      priority = 0.4;
      changeFrequency = 'yearly';
    } else if (route.startsWith('/apps/')) {
      priority = 0.7;
      changeFrequency = 'weekly';
    } else if (route === '/reviews' || route === '/changelog') {
      priority = 0.9;
      changeFrequency = 'weekly';
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });

  // Dynamic legal routes from legal sections
  const legalRoutes = legalSections.flatMap(section => 
    section.items.map((item: any) => ({
      url: `${baseUrl}/legal/${item.id}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    }))
  );

  // Dynamic competitor alternative routes
  const competitorRoutes = Object.keys(COMPETITORS_CONFIG).map((competitor) => ({
    url: `${baseUrl}/alternative/${competitor}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...competitorRoutes,
    ...legalRoutes,
  ];
}
