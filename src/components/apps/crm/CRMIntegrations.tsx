"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Users, ListTodo, Briefcase, ShoppingCart, 
  Wallet, Calculator, CalendarClock, UserSearch, 
  LifeBuoy, LineChart, MessageSquare, Database,
  Settings, Globe, Shield, Zap, Sparkles, Phone, Mail, MessageCircle, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTEGRATED_APPS = [
  { id: "sales", title: "Sales", icon: Briefcase, color: "blue", description: "Send professional quotes." },
  { id: "marketing", title: "Email Marketing", icon: Mail, color: "purple", description: "Reach your leads in bulk." },
  { id: "pos", title: "Point of Sale", icon: ShoppingCart, color: "orange", description: "Close retail deals." },
  { id: "hiring", title: "Hiring", icon: UserSearch, color: "violet", description: "Find the right salespeople." }
];

export function CRMIntegrations() {
  return (
    <section className="py-40 px-6 bg-[#f5f5f7] dark:bg-[#050505] border-y border-black/5 dark:border-white/5 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 mb-8 group cursor-default">
            <Zap size={14} className="text-blue-500" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 font-poppins">One need, one app.</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black font-poppins tracking-tighter mb-8 uppercase italic">Everything is connected.</h2>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Expand your business as you grow. Every Trac app is natively connected to your CRM.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {INTEGRATED_APPS.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col items-center gap-6 p-10 rounded-[2.5rem] bg-white dark:bg-black border border-black/5 dark:border-white/10 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-2"
            >
              <div className={cn(
                "size-20 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                `bg-${app.color}-500/10 text-${app.color}-500`
              )}>
                <app.icon size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                 <h3 className="text-xl font-black mb-2 uppercase italic tracking-tighter font-poppins">{app.title}</h3>
                 <p className="text-sm text-muted-foreground font-medium">{app.description}</p>
              </div>
              <Link 
                href={`/apps/${app.id}`} 
                className="mt-4 size-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300"
              >
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Link 
            href="/apps" 
            className="inline-flex items-center gap-2 font-black text-lg uppercase tracking-widest border-b-2 border-black dark:border-white pb-1 hover:opacity-70 transition-opacity"
          >
            Explore all apps <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
