"use client";

import { useState, useEffect } from "react";
import { Smartphone, Download, Share, PlusSquare, ArrowRight } from "lucide-react";
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
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS devices
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // For iOS, we check if it's already shown recently
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
      if (!dismissedUntil || new Date().getTime() > parseInt(dismissedUntil)) {
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

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[360px] z-[100]"
      >
        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-black/10 dark:shadow-black/50">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-xl shrink-0 border border-primary/10">
                {isIOS ? (
                  <Smartphone className="text-primary" size={24} />
                ) : (
                  <Download className="text-primary" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-foreground font-bold text-lg leading-none tracking-tight">
                  Install Trac App
                </h3>
                <p className="text-muted-foreground text-xs mt-1 font-medium leading-relaxed">
                  Get the best monitoring experience directly on your home screen.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {isIOS ? (
                <div className="space-y-3 bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <p className="text-foreground text-[13px] font-medium leading-relaxed">
                    Tap the <span className="font-bold text-primary italic">Share</span> button, then choose <span className="font-bold text-primary italic">Add to Home Screen</span>.
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <div className="p-2 bg-background rounded-lg border shadow-sm">
                      <Share className="size-4 text-primary" strokeWidth={2.5} />
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground opacity-50" />
                    <div className="p-2 bg-background rounded-lg border shadow-sm">
                      <PlusSquare className="size-4 text-primary" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleInstall}
                  className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20"
                >
                  Add to Home Screen
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
