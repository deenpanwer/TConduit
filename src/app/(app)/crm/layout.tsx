import { Metadata } from 'next';
import CRMClientLayout from './CRMClientLayout';

export const metadata: Metadata = {
   title: 'CRM Overview | TRAC AI Sales Pipeline',
   description: 'Manage your organization\'s sales pipeline and leads performance with TRAC AI.',
  };
export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CRMClientLayout>{children}</CRMClientLayout>;
}
