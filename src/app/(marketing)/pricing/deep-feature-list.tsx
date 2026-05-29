"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDown, Activity, Camera, Timer, 
  MessageSquare, Users, Calendar, ShieldAlert,
  FileText, Trophy, Mic, Lock, ShieldCheck, 
  Boxes, HardHat, Building2, Palette, Server,
  Search, Target, ShoppingCart, TrendingUp,
  Package, Factory, Truck, Calculator, Receipt
} from "lucide-react";

export default function DeepFeatureList() {
  return (
    <section className="py-32 bg-secondary/30 border-y-4 border-black dark:border-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">Deep Value for Deep Teams</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Everything you get in TRAC AI</p>
            <ArrowDown className="mx-auto text-primary animate-bounce mt-8" />
          </div>

          <div className="space-y-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="relative md:sticky md:top-32 space-y-6">
                <Badge className="bg-zinc-500 text-white font-black uppercase">Level 1</Badge>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">The Proof</h3>
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight leading-snug">Simple ways to see that work is actually happening. No more guessing.</p>
              </div>
              <div className="space-y-12">
                {[
                  { title: "Auto-Tracking", desc: "It starts when the work starts. You don't have to remind anyone.", icon: Timer },
                  { title: "Activity Capture", desc: "We track every mouse click and key press to show work effort.", icon: Activity },
                  { title: "Work Photos", desc: "Takes pictures of the screen so you can see progress visually.", icon: Camera },
                  { title: "Away Detection", desc: "Automatically knows when someone takes a break or stops working.", icon: ShieldAlert }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="size-14 rounded-2xl bg-card border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-zinc-500 group-hover:text-white transition-all">
                      <f.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tighter">{f.title}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="relative md:sticky md:top-32 space-y-6 md:order-last">
                <Badge className="bg-primary text-white font-black uppercase">Level 2</Badge>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">The Brain</h3>
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight leading-snug">A smart assistant that reads the data so you don't have to.</p>
              </div>
              <div className="space-y-12">
                {[
                  { title: "AI Daily Reports", desc: "A robot summarizes what everyone did and sends it to you.", icon: FileText },
                  { title: "Leaderboards", desc: "Turn work into a game. See who is winning the week.", icon: Trophy },
                  { title: "Meeting Notes", desc: "Our AI listens to your meetings and writes the important bits down.", icon: Mic },
                  { title: "Team Pulse", desc: "Know if your team is happy or tired based on their work rhythm.", icon: Activity }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="size-14 rounded-2xl bg-card border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      <f.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tighter">{f.title}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="relative md:sticky md:top-32 space-y-6">
                <Badge className="bg-emerald-500 text-white font-black uppercase">Level 3</Badge>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">The Command</h3>
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight leading-snug">Total control over how work flows through your company.</p>
              </div>
              <div className="space-y-12">
                {[
                  { title: "Voice Tasks", desc: "Just talk to your app. It will write the tasks for your team.", icon: Mic },
                  { title: "Shift Issuance", desc: "Tell everyone exactly when their day starts and ends.", icon: Calendar },
                  { title: "Master Access", desc: "Decide exactly what every person can see or touch in the app.", icon: Lock },
                  { title: "File Isolation", desc: "Keep your work papers in a safe room that only you control.", icon: ShieldCheck }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="size-14 rounded-2xl bg-card border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <f.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tighter">{f.title}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 4: SALES & GROWTH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="relative md:sticky md:top-32 space-y-6 md:order-last">
                <Badge className="bg-blue-600 text-white font-black uppercase">Level 4</Badge>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">The Engine</h3>
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight leading-snug">Automated sales, CRM, and lead enrichment to grow your revenue.</p>
              </div>
              <div className="space-y-12">
                {[
                  { title: "AI Lead Hunter", desc: "Find thousands of potential customers in minutes.", icon: Search },
                  { title: "CRM Magic", desc: "Track every deal and forecast your revenue perfectly.", icon: Target },
                  { title: "POS Retail", desc: "Run your physical stores with a unified checkout system.", icon: ShoppingCart },
                  { title: "Growth Analytics", desc: "See which sales channels are actually making you money.", icon: TrendingUp }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="size-14 rounded-2xl bg-card border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <f.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tighter">{f.title}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 5: OPERATIONS & SUPPLY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="relative md:sticky md:top-32 space-y-6">
                <Badge className="bg-purple-600 text-white font-black uppercase">Level 5</Badge>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">The Core</h3>
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight leading-snug">Full ERP, Inventory, and Manufacturing control for large operations.</p>
              </div>
              <div className="space-y-12">
                {[
                  { title: "Inventory Flow", desc: "Real-time stock tracking across all your warehouses.", icon: Package },
                  { title: "Manufacturing", desc: "BOM management and production line tracking.", icon: Factory },
                  { title: "Procurement", desc: "Automate your buying and vendor management.", icon: ShoppingCart },
                  { title: "Fleet & Logistics", desc: "Track your movement and delivery performance.", icon: Truck }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="size-14 rounded-2xl bg-card border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <f.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tighter">{f.title}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEVEL 6: FINANCE & PAYROLL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div className="relative md:sticky md:top-32 space-y-6 md:order-last">
                <Badge className="bg-rose-600 text-white font-black uppercase">Level 6</Badge>
                <h3 className="text-6xl font-black uppercase tracking-tighter leading-none">The Wallet</h3>
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tight leading-snug">Integrated accounting, payroll, and banking for total financial clarity.</p>
              </div>
              <div className="space-y-12">
                {[
                  { title: "Smart Accounting", desc: "Automated bookkeeping that connects to your bank.", icon: Calculator },
                  { title: "Auto-Payroll", desc: "Pay your entire team in one click based on work data.", icon: Receipt },
                  { title: "Audit Trail", desc: "A perfect record of every financial movement.", icon: ShieldCheck },
                  { title: "Tax Compliance", desc: "Automated tax filings and financial reporting.", icon: FileText }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="size-14 rounded-2xl bg-card border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all">
                      <f.icon size={24} strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tighter">{f.title}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
