import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supervise Personnel | TRAC AI",
  description: "Real-time monitoring and activity tracking for your organization's personnel.",
};

export default function SuperviseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
