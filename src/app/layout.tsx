import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { Poppins, Montserrat, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
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
  title: "Trac AI | Finally Know Who Is Working and Who Isn't",
  description: 'Trac AI is the ultimate integrated business operating system. Streamline your team workflows, CRM, POS, ATS, chats, time tracking, and accounting in one platform.',
};

export const viewport = {
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


