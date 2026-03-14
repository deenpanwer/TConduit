"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Download, Share, PlusSquare, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed or running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Capture the PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if the prompt was recently dismissed (within 7 days)
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS devices for specific instructions
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
        // Slight delay for better UX flow
        const timer = setTimeout(() => setShowPrompt(true), 4000);
        return () => clearTimeout(timer);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Dismiss for 7 days to avoid annoying the user
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_prompt_dismissed_until', expiry.toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[420px] z-[100]"
      >
        <div className="bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group">
          {/* Brutalist Accent Line */}
          <div className="absolute top-0 left-0 w-full h-3 bg-primary" />
          
          <button 
            onClick={dismissPrompt}
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-all p-1 hover:rotate-90"
          >
            <X size={24} strokeWidth={3} />
          </button>

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-5">
                <div className="bg-primary/10 border-4 border-black dark:border-white p-4 rounded-[1.5rem] shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                {isIOS ? (
                    <Smartphone className="text-primary" size={32} />
                ) : (
                    <Download className="text-primary" size={32} />
                )}
                </div>
                <div>
                    <h3 className="text-foreground font-black text-2xl leading-none uppercase tracking-tighter italic">
                        Install Trac
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile Optimized Node</span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-muted-foreground text-[11px] font-bold leading-relaxed uppercase tracking-widest">
                {isIOS 
                  ? "Manual Handshake Required: Tap the 'Share' icon, then 'Add to Home Screen' to link this node to your device."
                  : "Provision the native client directly to your home screen for high-frequency workforce oversight."
                }
              </p>

              {isIOS ? (
                <div className="flex items-center justify-center gap-6 py-5 bg-secondary/30 rounded-[1.5rem] border-4 border-dashed border-black/10 dark:border-white/10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-2.5 bg-background rounded-xl border-2 border-black dark:border-white shadow-sm">
                            <Share className="size-5 text-primary" strokeWidth={3} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Share</span>
                    </div>
                    <motion.div 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <ArrowRight className="size-4 text-muted-foreground" />
                    </motion.div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-2.5 bg-background rounded-xl border-2 border-black dark:border-white shadow-sm">
                            <PlusSquare className="size-5 text-primary" strokeWidth={3} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Add to Home</span>
                    </div>
                </div>
              ) : (
                <Button 
                  onClick={handleInstall}
                  className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white font-black uppercase tracking-[0.2em] text-xs h-16 rounded-[1.2rem] transition-all active:scale-[0.95] border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3"
                >
                  <Zap size={18} className="fill-current" />
                  Initialize Install
                </Button>
              )}
            </div>
          </div>
          
          {/* Subtle Background Pattern */}
          <div className="absolute -bottom-10 -left-10 size-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
