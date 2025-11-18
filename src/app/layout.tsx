import type {Metadata} from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { Poppins } from 'next/font/google';

// import { PHProvider } from './providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'TRAC',
  description: 'An AI agent that finds relevant talent across the web.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable}`}>
      {/* <PHProvider> */}
        <body className="font-serif">
          {children}
          <Analytics />
        </body>
      {/* </PHProvider> */}
    </html>
  );
}
