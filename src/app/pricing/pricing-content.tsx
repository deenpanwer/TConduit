"use client";

import React, { useState } from "react";
import { 
  Check, 
  Zap, 
  ShieldCheck, 
  Users, 
  MousePointer2, 
  Camera, 
  Smartphone, 
  MessageSquare, 
  Trophy, 
  Mic, 
  FileText, 
  Calendar, 
  Lock, 
  History, 
  ArrowRight,
  ChevronDown,
  Timer,
  Activity,
  Layout,
  Plus,
  ShieldAlert,
  HelpCircle,
  Mail,
  ArrowDown,
  Palette,
  Server,
  Bot,
  Coffee,
  ClipboardList,
  Voicemail,
  UserPlus,
  Target,
  ShoppingCart,
  Search,
  Package,
  Factory,
  LayoutDashboard,
  MailOpen,
  Calculator,
  Briefcase,
  TrendingUp,
  Boxes,
  Globe,
  Truck,
  Building2,
  HardHat,
  Receipt,
  CalendarClock,
  UserSearch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PricingNavbar } from "@/components/ui/pricing-navbar";

const WHATSAPP_NUMBER = "923178005465";

const getWhatsAppUrl = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

type PricingTier = {
  currency: string;
  symbol: string;
  proPrice: string;
  teamsPrice: string;
  competitorTotal: string;
  competitorTotalLocal: string;
};

const PRICING_CONFIG: Record<string, PricingTier> = {
  GB: {
    currency: "GBP",
    symbol: "£",
    proPrice: "7.99",
    teamsPrice: "15.99",
    competitorTotal: "2,000",
    competitorTotalLocal: "£2,000",
  },
  ZA: {
    currency: "ZAR",
    symbol: "R",
    proPrice: "150",
    teamsPrice: "300",
    competitorTotal: "2,000",
    competitorTotalLocal: "R4,000",
  },
  PK: {
    currency: "PKR",
    symbol: "Rs",
    proPrice: "1,500",
    teamsPrice: "3,000",
    competitorTotal: "2,000",
    competitorTotalLocal: `Rs ${(2528 * 280).toLocaleString('en-US')}`,
  },
  DEFAULT: {
    currency: "USD",
    symbol: "$",
    proPrice: "19.99",
    teamsPrice: "39.99",
    competitorTotal: "2,000",
    competitorTotalLocal: "$2,000",
  }
};

