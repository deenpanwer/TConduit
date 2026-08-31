import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Employee Productivity Loss Calculator | TRAC AI Tools',
  description: 'Calculate the exact monthly and annual revenue lost to employee visibility bottlenecks and fragmentation. Compare your losses against Trac AI savings.',
  openGraph: {
    title: 'Productivity Loss Calculator | TRAC AI Tools',
    description: 'Calculate monthly and annual revenue lost to unmonitored employee bottlenecks and compare with Trac AI.',
    url: 'https://heytracai.com/tools/calculator',
    siteName: 'TRAC AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employee Productivity Loss Calculator | TRAC AI',
    description: 'Find out how much money is leaking from your business every month without you knowing.',
  },
};

export default function CalculatorLayout({
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
