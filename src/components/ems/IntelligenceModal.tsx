"use client";

import { useState, useEffect } from "react";
import { 
  X, Plus, Ban, Globe, Info, Trash2, CheckCircle2, ShieldAlert, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

interface BlockedSiteItem {
  domain: string;
  blockedBy: string;
  blockedAt: any;
  blockedAtLocal?: string;
}

interface IntelligenceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const DEFAULT_DISTRACTIONS = [
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "netflix.com",
  "twitter.com",
  "reddit.com",
  "steamcommunity.com"
];

export function IntelligenceModal({ isOpen, onOpenChange, userId, userName }: IntelligenceModalProps) {
  const [blockedSites, setBlockedSites] = useState<BlockedSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [inputError, setInputError] = useState("");
  const [webBlockerEnabled, setWebBlockerEnabled] = useState(false);
  
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const adminName = userData?.name || user?.displayName || "Employer / Admin";

  useEffect(() => {
    async function fetchUserSettings() {
      if (!userId || !isOpen) return;
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const rawBlocked = data.blockedSites || [];
          
          // Migrate legacy string arrays to rich map objects on the fly
          const migrated: BlockedSiteItem[] = rawBlocked.map((item: any) => {
            if (item && typeof item === "object" && item.domain) {
              return {
                domain: item.domain,
                blockedBy: item.blockedBy || "Employer",
                blockedAt: item.blockedAt,
                blockedAtLocal: item.blockedAtLocal || (item.blockedAt?.toDate ? item.blockedAt.toDate().toString() : new Date(item.blockedAt).toString())
              };
            }
            return {
              domain: String(item),
              blockedBy: "Employer",
              blockedAt: new Date(),
              blockedAtLocal: new Date().toString()
            };
          });
          
          setBlockedSites(migrated);
          setWebBlockerEnabled(!!data.webBlockerEnabled);
        }
      } catch (err) {
        console.error("Failed to fetch user blocked sites:", err);
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
      await updateDoc(doc(db, "users", userId), {
        blockedSites: blockedSites.map(item => ({
          domain: item.domain,
          blockedBy: item.blockedBy,
          blockedAt: item.blockedAt || new Date(),
          blockedAtLocal: item.blockedAtLocal || new Date().toString()
        })),
        blockedSitesUpdatedAt: new Date().getTime(),
        updatedAt: serverTimestamp()
      });
      toast({ 
        title: "Blocklist Updated", 
        description: `Blocked websites list for ${userName} has been successfully synced.` 
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Sync Failed:", err);
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDomain = () => {
    setInputError("");
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;

    // Normalize domain: strip protocols and paths
    let cleanDomain = trimmed.replace(/^(https?:\/\/)?(www\.)?/, "");
    cleanDomain = cleanDomain.split("/")[0];

    // Basic domain validation
    if (!cleanDomain.includes(".") || cleanDomain.length < 4) {
      setInputError("Please enter a valid domain (e.g. domain.com)");
      return;
    }

    // Check duplicate
    if (blockedSites.some(item => item.domain === cleanDomain)) {
      setInputError("This website is already blocked.");
      return;
    }

    const newItem: BlockedSiteItem = {
      domain: cleanDomain,
      blockedBy: adminName,
      blockedAt: new Date(),
      blockedAtLocal: new Date().toString()
    };

    setBlockedSites(prev => [newItem, ...prev]);
    setNewDomain("");
  };

  const handleRemoveDomain = (domain: string) => {
    setBlockedSites(prev => prev.filter(item => item.domain !== domain));
  };

  const suggestDefaults = () => {
    const newlyAdded: BlockedSiteItem[] = [];
    DEFAULT_DISTRACTIONS.forEach(domain => {
      if (!blockedSites.some(item => item.domain === domain)) {
        newlyAdded.push({
          domain,
          blockedBy: adminName,
          blockedAt: new Date(),
          blockedAtLocal: new Date().toString()
        });
      }
    });

    if (newlyAdded.length === 0) {
      toast({ title: "No new blocks", description: "Default distraction websites are already blocked." });
      return;
    }

    setBlockedSites(prev => [...newlyAdded, ...prev]);
    toast({ title: "Defaults Suggested", description: `${newlyAdded.length} distraction websites added.` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:max-w-3xl max-h-[95vh] md:max-h-[90vh] rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-black dark:border-white bg-card shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] p-0 overflow-hidden flex flex-col outline-none">
        
        {/* Brutalist Top Header Bar */}
        <div className="border-b-4 border-black dark:border-white bg-secondary/30 p-3 md:p-4 flex flex-wrap items-center justify-between gap-2 px-4 md:px-8 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[10px] font-black uppercase tracking-widest hover:bg-secondary">
             Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={suggestDefaults}
              className="bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest h-9 md:h-10 px-3 md:px-6 gap-2"
            >
              <Sparkles size={14} />
              Suggest Distractions
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || loading}
              className="bg-black text-white dark:bg-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest h-9 md:h-10 px-6 md:px-8 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {isSaving ? "Syncing..." : "Save Blocklist"}
            </Button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar">
          
          {/* Header Title section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-10 md:size-14 bg-red-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 border-4 border-black dark:border-white shadow-inner shrink-0">
                <Ban size={24} className="md:hidden" />
                <Ban size={32} className="hidden md:block" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none text-foreground">
                    Blocked Websites: {userName}
                  </DialogTitle>
                  {webBlockerEnabled ? (
                    <span className="bg-emerald-100 text-emerald-700 border-2 border-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)]">
                      Blocker: ON
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 border-2 border-amber-600 dark:border-amber-500 dark:bg-amber-950/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,1)]">
                      Blocker: OFF
                    </span>
                  )}
                </div>
                <DialogDescription className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                  Block websites from being opened on their computer
                </DialogDescription>
              </div>
            </div>
            
            <div className="bg-secondary/50 border-4 border-black dark:border-white p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <p className="text-xs md:text-sm font-bold leading-relaxed max-w-2xl">
                When you add a website to this list, the employee will not be able to open it on their computer.
              </p>
            </div>

            {webBlockerEnabled ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border-4 border-emerald-500 p-4 rounded-2xl flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold leading-relaxed text-emerald-800 dark:text-emerald-400">
                    <span className="uppercase font-black text-emerald-600 dark:text-emerald-500 tracking-wider">Web Blocker is On</span>
                    <br />
                    Website blocking is currently active on {userName}'s computer. All listed websites will be blocked.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border-4 border-amber-500 p-4 rounded-2xl flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-400">
                    <span className="uppercase font-black text-amber-600 dark:text-amber-500 tracking-wider">Web Blocker is Off</span>
                    <br />
                    To block these sites, {userName} must open their Trac-Diary desktop app settings and turn on the "Web Blocker" switch.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Add block input area */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Add Website to Block
            </label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. facebook.com, youtube.com" 
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value);
                  setInputError("");
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                className="h-10 md:h-12 rounded-xl border-4 border-black dark:border-white font-bold text-xs"
              />
              <Button 
                onClick={handleAddDomain} 
                className="bg-red-500 hover:bg-red-650 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-10 md:h-12 px-6 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 gap-2"
              >
                <Plus size={16} /> Block Site
              </Button>
            </div>
            {inputError && (
              <p className="text-[10px] font-black text-red-500 flex items-center gap-1 ml-1 mt-1">
                <ShieldAlert size={12} /> {inputError}
              </p>
            )}
          </div>

          {/* Blocklist Table / Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Currently Blocked Sites
              </span>
              <span className="text-[9px] md:text-[10px] font-black text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 shadow-inner">
                {blockedSites.length} Blocks Active
              </span>
            </div>

            <div className="min-h-[180px] md:min-h-[220px] max-h-[300px] bg-secondary/20 rounded-2xl md:rounded-3xl p-4 border-4 border-black dark:border-white flex flex-col gap-3 overflow-y-auto custom-scrollbar shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AnimatePresence>
                {blockedSites.map((item) => (
                  <motion.div
                    key={item.domain}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border-2 border-black dark:border-white hover:bg-secondary/40 transition-colors p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
                        <Globe size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-black break-all">{item.domain}</p>
                        <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">
                          Blocked by: {item.blockedBy}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemoveDomain(item.domain)}
                      className="h-8 px-3 rounded-lg border-2 border-transparent text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all self-end sm:self-center"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {blockedSites.length === 0 && (
                <div className="w-full flex-1 flex flex-col items-center justify-center text-muted-foreground/30 py-8">
                  <Globe size={40} className="mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No Active Blocks</p>
                  <p className="text-[8px] mt-1 text-center max-w-[200px]">This employee has unrestricted browsing access.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Brutalist Bottom Status Footer */}
        <div className="bg-black text-white dark:bg-white dark:text-black py-3 px-6 md:px-8 flex items-center justify-center gap-2 shrink-0 border-t-4 border-black dark:border-white">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-yellow-500 dark:text-yellow-400" />
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-center">
              This may take anywhere from 3-7 minutes to take effect
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
