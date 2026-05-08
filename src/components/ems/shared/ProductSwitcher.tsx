"use client";

import React from "react";
import { 
  ChevronDown, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MODULE_CONFIG } from "@/lib/modules";

interface ProductSwitcherProps {
  currentModuleId: string;
  isCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  selectedModules: string[];
  partnerBrand?: string | null;
  onConfigOpen: () => void;
}

export function ProductSwitcher({
  currentModuleId,
  isCollapsed,
  isMobileSidebarOpen,
  selectedModules,
  partnerBrand,
  onConfigOpen
}: ProductSwitcherProps) {
  const router = useRouter();

  const currentModule = MODULE_CONFIG.find(m => m.id === currentModuleId) || MODULE_CONFIG[0];
  
  // Show other modules if released OR if they are in the selectedModules list
  const otherModules = MODULE_CONFIG.filter(m => 
    m.id !== currentModuleId && 
    (m.released || selectedModules.includes(m.id)) &&
    (selectedModules.length === 0 || selectedModules.includes(m.id))
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center justify-between w-full p-2 rounded-xl hover:bg-secondary transition-all group",
          isCollapsed && !isMobileSidebarOpen ? "justify-center" : "px-3"
        )}>
          <div className="flex items-center gap-3">
            {currentModuleId === "ems" ? (
              <img src="/logo.svg" alt="Logo" className="w-8 h-8 min-w-8 dark:invert shrink-0 transition-transform group-hover:scale-105" />
            ) : (
              <currentModule.icon className={cn("size-6 shrink-0 transition-transform group-hover:scale-105", currentModule.color)} />
            )}
            
            {(!isCollapsed || isMobileSidebarOpen) && (
              <div className="flex flex-col items-start min-w-0 text-left">
                <span className="font-poppins font-black text-lg tracking-tighter uppercase leading-none">
                  {currentModuleId === "ems" ? "TRAC AI" : currentModule.shortTitle}
                </span>
                {partnerBrand && (
                  <span className="font-poppins font-black text-[10px] tracking-tighter uppercase leading-none mt-1 opacity-60">
                    SUBSIDIARY OF {partnerBrand}
                  </span>
                )}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                  {currentModule.description.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
          {(!isCollapsed || isMobileSidebarOpen) && <ChevronDown size={14} className="text-muted-foreground ml-2" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl">
        <div className="px-2 py-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Switch Product</span>
        </div>
        
        {/* CURRENT MODULE */}
        <DropdownMenuItem 
          disabled
          className="flex items-center gap-4 p-3 rounded-xl mb-1 opacity-50 bg-secondary/50 cursor-default"
        >
          <div className={cn("size-10 rounded-xl flex items-center justify-center", currentModule.bg)}>
            <currentModule.icon className={cn("size-5", currentModule.color)} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm">{currentModule.shortTitle}</span>
            <span className="text-[10px] text-muted-foreground">Current Product</span>
          </div>
        </DropdownMenuItem>

        {/* OTHER MODULES */}
        {otherModules.map((module) => (
          <DropdownMenuItem 
            key={module.id}
            asChild
            className="flex items-center gap-4 p-3 rounded-xl mb-1 cursor-pointer hover:bg-secondary transition-all"
          >
            <Link href={module.href}>
              <div className={cn("size-10 rounded-xl flex items-center justify-center", module.bg)}>
                <module.icon className={cn("size-5", module.color)} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm">{module.shortTitle}</span>
                <span className="text-[10px] text-muted-foreground">{module.description}</span>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}

        <div className="border-t border-border mt-2 pt-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 p-3 rounded-xl hover:bg-primary/5 hover:text-primary group"
            onClick={onConfigOpen}
          >
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm">Add more apps</span>
              <span className="text-[10px] text-muted-foreground">Customize workspace</span>
            </div>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
