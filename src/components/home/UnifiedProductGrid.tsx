"use client";

import React from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  Calculator, 
  Target, 
  Users, 
  ShoppingCart, 
  Search, 
  FileText, 
  MessageSquare, 
  Package, 
  Truck, 
  Trophy, 
  ShieldCheck, 
  MailOpen, 
  Activity, 
  Mic, 
  BarChart, 
  Layout, 
  CheckSquare,
  FolderKanban,
  Sparkles,
  MessageCircle
} from "lucide-react";

const PRODUCTS = [
  { name: "Tasks", icon: ClipboardList, href: "/features" },
  { name: "Time Tracking", icon: Clock, href: "/features" },
  { name: "Shifts", icon: Calendar, href: "/features" },
  { name: "Accounting", icon: Calculator, href: "/features" },
  { name: "CRM", icon: Target, href: "/features" },
  { name: "ATS / Hiring", icon: Users, href: "/features" },
  { name: "POS Checkout", icon: ShoppingCart, href: "/features" },
  { name: "AI Lead Hunter", icon: Search, href: "/features" },
  { name: "Forms", icon: FileText, href: "/features" },
  { name: "Slack Chats", icon: MessageSquare, href: "/features" },
  { name: "Inventory", icon: Package, href: "/features" },
  { name: "Procurement", icon: Truck, href: "/features" },
  { name: "Leaderboards", icon: Trophy, href: "/features" },
  { name: "Custom NDAs", icon: ShieldCheck, href: "/features" },
  { name: "Email Automation", icon: MailOpen, href: "/features" },
  { name: "Personnel Pulse", icon: Activity, href: "/features" },
  { name: "Audio Tasks", icon: Mic, href: "/features" },
  { name: "Gantt Charts", icon: BarChart, href: "/features" },
  { name: "Whiteboards", icon: Layout, href: "/features" },
  { name: "Checklists", icon: CheckSquare, href: "/features" }
];

