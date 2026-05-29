"use client";

import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // TEMPORARY REDIRECT: This is a temporary redirect to the /ems page.
  // This should be removed once the main dashboard feature is complete.
  useEffect(() => {
    router.replace('/ems');
  }, [router]);

  // Show a loading skeleton while the page is redirecting.
  return <div className="h-screen w-screen bg-background flex items-center justify-center">
    <p className="text-muted-foreground">Loading...</p>
  </div>;

  /*
  // Original Dashboard Layout - Commented out until the feature is ready.
  return (
    <UnifiedDashboard>
      {children}
    </UnifiedDashboard>
  );
  */
}
