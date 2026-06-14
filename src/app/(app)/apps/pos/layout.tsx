import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Point of Sale (POS) System | TRAC AI Retail Solutions',
  description: 'Discover Trac AI Point of Sale (POS) software. Streamline retail transactions, manage real-time inventory levels, and build customer loyalty effortlessly.',
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
