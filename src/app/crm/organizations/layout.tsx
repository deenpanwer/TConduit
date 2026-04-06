import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Organizations | Trac AI",
    description: "Manage and view your CRM organizations.",
};

export default function CrmOrganizationsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
