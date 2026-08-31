import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { Poppins, Montserrat, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from '@/components/theme-provider';
import { PHProvider } from './providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.heytracai.com'),
  title: "Trac AI | Finally Know Who Is Working and Who Isn't",
  description: 'Trac AI is the ultimate integrated business operating system. Streamline your team workflows, CRM, POS, ATS, chats, time tracking, and accounting in one platform.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-196.png', sizes: '196x196', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    url: 'https://www.heytracai.com',
    title: "Trac AI | Finally Know Who Is Working and Who Isn't",
    description: 'Trac AI is the ultimate integrated business operating system. Streamline your team workflows, CRM, POS, ATS, chats, time tracking, and accounting in one platform.',
    images: [
      {
        url: 'https://www.heytracai.com/trac-ai-logo.png',
        width: 1200,
        height: 630,
        alt: 'Trac AI - Business Operating System',
      },
    ],
    siteName: 'Trac AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Trac AI | Finally Know Who Is Working and Who Isn't",
    description: 'Trac AI is the ultimate integrated business operating system.',
    images: ['https://www.heytracai.com/trac-ai-logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable, montserrat.variable, playfair.variable)} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        {/* Favicon & Web App Icons for Search Engines (Googlebot-Favicon requires square multiples of 48px) */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" type="image/x-icon" />
        <link rel="icon" href="/icon.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon-196.png" sizes="196x196" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon-180.png" sizes="180x180" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Preconnect and DNS-prefetch to speed up analytics script loading in production */}
        <link rel="preconnect" href="https://us.posthog.com" />
        <link rel="preconnect" href="https://us.i.posthog.com" />
        <link rel="preconnect" href="https://z.clarity.ms" />
        <link rel="preconnect" href="https://www.clarity.ms" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" />
        <link rel="dns-prefetch" href="https://us.posthog.com" />
        <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        <link rel="dns-prefetch" href="https://z.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
      </head>
      <body className="font-sans">
        <PHProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <SonnerToaster position="bottom-right" expand={false} richColors />
            <Analytics />
          </ThemeProvider>
        </PHProvider>
      </body>
    </html>
  );
}
