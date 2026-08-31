"use client";

import { cn, getUserAvatar } from "@/lib/utils";
import { 
  FileText, FolderOpen, Layers, CheckSquare, Settings, 
  ChevronsRight, ChevronsLeft, Moon, Sun, X, LogOut, Plus,
  LayoutDashboard, MessageSquare, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getDocs, collection, query, where, limit, doc, getDoc } from "firebase/firestore";
import { ModuleConfigModal } from "@/components/ModuleConfigModal";
import { ProductSwitcher } from "@/components/ems/shared/ProductSwitcher";
import { toast } from "sonner";

interface DocsSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  onInviteClick?: () => void;
}

export function DocsSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onInviteClick
}: DocsSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [partnerBrand, setPartnerBrand] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const orgId = userData?.ownedOrgId || userData?.orgId;
  const isClientUser = userData?.role === "client" || userData?.isClient === true;

  useEffect(() => { 
    setMounted(true); 
    async function fetchData() {
      if (userData?.partnerSlug) {
        try {
          const q = query(collection(db, "partners"), where("slug", "==", userData.partnerSlug), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setPartnerBrand(snap.docs[0].data().brandName);
          }
        } catch (err) {
          console.error("Error fetching Docs branding:", err);
        }
      }

      if (orgId) {
        try {
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          if (orgDoc.exists()) {
            setSelectedModules(orgDoc.data()?.selectedModules || []);
          }
        } catch (err) {
          console.error("Error fetching org modules:", err);
        }
      }
    }
    fetchData();
  }, [userData?.partnerSlug, orgId]);

  if (!mounted) return null;

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    if (touchStartX.current - touchEndX.current > 50 && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    touchStartX.current = null; touchEndX.current = null;
  };

  const NavItem = ({ icon: Icon, label, href, active, onClick }: any) => {
    const className = cn(
      "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative",
      active ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold shadow-sm ring-1 ring-teal-500/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary",
      (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
    );

    const content = (
      <>
        <Icon className={cn("size-5 shrink-0", active ? "text-teal-600 dark:text-teal-400" : "")} size={20} />
        {(!isCollapsed || isMobileSidebarOpen) && (
          <span className="text-sm font-bold truncate">{label}</span>
        )}
      </>
    );

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {href ? (
              <Link 
                href={href}
                onClick={() => {
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (onClick) onClick();
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
                className={className}
              >
                {content}
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div 
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col shrink-0 overflow-hidden h-screen sticky top-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "hidden lg:flex",
          isMobileSidebarOpen && "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex translate-x-0"
        )}
      >
        <div className="p-4 flex flex-col h-full relative">
          {isMobileSidebarOpen && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
              <X size={18} />
            </Button>
          )}

          {/* Product Switcher Header */}
          <div className="mb-8 pt-8 lg:pt-0 shrink-0 min-h-8">
            <ProductSwitcher 
              currentModuleId="docs"
              isCollapsed={isCollapsed}
              isMobileSidebarOpen={isMobileSidebarOpen}
              selectedModules={selectedModules}
              partnerBrand={partnerBrand}
              onConfigOpen={() => setIsConfigOpen(true)}
              isClient={isClientUser}
              allowedScopes={userData?.allowedScopes || ["ems", "crm", "tasks", "docs"]}
            />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2 scrollbar-none">
            {/* Invite Staff Member Button */}
            {!isClientUser && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => onInviteClick?.()}
                      className={cn(
                        "flex items-center gap-3 w-full p-2.5 rounded-xl transition-all hover:bg-secondary border border-transparent hover:border-border text-foreground",
                        (isCollapsed && !isMobileSidebarOpen) ? "justify-center" : "px-3"
                      )}
                    >
                      <Plus className="size-5 shrink-0" />
                      {(!isCollapsed || isMobileSidebarOpen) && <span className="text-sm font-bold truncate">Invite Staff Member</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={cn((!isCollapsed || isMobileSidebarOpen) && "hidden")}>
                    Invite Staff Member
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <div className="space-y-1">
              <NavItem icon={FolderOpen} label="Overview" href="/docs" active={pathname === "/docs"} />
              <NavItem icon={FileText} label="Company Policies" href="/docs/general" active={pathname === "/docs/general"} />
              <NavItem icon={Layers} label="Document Packets" href="/docs/packets" active={pathname === "/docs/packets"} />
              <NavItem icon={CheckSquare} label="Staff Progress" href="/docs/compliance" active={pathname === "/docs/compliance"} />
            </div>

            {/* Separator & Quick Jump Links */}
            <div className="pt-2 border-t border-border space-y-1">
              <NavItem icon={LayoutDashboard} label="Back to EMS" href="/ems" active={false} />
              <NavItem icon={MessageSquare} label="Back to Chat" href="/ems/chat" active={false} />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex flex-col items-center space-y-4 shrink-0">
            <button 
              onClick={async () => {
                if (isClientUser) {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("client_portal_session");
                    localStorage.removeItem("client_portal_session");
                  }
                  const shareId = userData?.shareId;
                  const orgId = userData?.orgId;
                  await signOut(auth);
                  toast("Logged Out", { description: "You have safely exited the client portal." });
                  if (orgId && shareId) {
                    router.push(`/share/${orgId}/${shareId}`);
                  } else {
                    router.push("/");
                  }
                  return;
                }
                router.push("/ems/settings");
                if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
              }} 
              className={cn(
                "flex items-center transition-all group border border-transparent", 
                pathname === "/ems/settings" && "bg-secondary ring-1 ring-border", 
                (isCollapsed && !isMobileSidebarOpen) 
                  ? "w-12 h-12 justify-center rounded-full mx-auto" 
                  : "w-full gap-3 p-2 px-3 rounded-xl",
                isClientUser
                  ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
                  : "hover:bg-secondary"
              )}
            >
              <div className="size-10 rounded-full bg-secondary overflow-hidden border border-border shrink-0 transition-transform group-hover:scale-105">
                 <img src={getUserAvatar(userData)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {(!isCollapsed || isMobileSidebarOpen) && (
                <div className="flex flex-1 items-center justify-between min-w-0 text-left">
                  <div className={cn("flex flex-col min-w-0", isClientUser ? "text-destructive" : "")}>
                      <div className="text-xs font-bold truncate">{userData?.name || userData?.displayName || "Client Portal"}</div>
                      <div className={cn("text-[10px] font-black uppercase tracking-widest", isClientUser ? "text-destructive/80" : "text-muted-foreground")}>
                        {isClientUser ? "Client Access" : (userData?.role || "Owner")}
                      </div>
                  </div>
                  {isClientUser ? (
                    <LogOut size={16} className="text-destructive ml-2 shrink-0 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Settings size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              )}
            </button>
            
            <div className={cn("flex w-full gap-2", (isCollapsed && !isMobileSidebarOpen) ? "flex-col items-center" : "justify-center")}>
              <Button variant="ghost" size="icon" onClick={() => isMobileSidebarOpen ? setIsMobileSidebarOpen(false) : setIsCollapsed(!isCollapsed)} className="hover:bg-secondary">
                {(isCollapsed && !isMobileSidebarOpen) ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hover:bg-secondary">
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ModuleConfigModal 
        isOpen={isConfigOpen} 
        onOpenChange={setIsConfigOpen} 
        selectedModules={selectedModules} 
      />
    </>
  );
}
