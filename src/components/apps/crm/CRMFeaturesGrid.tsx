"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, ListTodo, Briefcase, ShoppingCart, 
  Wallet, Calculator, CalendarClock, UserSearch, 
  LifeBuoy, LineChart, MessageSquare, Database,
  Settings, Globe, Shield, Zap, Sparkles, Phone, Mail, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Your entire sales pipeline at a glance.",
    description: "The Kanban view organizes your opportunities by stage. Drag and drop them to move from one stage to another.",
    icon: ListTodo,
    color: "blue"
  },
  {
    title: "Too many leads? Our AI helps.",
    description: "Trac AI scores your leads to make sure you're always working on the most important ones first.",
    icon: Sparkles,
    color: "purple"
  },
  {
    title: "Connect with anyone, anywhere.",
    description: "Send emails, make calls, and send text messages right from your browser. Everything is logged automatically.",
    icon: MessageSquare,
    color: "emerald"
  },
  {
    title: "Always know what to do next.",
    description: "Get smart reminders for follow-ups and meetings. Never let a good deal slip through the cracks.",
    icon: CalendarClock,
    color: "rose"
  }
];

export function CRMFeaturesGrid() {
  return (
    <section className="py-32 px-6 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
           <h2 className="text-4xl md:text-6xl font-black font-poppins tracking-tighter mb-8 uppercase italic">Everything you need <br className="hidden md:block" /> to close deals faster.</h2>
           <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">Focus on selling, not software. Trac AI handles the repetitive work so you can win more customers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {FEATURES.map((feature, index) => (
             <motion.div
               key={feature.title}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
               className="group flex flex-col p-12 rounded-[3rem] bg-[#f5f5f7] dark:bg-[#111] border border-black/5 dark:border-white/10 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-2"
             >
               <div className={cn(
                 "size-16 rounded-2xl flex items-center justify-center mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                 `bg-${feature.color}-500/10 text-${feature.color}-500`
               )}>
                 <feature.icon size={32} strokeWidth={2.5} />
               </div>
               <h3 className="text-3xl font-black mb-6 font-poppins tracking-tighter uppercase italic">{feature.title}</h3>
               <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                 {feature.description}
               </p>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
}
