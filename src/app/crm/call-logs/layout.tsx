import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CRM Call Logs | Trac AI",
    description: "Review and analyze call logs from your CRM.",
};

export default function CrmCallLogsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
