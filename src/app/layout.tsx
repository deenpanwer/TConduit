import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RetroSheet',
  description: 'A retro-style data entry page.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
