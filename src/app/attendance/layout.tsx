import { SidebarProvider } from "@/hooks/use-sidebar";
import { AttendanceClientLayout } from "./AttendanceClientLayout";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'TRAC | Attendance & Compliance',
  description: 'Manage employee attendance and compliance with TRAC AI.',
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-196.png",
    apple: "/apple-icon-180.png",
  }
};

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AttendanceClientLayout>{children}</AttendanceClientLayout>
    </SidebarProvider>
  );
}
