"use client";

import { useState } from "react";
import { DemoSidebar } from "@/components/demo/DemoSidebar";
import { demoEmployees } from "@/lib/demo-data";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PWAInstallPrompt } from "@/components/ems/PWAInstallPrompt";
import { GlobalDateSelector } from "@/components/ems/shared/GlobalDateSelector";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <div className="flex h-screen bg-background overflow-hidden relative text-foreground">
          <DemoSidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileSidebarOpen={isMobileOpen}
            setIsMobileSidebarOpen={setIsMobileOpen}
            employees={demoEmployees}
          />

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
                  <Menu />
                </Button>
                <GlobalDateSelector 
                  selectedDate={selectedDate} 
                  setSelectedDate={setSelectedDate} 
                  minDate={new Date("2024-01-01")} 
                />
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  className="size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-90"
                >
                   <img 
                      src="https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah" 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {children}
              
              {/* Floating Signup Button */}
              <div className="fixed bottom-8 right-8 z-50 animate-bounce hover:animate-none">
                <Link 
                  href="/ems/signup"
                  className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm rounded-full shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group"
                >
                  Start For Free 
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <PWAInstallPrompt />
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
