import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Contact Details | Trac AI",
    description: "View details for a specific CRM contact.",
};

export default function CrmContactDetailsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
