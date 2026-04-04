"use client";

import React from "react";
import Link from "next/link";
import { 
  Twitter, Mail, Shield, 
  Target, ShoppingCart, Search, Zap,
  Package, Factory, LayoutDashboard, CalendarClock,
  UserSearch, Users, ClipboardList, Timer,
  Trophy, MessageSquare, MailOpen, Calculator,
  Briefcase, FileText, Globe
} from "lucide-react";

const PLATFORM_LINKS = [
  { name: "CRM", href: "/apps/crm", icon: Target },
  { name: "Sales", href: "/apps/sales", icon: Briefcase },
  { name: "POS", href: "/apps/pos", icon: ShoppingCart },
  { name: "Lead Hunter", href: "/apps/lead-hunter", icon: Search },
  { name: "Leads Enrich", href: "/apps/leads-enrich", icon: Zap },
  { name: "Inventory", href: "/apps/inventory", icon: Package },
  { name: "Procurement", href: "/apps/procurement", icon: ShoppingCart },
  { name: "Manufacturing", href: "/apps/manufacturing", icon: Factory },
  { name: "Dashboard", href: "/apps/dashboard", icon: LayoutDashboard },
  { name: "Shifts", href: "/apps/shifts", icon: CalendarClock },
  { name: "Hiring", href: "/apps/hiring", icon: UserSearch },
  { name: "ATS", href: "/apps/ats", icon: Users },
  { name: "Tasks", href: "/apps/tasks", icon: ClipboardList },
  { name: "Time Tracking", href: "/apps/time-tracking", icon: Timer },
  { name: "Leaderboards", href: "/apps/leaderboards", icon: Trophy },
  { name: "Chats", href: "/apps/chats", icon: MessageSquare },
  { name: "Email", href: "/apps/email", icon: MailOpen },
  { name: "Forms", href: "/apps/forms", icon: FileText },
  { name: "Accounting", href: "/apps/accounting", icon: Calculator },
];

const LEGAL_LINKS = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
  { name: "Legal", href: "/legal" },
];

const COMPANY_LINKS = [
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
  { name: "Partner Program", href: "/partner" },
];

export function Footer() {
  return (
    <footer className="bg-black text-white pt-32 pb-12 px-6 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 mb-24">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-8 group">
              <div className="size-10 bg-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                <span className="text-black font-black text-2xl">T</span>
              </div>
              <span className="font-poppins font-black text-2xl tracking-tighter uppercase italic">Trac AI</span>
            </Link>
            <p className="text-white/60 font-medium max-w-sm mb-12 leading-relaxed">
              The first truly integrated business operating system. Software that replaces all software.
            </p>
            <div className="flex items-center gap-6">
               <Link href="https://twitter.com" className="text-white/40 hover:text-white transition-colors">
                 <Twitter size={24} />
               </Link>
               <Link href="mailto:info@traconomics.com" className="text-white/40 hover:text-white transition-colors">
                 <Mail size={24} />
               </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-white/40">Platform Apps</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {PLATFORM_LINKS.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-white/70"
                >
                  <link.icon size={14} className="text-white/20 group-hover:text-primary transition-colors" strokeWidth={2.5} />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-white/40">Company</h3>
            <div className="flex flex-col gap-4">
              {COMPANY_LINKS.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-white/70"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-white/40">Legal</h3>
            <div className="flex flex-col gap-4">
              {LEGAL_LINKS.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-white/70"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
              <span>&copy; 2026 TRACONOMICS INDUSTRIES</span>
              <span className="flex items-center gap-2">
                 <Shield size={10} className="text-emerald-500" />
                 Global Security Standard
              </span>
           </div>
           
           <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 px-6 py-3 rounded-full border border-white/10">
              <span className="text-green-400 size-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
              All Systems Operational
           </div>
        </div>
      </div>
    </footer>
  );
}