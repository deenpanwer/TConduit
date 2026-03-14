"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Download, Share, PlusSquare, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if the prompt was recently dismissed
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
        // Delay showing on iOS for a better initial experience
        const timer = setTimeout(() => setShowPrompt(true), 3000);
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
    // Dismiss for 7 days
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_prompt_dismissed_until', expiry.toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[100]"
      >
        <div className="bg-card border-4 border-black dark:border-white rounded-[2rem] p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group">
          {/* Accent Line */}
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          
          <button 
            onClick={dismissPrompt}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>

          <div className="flex gap-5 items-start relative z-10 pt-2">
            <div className="bg-primary/10 border-2 border-primary/20 p-4 rounded-2xl shrink-0">
              {isIOS ? (
                <Smartphone className="text-primary" size={32} />
              ) : (
                <Download className="text-primary" size={32} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground font-black text-xl leading-tight mb-2 uppercase tracking-tighter">
                Install Trac App
              </h3>
              <p className="text-muted-foreground text-[10px] font-bold leading-relaxed mb-6 uppercase tracking-widest">
                {isIOS 
                  ? "Tap the Share icon below, then select 'Add to Home Screen' to launch Trac instantly from your screen."
                  : "Add Trac to your home screen for a high-performance native app experience with zero friction."
                }
              </p>

              {isIOS ? (
                <div className="flex items-center justify-center gap-4 py-3 bg-secondary/50 rounded-xl border-2 border-dashed border-border">
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-1.5 bg-background rounded-md border shadow-sm">
                            <Share className="size-4 text-primary" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter">Share</span>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-1.5 bg-background rounded-md border shadow-sm">
                            <PlusSquare className="size-4 text-primary" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter">Add to Home</span>
                    </div>
                </div>
              ) : (
                <Button 
                  onClick={handleInstall}
                  className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl transition-all active:scale-[0.98] border-2 border-transparent shadow-lg"
                >
                  Install Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
