"use client";

import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Briefcase, ShoppingCart, ListTodo,
  CheckCircle2, Plus, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface ModuleConfigModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModules: string[];
}

const MODULE_CONFIG = [
  {
    id: "ems",
    title: "Employee Monitoring",
    shortTitle: "EMS",
    icon: LayoutDashboard,
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    id: "crm",
    title: "Customer Relations",
    shortTitle: "CRM",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: "pos",
    title: "Point of Sale System",
    shortTitle: "POS",
    icon: ShoppingCart,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    id: "tasks",
    title: "Operations & Tasks",
    shortTitle: "Tasks",
    icon: ListTodo,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
];

export function ModuleConfigModal({
  isOpen,
  onOpenChange,
  selectedModules
}: ModuleConfigModalProps) {
  const { userData } = useAuth();
  const [tempSelected, setTempSelected] = useState<string[]>(selectedModules);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { 
    setTempSelected(selectedModules); 
  }, [selectedModules]);

  const handleSaveConfig = async () => {
    if (tempSelected.length === 0) {
      toast.error("Select at least one module");
      return;
    }
    setIsSaving(true);
    try {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (orgId) {
        await updateDoc(doc(db, "organizations", orgId), {
          selectedModules: tempSelected
        });
        toast.success("Workspace updated");
        onOpenChange(false);
        window.location.reload(); 
      }
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border rounded-[2rem] overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Settings2 className="text-primary" /> Configure Workspace
          </DialogTitle>
          <DialogDescription className="text-sm font-medium italic">
            Select which modules appear in your sidebar and dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 pt-0">
          {MODULE_CONFIG.map((module) => {
            const isSelected = tempSelected.includes(module.id);
            const Icon = module.icon;
            return (
              <div 
                key={module.id}
                onClick={() => {
                  setTempSelected(prev => 
                    prev.includes(module.id) ? prev.filter(id => id !== module.id) : [...prev, module.id]
                  );
                }}
                className={cn(
                  "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 bg-secondary/20"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center", module.bg, module.color)}>
                    <Icon size={20} />
                  </div>
                  {isSelected && <CheckCircle2 className="text-primary size-5" />}
                </div>
                <h4 className="font-black uppercase tracking-tight">{module.shortTitle}</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-secondary/30 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
          <Button onClick={handleSaveConfig} disabled={isSaving} className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8">
            {isSaving ? "Saving..." : "Apply Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
