"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { TasksSidebar } from "./TasksSidebar";
import { InviteModal } from "@/components/ems/InviteModal";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, useSidebar } from "@/hooks/use-sidebar";
import { useRouter, usePathname } from "next/navigation";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

function TasksLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { employees } = useTeam();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    // Only redirect if auth and userData are fully loaded AND we are in the tasks module
    if (!loading && userData && pathname?.startsWith("/tasks")) {
        const tourNotDone = userData.tasksTourCompleted === false || userData.tasksTourCompleted === undefined;
        const isNotOnOnboardingPage = pathname !== "/tasks/onboarding" && !pathname?.startsWith("/tasks/onboarding");
        
        if (tourNotDone && isNotOnOnboardingPage) {
            router.push("/tasks/onboarding");
        }
    }
  }, [loading, userData, pathname, router]);

  // Show shimmer while loading auth or while redirecting to tour
  const tourNotDone = userData?.tasksTourCompleted === false || userData?.tasksTourCompleted === undefined;
  const isNotOnOnboardingPage = pathname !== "/tasks/onboarding" && !pathname?.startsWith("/tasks/onboarding");
  const isTasksPath = pathname?.startsWith("/tasks");
  const shouldRedirect = userData && tourNotDone && isNotOnOnboardingPage && isTasksPath;

  if (loading || shouldRedirect) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
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
             <Shimmer className="h-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <TasksSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isMobileSidebarOpen={isMobileOpen}
          setIsMobileSidebarOpen={setIsMobileOpen}
          employees={employees}
          onInviteClick={() => setIsInviteModalOpen(true)}
        />

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-card shrink-0 z-40">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(true)}
                className="hover:bg-secondary"
              >
                <Menu className="size-6" />
              </Button>
              <div className="flex flex-col">
                <span className="font-poppins font-black text-xs uppercase tracking-tighter leading-none text-primary">
                  TASKS SYSTEM
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  Management
                </span>
              </div>
            </div>
            
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <img src="/logo.svg" alt="Logo" className="size-5 dark:invert" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 bg-background/50">
            <AnnouncementBanner />
            {children}
          </main>
        </div>
      </div>
      <InviteModal 
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </>
  );
}

function TasksLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith("/tasks/onboarding");

  if (isOnboarding) {
    return <div className="h-screen w-full overflow-hidden">{children}</div>;
  }

  return <TasksLayoutContent>{children}</TasksLayoutContent>;
}

export default function TasksClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <TasksLayoutWrapper>
                {children}
            </TasksLayoutWrapper>
        </SidebarProvider>
    );
}