export function UnifiedProductGrid() {
  return (
    <section className="py-24 bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 overflow-hidden relative border-t border-zinc-100 dark:border-zinc-800/85">
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center space-y-16">
        
        {/* Header Text Block: Original & non-copied TRAC AI value proposition */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white uppercase leading-none">
            The Complete Business Operations Engine
          </h2>
          <p className="text-sm sm:text-base font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide max-w-2xl mx-auto leading-relaxed">
            Replaces all your disconnected time trackers, CRM sales boards, hiring databases, and payroll bookkeeping suites under one seamless, high-performance workspace.
          </p>
        </div>

        {/* Fading Edge Mask Container: Dissolves the borders at outer boundaries smoothly */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#050505] p-2">
          
          {/* Subtle edge-fade overlays to smoothly dissolve grid lines at layout borders exactly like ClickUp */}
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-white via-white/70 to-transparent dark:from-[#050505] dark:via-[#050505]/70 pointer-events-none z-20" />
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white via-white/70 to-transparent dark:from-[#050505] dark:via-[#050505]/70 pointer-events-none z-20" />
          <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white via-white/70 to-transparent dark:from-[#050505] dark:via-[#050505]/70 pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white via-white/70 to-transparent dark:from-[#050505] dark:via-[#050505]/70 pointer-events-none z-20" />

          {/* Contiguous Grid: White background, border lines forming the grid layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border-t border-l border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-[#050505] select-none">
            
            {/* Row 1: First 6 modular cells surrounding the center */}
            {PRODUCTS.slice(0, 6).map((prod, idx) => {
              const Icon = prod.icon;
              return (
                <Link 
                  href={prod.href}
                  key={idx}
                  className="bg-white dark:bg-[#050505] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-200 group min-h-[150px]"
                >
                  <div className="text-zinc-400 group-hover:text-indigo-600 transition-colors group-hover:scale-110 duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{prod.name}</span>
                </Link>
              );
            })}

            {/* Row 2 (Part 1): Pinned 2 left cells */}
            {PRODUCTS.slice(6, 8).map((prod, idx) => {
              const Icon = prod.icon;
              return (
                <Link 
                  href={prod.href}
                  key={idx}
                  className="bg-white dark:bg-[#050505] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-200 group min-h-[150px]"
                >
                  <div className="text-zinc-400 group-hover:text-indigo-600 transition-colors group-hover:scale-110 duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{prod.name}</span>
                </Link>
              );
            })}

            {/* 2x2 Large Pinned Center Container Block */}
            <div className="col-span-2 row-span-2 border-r border-b border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-0 bg-white dark:bg-black z-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              
              {/* Box 1: Projects (Amber/Rose Soft Gradient) */}
              <Link 
                href="/features"
                className="bg-gradient-to-tr from-amber-500/[0.04] to-rose-500/[0.04] hover:from-amber-500/[0.07] hover:to-rose-500/[0.07] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-6 flex flex-col justify-between items-center text-center transition-all duration-300 group overflow-hidden relative min-h-[190px]"
              >
                {/* High-Fidelity Custom-Drawn Kanban Mockup */}
                <div className="w-full aspect-[16/10] rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] flex flex-col p-2 space-y-1.5 group-hover:scale-[1.02] transition-transform duration-300">
                  {/* Mockup Header */}
                  <div className="flex items-center gap-1">
                    <div className="size-1.5 rounded-full bg-rose-400" />
                    <div className="size-1.5 rounded-full bg-amber-400" />
                    <div className="size-1.5 rounded-full bg-emerald-400" />
                  </div>
                  {/* Mockup Board columns */}
                  <div className="grid grid-cols-3 gap-1 flex-1">
                    <div className="rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 flex flex-col p-1 space-y-1">
                      <div className="h-1 bg-blue-500/20 rounded w-4/5" />
                      <div className="h-2 bg-zinc-200/40 dark:bg-zinc-700/40 rounded w-full" />
                    </div>
                    <div className="rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 flex flex-col p-1 space-y-1">
                      <div className="h-1 bg-amber-500/20 rounded w-3/5" />
                      <div className="h-2.5 bg-zinc-200/40 dark:bg-zinc-700/40 rounded w-full" />
                    </div>
                    <div className="rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 flex flex-col p-1 space-y-1">
                      <div className="h-1 bg-emerald-500/20 rounded w-1/2" />
                      <div className="h-1.5 bg-zinc-200/40 dark:bg-zinc-700/40 rounded w-full" />
                    </div>
                  </div>
                </div>

                {/* Bottom Pinned Label */}
                <div className="flex items-center gap-2 mt-4">
                  <FolderKanban size={16} className="text-blue-500" />
                  <span className="text-sm font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Projects</span>
                </div>
              </Link>

              {/* Box 2: Lead Finder (Blue/Cyan Soft Gradient) - WAS Docs */}
              <Link 
                href="/features"
                className="bg-gradient-to-tr from-blue-500/[0.04] to-cyan-500/[0.04] hover:from-blue-500/[0.07] hover:to-cyan-500/[0.07] border-b border-zinc-100 dark:border-zinc-800/80 p-6 flex flex-col justify-between items-center text-center transition-all duration-300 group overflow-hidden relative min-h-[190px]"
              >
                {/* High-Fidelity Leads Extracted List Mockup */}
                <div className="w-full aspect-[16/10] rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] flex flex-col p-2 space-y-1 justify-start text-left group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800/50 text-[6px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    <span>Active Leads</span>
                    <span className="text-emerald-500 font-extrabold">+24 Today</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 p-1 rounded border border-zinc-100/50 dark:border-zinc-800/50 text-[6px] font-extrabold">
                      <span className="text-zinc-900 dark:text-zinc-100">Alex V. (Founder)</span>
                      <span className="text-indigo-500 font-black">Verified Email</span>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 p-1 rounded border border-zinc-100/50 dark:border-zinc-800/50 text-[6px] font-extrabold">
                      <span className="text-zinc-900 dark:text-zinc-100">Sarah K. (COO)</span>
                      <span className="text-indigo-500 font-black">Verified Email</span>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 p-1 rounded border border-zinc-100/50 dark:border-zinc-800/50 text-[6px] font-extrabold">
                      <span className="text-zinc-900 dark:text-zinc-100">Thane S. (Sales)</span>
                      <span className="text-indigo-500 font-black">Verified Email</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Pinned Label */}
                <div className="flex items-center gap-2 mt-4">
                  <Search size={16} className="text-cyan-500" />
                  <span className="text-sm font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Lead Finder</span>
                </div>
              </Link>

              {/* Box 3: Super Copilot (Fuchsia/Purple Soft Gradient) - WAS Brain */}
              <Link 
                href="/features"
                className="bg-gradient-to-tr from-fuchsia-500/[0.04] to-purple-500/[0.04] hover:from-fuchsia-500/[0.07] hover:to-purple-500/[0.07] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-6 flex flex-col justify-between items-center text-center transition-all duration-300 group overflow-hidden relative min-h-[190px]"
              >
                {/* High-Fidelity Copilot Chat Prompt & Synced Billing response Mockup */}
                <div className="w-full aspect-[16/10] rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] flex flex-col p-2 space-y-1.5 text-left group-hover:scale-[1.02] transition-transform duration-300">
                  {/* User Input Prompt */}
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg p-1 text-[6px] font-extrabold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <span className="size-2 bg-indigo-500 rounded-full flex items-center justify-center text-[5px] text-white font-black">U</span>
                    <span>Draft payroll reports...</span>
                  </div>
                  {/* AI Response Output */}
                  <div className="bg-pink-500/[0.03] dark:bg-pink-500/[0.05] border border-pink-500/10 dark:border-pink-500/20 rounded-lg p-1 flex flex-col space-y-0.5">
                    <div className="flex items-center gap-1 text-[5px] font-black text-pink-500 uppercase tracking-widest">
                      <Sparkles size={6} className="fill-pink-500 stroke-none" />
                      Copilot Active
                    </div>
                    <span className="text-[6px] font-extrabold text-zinc-950 dark:text-zinc-100 leading-snug">Compiled 14 shifts. Total: Rs 4,200. Synced to invoicing.</span>
                  </div>
                </div>

                {/* Bottom Pinned Label */}
                <div className="flex items-center gap-2 mt-4">
                  <Sparkles size={16} className="text-pink-500 animate-pulse" />
                  <span className="text-sm font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Super Copilot</span>
                </div>
              </Link>

              {/* Box 4: Chat (Violet/Indigo Soft Gradient) */}
              <Link 
                href="/features"
                className="bg-gradient-to-tr from-violet-500/[0.04] to-indigo-500/[0.04] hover:from-violet-500/[0.07] hover:to-indigo-500/[0.07] p-6 flex flex-col justify-between items-center text-center transition-all duration-300 group overflow-hidden relative min-h-[190px]"
              >
                {/* High-Fidelity Chat Messages Mockup */}
                <div className="w-full aspect-[16/10] rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] flex flex-col p-2 space-y-1.5 justify-between group-hover:scale-[1.02] transition-transform duration-300">
                  {/* Left Message */}
                  <div className="flex items-start gap-1 max-w-[85%]">
                    <div className="size-3.5 rounded-full bg-violet-500 text-white text-[5px] flex items-center justify-center font-black shrink-0">A</div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-lg p-1 text-[5px] font-extrabold text-zinc-800 dark:text-zinc-200 leading-tight">Shifts completed. Reviewing timesheets.</div>
                  </div>
                  {/* Right Message */}
                  <div className="flex items-start gap-1 max-w-[85%] self-end flex-row-reverse">
                    <div className="size-3.5 rounded-full bg-emerald-500 text-white text-[5px] flex items-center justify-center font-black shrink-0">T</div>
                    <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg p-1 text-[5px] font-extrabold text-zinc-950 dark:text-zinc-100 leading-tight">Excellent! Time logs auto-approved.</div>
                  </div>
                </div>

                {/* Bottom Pinned Label */}
                <div className="flex items-center gap-2 mt-4">
                  <MessageCircle size={16} className="text-purple-500" />
                  <span className="text-sm font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Chat</span>
                </div>
              </Link>
            </div>

            {/* Row 2 (Part 2): Pinned 2 right cells */}
            {PRODUCTS.slice(8, 10).map((prod, idx) => {
              const Icon = prod.icon;
              return (
                <Link 
                  href={prod.href}
                  key={idx}
                  className="bg-white dark:bg-[#050505] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-200 group min-h-[150px]"
                >
                  <div className="text-zinc-400 group-hover:text-indigo-600 transition-colors group-hover:scale-110 duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{prod.name}</span>
                </Link>
              );
            })}

            {/* Row 3: Surrounding middle-bottom cells */}
            {PRODUCTS.slice(10, 14).map((prod, idx) => {
              const Icon = prod.icon;
              return (
                <Link 
                  href={prod.href}
                  key={idx}
                  className="bg-white dark:bg-[#050505] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-200 group min-h-[150px]"
                >
                  <div className="text-zinc-400 group-hover:text-indigo-600 transition-colors group-hover:scale-110 duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{prod.name}</span>
                </Link>
              );
            })}

            {/* Row 4: Remaining 6 surrounding cells */}
            {PRODUCTS.slice(14).map((prod, idx) => {
              const Icon = prod.icon;
              return (
                <Link 
                  href={prod.href}
                  key={idx}
                  className="bg-white dark:bg-[#050505] border-r border-b border-zinc-100 dark:border-zinc-800/80 p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-200 group min-h-[150px]"
                >
                  <div className="text-zinc-400 group-hover:text-indigo-600 transition-colors group-hover:scale-110 duration-200">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">{prod.name}</span>
                </Link>
              );
            })}

          </div>

        </div>

      </div>
    </section>
  );
}
