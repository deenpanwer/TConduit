"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, ListTodo, Briefcase, ShoppingCart, 
  Wallet, Calculator, CalendarClock, UserSearch, 
  LifeBuoy, LineChart, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TracCanvas } from "@/components/ui/TracCanvas";

const PRODUCTS = [
  {
    id: "sales",
    title: "CRM",
    description: "Keep track of your customers and deals.",
    icon: Users,
    href: "/crm",
    color: "blue",
    competitor: "Hubspot",
    competitorPrice: "$450/mo"
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "Manage what your team needs to do.",
    icon: ListTodo,
    href: "/tasks",
    color: "purple",
    competitor: "Monday.com",
    competitorPrice: "$10/user"
  },
  {
    id: "engineering",
    title: "Operations",
    description: "The main control center for your company.",
    icon: Briefcase,
    href: "/dashboard",
    color: "emerald",
    competitor: "Linear",
    competitorPrice: "$12/user"
  },
  {
    id: "retail",
    title: "Point of Sale",
    description: "Take payments and manage your shop.",
    icon: ShoppingCart,
    href: "/pos",
    color: "orange",
    competitor: "Square",
    competitorPrice: "$60/mo"
  },
  {
    id: "payroll",
    title: "Payroll",
    description: "Send money to your team for their work.",
    icon: Wallet,
    href: "#",
    color: "indigo",
    competitor: "Gusto",
    competitorPrice: "$40+ $6/user"
  },
  {
    id: "accounting",
    title: "Accounting",
    description: "Keep track of money coming in and out.",
    icon: Calculator,
    href: "#",
    color: "rose",
    competitor: "QuickBooks",
    competitorPrice: "$30/mo"
  },
  {
    id: "shifts",
    title: "Shifts",
    description: "Schedule who is working and when.",
    icon: CalendarClock,
    href: "#",
    color: "cyan",
    competitor: "7shifts",
    competitorPrice: "$31/mo"
  },
  {
    id: "hiring",
    title: "Hiring",
    description: "Find the right people to join your team.",
    icon: UserSearch,
    href: "/search",
    color: "violet",
    competitor: "Greenhouse",
    competitorPrice: "$6,000/yr"
  },
  {
    id: "support",
    title: "Support",
    description: "Answer questions and solve customer issues.",
    icon: LifeBuoy,
    href: "#",
    color: "amber",
    competitor: "Zendesk",
    competitorPrice: "$55/user"
  },
  {
    id: "productivity",
    title: "Team Monitoring",
    description: "Measure how productive your team is.",
    icon: LineChart,
    href: "#",
    color: "pink",
    competitor: "Hubstaff",
    competitorPrice: "$7/user"
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* Hero Particle Canvas */}
      <section className="pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="mb-12"
        >
          <TracCanvas />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-6 font-poppins"
        >
          The Operating System<br />for Business.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium"
        >
          A single, unified stack of products designed to replace a dozen different subscriptions. Elegant, simple, and professional.
        </motion.p>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
        >
          {PRODUCTS.map((product) => (
            <motion.div key={product.id} variants={item} className="group flex flex-col">
              <Link href={product.href} className="block">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#f5f5f7] dark:bg-[#111111] p-10 h-80 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/10 group-hover:-translate-y-2">
                  <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white dark:bg-black border border-black/5 dark:border-white/10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                    <product.icon size={28} strokeWidth={2.5} />
                  </div>
                  
                  <h3 className="text-2xl font-black mb-3 font-poppins tracking-tight">{product.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed mb-8">
                    {product.description}
                  </p>

                  <div className="absolute bottom-10 right-10 size-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-300">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>

              {/* Competitor Comparison Section */}
              <div className="mt-6 px-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40">Replaces</span>
                </div>
                <div className="relative inline-block rotate-[-1deg]">
                  <span className="font-marker text-xl md:text-2xl text-red-500 opacity-80 dark:text-red-400 block line-through decoration-red-500/50 decoration-2">
                    {product.competitor}
                  </span>
                  <span className="font-marker text-sm text-red-500/60 dark:text-red-400/60 block text-center mt-[-4px]">
                    {product.competitorPrice}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-black text-white py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8 font-poppins tracking-tighter italic uppercase">Zero Jargon. All Professional.</h2>
          <p className="text-xl text-white/60 mb-12 font-medium">
            We built these products because we were tired of "Enterprise" software that felt like it was built in the 90s. Welcome to the new standard.
          </p>
          <Link href="/dashboard/signup">
            <button className="bg-white text-black h-16 px-12 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform">
              Get Started Now
            </button>
          </Link>
        </div>
      </section>

      <footer className="py-12 border-t border-black/5 dark:border-white/5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
        &copy; 2026 TRAC AI INDUSTRIES • ALL RIGHTS RESERVED
      </footer>

    </div>
  );
}
