import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lead Detail | TRAC AI CRM',
  description: 'View and manage lead information and activity history.',
};

export default function LeadDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
