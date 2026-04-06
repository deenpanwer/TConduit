import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Notes | Trac AI",
    description: "Manage and view your CRM notes.",
};

export default function CrmNotesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
