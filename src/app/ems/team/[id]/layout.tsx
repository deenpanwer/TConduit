import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Member Detail | TRAC AI",
  description: "Comprehensive performance analysis and activity history for individual team members.",
};

export default function TeamMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
