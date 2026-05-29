"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tracker = searchParams.get("tracker");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full bg-card border-4 border-black dark:border-white p-8 space-y-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] text-center"
    >
      <div className="flex justify-center">
        <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Payment Successful</h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Your subscription is now being processed
        </p>
      </div>

      {tracker && (
        <div className="bg-secondary/50 p-4 rounded-xl border-2 border-dashed border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Transaction Tracker
          </p>
          <code className="text-xs font-mono font-bold break-all">{tracker}</code>
        </div>
      )}

      <div className="pt-4">
        <Link href="/ems">
          <Button className="w-full h-14 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-xs border-4 border-transparent hover:border-emerald-500 transition-all gap-2">
            Back to Dashboard
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        It may take a few minutes for your access to be fully restored.
      </p>
    </motion.div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Suspense fallback={
        <div className="text-sm font-bold animate-pulse uppercase tracking-widest">
          Verifying Payment...
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
