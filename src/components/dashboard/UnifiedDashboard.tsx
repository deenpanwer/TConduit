"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "./chat/ChatInterface";
import { useState } from "react";
import { UnifiedSidebar } from "./UnifiedSidebar";
import { useParams } from "next/navigation";

export function UnifiedDashboard({ children }: { children?: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { id: chatId } = useParams();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <UnifiedSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header for mobile view */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-20 sticky top-0 lg:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu size={20} />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none flex items-center gap-2">
                Trac AI
              </h1>
            </div>
          </div>
        </header>

        {/* Content Area - Chat Only */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatInterface />
          {children}
        </div>
      </main>
    </div>
  );
}
