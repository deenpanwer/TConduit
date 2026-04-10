import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Shift Orchestrator | TRAC',
  description: 'Manage your team\'s work schedule and time-off requests with ease.',
};

export default function ShiftsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 h-screen relative overflow-hidden">
      {children}
    </div>
  );
}
