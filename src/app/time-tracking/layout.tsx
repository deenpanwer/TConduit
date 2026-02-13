import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Tracking Software for Remote Teams | TRAC AI',
  description: 'Experience the most accurate AI-powered time tracking software. Monitor productivity with live streams and ensure every billed hour is a productive hour.',
};

export default function TimeTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
