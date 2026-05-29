import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Leads | Trac AI",
    description: "Manage and view your CRM leads.",
};

export default function CrmLeadsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
