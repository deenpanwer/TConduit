import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | TRAC AI Sales & Customer Support',
  description: 'Get in touch with the Trac AI support and sales teams. Ask questions, request customized enterprise product demos, or get technical help with our platform.',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
