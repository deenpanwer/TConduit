'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Twitter, Mail, 
  Target, ShoppingCart, Search, Zap,
  Package, Factory, LayoutDashboard, CalendarClock,
  UserSearch, Users, ClipboardList, Timer,
  Trophy, MessageSquare, MailOpen, Calculator,
  Briefcase, FileText, Linkedin
} from 'lucide-react';

const PLATFORM_LINKS = [
  { name: 'CRM', href: '/apps/crm', icon: Target },
  { name: 'Sales', href: '/apps/sales', icon: Briefcase },
  { name: 'POS', href: '/apps/pos', icon: ShoppingCart },
  { name: 'Lead Hunter', href: '/apps/lead-hunter', icon: Search },
  { name: 'Leads Enrich', href: '/apps/leads-enrich', icon: Zap },
  { name: 'Inventory', href: '/apps/inventory', icon: Package },
  { name: 'Procurement', href: '/apps/procurement', icon: ShoppingCart },
  { name: 'Manufacturing', href: '/apps/manufacturing', icon: Factory },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Shifts', href: '/apps/shifts', icon: CalendarClock },
  { name: 'Hiring', href: '/apps/hiring', icon: UserSearch },
  { name: 'ATS', href: '/apps/ats', icon: Users },
  { name: 'Tasks', href: '/apps/tasks', icon: ClipboardList },
  { name: 'Time Tracking', href: '/apps/time-tracking', icon: Timer },
  { name: 'Leaderboards', href: '/apps/leaderboards', icon: Trophy },
  { name: 'Chats', href: '/apps/chats', icon: MessageSquare },
  { name: 'Email', href: '/apps/email', icon: MailOpen },
  { name: 'Forms', href: '/apps/forms', icon: FileText },
  { name: 'Accounting', href: '/apps/accounting', icon: Calculator },
];

const LEGAL_LINKS = [
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Refund Policy', href: '/cancellation-refund-policy' },
  { name: 'Legal', href: '/legal' },
];

const COMPANY_LINKS = [
  { name: 'About Us', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Partner Program', href: '/partner' },
];

const COMPARE_LINKS = [
  { name: 'vs Hubstaff', href: '/alternative/hubstaff' },
  { name: 'vs ClickUp', href: '/alternative/clickup' },
  { name: 'Best EMS Software', href: '/best-ems-software' },
  { name: 'Best Lead Finder', href: '/best-lead-finder' },
];

export function Footer() {
  return (
    <footer className="relative w-full h-auto lg:h-screen">
      <Image
        src="/footerimage.png"
        alt="Footer background"
        fill
        sizes="100vw"
        style={{ objectFit: 'cover' }}
        quality={75}
        className="hidden lg:block"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex items-center justify-center h-full py-24 lg:py-0">
        <div className="max-w-7xl w-full mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-16 mb-16">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-8 group">
                <img 
                  src="/special-triangle-black.svg" 
                  alt="TRAC AI Logo" 
                  className="dark:hidden w-8 h-8 object-contain"
                />
                <img 
                  src="/special-triangle.svg" 
                  alt="TRAC AI Logo" 
                  className="hidden dark:block w-8 h-8 object-contain"
                />
                <span className="font-poppins font-bold text-2xl text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">
                  TRAC AI
                </span>
              </Link>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium max-w-sm mb-12 leading-relaxed">
                The first truly integrated business operating system. Software that replaces all software.
              </p>
              <div className="flex items-center gap-6">
                 <Link href="https://x.com/trytracai" target="_blank" className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                   <Twitter size={24} />
                 </Link>
                 <Link href="https://www.linkedin.com/company/trac-ai/" target="_blank" className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                   <Linkedin size={24} />
                 </Link>
                 <Link href="mailto:info@heytracai.com" className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                   <Mail size={24} />
                 </Link>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-500 dark:text-zinc-400">Platform Apps</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {PLATFORM_LINKS.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    <link.icon size={14} className="text-zinc-400 dark:text-zinc-400 group-hover:text-primary transition-colors" strokeWidth={2.5} />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-500 dark:text-zinc-400">Compare</h3>
              <div className="flex flex-col gap-4">
                {COMPARE_LINKS.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-500 dark:text-zinc-400">Company</h3>
              <div className="flex flex-col gap-4">
                {COMPANY_LINKS.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-500 dark:text-zinc-400">Legal</h3>
              <div className="flex flex-col gap-4 mb-8">
                {LEGAL_LINKS.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-full cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors w-fit">
                <img src="/compliance/choices.png" alt="Privacy Choices" width={16} height={16} className="h-4 w-auto" />
                <span className="text-[10px] font-bold text-zinc-900 dark:text-white">Your privacy choices</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row items-center justify-between gap-8">
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-10 gap-y-4">
                <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">
                  <img src="/compliance/gdpr.png" alt="GDPR" width={80} height={80} className="h-20 w-auto object-contain dark:invert" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-100">GDPR</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">
                  <img src="/compliance/hipaa.png" alt="HIPAA" width={32} height={32} className="h-8 w-auto object-contain dark:invert" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-100">HIPAA</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">
                  <img src="/compliance/LGPD-CCPA.png" alt="LGPD and CCPA" width={40} height={40} className="h-10 w-auto object-contain dark:invert" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-100">LGPD and CCPA</span>
                </div>
             </div>

             <div className="flex items-center gap-6">
                <span className="text-[11px] font-bold tracking-tight text-zinc-500 dark:text-zinc-400">
                  &copy; 2026 <span className="text-zinc-900 dark:text-white font-black">TRAC AI (PRIVATE) LIMITED</span>. All rights reserved.
                </span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
