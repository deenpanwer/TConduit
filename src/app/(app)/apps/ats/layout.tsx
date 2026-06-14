import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Applicant Tracking System (ATS) | TRAC AI Recruitment',
  description: 'Optimize your recruitment pipeline with the Trac AI Applicant Tracking System (ATS). Automate resume screening, interviews, and hire top talent faster.',
};

export default function ATSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
