import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { PHProvider } from './providers';

export const metadata: Metadata = {
  title: 'TConduit',
  description: 'An AI agent that finds relevant talent across the web.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <PHProvider>
        <body className="font-serif">
          {children}
          <Analytics />
        </body>
      </PHProvider>
    </html>
  );
}
