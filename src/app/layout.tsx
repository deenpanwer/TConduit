import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { Poppins, Montserrat, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { PHProvider } from './providers';
import { AuthProvider } from '@/hooks/use-auth';
import { TeamProvider } from '@/hooks/use-team';
import { TasksProvider } from '@/hooks/useTasks';
import { CRMProvider } from '@/hooks/use-crm';
import { PosProvider } from '@/hooks/use-pos';

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
  title: 'TRAC | Google for Hiring',
  description: 'An AI agent that finds relevant talent across the web.',
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
        </head>
        <body className="font-sans">
          <PHProvider>
            <AuthProvider>
              <TeamProvider>
                <TasksProvider>
                <PosProvider> {/* <-- Wrap with PosProvider */} 
                 <CRMProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    {children}
                    <Toaster />
                    <Analytics />
                  </ThemeProvider>
                 </CRMProvider>
                 </PosProvider>
                </TasksProvider>
              </TeamProvider>
            </AuthProvider>
          </PHProvider>
        </body>
    </html>
  );
}
