"use client";

import { useState } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTeam } from "@/hooks/use-team";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { PWAInstallPrompt } from "@/components/dashboard/PWAInstallPrompt";
import { usePathname } from "next/navigation";

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } =
    useSidebar();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { employees } = useTeam();
  const pathname = usePathname();

  const isAuthPage =
    pathname?.includes("/login") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/forgot-password") ||
    pathname?.includes("/onboarding");

  if (isAuthPage) {
    return (
      <div className="flex-1 h-screen relative">
        {children}
        <PWAInstallPrompt />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <DashboardSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileOpen}
        setIsMobileSidebarOpen={setIsMobileOpen}
        employees={employees}
        onInviteClick={() => setShowInviteModal(true)}
      />

      <InviteModal isOpen={showInviteModal} onOpenChange={setShowInviteModal} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
