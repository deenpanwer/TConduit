"use client";

import { PosSidebar } from "@/components/pos/PosSidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* The Sidebar (now receiving mobile state) */}
      <PosSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Navigation Bar (Visible only on small screens) */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="hover:bg-secondary"
            >
              <Menu className="size-6" />
            </Button>
            <span className="font-poppins font-black text-sm uppercase tracking-tighter">
              POS SYSTEM
            </span>
          </div>
          
          {/* Optional: Add a small logo or status indicator here */}
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo" className="size-5 dark:invert" />
          </div>
        </header>

        {/* Main Page Content */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 scrollbar-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}