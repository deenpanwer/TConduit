import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Organization Details | Trac AI",
    description: "View details for a specific CRM organization.",
};

export default function CrmOrganizationDetailsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
