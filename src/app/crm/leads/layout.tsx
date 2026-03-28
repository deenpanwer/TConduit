import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads | TRAC AI CRM',
  description: 'Manage and track your sales leads and opportunities.',
};

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
