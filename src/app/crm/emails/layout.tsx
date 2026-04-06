import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Emails | Trac AI",
    description: "Review and analyze emails from your CRM.",
};

export default function CrmEmailsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
