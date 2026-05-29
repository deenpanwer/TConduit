import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.heytracai.com';

  const publicAllowPaths = [
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
    '/legal',
    '/legal/',
    '/cancellation-refund-policy',
    '/ownership-statement',
    '/privacy-policy',
    '/terms-of-service',
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
    '/llms.txt',
  ];

  const privateDisallowPaths = [
    '/dashboard/',
    '/internaldashboard/',
    '/crm/',
    '/attendance/',
    '/ems/',
    '/pos/',
    '/tasks/',
    '/reports/',
    '/support/',
    '/subscribe/',
    '/apps/dashboard/builder', // Example internal apps assets if any
    '/api/',
    '/login',
    '/signup',
    '/test/',
    '/test-ui/',
    '/test-ui1/',
    '/test-ui2/',
    '/test-ui3/',
    '/test10/',
    '/test11/',
    '/test12/',
    '/test13/',
    '/test14/',
    '/test15/',
    '/test16/',
    '/test17/',
    '/test18/',
    '/testpush/',
    '/testtable/',
  ];

  return {
    rules: [
      {
        // Standard Search Crawlers
        userAgent: ['Googlebot', 'Bingbot', 'YandexBot', 'Yandex', 'Applebot'],
        allow: publicAllowPaths,
        disallow: privateDisallowPaths,
      },
      {
        // AI Chatbots and Scrapers (OpenAI GPTBot, Anthropic's ClaudeBot, Perplexity)
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Claude-Web', 'cohere-ai'],
        allow: [...publicAllowPaths, '/llms.txt'],
        disallow: privateDisallowPaths,
      },
      {
        // Global Fallback
        userAgent: '*',
        allow: publicAllowPaths,
        disallow: privateDisallowPaths,
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
