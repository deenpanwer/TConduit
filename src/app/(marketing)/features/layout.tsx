import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features & Tools | TRAC AI Business Operating System',
  description: 'Explore the robust features of Trac AI, including integrated CRM, ATS recruitment pipelines, POS billing, smart shift scheduling, and automated accounting.',
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