const EXTENDED_COMPARISON = [
  { tool: "Work Tracking", competitor: "Hubstaff", priceUSD: "$30", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubstaff.com&size=128" },
  { tool: "Team Chat", competitor: "Slack", priceUSD: "$20", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://slack.com&size=128" },
  { tool: "Task Lists", competitor: "Monday.com", priceUSD: "$15", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://monday.com&size=128" },
  { tool: "AI Meeting Notes", competitor: "Otter.ai", priceUSD: "$25", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://otter.ai&size=128" },
  { tool: "CRM", competitor: "HubSpot", priceUSD: "$450", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubspot.com&size=128" },
  { tool: "Sales Automation", competitor: "Salesforce", priceUSD: "$150", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://salesforce.com&size=128" },
  { tool: "Inventory", competitor: "NetSuite", priceUSD: "$999", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://netsuite.com&size=128" },
  { tool: "Lead Hunter", competitor: "Apollo.io", priceUSD: "$49", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://apollo.io&size=128" },
  { tool: "Hiring (ATS)", competitor: "Greenhouse", priceUSD: "$500", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://greenhouse.io&size=128" },
  { tool: "Point of Sale", competitor: "Square", priceUSD: "$60", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://squareup.com&size=128" },
  { tool: "Manufacturing", competitor: "SAP", priceUSD: "$200", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sap.com&size=128" },
  { tool: "Accounting", competitor: "QuickBooks", priceUSD: "$30", logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://quickbooks.intuit.com&size=128" },
];

const ALL_PRODUCTS_LIST = [
  { id: "accounting", title: "Accounting", icon: Calculator, replaces: "QuickBooks", price: "$30/mo", category: "Finance" },
  { id: "hiring", title: "Hiring", icon: UserSearch, replaces: "Greenhouse", price: "$500/mo", category: "HR" },
  { id: "shifts", title: "Shifts", icon: CalendarClock, replaces: "7shifts", price: "$31/mo", category: "Operations" },
  { id: "timetracking", title: "Time Tracking", icon: Timer, replaces: "Hubstaff", price: "$30/mo", category: "Operations" },
  { id: "tasks", title: "Tasks", icon: ClipboardList, replaces: "Monday.com", price: "$15/mo", category: "Productivity" },
  { id: "leaderboards", title: "Leaderboards", icon: Trophy, replaces: "Spinify", price: "$200/mo", category: "Productivity" },
  { id: "crm", title: "CRM", icon: Target, replaces: "HubSpot", price: "$450/mo", category: "Sales" },
  { id: "forms", title: "Forms", icon: FileText, replaces: "Typeform", price: "$25/mo", category: "Productivity" },
  { id: "pos", title: "POS", icon: ShoppingCart, replaces: "Square", price: "$60/mo", category: "Sales" },
  { id: "chats", title: "Chats", icon: MessageSquare, replaces: "Slack", price: "$20/mo", category: "Productivity" },
  { id: "lead-hunter", title: "Lead Hunter", icon: Search, replaces: "Apollo.io", price: "$49/mo", category: "Sales" },
  { id: "leads-enrich", title: "Leads Enrich", icon: Zap, replaces: "Clearbit", price: "$99/mo", category: "Sales" },
  { id: "email", title: "Email", icon: MailOpen, replaces: "Mailchimp", price: "$20/mo", category: "Sales" },
  { id: "procurement", title: "Procurement", icon: ShoppingCart, replaces: "Coupa", price: "$500/mo", category: "Operations" },
  { id: "inventory", title: "Inventory", icon: Package, replaces: "NetSuite", price: "$999/mo", category: "Operations" },
  { id: "sales", title: "Sales", icon: Briefcase, replaces: "Salesforce", price: "$150/mo", category: "Sales" },
  { id: "manufacturing", title: "Manufacturing", icon: Factory, replaces: "SAP", price: "$200/mo", category: "Operations" },
  { id: "ats", title: "ATS", icon: Users, replaces: "Ashby", price: "$300/mo", category: "HR" },
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, replaces: "Tableau", price: "$70/mo", category: "Operations" },
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. The CORE plan is free forever because it offers basic tools to see work is being done. It does not include advanced features like Work Photos or the AI Meeting Helper. We offer these essential tools at no cost to help every company get started."
  },
  {
    q: "What products are included in Enterprise?",
    a: "Everything. In the Enterprise plan, you get access to our full stack including CRM, POS, Inventory, Manufacturing, Accounting, and more. It is a complete replacement for your entire business software stack."
  },
  {
    q: "How do I pay?",
    a: "We make it easy for global businesses. You can pay your bill monthly using a simple local bank transfer or any debit/credit card. We accept local currencies to ensure smooth transactions."
  },
  {
    q: "Can I migrate my data from HubSpot or QuickBooks?",
    a: "Yes. Our team provides white-glove migration services to move your data from your old legacy systems into the Trac AI ecosystem without losing a single record."
  },
  {
    q: "Can I use my phone?",
    a: "Absolutely. TRAC AI comes with a powerful mobile app for both iPhone and Android, so you can manage your team, see work reports, and chat with your staff from anywhere in the world."
  },
  {
    q: "Is my company's data safe?",
    a: "Yes. All data is encrypted in transit (TLS) and at rest. For our CORE, PRO, and TEAMS plans, your data is securely isolated in the cloud. For ENTERPRISE clients, we offer on-premise deployment, meaning everything can be hosted on your own servers for maximum control."
  },
  {
    q: "What is 'Full History'?",
    a: "The 'Full History' is the complete, unchangeable record of every action taken in your organization. It's your ultimate source of truth, showing who did what, and when, for total accountability and compliance."
  },
  {
    q: "Can I add custom modules?",
    a: "For Enterprise customers, our engineering team can build custom modules specific to your industry, whether you're in manufacturing, retail, or service-based business."
  }
];

export function PricingContent({ country = "DEFAULT" }: { country?: string }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalCompetitorCost = EXTENDED_COMPARISON.reduce((acc, curr) => acc + parseInt(curr.priceUSD.replace('$', '')), 0);
  
  const pricing = PRICING_CONFIG[country.toUpperCase()] || PRICING_CONFIG.DEFAULT;

  const PLANS = [
    {
      name: "CORE",
      subtitle: "Just the Basics",
      price: "0",
      description: "Know if they are online. That's it.",
      cta: "Start Barebones",
      whatsappMsg: "Hi TRAC AI, I'd like to start with the free CORE plan.",
      color: "bg-zinc-500",
      features: [
        { icon: Activity, title: "Active Status", desc: "See if the user is currently 'Active' or 'Idle'." },
        { icon: History, title: "1-Hour History", desc: "Data is only kept for the last 60 minutes." },
      ],
      plus: false,
    },
    {
      name: "PRO",
      subtitle: "The Work Watcher",
      price: pricing.proPrice,
      description: "Get pictures and reports of the work.",
      cta: "Go Pro",
      whatsappMsg: `Hi TRAC AI, I'm interested in the PRO plan (${pricing.symbol}${pricing.proPrice}) for my team.`,
      popular: true,
      color: "bg-primary",
      features: [
        { icon: Camera, title: "Screenshot Capture", desc: "See pictures of your team's screens at set intervals." },
        { icon: Timer, title: "Full Work History", desc: "Data kept for the full month." },
        { icon: MessageSquare, title: "Direct Messaging", desc: "Send private 1-on-1 messages to your team." },
        { icon: Users, title: "Group & Team Chat", desc: "Create chat rooms for the whole company." },
        { icon: Calendar, title: "AI Weekly Reports", desc: "AI sends a summary of the week's work." },
      ],
      plus: true,
    },
    {
      name: "TEAMS",
      subtitle: "The Manager",
      price: pricing.teamsPrice,
      description: "Tools to lead and schedule your team.",
      cta: "Manage Your Team",
      whatsappMsg: `Hi TRAC AI, I want to lead my team with the TEAMS plan (${pricing.symbol}${pricing.teamsPrice}).`,
      color: "bg-emerald-500",
      features: [
        { icon: Smartphone, title: "Mobile App Access", desc: "Manage everything from your phone." },
        { icon: Bot, title: "AI Insights Manager", desc: "An AI that spots productivity problems for you." },
        { icon: Check, title: "Task Management", desc: "Assign tasks and track their completion." },
        { icon: Calendar, title: "Shift Scheduling", desc: "Manage who works when with a simple calendar." },
        { icon: ClipboardList, title: "Automated Timesheets", desc: "Perfect timesheets ready for payroll." },
      ],
      plus: true,
    },
    {
      name: "ENTERPRISE",
      subtitle: "The Complete Suite",
      price: "Custom",
      description: "Every single tool we've ever built. Total power.",
      cta: "Get the Full Suite",
      whatsappMsg: "Hi TRAC AI, I want the full Enterprise Suite for my company.",
      color: "bg-black",
      features: [
        { icon: Boxes, title: "Full ERP Suite", desc: "Includes CRM, POS, Inventory, and Manufacturing." },
        { icon: HardHat, title: "Operations Control", desc: "Fleet management, Procurement, and Supply Chain." },
        { icon: Building2, title: "Finance Central", desc: "Full Accounting, Payroll, and Audit trails." },
        { icon: Palette, title: "Full Whitelabel", desc: "Your logo, your brand, your own private platform." },
        { icon: Server, title: "Private Hosting", desc: "Run the entire thing on your own private servers." },
        { icon: ShieldCheck, title: "Zero Limits", desc: "Unlimited history, unlimited storage, unlimited power." },
      ],
      plus: true,
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <PricingNavbar />
      
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 left-8 z-50 size-14 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl border-2 border-primary/20 hover:scale-110 active:scale-90 transition-all"
          >
            <ChevronDown className="rotate-180" size={24} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 1. Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden border-b-4 border-black dark:border-white bg-card">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <Badge variant="outline" className="px-6 py-2 rounded-full border-2 border-primary text-primary font-black uppercase tracking-widest text-[10px]">
              The Mathematical Disparity
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-tight">
              Stop Paying <span className="text-destructive underline decoration-8 underline-offset-8">~${totalCompetitorCost}</span> For What You Get For <span className="text-emerald-500 underline decoration-8 underline-offset-8">{pricing.symbol} {pricing.proPrice}</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-muted-foreground uppercase tracking-tight max-w-2xl mx-auto">
              The world sells you 20 different tools. We give you one simple button.
            </p>

            <div className="pt-12 flex flex-col items-center gap-4">
              <Button 
                onClick={() => document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' })}
                variant="ghost" 
                className="group flex flex-col items-center gap-2 hover:bg-transparent"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">See Plans</span>
                <div className="size-12 rounded-full border-2 border-black dark:border-white flex items-center justify-center group-hover:border-primary transition-colors">
                  <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
                </div>
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </header>

      {/* 2. The Anchor Section (Comparison) */}
      <section className="py-24 bg-black text-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">
                Why get 20 different tools when you get them all in <span className="text-emerald-500">one</span>?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EXTENDED_COMPARISON.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 border-2 border-white/10 rounded-2xl group hover:border-white/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        <img 
                          src={item.logo} 
                          alt={item.competitor} 
                          className="size-5 object-contain grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{item.tool}</span>
                        <span className="text-sm font-bold uppercase text-white/80 group-hover:text-white transition-colors">{item.competitor}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-destructive block leading-none">{item.priceUSD}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t-4 border-white/20 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black uppercase italic">The Old Bill</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total monthly cost</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-3xl font-black text-destructive leading-none">~${totalCompetitorCost.toLocaleString()}</span>
                  {pricing.currency !== "USD" && (
                    <span className="text-3xl font-black text-destructive leading-tight uppercase">~{pricing.competitorTotalLocal}</span>
                  )}
                  <span className="text-[10px] font-bold text-white/40 uppercase mt-1">Per User</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-emerald-500 p-12 rounded-[3rem] text-black shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] relative z-10"
              >
                <Badge className="bg-black text-white font-black uppercase mb-6">The Smart Choice</Badge>
                <h3 className="text-7xl font-black uppercase tracking-tighter leading-none mb-8">TRAC AI</h3>
                <p className="text-2xl font-bold uppercase tracking-tight mb-12">
                  Everything listed on the left is included in one simple package.
                </p>
                <div className="text-8xl font-black tracking-tighter mb-4 leading-none">
                  {pricing.proPrice}
                  <span className="text-2xl font-bold tracking-normal uppercase ml-2 text-black/60">{pricing.currency}</span>
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-black/60">Per User / Per Month</p>
              </motion.div>
              <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 hidden lg:block">
                <motion.div animate={{ x: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <ArrowRight size={80} className="text-emerald-500" strokeWidth={3} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pricing Cards */}
      <section id="pricing-cards" className="py-32 container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className={cn(
                "relative bg-card border-4 border-black dark:border-white p-6 rounded-[3rem] flex flex-col h-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]",
                plan.popular && "ring-4 ring-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full border-4 border-black dark:border-white z-20 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="mb-10 text-center">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{plan.name}</h3>
                <p className="text-2xl font-black uppercase tracking-tighter mb-6">{plan.subtitle}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-xl font-bold text-muted-foreground uppercase">{plan.price === "Custom" ? "" : (plan.price === "0" ? pricing.currency : pricing.currency)}</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">per user / month</p>
              </div>
              {plan.plus && (
                <div className="mb-6 text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Everything in previous package +</p>
                </div>
              )}
              <div className="space-y-6 flex-1 mb-12">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex gap-4 group">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] group-hover:scale-110 transition-transform", plan.color, (plan.name === 'BASIC' || plan.name === 'ENTERPRISE') ? 'text-white' : 'text-black')}>
                      <feature.icon size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase leading-none mb-1">{feature.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => window.open(getWhatsAppUrl(plan.whatsappMsg), '_blank')}
                className="w-full h-16 rounded-2xl border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black uppercase tracking-widest text-sm"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Deep Feature List (Vertical Scroll Authority) */}
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

      {/* Massive Product Ecosystem Section */}
      <section className="py-32 bg-card border-b-4 border-black dark:border-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24 space-y-6">
            <Badge className="bg-primary text-white font-black uppercase px-6 py-2">The Complete Ecosystem</Badge>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">The Only Suite You'll Ever Need</h2>
            <p className="text-xl font-bold text-muted-foreground uppercase max-w-3xl mx-auto">We've built 19+ integrated products to replace your entire software stack. Each one is included in your base subscription.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ALL_PRODUCTS_LIST.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 bg-background border-4 border-black dark:border-white rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-4px] transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border-2 border-primary/20">
                    <product.icon size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{product.title}</h3>
                    <Badge variant="outline" className="mt-1 text-[8px] font-black uppercase tracking-widest">{product.category}</Badge>
                  </div>
                </div>
                
                <div className="pt-6 border-t-2 border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Replaces</span>
                    <span className="text-sm font-marker text-destructive line-through decoration-2">{product.replaces}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Their Price</span>
                    <span className="text-sm font-marker text-destructive">{product.price}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Our Price</span>
                    <span className="text-sm font-black uppercase text-emerald-500">Included</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Enterprise Section (The History Book) */}
      <section className="py-32 bg-black text-white overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <Badge className="bg-white text-black font-black uppercase">Enterprise Only</Badge>
                <h3 className="text-7xl font-black uppercase tracking-tighter leading-none">The History Book</h3>
                <p className="text-2xl font-bold uppercase tracking-tight text-white/60">Total provenance. A perfect record of "who did what and when."</p>
                <ul className="space-y-6 text-left inline-block">
                  {["Audit Trail of every click made.", "Isolated data rooms for max safety.", "One-click onboarding & offboarding.", "Legal compliance assistance."].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-lg font-bold uppercase tracking-tight">
                      <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-black" strokeWidth={4} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-10">
                  <Button 
                    onClick={() => window.open(getWhatsAppUrl("Hi TRAC AI, I want to discuss the Enterprise plan for my company."), '_blank')}
                    className="h-20 px-12 rounded-2xl bg-white text-black hover:bg-emerald-500 hover:text-white transition-all font-black uppercase text-lg"
                  >
                    Speak With Our Founders
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="size-[500px] rounded-full border-8 border-white/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                <div className="size-[400px] rounded-full border-8 border-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-75" />
                <div className="size-[300px] rounded-[4rem] bg-white/5 border-4 border-white/20 backdrop-blur-2xl flex items-center justify-center mx-auto relative z-10 shadow-2xl">
                  <ShieldCheck size={120} className="text-white opacity-40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-32 container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-20 space-y-4">
          <HelpCircle className="size-16 mx-auto text-primary" />
          <h2 className="text-5xl font-black uppercase tracking-tighter">Common Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-4 border-black dark:border-white rounded-3xl px-8 bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <AccordionTrigger className="text-lg font-black uppercase tracking-tight hover:no-underline py-8">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-base font-bold text-muted-foreground uppercase leading-relaxed pb-8">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 7. Final CTA */}
      <section className="py-32 bg-primary text-white text-center border-t-4 border-black dark:border-white">
        <div className="container mx-auto px-6 space-y-12">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">Boost Output by 40%</h2>
          <p className="text-2xl font-bold uppercase tracking-tight max-w-2xl mx-auto opacity-80">Most teams see a 40% jump in work done within the first 30 days. Don't let your company fall behind. Let's talk about your growth.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Button 
              onClick={() => window.open(getWhatsAppUrl("Hi TRAC AI, I want to see how we can increase our productivity by 40%."), '_blank')}
              className="h-20 px-16 rounded-[2.5rem] bg-black text-white hover:bg-emerald-500 transition-all font-black uppercase text-xl shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none"
            >
              Talk to Our Team
            </Button>
            <Button 
              onClick={() => window.open(getWhatsAppUrl("Hi TRAC AI, I'd like to hear more about the 40% productivity boost."), '_blank')}
              variant="outline" 
              className="h-20 px-16 rounded-[2.5rem] border-4 border-white bg-transparent hover:bg-white hover:text-black transition-all font-black uppercase text-xl"
            >
              Chat on WhatsApp
            </Button>
          </div>
        </div>
      </section>

      <motion.a
        href={getWhatsAppUrl("Hi TRAC AI, I'm on the pricing page and need some help.")}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 flex items-center justify-center rounded-none"
        aria-label="Chat on WhatsApp"
      >
        <img src="/whatsapp-real.svg" alt="WhatsApp" className="w-8 h-8" />
      </motion.a>

      <footer className="py-8 border-t-4 border-black dark:border-white text-center">
        <div className="flex items-center justify-center gap-3 px-6">
          <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Infrastructure Optimized for Global Founders | Global Standards • Local Reliability • 2026</p>
        </div>
      </footer>
    </div>
  );
}
