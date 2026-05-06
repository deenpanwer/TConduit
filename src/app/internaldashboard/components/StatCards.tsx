"use client";

import { motion } from "framer-motion";
import { Zap, AlertCircle, Timer, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  stats: {
    total: number;
    activeTrial: number;
    expired: number;
    missingExpiry: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  const statConfig = [
    { label: "Active Access", value: stats.activeTrial, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Access Expired", value: stats.expired, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "New Accounts", value: stats.missingExpiry, icon: Timer, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total Accounts", value: stats.total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statConfig.map((stat, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          key={i} 
          className="bg-card border-2 border-border p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all"
        >
          <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110", stat.bg, stat.color)}>
             <stat.icon size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
          <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
             <stat.icon size={80} />
          </div>
        </motion.div>
      ))}
    </section>
  );
}
