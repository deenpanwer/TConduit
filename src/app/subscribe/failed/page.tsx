"use client";

import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SubscribeFailedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border-4 border-black dark:border-white p-8 space-y-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] text-center"
      >
        <div className="flex justify-center">
          <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center border-4 border-destructive">
            <XCircle size={40} className="text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Payment Failed</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Something went wrong with your transaction
          </p>
        </div>

        <div className="bg-secondary/50 p-6 rounded-xl border-2 border-dashed border-border text-left">
          <p className="text-xs font-bold leading-relaxed">
            Your payment could not be processed. This might be due to:
          </p>
          <ul className="mt-2 space-y-1">
            {["Transaction cancelled by user", "Insufficient funds", "Invalid payment details"].map((item, i) => (
              <li key={i} className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                <div className="size-1 bg-destructive rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link href="/ems">
            <Button className="w-full h-14 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-xs border-4 border-transparent hover:border-destructive transition-all gap-2">
              <ArrowLeft size={16} />
              Return to EMS
            </Button>
          </Link>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Need help? Contact support via WhatsApp.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
