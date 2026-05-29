import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Configuration | Trac AI",
    description: "Configure your CRM settings.",
};

export default function CrmConfigLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
