"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "@/hooks/use-sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useTeam } from "@/hooks/use-team";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { PWAInstallPrompt } from "@/components/dashboard/PWAInstallPrompt";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// A custom hook to poll for notifications
function useNotificationPoller() {
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const { notifications } = await response.json();
          notifications.forEach((notif: any) => {
            // Display each notification as a toast
            toast({
              title: notif.title,
              description: notif.description,
            });
          });
        }
      } catch (error) {
        // Silently fail. We don't want to bother the user if the network fails.
        console.error("Failed to fetch notifications:", error);
      }
    };

    // Fetch notifications immediately and then every 15 seconds
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 15000);

    // Cleanup on component unmount
    return () => clearInterval(intervalId);
  }, [toast]);
}


export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { employees } = useTeam();
  const pathname = usePathname();

  // This custom hook will now handle all notification logic.
  useNotificationPoller();

  const isAuthPage = pathname?.includes("/login") || 
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

      <InviteModal 
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
