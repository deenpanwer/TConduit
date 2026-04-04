"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Users, ListTodo, Briefcase, ShoppingCart, 
  Wallet, Calculator, CalendarClock, UserSearch, 
  LifeBuoy, LineChart, MessageSquare, Database,
  Settings, Globe, Shield, Zap, Mail, Factory, 
  Package, Search, Trophy, LayoutDashboard, ClipboardList,
  Target, MailOpen, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCT_GROUPS = [
  {
    category: "Sales & Growth",
    apps: [
      { id: "crm", title: "CRM", icon: Target, href: "/apps/crm", color: "blue", desc: "Track customers.", replaces: "HubSpot", price: "$450/mo" },
      { id: "sales", title: "Sales", icon: Briefcase, href: "/apps/sales", color: "blue", desc: "Send quotes.", replaces: "Salesforce", price: "$150/user" },
      { id: "pos", title: "Point of Sale", icon: ShoppingCart, href: "/apps/pos", color: "orange", desc: "In-store shop.", replaces: "Square", price: "$60/mo" },
      { id: "lead-hunter", title: "Lead Hunter", icon: Search, href: "/apps/lead-hunter", color: "indigo", desc: "Find new people.", replaces: "Apollo", price: "$49/mo" },
      { id: "leads-enrich", title: "Leads Enrich", icon: Zap, color: "yellow", href: "/apps/leads-enrich", desc: "Know your leads.", replaces: "Clearbit", price: "$99/mo" },
    ]
  },
  {
    category: "Operations",
    apps: [
      { id: "inventory", title: "Inventory", icon: Package, href: "/apps/inventory", color: "emerald", desc: "Stock management.", replaces: "NetSuite", price: "$999/mo" },
      { id: "procurement", title: "Procurement", icon: ShoppingCart, href: "/apps/procurement", color: "emerald", desc: "Buying stuff.", replaces: "Coupa", price: "$500/mo" },
      { id: "manufacturing", title: "Manufacturing", icon: Factory, href: "/apps/manufacturing", color: "slate", desc: "Making things.", replaces: "SAP", price: "$200/user" },
      { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, href: "/apps/dashboard", color: "sky", desc: "Company overview.", replaces: "Tableau", price: "$70/user" },
    ]
  },
  {
    category: "Team & HR",
    apps: [
      { id: "hiring", title: "Hiring", icon: UserSearch, href: "/apps/hiring", color: "violet", desc: "Find teammates.", replaces: "Greenhouse", price: "$6k/yr" },
      { id: "ats", title: "ATS", icon: Users, href: "/apps/ats", color: "violet", desc: "Track applicants.", replaces: "Ashby", price: "$300/mo" },
      { id: "shifts", title: "Shifts", icon: CalendarClock, href: "/apps/shifts", color: "cyan", desc: "Work schedules.", replaces: "7shifts", price: "$31/mo" },
      { id: "timetracking", title: "Time Tracking", icon: ListTodo, href: "/apps/time-tracking", color: "cyan", desc: "Clock in & out.", replaces: "Hubstaff", price: "$7/user" },
    ]
  },
  {
    category: "Productivity",
    apps: [
      { id: "tasks", title: "Tasks", icon: ClipboardList, href: "/apps/tasks", color: "purple", desc: "Jobs to do.", replaces: "Monday.com", price: "$10/user" },
      { id: "leaderboards", title: "Leaderboards", icon: Trophy, href: "/apps/leaderboards", color: "amber", desc: "Friendly contests.", replaces: "Spinify", price: "$200/mo" },
      { id: "chats", title: "Chats", icon: MessageSquare, href: "/apps/chats", color: "sky", desc: "Team talking.", replaces: "Slack", price: "$7/user" },
      { id: "email", title: "Email", icon: MailOpen, href: "/apps/email", color: "blue", desc: "Send messages.", replaces: "Mailchimp", price: "$20/mo" },
      { id: "forms", title: "Forms", icon: ListTodo, href: "/apps/forms", color: "emerald", desc: "Ask questions.", replaces: "Typeform", price: "$25/mo" },
      { id: "accounting", title: "Accounting", icon: Calculator, href: "/apps/accounting", color: "rose", desc: "Money tracking.", replaces: "QuickBooks", price: "$30/mo" },
    ]
  }
];

export function AppGrid() {
  return (
    <section className="py-32 px-6 bg-[#f5f5f7] dark:bg-[#0a0a0a] border-y border-black/5 dark:border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-32">
          <h2 className="text-4xl md:text-7xl font-black font-poppins tracking-tighter mb-8 uppercase italic selection:bg-primary selection:text-white">
            Replace all your <br className="hidden md:block" />
            <span className="text-primary underline underline-offset-8 decoration-primary/20">other software.</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Stop paying for 20 different tools. Trac AI gives you everything in one place, so things just work.
          </p>
        </div>

        <div className="space-y-32">
          {PRODUCT_GROUPS.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-6 mb-16">
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/60 font-poppins italic">{group.category}</h3>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16">
                {group.apps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center"
                  >
                    <Link 
                      href={app.href} 
                      className="group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all duration-500 hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5 hover:-translate-y-2 border border-transparent hover:border-black/5 dark:hover:border-white/10 w-full"
                    >
                      <div className={cn(
                        "size-20 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-2xl",
                        "bg-white dark:bg-black border border-black/5 dark:border-white/10"
                      )}>
                        <app.icon className={cn(
                          "size-10 transition-colors duration-500",
                          `text-${app.color}-500 group-hover:text-primary`
                        )} strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <span className="block font-black text-sm uppercase italic tracking-tighter font-poppins mb-1">
                          {app.title}
                        </span>
                        <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                          {app.desc}
                        </span>
                      </div>
                      
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden rounded-[2.5rem]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                      </div>
                    </Link>

                    {/* Competitor Marker */}
                    <div className="mt-6 flex flex-col items-center text-center pointer-events-none select-none">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">Replaces</span>
                       <div className="relative rotate-[-2deg] flex flex-col items-center">
                          <span className="font-marker text-lg text-red-500/80 dark:text-red-400/80 line-through decoration-red-500/40 decoration-2 leading-none">
                             {app.replaces}
                          </span>
                          <span className="font-marker text-xs text-red-500/60 dark:text-red-400/60 mt-0.5">
                             {app.price}
                          </span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-40 text-center">
          <Link 
            href="/apps" 
            className="group inline-flex items-center gap-4 px-12 py-5 bg-black dark:bg-white text-white dark:text-black font-black text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-2xl"
          >
            SEE ALL 50+ APPS
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}