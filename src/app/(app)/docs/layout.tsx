import DocsClientLayout from "./DocsClientLayout";

export const metadata = {
  title: "Docs & Policies | TRAC AI Enterprise",
  description: "Company policy management, employee onboarding packets, and compliance tracking.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsClientLayout>{children}</DocsClientLayout>;
}
