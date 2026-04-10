"use client";

import { useState, useEffect, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, Clock, Lock, MessageCircle, 
  X, ArrowRight, Zap, ShieldAlert, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";

interface SubscriptionBadgeProps {
  orgData: any;
  userData: any;
}

export function SubscriptionBadge({ orgData, userData }: SubscriptionBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  const expiryDate = useMemo(() => {
    if (!orgData?.subscriptionExpiry) return null;
    return orgData.subscriptionExpiry.toDate ? orgData.subscriptionExpiry.toDate() : new Date(orgData.subscriptionExpiry);
  }, [orgData?.subscriptionExpiry]);

  useEffect(() => {
    setMounted(true);
    if (!expiryDate) return;

    const calculateTimeLeft = () => {
      const seconds = differenceInSeconds(expiryDate, new Date());
      setTimeLeft(seconds);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!mounted || !expiryDate || timeLeft <= 0) return null;

  const daysLeft = Math.floor(timeLeft / 86400);
  const isCritical = daysLeft < 1;
  const isWarning = daysLeft >= 1 && daysLeft <= 7;

  // If more than 7 days left, don't show the badge
  if (!isCritical && !isWarning) return null;

  const formatCountdown = () => {
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const whatsappNumber = "923057631663";
  const orgName = orgData?.name || "My Organization";
  const orgId = orgData?.id || "Unknown ID";
  const message = encodeURIComponent(
    `Hello! My subscription for ${orgName} (ID: ${orgId}) is ending in ${daysLeft > 0 ? daysLeft + ' days' : 'less than 24 hours'}. I'd like to top up now.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <>
      <m.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]",
          isCritical 
            ? "bg-destructive text-white border-white animate-pulse" 
            : "bg-amber-400 text-black border-black"
        )}
      >
        {isCritical ? <Timer size={14} className="animate-spin-slow" /> : <AlertTriangle size={14} />}
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
          {isCritical ? formatCountdown() : `${daysLeft} DAYS LEFT`}
        </span>
      </m.button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-black dark:border-white bg-card shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] p-0 custom-scrollbar outline-none flex flex-col">
          <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 flex-1">
            <DialogHeader className="items-center text-center space-y-4">
              <div className={cn(
                "size-16 sm:size-20 rounded-2xl sm:rounded-3xl flex items-center justify-center border-4 relative",
                isCritical ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-amber-400/10 border-amber-400/20 text-amber-500"
              )}>
                {isCritical ? <Lock size={32} /> : <ShieldAlert size={32} />}
                <m.div 
                   animate={{ scale: [1, 1.2, 1] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className={cn("absolute -top-2 -right-2 p-1 sm:p-1.5 rounded-full shadow-lg", isCritical ? "bg-destructive" : "bg-amber-500")}
                >
                  <AlertTriangle size={14} className="text-white" />
                </m.div>
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none">
                  {isCritical ? "Subscription Ending" : "Limited Access Remaining"}
                </DialogTitle>
                <DialogDescription className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  Status: {orgData?.subscriptionStatus || "Trialing"}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="bg-secondary/50 border-2 border-dashed border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Automatic Suspension In:</p>
              <h3 className={cn(
                "text-3xl sm:text-5xl font-black tracking-tighter tabular-nums",
                isCritical ? "text-destructive" : "text-foreground"
              )}>
                {isCritical ? formatCountdown() : `${daysLeft} Days`}
              </h3>
            </div>

            <div className="space-y-4">
               <p className="text-xs sm:text-sm font-bold leading-relaxed text-center px-2 sm:px-4">
                 When this timer reaches zero, all background tracking will pause. Your team's snapshots, activity metrics, and cognitive processing will be suspended immediately.
               </p>
               
               <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-2">
                  {[
                    "Screenshots will stop uploading",
                    "AI Efficiency reports will pause",
                    "Employee activity logs will lock"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 bg-card border-2 border-border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                       <div className="size-5 sm:size-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                          <ArrowRight size={12} />
                       </div>
                       <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">{text}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 pt-2 sm:pt-4">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-3 bg-[#25D366] text-white font-black uppercase tracking-widest text-[10px] sm:text-xs h-14 sm:h-16 rounded-xl sm:rounded-2xl border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                <MessageCircle size={18} />
                Top Up via WhatsApp
              </a>
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest h-9 sm:h-10"
              >
                Close Warning
              </Button>
            </div>
          </div>

          <div className="bg-black text-white dark:bg-white dark:text-black py-2.5 sm:py-3 px-6 sm:px-8 flex justify-between items-center shrink-0">
             <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">ORG: {orgName}</span>
             <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">ID: {orgId}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}