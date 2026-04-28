"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { CRMSidebar } from "./crm-sidebar"; // Ensure this matches your export name
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

export default function CRMClientLayout({ children }: { children: React.ReactNode }) {
  const { loading, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect if auth and userData are fully loaded AND we are in the CRM module
    if (!loading && userData && pathname?.startsWith("/crm")) {
        const tourNotDone = userData.crmTourCompleted === false || userData.crmTourCompleted === undefined;
        const isNotOnOnboardingPage = pathname !== "/crm/onboarding" && !pathname?.startsWith("/crm/onboarding");
        
        if (tourNotDone && isNotOnOnboardingPage) {
            router.push("/crm/onboarding");
        }
    }
  }, [loading, userData, pathname, router]);

  // Show shimmer while loading auth or while redirecting to tour
  const tourNotDone = userData?.crmTourCompleted === false || userData?.crmTourCompleted === undefined;
  const isNotOnOnboardingPage = pathname !== "/crm/onboarding" && !pathname?.startsWith("/crm/onboarding");
  const isCrmPath = pathname?.startsWith("/crm");
  const shouldRedirect = userData && tourNotDone && isNotOnOnboardingPage && isCrmPath;

  if (loading || shouldRedirect) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Shimmer Sidebar Placeholder */}
        <div className="w-64 border-r p-4 space-y-4 hidden lg:block">
          <Shimmer className="h-10 w-full rounded-xl" />
          <div className="space-y-2 pt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Shimmer key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
            <Shimmer className="h-4 w-32 rounded-full" />
            <div className="flex items-center gap-4">
              <Shimmer className="h-8 w-24 rounded-md" />
              <Shimmer className="size-8 rounded-full" />
            </div>
          </header>
          <div className="flex-1 p-6 space-y-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Shimmer className="h-32 rounded-2xl" />
              <Shimmer className="h-32 rounded-2xl" />
              <Shimmer className="h-32 rounded-2xl" />
            </div>
            <Shimmer className="h-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // --- FULL SCREEN ONBOARDING CHECK ---
  // If we are on the onboarding page, do NOT show the sidebar or main header.
  if (pathname?.startsWith("/crm/onboarding")) {
    return <div className="h-screen w-full overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Updated CRM Sidebar */}
      <CRMSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header with Hamburger Toggle */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-card shrink-0 z-40">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="hover:bg-secondary"
            >
              <Menu className="size-6" />
            </Button>
            <div className="flex flex-col">
              <span className="font-poppins font-black text-xs uppercase tracking-tighter leading-none text-blue-600 dark:text-blue-400">
                CRM SYSTEM
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Management
              </span>
            </div>
          </div>
          
          <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo" className="size-5 dark:invert" />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}