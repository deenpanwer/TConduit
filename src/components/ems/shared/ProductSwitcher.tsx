"use client";

import React from "react";
import { 
  ChevronDown, Lock, Plus
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
import { useAuth } from "@/hooks/use-auth";

interface ProductSwitcherProps {
  currentModuleId: string;
  isCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  selectedModules: string[];
  partnerBrand?: string | null;
  onConfigOpen: () => void;
  isClient?: boolean;
  allowedScopes?: string[];
}

export function ProductSwitcher({
  currentModuleId,
  isCollapsed,
  isMobileSidebarOpen,
  selectedModules,
  partnerBrand,
  onConfigOpen,
  isClient,
  allowedScopes
}: ProductSwitcherProps) {
  const router = useRouter();
  const { userData } = useAuth();

  const isClientUser = isClient || userData?.isClient === true || userData?.role === "client";
  const effectiveAllowedScopes = allowedScopes || userData?.allowedScopes;

  const isOwnerOrFounder = React.useMemo(() => {
    if (!userData || isClientUser) return false;
    const role = (userData.role || '').toLowerCase();
    return !!userData.ownedOrgId || role.includes('owner') || role.includes('founder') || role.includes('admin');
  }, [userData, isClientUser]);

  const currentModule = MODULE_CONFIG.find(m => m.id === currentModuleId) || MODULE_CONFIG[0];
  
  // Show only allowed selected modules
  const otherModules = React.useMemo(() => {
    let base = MODULE_CONFIG;
    if (selectedModules && selectedModules.length > 0) {
      base = base.filter(m => selectedModules.includes(m.id));
    }
    if (isClientUser && effectiveAllowedScopes) {
      base = base.filter(m => effectiveAllowedScopes.includes(m.id));
    }
    return base.filter(m => m.id !== currentModuleId);
  }, [selectedModules, isClientUser, effectiveAllowedScopes, currentModuleId]);

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
      <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] sm:w-[500px] lg:w-[680px] p-4 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="px-3 py-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Switch Product</span>
        </div>
        
        {/* CURRENT MODULE */}
        <DropdownMenuItem 
          disabled
          className="flex items-center gap-4 p-4 rounded-2xl mb-3 opacity-50 bg-secondary/50 cursor-default mx-1"
        >
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", currentModule.bg)}>
            <currentModule.icon className={cn("size-6", currentModule.color)} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-[13px]">{currentModule.shortTitle}</span>
            <span className="text-[10px] text-muted-foreground">Current Product</span>
          </div>
        </DropdownMenuItem>

        {/* OTHER MODULES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2 px-1">
        {otherModules.map((module) => {
          const isScopeAllowed = !isClientUser || (effectiveAllowedScopes && effectiveAllowedScopes.includes(module.id));

          if (!module.released || !isScopeAllowed) {
             return (
              <DropdownMenuItem 
                key={module.id}
                disabled
                className="flex items-center gap-4 p-3 rounded-2xl cursor-default opacity-50 bg-secondary/20"
              >
                <div className={cn("size-11 rounded-2xl flex items-center justify-center shrink-0 grayscale", module.bg)}>
                  <module.icon className={cn("size-5", module.color)} />
                </div>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="font-bold text-[13px] break-words">{module.shortTitle}</span>
                  <span className="text-[10px] text-muted-foreground break-words">{module.description}</span>
                </div>
                <div className="bg-secondary px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-muted-foreground shrink-0 flex items-center gap-1">
                  <Lock size={10} />
                  <span>{!module.released ? "Soon" : "Locked"}</span>
                </div>
              </DropdownMenuItem>
             );
          }

          return (
            <DropdownMenuItem 
              key={module.id}
              asChild
              className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-secondary transition-all"
            >
              <Link href={module.href}>
                <div className={cn("size-11 rounded-2xl flex items-center justify-center shrink-0", module.bg)}>
                  <module.icon className={cn("size-5", module.color)} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-[13px] break-words">{module.shortTitle}</span>
                  <span className="text-[10px] text-muted-foreground break-words">{module.description}</span>
                </div>
              </Link>
            </DropdownMenuItem>
          );
        })}
        </div>

        {/* Add More Modules Button (Owner / Founder Only, Never for Clients) */}
        {isOwnerOrFounder && !isClientUser && (
          <div className="border-t border-border mt-3 pt-3 px-1 pb-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-4 p-3.5 h-auto rounded-2xl hover:bg-primary/5 hover:text-primary group border border-dashed border-border/80 hover:border-primary/40 transition-all"
              onClick={onConfigOpen}
            >
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <Plus className="size-5 text-primary" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="font-bold text-[13px] truncate">Add More Modules</span>
                <span className="text-[10px] text-muted-foreground truncate">Customize workspace apps</span>
              </div>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
