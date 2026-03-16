"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Download, Monitor } from "lucide-react";
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

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW Registered'))
        .catch((err) => console.log('SW Registration Failed', err));
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      const hasSeenPrompt = localStorage.getItem('pwa_prompt_seen');
      if (!hasSeenPrompt) {
        setShowPrompt(true);
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
    localStorage.setItem('pwa_prompt_seen', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100]"
      >
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
                    <div className="flex gap-4 items-start relative z-10">
            <div className="bg-primary/20 p-3 rounded-xl">
              {isIOS ? (
                <Smartphone className="text-primary" size={24} />
              ) : (
                <Download className="text-primary" size={24} />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-foreground font-semibold text-lg leading-tight mb-1">
                Put TRAC on your screen
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {isIOS 
                  ? "Tap Share, then 'Add to Home Screen' to keep it where you can see it."
                  : "It works just like an app so you can open it with one tap."
                }
              </p>

              {!isIOS && (
                <Button 
                  onClick={handleInstall}
                  className="w-full bg-white text-black hover:bg-white/90 font-medium rounded-xl h-11 transition-all active:scale-[0.98]"
                >
                  Add to Home
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
