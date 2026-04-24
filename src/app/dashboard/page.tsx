"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  ListTodo, 
  ShoppingCart, 
  Sparkles, 
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";

const MODULES = [
  {
    id: "ems",
    title: "EMS",
    description: "Enterprise Management System. Overview, team management, and analytics.",
    icon: LayoutDashboard,
    color: "sky",
    href: "/ems",
    accent: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20"
  },
  {
    id: "crm",
    title: "CRM",
    description: "Customer Relationship Management. Leads, deals, and client tracking.",
    icon: Users,
    color: "blue",
    href: "/crm",
    accent: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Productivity & Operations. Task boards, timelines, and collaboration.",
    icon: ListTodo,
    color: "purple",
    href: "/tasks",
    accent: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  },
  {
    id: "pos",
    title: "POS",
    description: "Retail & Transactions. Point of Sale system for physical storefronts.",
    icon: ShoppingCart,
    color: "orange",
    href: "/pos/dashboard",
    accent: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20"
  }
];

export default function ModuleSelectorPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [persistedModules, setPersistedModules] = useState<string[] | null>(["ems", "crm", "tasks", "pos"]);
  const [isSaving, setIsSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkExistingModules() {
      if (!loading && user && userData) {
        const orgId = userData.ownedOrgId || userData.orgId;
        if (orgId) {
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          const data = orgDoc.data();
          if (data?.selectedModules && data.selectedModules.length > 0) {
            setPersistedModules(data.selectedModules);
          } else {
            setChecking(false);
          }
        } else {
          setChecking(false);
        }
      }
    }
    checkExistingModules();
  }, [user, userData, loading]);

  const toggleModule = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (selectedIds.length === 0) return;
    
    setIsSaving(true);
    try {
      const orgId = userData.ownedOrgId || userData.orgId;
      if (orgId) {
        await updateDoc(doc(db, "organizations", orgId), {
          selectedModules: selectedIds
        });
        
        setPersistedModules(selectedIds);
      }
    } catch (error) {
      console.error("Failed to save modules:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || (checking && !persistedModules)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-white">
        <div className="flex flex-col items-center gap-6">
          <div className="size-16 border-t-2 border-primary rounded-full animate-spin" />
          <span className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Trac Workspace...</span>
        </div>
      </div>
    );
  }

  if (persistedModules) {
    return <UnifiedDashboard selectedModules={persistedModules} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] size-[40vw] bg-sky-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[40vw] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full z-10"
      >
        <div className="flex flex-col items-center text-center mb-16">
          <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-xl">
            <Sparkles className="text-primary size-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 uppercase leading-none">
            Welcome to <span className="text-primary">Trac AI</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm md:text-lg font-medium tracking-tight">
            Configure your workspace by selecting the tools you need today. You can always add more later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULES.map((module, idx) => {
            const isSelected = selectedIds.includes(module.id);
            const Icon = module.icon;
            
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => toggleModule(module.id)}
                className={cn(
                  "relative group cursor-pointer p-8 rounded-[2.5rem] border-[3px] transition-all duration-500 flex flex-col h-full",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]" 
                    : "border-white/5 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <div className={cn(
                  "size-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500",
                  isSelected ? "bg-primary text-white scale-110" : cn(module.bg, module.accent)
                )}>
                  <Icon className="size-7" />
                </div>
                
                <h3 className="text-xl font-black uppercase mb-3 tracking-tighter">{module.title}</h3>
                <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed flex-1">
                  {module.description}
                </p>

                <div className={cn(
                  "absolute top-6 right-6 transition-all duration-300",
                  isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0"
                )}>
                  <div className="size-6 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                </div>

                <div className={cn(
                  "mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  isSelected ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                )}>
                  {isSelected ? "Selected" : "Click to Add"}
                  <ChevronRight size={10} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {selectedIds.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button 
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase text-xs tracking-[0.2em] h-16 px-12 border-[3px] border-black active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                >
                  {isSaving ? "Setting Up Workspace..." : "Initialize Workspace"}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40"
              >
                Select at least one module to continue
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
