"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, Plus, Zap, Ban, Save, Sparkles, 
  Search, ShieldCheck, HelpCircle, ArrowRight,
  Info, Globe, Monitor, Trash2, CheckCircle2
} from "lucide-react";
import * as Icons from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// Helper to find icon by name (Lazy matching)
function BrandIcon({ name, className }: { name: string; className?: string }) {
  const normalized = name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const iconKey = Object.keys(Icons).find(key => 
    key.toLowerCase() === `si${normalized}` || 
    key.toLowerCase() === normalized
  );

  if (iconKey) {
    const IconComponent = (Icons as any)[iconKey];
    return <IconComponent className={cn("size-4", className)} />;
  }
  return <Monitor className={cn("size-4", className)} />;
}

interface TrackingSettings {
  primeApps: string[];
  noiseApps: string[];
}

interface IntelligenceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const DEFAULT_PRIME_APPS = ["Chrome", "Slack", "VS Code", "Figma", "Notion", "Linear", "Zoom", "Excel", "Discord", "Cursor", "Microsoft Teams"];
const DEFAULT_NOISE_APPS = ["Netflix", "YouTube", "Twitter", "Facebook", "Instagram", "Reddit", "Steam", "Roblox", "Epic Games", "Disney+", "Spotify"];

export function IntelligenceModal({ isOpen, onOpenChange, userId, userName }: IntelligenceModalProps) {
  const [settings, setSettings] = useState<TrackingSettings>({
    primeApps: [],
    noiseApps: []
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPrimeApp, setNewPrimeApp] = useState("");
  const [newNoiseApp, setNewNoiseApp] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserSettings() {
      if (!userId || !isOpen) return;
      setLoading(true);
      try {
        const user = storage.getItem<any>("users", userId);
        if (user) {
          setSettings({
            primeApps: user.trackingSettings?.primeApps || user.trackingSettings?.workApps || [],
            noiseApps: user.trackingSettings?.noiseApps || user.trackingSettings?.distractionApps || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch user tracking settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserSettings();
  }, [userId, isOpen]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const user = storage.getItem<any>("users", userId);
      if (user) {
        storage.saveItem("users", {
            ...user,
            trackingSettings: {
                primeApps: settings.primeApps,
                noiseApps: settings.noiseApps,
            },
            updatedAt: new Date().toISOString()
        });
        toast({ title: "Intelligence Updated", description: `Rules for ${userName} have been updated.` });
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Update Failed:", err);
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const suggestDefaults = () => {
    setSettings({
      primeApps: Array.from(new Set([...settings.primeApps, ...DEFAULT_PRIME_APPS])),
      noiseApps: Array.from(new Set([...settings.noiseApps, ...DEFAULT_NOISE_APPS]))
    });
    toast({ title: "Rules Suggested", description: "Default industry apps added." });
  };

  const removeApp = (list: 'primeApps' | 'noiseApps', app: string) => {
    setSettings(prev => ({
      ...prev,
      [list]: prev[list].filter(a => a !== app)
    }));
  };

  const addApp = (list: 'primeApps' | 'noiseApps', app: string) => {
    if (!app.trim()) return;
    setSettings(prev => ({
      ...prev,
      [list]: Array.from(new Set([...prev[list], app.trim()]))
    }));
    if (list === 'primeApps') setNewPrimeApp("");
    else setNewNoiseApp("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:max-w-4xl max-h-[95vh] md:max-h-[90vh] rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-black dark:border-white bg-card shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] p-0 overflow-hidden flex flex-col outline-none">
        {/* Top Header Actions - Brutalist Style */}
        <div className="border-b-4 border-black dark:border-white bg-secondary/30 p-3 md:p-4 flex flex-wrap items-center justify-between gap-2 px-4 md:px-8 shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase tracking-widest order-1 hover:bg-secondary">
               Cancel
            </Button>
            <Button 
                onClick={suggestDefaults}
                className="bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest h-9 md:h-10 px-3 md:px-6 gap-2 order-3 sm:order-2 w-full sm:w-auto"
            >
                <Sparkles size={14} />
                Auto-Suggest Defaults
            </Button>
            <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black text-white dark:bg-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest h-9 md:h-10 px-6 md:px-8 shadow-lg transition-transform hover:scale-105 active:scale-95 order-2 sm:order-3"
            >
                {isSaving ? "Syncing..." : "Save Rules"}
            </Button>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-10 custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="size-10 md:size-14 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary border-4 border-black dark:border-white shadow-inner shrink-0">
                  <ShieldCheck size={24} className="md:hidden" />
                  <ShieldCheck size={32} className="hidden md:block" />
               </div>
               <div>
                  <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-1">Intelligence: {userName}</h2>
                  <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Custom Tracking Rules</p>
               </div>
            </div>
            
            <div className="bg-secondary/50 border-4 border-black dark:border-white p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
                  <HelpCircle size={48} />
               </div>
               <p className="text-xs md:text-sm font-bold leading-relaxed max-w-2xl relative z-10">
                 Identify <span className="text-primary">{userName}'s</span> work-critical applications (Prime Apps) and non-work distractions (Noise Apps) to refine performance tracking.
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             {/* Productive Side */}
             <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 md:size-10 bg-emerald-500/10 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-500 border-2 border-emerald-500/20">
                         <Zap size={16} />
                      </div>
                      <div>
                         <h3 className="text-xs md:text-sm font-black uppercase tracking-widest leading-none">Prime Apps</h3>
                         <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase mt-1">Core work tools</p>
                      </div>
                   </div>
                   <span className="text-[9px] md:text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{settings.primeApps.length}</span>
                </div>

                <div className="min-h-[150px] md:min-h-[250px] bg-secondary/30 rounded-2xl md:rounded-3xl p-3 md:p-4 border-4 border-black dark:border-white flex flex-col gap-2 overflow-y-auto max-h-[250px] md:max-h-[350px] custom-scrollbar shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <div className="flex flex-wrap gap-2">
                      {settings.primeApps.map((app) => (
                        <AnimatePresence key={app}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 bg-card border-2 border-black dark:border-white hover:bg-secondary transition-colors p-2 md:p-2.5 rounded-lg md:rounded-xl group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                             <BrandIcon name={app} className="text-emerald-500" />
                             <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight">{app}</span>
                             <button onClick={() => removeApp('primeApps', app)} className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all sm:opacity-0 sm:group-hover:opacity-100">
                                <X size={12} />
                             </button>
                          </motion.div>
                        </AnimatePresence>
                      ))}
                      {settings.primeApps.length === 0 && (
                        <div className="w-full h-24 md:h-32 flex flex-col items-center justify-center text-muted-foreground/30">
                           <Zap size={32} className="mb-2" />
                           <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">No work apps</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex gap-2">
                   <Input 
                      placeholder="Add App Name..." 
                      value={newPrimeApp}
                      onChange={(e) => setNewPrimeApp(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addApp('primeApps', newPrimeApp)}
                      className="h-10 md:h-12 rounded-xl border-4 border-black dark:border-white font-bold text-xs"
                   />
                   <Button onClick={() => addApp('primeApps', newPrimeApp)} size="icon" className="size-10 md:size-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                      <Plus size={20} />
                   </Button>
                </div>
             </div>

             {/* Distraction Side */}
             <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 md:size-10 bg-destructive/10 rounded-lg md:rounded-xl flex items-center justify-center text-destructive border-2 border-destructive/20">
                         <Ban size={16} />
                      </div>
                      <div>
                         <h3 className="text-xs md:text-sm font-black uppercase tracking-widest leading-none">Noise Apps</h3>
                         <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase mt-1">Distractions</p>
                      </div>
                   </div>
                   <span className="text-[9px] md:text-[10px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">{settings.noiseApps.length}</span>
                </div>

                <div className="min-h-[150px] md:min-h-[250px] bg-secondary/30 rounded-2xl md:rounded-3xl p-3 md:p-4 border-4 border-black dark:border-white flex flex-col gap-2 overflow-y-auto max-h-[250px] md:max-h-[350px] custom-scrollbar shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <div className="flex flex-wrap gap-2">
                      {settings.noiseApps.map((app) => (
                        <AnimatePresence key={app}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 bg-card border-2 border-black dark:border-white hover:bg-secondary transition-colors p-2 md:p-2.5 rounded-lg md:rounded-xl group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                             <BrandIcon name={app} className="text-destructive" />
                             <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight">{app}</span>
                             <button onClick={() => removeApp('noiseApps', app)} className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all sm:opacity-0 sm:group-hover:opacity-100">
                                <X size={12} />
                             </button>
                          </motion.div>
                        </AnimatePresence>
                      ))}
                      {settings.noiseApps.length === 0 && (
                        <div className="w-full h-24 md:h-32 flex flex-col items-center justify-center text-muted-foreground/30">
                           <Ban size={32} className="mb-2" />
                           <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">No distractions</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex gap-2">
                   <Input 
                      placeholder="Add App Name..." 
                      value={newNoiseApp}
                      onChange={(e) => setNewNoiseApp(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addApp('noiseApps', newNoiseApp)}
                      className="h-10 md:h-12 rounded-xl border-4 border-black dark:border-white font-bold text-xs"
                   />
                   <Button onClick={() => addApp('noiseApps', newNoiseApp)} size="icon" className="size-10 md:size-12 rounded-xl bg-destructive hover:bg-destructive/90 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                      <Plus size={20} />
                   </Button>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Info - Brutalist Style */}
        <div className="bg-black text-white dark:bg-white dark:text-black py-3 md:py-4 px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 border-t-4 border-black dark:border-white">
           <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                 <CheckCircle2 size={12} className="text-emerald-500" />
                 <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">Real-time Sync Active</span>
              </div>
              <div className="flex items-center gap-2">
                 <Info size={12} className="text-primary" />
                 <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">User Specific Rules</span>
              </div>
           </div>
           <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60">TRAC AI Engine v1.2</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
