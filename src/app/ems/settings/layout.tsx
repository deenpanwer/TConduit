import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your personal profile, organization settings, and application preferences.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
