import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Lead Details | Trac AI",
    description: "View details for a specific CRM lead.",
};

export default function CrmLeadDetailsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
