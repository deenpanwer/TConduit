"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UnifiedSidebar } from "./UnifiedSidebar";
import { MasterDashboard } from "@/components/ems/main/MasterDashboard";
import { PosDashboardContent } from "@/components/pos/PosDashboardContent";
import { CRMOverviewContent } from "@/components/crm/CRMOverviewContent";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { ExternalLink, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { TasksProvider } from "@/hooks/useTasks";
import { TasksDashboardContent } from "@/components/tasks/TasksDashboardContent";

export function UnifiedDashboard({ selectedModules }: { selectedModules: string[] }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [activeModule, setActiveModule] = useState(selectedModules[0] || "ems");
  const [orgData, setOrgData] = useState<any>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchOrgDetails() {
      const targetOrgId = userData?.ownedOrgId || userData?.orgId;
      if (targetOrgId) {
        const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
        if (orgDoc.exists()) setOrgData({ id: orgDoc.id, ...orgDoc.data() });
      }
      setOrgLoading(false);
    }
    if (userData) {
      fetchOrgDetails();
    }
  }, [userData]);

  if (loading || orgLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 border-r p-4 space-y-4">
          <Shimmer className="h-8 w-32 rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <Shimmer key={i} className="h-10 w-full rounded-xl" />)}
          </div>
        </div>
        <div className="flex-1 p-8 space-y-8">
          <Shimmer className="h-12 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Shimmer key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
          <Shimmer className="h-96 w-full rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const activeModuleData = MODULE_CONFIG.find(m => m.id === activeModule);

  const renderContent = () => {
    switch (activeModule) {
      case "ems":
        return (
          <div className="p-4 md:p-8">
            <MasterDashboard orgData={orgData} ownerData={userData} />
          </div>
        );
      case "pos":
        return <PosDashboardContent />;
      case "crm":
        return <CRMOverviewContent />;
      case "tasks":
        return (
          <TasksProvider>
             <TasksDashboardContent />
          </TasksProvider>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground font-black uppercase tracking-widest">Select a module from the sidebar</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <UnifiedSidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        selectedModules={selectedModules}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Hub Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden">
              <Menu size={20} />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none flex items-center gap-2">
                {activeModuleData?.title} <span className="text-[10px] text-muted-foreground tracking-widest font-bold bg-secondary px-2 py-0.5 rounded">Dashboard</span>
              </h1>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (activeModuleData?.href) {
                router.push(activeModuleData.href);
              }
            }}
            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-9 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            Open {activeModuleData?.title} Full Module
            <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

const MODULE_CONFIG = [
  { id: "ems", title: "Employee Monitoring", href: "/ems" },
  { id: "crm", title: "Customer Relations", href: "/crm" },
  { id: "pos", title: "Point of Sale System", href: "/pos/dashboard" },
  { id: "tasks", title: "Operations & Tasks", href: "/tasks" }
];
