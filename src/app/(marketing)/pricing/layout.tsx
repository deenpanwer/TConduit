import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Pricing & Plans | TRAC AI Business Operating System',
  description: 'View simple and transparent pricing plans for Trac AI. Find the perfect tier for your team to unlock CRM, POS, ATS, and advanced workforce management.',
};

export default function PricingLayout({
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
