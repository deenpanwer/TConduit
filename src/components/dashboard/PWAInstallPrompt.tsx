"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Download, Share, PlusSquare, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Snooze duration (7 days)
const DISMISS_DAYS = 7;

export function PWAInstallPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // 2. REQUIRED: Register Service Worker for Push & PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Trac AI SW Registered');
          // Update standalone status after SW is ready
          if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
          }
        })
        .catch((err) => console.log('Trac AI SW Registration Failed', err));
    }

    // 3. Check Snooze Logic
    const checkSnooze = () => {
      const dismissedUntil = localStorage.getItem('pwa_prompt_snoozed_until');
      return dismissedUntil && new Date().getTime() < parseInt(dismissedUntil);
    };

    // 4. Capture Install Event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!checkSnooze()) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (isIosDevice && !checkSnooze()) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const snoozePrompt = () => {
    const snoozeTime = new Date().getTime() + (DISMISS_DAYS * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa_prompt_snoozed_until', snoozeTime.toString());
    setShowPrompt(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      // Installed - snooze "forever" (effectively)
      localStorage.setItem('pwa_prompt_snoozed_until', (new Date().getTime() * 2).toString());
      setShowPrompt(false);
      
      // Update User Doc if Logged In
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            "deviceStatus.isPWA": true,
            "deviceStatus.lastUpdated": serverTimestamp()
          });
        } catch (error) {
          console.error("Failed to update PWA status in user doc:", error);
        }
      }
    }
    setDeferredPrompt(null);
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
          {/* Close Button */}
          <button 
            onClick={snoozePrompt}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 z-20"
          >
            <X size={18} />
          </button>

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
