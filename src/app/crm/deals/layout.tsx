import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Deals | Trac AI",
    description: "Manage and view your CRM deals.",
};

export default function CrmDealsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
