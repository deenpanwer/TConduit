"use client";

import { useState } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import { AttendanceSidebar } from "./attendance-sidebar";
import { InviteModal } from "@/components/ems/InviteModal";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { PaywallWrapper } from "@/components/ems/PaywallWrapper";

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Attendance";
  if (pathname.includes("/payroll")) return "Payroll";
  if (pathname.endsWith("/ledger")) return "Ledger";
  if (pathname.endsWith("/holidays")) return "Holidays";
  if (pathname.endsWith("/settings")) return "Settings";
  return "Overview";
}

export function AttendanceClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } =
    useSidebar();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <AttendanceSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileOpen}
        setIsMobileSidebarOpen={setIsMobileOpen}
        onInviteClick={() => setShowInviteModal(true)}
      />

      <InviteModal isOpen={showInviteModal} onOpenChange={setShowInviteModal} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
                <Menu className="size-5" />
            </Button>
            <h1 className="text-sm font-bold uppercase tracking-widest">{getPageTitle(pathname)}</h1>
            <div className="w-8" />
        </header>
        <div className="flex-1 flex flex-col overflow-hidden">
          <PaywallWrapper>{children}</PaywallWrapper>
        </div>
      </main>
    </div>
  );
}
