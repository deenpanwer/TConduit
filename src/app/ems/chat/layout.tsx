import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | TRAC AI Productivity Monitor',
  description: 'Chat with your staff members in real-time.',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}