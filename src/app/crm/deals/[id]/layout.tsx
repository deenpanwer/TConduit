import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Deal Details | Trac AI",
    description: "View details for a specific CRM deal.",
};

export default function CrmDealDetailsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
