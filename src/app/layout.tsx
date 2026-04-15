import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { Poppins, Montserrat, Playfair_Display, Permanent_Marker } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from '@/components/theme-provider';
import { PHProvider } from './providers';
import { AuthProvider } from '@/hooks/use-auth';
import { TeamProvider } from '@/hooks/use-team';
import { TasksProvider } from '@/hooks/useTasks';
import { CRMProvider } from '@/hooks/use-crm';
import { PosProvider } from '@/hooks/use-pos';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UploadProvider } from '@/hooks/useUploadProgress';

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

const marker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marker',
});

export const metadata: Metadata = {
  title: 'Trac AI | Software that replaces all software',
  description: 'The first truly integrated business operating system. Designed for professionals, powered by AI.',
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
    <html lang="en" className={cn(poppins.variable, montserrat.variable, playfair.variable, marker.variable)} suppressHydrationWarning>
        <head>
          <meta name="theme-color" content="#000000" />
        </head>
        <body className="font-sans">
          <PHProvider>
            <AuthProvider>
              <TeamProvider>
                <UploadProvider>
                  <TasksProvider>
                   <CRMProvider>
                    <PosProvider>
                      <TooltipProvider>
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
                      </TooltipProvider>
                    </PosProvider>
                   </CRMProvider>
                  </TasksProvider>
                </UploadProvider>
              </TeamProvider>
            </AuthProvider>
          </PHProvider>
        </body>
    </html>
  );
}
