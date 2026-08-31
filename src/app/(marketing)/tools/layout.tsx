import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Free Business Operations Tools & Calculators | TRAC AI',
  description: 'Free, interactive business tools, productivity loss calculators, and PDF invoice generators. 100% free with no account or credit card required.',
  openGraph: {
    title: 'Free Business Operations Tools | TRAC AI',
    description: 'Optimize your business operations with our free suite of productivity calculators and client-side invoice generators.',
    url: 'https://heytracai.com/tools',
    siteName: 'TRAC AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Business Tools & Calculators | TRAC AI',
    description: 'Free tools to calculate productivity leaks and generate high-res PDF invoices instantly.',
  },
};

export default function ToolsRootLayout({
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
