"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MessageCircle, Lock, AlertCircle, ArrowRight } from "lucide-react";

interface PaywallScreenProps {
  orgData: any;
  userData: any;
}

export function PaywallScreen({ orgData, userData }: PaywallScreenProps) {
  const whatsappNumber = "923178005465";
  const orgName = orgData?.name || "My Organization";
  const orgId = orgData?.id || "Unknown ID";
  
  const message = encodeURIComponent(
    `Hello! I would like to top up my account for ${orgName} (ID: ${orgId}). Please let me know the process.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 md:p-8 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* Status Indicator */}
        <div className="flex flex-col items-center space-y-4">
          <div className="size-20 bg-destructive/10 rounded-3xl flex items-center justify-center border-4 border-destructive/20 relative">
            <Lock size={40} className="text-destructive" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 bg-destructive text-white p-1.5 rounded-full shadow-lg"
            >
              <AlertCircle size={16} />
            </motion.div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive">
              Access Status: Restricted
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              Time Limit Reached
            </h1>
          </div>
        </div>

        {/* The "Why" - Professional & Clear */}
        <div className="bg-card border-4 border-black dark:border-white p-8 md:p-10 space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-lg font-bold leading-relaxed">
            Your organization's monitoring period has ended. 
            To resume seeing your team's real-time activity, cognitive reports, 
            and daily productivity analytics, a top-up is required.
          </p>
          
          <div className="h-px bg-border w-full" />
          
          <div className="space-y-4 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              What happens next?
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Daily reports are paused",
                "Heartbeat tracking is idle",
                "Screenshots are suspended",
                "Team analytics are locked"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs font-bold uppercase">
                  <ArrowRight size={14} className="text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-6 pt-4">
          <p className="text-sm font-bold text-muted-foreground">
            Connect with our support team on WhatsApp to extend your access immediately.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center gap-3 bg-[#25D366] text-white font-black uppercase tracking-widest text-sm px-10 py-5 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px]"
            >
              <img src="/whatsapp-real.svg" alt="WA" className="size-6 invert-0" />
              Top Up via WhatsApp
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-8 px-4 border-t-2 border-dashed border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Organization: {orgName}</span>
          <span>ID: {orgId}</span>
        </div>
      </motion.div>
    </div>
  );
}
