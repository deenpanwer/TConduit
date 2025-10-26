import type {Metadata} from 'next';
import './globals.css';

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
      <body className="font-serif">
        {children}
      </body>
    </html>
  );
}
