import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TRAC AI | Partner Portal',
  description: 'Join the TRAC AI partner network and manage your attribution.',
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
