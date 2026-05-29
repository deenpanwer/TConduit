import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download Trac Diary | Proof of Work & Activity Tracker',
  description: 'Get the Trac Diary client for Windows, macOS, or Linux. Start building your verifiable professional profile and track your productivity in real-time.',
};

export default function TracDiaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
