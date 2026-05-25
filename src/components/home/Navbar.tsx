"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, ChevronDown, Rocket, Sparkles, Zap, 
  Calculator, UserSearch, CalendarClock, Timer, 
  ClipboardList, Trophy, Target, FileText, 
  ShoppingCart, MessageSquare, Search, Mail, 
  Package, Briefcase, Factory, Users, LayoutDashboard,
  ShieldCheck, Globe, MousePointer2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const APPS = [
  { name: "CRM", href: "/apps/crm", icon: Target, description: "Track customers and deals.", color: "text-blue-500" },
  { name: "Hiring", href: "/apps/hiring", icon: UserSearch, description: "Find and hire top talent.", color: "text-violet-500" },
  { name: "Accounting", href: "/apps/accounting", icon: Calculator, description: "Bookkeeping made simple.", color: "text-rose-500" },
  { name: "POS", href: "/apps/pos", icon: ShoppingCart, description: "In-store sales and payments.", color: "text-orange-500" },
  { name: "Tasks", href: "/apps/tasks", icon: ClipboardList, description: "Manage team projects.", color: "text-purple-500" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Your business command center.", color: "text-sky-500" },
  { name: "Inventory", href: "/apps/inventory", icon: Package, description: "Real-time stock tracking.", color: "text-emerald-500" },
  { name: "Manufacturing", href: "/apps/manufacturing", icon: Factory, description: "Production line control.", color: "text-slate-500" },
  { name: "Lead Hunter", href: "/apps/lead-hunter", icon: Search, description: "Find new prospects fast.", color: "text-indigo-500" },
  { name: "Leads Enrich", href: "/apps/leads-enrich", icon: Zap, description: "Deep lead intelligence.", color: "text-yellow-500" },
  { name: "Shifts", href: "/apps/shifts", icon: CalendarClock, description: "Easy team scheduling.", color: "text-cyan-500" },
  { name: "Time Tracking", href: "/apps/time-tracking", icon: Timer, description: "Effortless work logs.", color: "text-cyan-500" },
  { name: "Leaderboards", href: "/apps/leaderboards", icon: Trophy, description: "Gamify team performance.", color: "text-amber-500" },
  { name: "Chats", href: "/apps/chats", icon: MessageSquare, description: "Secure team communication.", color: "text-sky-500" },
  { name: "Email", href: "/apps/email", icon: Mail, description: "AI-powered business mail.", color: "text-blue-500" },
  { name: "Procurement", href: "/apps/procurement", icon: ShoppingCart, description: "Automated business buying.", color: "text-emerald-500" },
  { name: "Sales", href: "/apps/sales", icon: Briefcase, description: "Professional quotes and deals.", color: "text-blue-500" },
  { name: "ATS", href: "/apps/ats", icon: Users, description: "Applicant tracking system.", color: "text-violet-500" },
  { name: "Forms", href: "/apps/forms", icon: FileText, description: "Smart data collection.", color: "text-emerald-500" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 transition-all duration-500 px-6 py-4",
          isScrolled && !mobileMenuOpen ? "bg-white/95 dark:bg-black/95 backdrop-blur-2xl border-b border-black/5 dark:border-white/10 py-3" : "bg-transparent",
          mobileMenuOpen ? "z-[110]" : "z-50"
        )}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="size-10 bg-black dark:bg-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500 shadow-xl group-hover:shadow-primary/20">
                <span className="text-white dark:text-black font-black text-2xl">T</span>
              </div>
              <span className="font-poppins font-black text-2xl tracking-tighter uppercase">Trac AI</span>
            </Link>

            <div className="hidden xl:flex items-center gap-10">
              {/* Desktop links temporarily hidden as requested */}
              {/*
              <div 
                className="relative py-2"
                onMouseEnter={() => setIsAppsOpen(true)}
                onMouseLeave={() => setIsAppsOpen(false)}
              >
                <button className="flex items-center gap-1.5 font-bold text-[11px] hover:text-primary transition-colors uppercase tracking-[0.25em]">
                  Apps <ChevronDown size={14} className={cn("transition-transform duration-500", isAppsOpen && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isAppsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full left-[-300px] mt-2 w-[1200px] bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] p-12 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="relative z-10 grid grid-cols-4 gap-x-12 gap-y-2">
                        {APPS.map((app) => (
                          <Link
                            key={app.name}
                            href={app.href}
                            className="group/item flex items-center gap-4 p-4 rounded-3xl hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-300"
                          >
                            <div className={cn("size-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-6 shadow-sm", app.color)}>
                              <app.icon size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                              <div className="font-black text-sm uppercase italic tracking-tight mb-0.5">{app.name}</div>
                              <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest leading-tight">{app.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                            <ShieldCheck size={18} className="text-emerald-500" />
                            Software that replaces all software.
                         </div>
                         <Link href="/apps" className="group/all flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary hover:opacity-70 transition-opacity">
                            Explore all 50+ integrations 
                            <ArrowRight size={16} className="group-hover/all:translate-x-1 transition-transform" />
                         </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link 
                href="/apps/hiring" 
                className="flex items-center gap-2 font-bold text-[11px] hover:text-primary transition-colors uppercase tracking-[0.25em]"
              >
                Google For Hiring
                <Sparkles size={14} className="text-primary animate-pulse" />
              </Link>

              <Link href="/features" className="font-bold text-[11px] hover:text-primary transition-colors uppercase tracking-[0.25em]">Features</Link>
              <Link href="/pricing" className="font-bold text-[11px] hover:text-primary transition-colors uppercase tracking-[0.25em]">Pricing</Link>
              */}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {/* 
            <Link href="/ems/login" className="font-black text-[11px] uppercase tracking-[0.3em] hover:opacity-70 transition-opacity">Login</Link>
            <Link 
              href="/ems/signup" 
              className="bg-black dark:bg-white text-white dark:text-black font-black text-[11px] uppercase tracking-[0.3em] px-12 py-4 rounded-full hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-primary/20"
            >
              Start Now
            </Link>
            */}
          </div>

          <button 
            className="xl:hidden p-3 rounded-2xl bg-black/5 dark:bg-white/5 transition-all active:scale-90 z-[110]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="xl:hidden fixed inset-0 bg-white dark:bg-black z-[100] flex flex-col p-6 pt-24 overflow-y-auto"
          >
            <div className="flex flex-col gap-2 mb-8">
              <Link 
                href="/apps/hiring"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 p-6 rounded-[2.5rem] bg-primary text-white shadow-2xl shadow-primary/20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
                <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-[10px] uppercase tracking-[0.3em] opacity-70 mb-1">Revolutionary</span>
                  <span className="font-black text-sm uppercase tracking-widest leading-none">Google For Hiring</span>
                </div>
                <ArrowRight size={20} className="ml-auto" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-12">
              <Link 
                href="/pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-6 text-center font-black text-[11px] uppercase tracking-[0.3em] border-2 border-black/10 dark:border-white/10 rounded-[2rem] active:scale-95 transition-transform"
              >
                Pricing
              </Link>
              <Link 
                href="/features" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-6 text-center font-black text-[11px] uppercase tracking-[0.3em] border-2 border-black/10 dark:border-white/10 rounded-[2rem] active:scale-95 transition-transform"
              >
                Features
              </Link>
            </div>

            <div className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 mb-6 px-4">Platform Suite</div>
            
            <div className="grid grid-cols-1 gap-2 mb-12">
              {APPS.map((app) => (
                <Link 
                  key={app.name} 
                  href={app.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-5 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  <div className={cn("size-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center transition-transform", app.color)}>
                    <app.icon size={24} />
                  </div>
                  <div className="font-black text-[11px] uppercase tracking-[0.2em]">{app.name}</div>
                </Link>
              ))}
            </div>

            <div className="mt-auto pb-10">
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/ems/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-6 text-center font-black text-[11px] uppercase tracking-[0.3em] border-2 border-black/10 dark:border-white/10 rounded-[2rem] active:scale-95 transition-transform"
                >
                  Login
                </Link>
                <Link 
                  href="/ems/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-6 text-center font-black text-[11px] uppercase tracking-[0.3em] bg-black dark:bg-white text-white dark:text-black rounded-[2rem] shadow-xl active:scale-95 transition-transform"
                >
                  Start Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
