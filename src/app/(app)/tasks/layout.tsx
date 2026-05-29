import { Metadata } from 'next';
import TasksClientLayout from '@/components/tasks/TasksClientLayout';

export const metadata: Metadata = {
  title: 'Tasks | TRAC AI Productivity Monitor',
  description: 'Manage and track your team\'s progress across projects.',
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TasksClientLayout>{children}</TasksClientLayout>;
}
