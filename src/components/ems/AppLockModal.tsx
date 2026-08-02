"use client";

import { useState, useEffect } from "react";
import { 
  Lock, Pause, Play, Trash2, KeyRound, ShieldCheck, ShieldAlert, ShieldOff, Loader2, CheckCircle2
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
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AppLockModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  appLockPassword?: string | null;
  appLockPaused?: boolean;
  onUpdated?: () => void;
}

export function AppLockModal({ 
  isOpen, 
  onOpenChange, 
  userId, 
  userName,
  appLockPassword: initialPassword,
  appLockPaused: initialPaused,
  onUpdated 
}: AppLockModalProps) {
  const [pin, setPin] = useState("");
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      setPin(initialPassword || "");
      setCurrentPassword(initialPassword || null);
      setIsPaused(!!initialPaused);
      setError("");

      // Fetch fresh status from Firestore
      setLoading(true);
      const userRef = doc(db, "users", userId);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const pwd = data.appLockPassword || null;
          const paused = !!data.appLockPaused;
          setCurrentPassword(pwd);
          setPin(pwd || "");
          setIsPaused(paused);
        }
      }).catch((err) => {
        console.error("Error fetching employee app lock status:", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, userId, initialPassword, initialPaused]);

  const handleSavePin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // 1. Primary: Server-side API update using Admin SDK (bypasses Firestore rules)
      const res = await fetch("/api/admin/update-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          appLockPassword: pin,
          appLockPaused: false
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update App Lock");
      }

      // 2. Client-side update attempt for instant local cache sync
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          appLockPassword: pin,
          appLockPaused: false,
          updatedAt: serverTimestamp()
        });
      } catch (clientErr) {
        // Ignore client permission error since API route succeeded
      }

      setCurrentPassword(pin);
      setIsPaused(false);
      toast({
        title: "App Lock Saved",
        description: `App Lock 6-digit PIN updated and active for ${userName}.`,
      });
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error("Failed to save App Lock PIN:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update App Lock. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    if (!currentPassword) return;
    const nextPaused = !isPaused;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          appLockPaused: nextPaused
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update App Lock status");
      }

      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          appLockPaused: nextPaused,
          updatedAt: serverTimestamp()
        });
      } catch (clientErr) {}

      setIsPaused(nextPaused);
      toast({
        title: nextPaused ? "App Lock Paused" : "App Lock Resumed",
        description: nextPaused 
          ? `App Lock is now paused for ${userName}. Desktop app will bypass lock screen.`
          : `App Lock is now active for ${userName}. Desktop app will require PIN.`,
      });
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error("Failed to toggle App Lock pause state:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update App Lock status.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAppLock = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          appLockPassword: null,
          appLockPaused: false
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove App Lock");
      }

      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          appLockPassword: null,
          appLockPaused: false,
          updatedAt: serverTimestamp()
        });
      } catch (clientErr) {}

      setCurrentPassword(null);
      setPin("");
      setIsPaused(false);
      toast({
        title: "App Lock Removed",
        description: `App Lock configuration cleared for ${userName}.`,
      });
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error("Failed to remove App Lock:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to remove App Lock.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = !!currentPassword;
  const isCurrentlyActive = isConfigured && !isPaused;
  const isCurrentlyPaused = isConfigured && isPaused;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-border bg-card shadow-2xl p-0 overflow-hidden">
        <div className="p-8 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Lock size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-widest">
                  App Lock Control
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60">
                  Manage desktop application access lock for {userName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading status...</p>
          </div>
        ) : (
          <div className="px-8 py-2 space-y-6">
            {/* Status Card */}
            <div className="bg-secondary/40 rounded-3xl p-5 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Current Status
                </span>
                {isCurrentlyActive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                    <ShieldCheck size={12} /> Active
                  </span>
                )}
                {isCurrentlyPaused && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                    <ShieldAlert size={12} /> Paused
                  </span>
                )}
                {!isConfigured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20">
                    <ShieldOff size={12} /> Not Configured
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {isCurrentlyActive && "Desktop app is secured with a 6-digit PIN lock screen upon startup and restoration."}
                {isCurrentlyPaused && "App lock is temporarily paused. The employee can access the desktop app without entering a PIN."}
                {!isConfigured && "No App Lock PIN has been configured. The desktop app opens freely without lock prompts."}
              </p>

              {isConfigured && (
                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Configured PIN Password:</span>
                  <span className="text-sm font-black font-mono tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
                    {currentPassword}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions: Start / Pause Toggle */}
            {isConfigured && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={isCurrentlyPaused ? "default" : "outline"}
                  onClick={handleTogglePause}
                  disabled={saving}
                  className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-md"
                >
                  {isCurrentlyPaused ? (
                    <>
                      <Play size={14} className="mr-2 fill-current" /> Start / Resume App Lock
                    </>
                  ) : (
                    <>
                      <Pause size={14} className="mr-2 fill-current" /> Pause App Lock
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAppLock}
                  disabled={saving}
                  className="h-12 px-4 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} className="mr-1.5" /> Remove
                </Button>
              </div>
            )}

            {/* PIN Configuration Form */}
            <form onSubmit={handleSavePin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <KeyRound size={12} /> {isConfigured ? "Update 6-Digit PIN" : "Set New 6-Digit PIN"}
                </label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,6}$/.test(val)) {
                        setPin(val);
                        setError("");
                      }
                    }}
                    maxLength={6}
                    className="h-12 rounded-2xl text-center text-lg tracking-[0.5em] font-mono border-border bg-secondary/20 focus:bg-background font-bold text-primary"
                  />
                  <Button
                    type="submit"
                    disabled={saving || pin.length !== 6 || (pin === currentPassword && !isPaused)}
                    className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shrink-0 shadow-lg shadow-primary/20"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save PIN"}
                  </Button>
                </div>
                {error && (
                  <p className="text-xs text-rose-500 font-medium pt-1">{error}</p>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="p-8 pt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest border-border/50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
