"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { DocsSidebar } from "./docs-sidebar";
import { Menu, FileText, UserPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { PaywallWrapper } from "@/components/ems/PaywallWrapper";
import { InviteModal } from "@/components/ems/InviteModal";
import { useRouter } from "next/navigation";
import { getUserAvatar } from "@/lib/utils";

export default function DocsClientLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, userData } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isClientUser = userData?.role === "client" || userData?.isClient === true;

  if (loading) {
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DocsSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onInviteClick={() => setShowInviteModal(true)}
      />

      <InviteModal isOpen={showInviteModal} onOpenChange={setShowInviteModal} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar (Identical layout & profile icon to EMS) */}
        <header className="px-4 md:px-6 h-14 border-b border-border/80 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden hover:bg-secondary"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-black text-xs md:text-sm uppercase tracking-tight text-foreground">
                DOCS & POLICIES
              </span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline-block">
                • Company Management
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isClientUser && (
              <Button 
                onClick={() => setShowInviteModal(true)} 
                variant="outline" 
                size="sm" 
                className="hidden md:flex rounded-xl font-bold text-xs gap-1.5 h-9 px-4 hover:bg-secondary"
              >
                <UserPlus size={14} /> Add Staff Member
              </Button>
            )}

            {/* User Profile Avatar Button (EMS Pattern) */}
            <button 
              onClick={() => {
                if (isClientUser) return;
                router.push("/ems/settings");
              }}
              title={userData?.name || userData?.displayName || userData?.email || "Account Settings"}
              className="size-9 sm:size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 shrink-0 shadow-sm"
            >
              <img 
                src={getUserAvatar(userData)} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col transition-all duration-300 bg-background/50">
          <AnnouncementBanner />
          <PaywallWrapper>{children}</PaywallWrapper>
        </main>
      </div>
    </div>
  );
}
