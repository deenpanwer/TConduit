import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Contacts | Trac AI",
    description: "Manage and view your CRM contacts.",
};

export default function CrmContactsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
