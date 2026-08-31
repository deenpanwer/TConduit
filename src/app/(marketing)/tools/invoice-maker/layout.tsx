import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Free Invoice Maker & High-Resolution PDF Generator | TRAC AI Tools',
  description: 'Create, customize, and export professional high-resolution A4 PDF invoices for free. 100% client-side privacy, custom logo upload, multi-currency, and digital signature.',
  openGraph: {
    title: 'Free Invoice Maker & Generator | TRAC AI Tools',
    description: 'Generate beautiful A4 PDF invoices instantly with custom branding and digital signatures. No sign-up or credit card required.',
    url: 'https://heytracai.com/tools/invoice-maker',
    siteName: 'TRAC AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Invoice Maker & PDF Generator | TRAC AI',
    description: '100% free client-side invoice maker with instant high-resolution A4 PDF export.',
  },
};

export default function InvoiceMakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-h-screen relative bg-background">
      {children}
    </div>
  );
}
