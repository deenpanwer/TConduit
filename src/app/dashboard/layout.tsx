import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Dashboard | TRAC AI Productivity Monitor',
  description: 'Manage your organization, view real-time employee work streams, and analyze team productivity through the TRAC AI Master Dashboard.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
