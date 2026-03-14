import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TRAC AI | Partner Dashboard',
  description: 'Manage your TRAC AI partner account, signups, and performance tracking.',
};

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
