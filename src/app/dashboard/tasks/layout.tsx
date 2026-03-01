import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks | TRAC AI Productivity Monitor',
  description: 'Manage and track your team\'s progress across projects.',
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
