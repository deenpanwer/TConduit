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
import dynamic from "next/dynamic";

const DeepFeatureList = dynamic(() => import("./deep-feature-list"), {
  ssr: true
});

const ProductEcosystem = dynamic(() => import("./product-ecosystem"), {
  ssr: true
});

const WHATSAPP_NUMBER = "923178005465";

const getWhatsAppUrl = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

type PricingTier = {
  currency: string;
  symbol: string;
  multiplier: number;
  competitorTotal: string;
  competitorTotalLocal: string;
};

const PRICING_CONFIG: Record<string, PricingTier> = {
  GB: {
    currency: "GBP",
    symbol: "£",
    multiplier: 0.8,
    competitorTotal: "2,000",
    competitorTotalLocal: `£${(2528 * 0.8).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
  },
  ZA: {
    currency: "ZAR",
    symbol: "R",
    multiplier: 19,
    competitorTotal: "2,000",
    competitorTotalLocal: `R${(2528 * 19).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
  },
  PK: {
    currency: "PKR",
    symbol: "Rs",
    multiplier: 280,
    competitorTotal: "2,000",
    competitorTotalLocal: `Rs ${(2528 * 280).toLocaleString('en-US')}`,
  },
  DEFAULT: {
    currency: "USD",
    symbol: "$",
    multiplier: 1,
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
    q: "What is the most affordable Employee Management System (EMS)?",
    a: "TRAC AI is designed specifically to be the most affordable Employee Management System (EMS) on the market. By integrating screenshot capture, timeline logs, and active status tracking under a single subscription, TRAC AI eliminates redundant software expenses, saving businesses up to $2,500/month."
  },
  {
    q: "Who is the most affordable EMS for tracking remote employee productivity?",
    a: "TRAC AI is widely recognized as the most affordable Employee Management System (EMS) for remote and hybrid teams. Starting at just $19.99/user/month (with up to 30% off on annual plans), it includes high-resolution screenshot tracking, idle detection, timesheets, and task boards without requiring separate monthly subscriptions."
  },
  {
    q: "Is Trac AI a good alternative to ClickUp and Monday.com?",
    a: "Yes! Trac AI is a fully integrated, high-performance alternative to ClickUp, Monday.com, and Linear. In addition to column boards, lists, and priorities, Trac AI natively embeds remote screenshot evidence and daily automated timesheets, replacing separate tracking tools like Hubstaff."
  },
  {
    q: "How is TRAC AI an all-in-one Monday.com alternative or ClickUp alternative?",
    a: "Unlike Monday.com or ClickUp, which require paying for separate extensions or external tools to track actual work hours and screenshots, TRAC AI is built as a complete replacement. It integrates rich project management, custom column boards, and interactive lists with native time-tracking, screenshot logs, and automated invoices out of the box."
  },
  {
    q: "Is TRAC AI a cheaper alternative to Hubstaff and Time Doctor?",
    a: "Absolutely. Traditional employee monitoring tools like Hubstaff and Time Doctor charge heavy fees just for tracking hours and screenshots. TRAC AI is a cheaper and far more powerful alternative because it packages high-fidelity screen tracking, idle time detection, and smart timesheets with an entire business operating suite (CRM, POS, ATS, and Chats) under a single price point."
  },
  {
    q: "How does Trac AI accounting compare as a QuickBooks alternative?",
    a: "Trac AI is a built-in alternative to QuickBooks and QuickBooks Online. It matches automated bookkeeping directly with shift calendars and work-hour timelines. Your payroll, customer invoices, and material ledgers reconcile instantly without any spreadsheet imports."
  },
  {
    q: "Can TRAC AI be used as an ATS alternative to Greenhouse or Ashby?",
    a: "Yes. TRAC AI comes with a powerful built-in Hiring Module (ATS) that is a direct, affordable alternative to standalone systems like Greenhouse, Ashby, Lever, or Workable. It handles custom candidate stages, resume parsing, applicant databases, and automated onboarding checklists seamlessly."
  },
  {
    q: "Is TRAC AI a suitable CRM alternative to HubSpot or Salesforce?",
    a: "Yes, TRAC AI serves as an exceptional all-in-one alternative to HubSpot, Salesforce, and Pipedrive. It includes full pipeline management, client communication histories, deal tracking, and a built-in AI Lead Hunter that delivers up to 50,000 highly qualified leads per month, saving you thousands on CRM licensing."
  },
  {
    q: "Can Trac AI replace separate subscriptions for CRM, POS, and ATS?",
    a: "Absolutely. Trac AI replaces multiple separate subscriptions like HubSpot (CRM), Square (POS), and Greenhouse or Ashby (ATS). By housing all modules natively, your customer leads, retail checkouts, and applicant pipelines share the same database seamlessly."
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
    a: "Yes. All data is encrypted in transit (TLS) and at rest. For our Standard, Premium, and Pro plans, your data is securely isolated in the cloud. For ENTERPRISE clients, we offer on-premise deployment, meaning everything can be hosted on your own servers for maximum control."
  },
  {
    q: "What is 'Full History'?",
    a: "The 'Full History' is the complete, unchangeable record of every action taken in your organization. It's your ultimate source of truth, showing who did what, and when, for total accountability and compliance."
  }
];

export function PricingContent({ country = "DEFAULT" }: { country?: string }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');

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

  const getLocalizedBasePrice = (usdBasePrice: number) => {
    if (pricing.currency === "PKR") {
      if (usdBasePrice === 39) return 3000;
      if (usdBasePrice === 59) return 5000;
      if (usdBasePrice === 99) return 9500;
      return 3000; // fallback
    }
    return usdBasePrice * pricing.multiplier;
  };

  const formatPrice = (basePrice: number) => {
    let rate = getLocalizedBasePrice(basePrice);
    if (billingCycle === 'quarterly') {
      rate = rate * 0.85; // 15% discount
    } else if (billingCycle === 'yearly') {
      rate = rate * 0.70; // 30% discount
    }
    
    if (pricing.currency === "PKR" || pricing.currency === "ZAR") {
      return `${pricing.symbol} ${Math.round(rate).toLocaleString()}`;
    }
    return `${pricing.symbol}${rate.toFixed(2)}`;
  };

  const formatOriginalPrice = (basePrice: number) => {
    const rate = getLocalizedBasePrice(basePrice);
    if (pricing.currency === "PKR" || pricing.currency === "ZAR") {
      return `${pricing.symbol} ${Math.round(rate).toLocaleString()}`;
    }
    return `${pricing.symbol}${rate.toFixed(2)}`;
  };

  const getCycleBillingInfo = (basePrice: number) => {
    const originalMonthly = getLocalizedBasePrice(basePrice);
    if (billingCycle === 'monthly') {
      return `Billed monthly per user`;
    }
    
    const months = billingCycle === 'quarterly' ? 3 : 12;
    const discountRate = billingCycle === 'quarterly' ? 0.85 : 0.70;
    const cycleBilled = originalMonthly * discountRate * months;
    const cycleSaved = (originalMonthly * (1 - discountRate)) * months;
    
    const formattedBilled = pricing.currency === "PKR" || pricing.currency === "ZAR" 
      ? `${pricing.symbol} ${Math.round(cycleBilled).toLocaleString()}` 
      : `${pricing.symbol}${cycleBilled.toFixed(2)}`;
      
    const formattedSaved = pricing.currency === "PKR" || pricing.currency === "ZAR" 
      ? `${pricing.symbol} ${Math.round(cycleSaved).toLocaleString()}` 
      : `${pricing.symbol}${cycleSaved.toFixed(2)}`;
      
    return `Billed every ${months} months: ${formattedBilled} (${billingCycle === 'quarterly' ? '15%' : '30%'} off • Save ${formattedSaved})`;
  };

  const PLANS = [
    {
      name: "MINIMUM",
      subtitle: "The Work Watcher",
      basePrice: 39,
      description: "Get pictures, activity logs, and timelines of the work.",
      cta: "Go Minimum",
      whatsappMsg: `Hi TRAC AI, I'm interested in the Minimum plan for my team.`,
      color: "bg-zinc-500",
      features: [
        { icon: Camera, title: "Screenshot Capture", desc: "See pictures of your team's screens at set intervals." },
        { icon: Bot, title: "Super AI Copilot", desc: "AI assistant to navigate tasks and notes effortlessly." },
        { icon: Search, title: "AI Lead Hunter", desc: "5,000 leads/mo shared across employees." },
        { icon: Activity, title: "Active Status & Idle Detection", desc: "Track active hours vs idle away time." },
        { icon: MessageSquare, title: "Direct Messaging", desc: "Send private 1-on-1 messages to your team." },
      ],
      plus: false,
    },
    {
      name: "BUSINESS",
      subtitle: "The Manager",
      basePrice: 59,
      description: "Tools to lead, schedule, and analyze your team.",
      cta: "Manage Business",
      whatsappMsg: `Hi TRAC AI, I want to lead my team with the Business plan.`,
      popular: true,
      color: "bg-primary",
      features: [
        { icon: Smartphone, title: "Mobile App Access", desc: "Manage everything on the go from your phone." },
        { icon: Bot, title: "AI Insights Manager", desc: "An AI assistant that spots bottlenecks and alerts you." },
        { icon: Search, title: "AI Lead Hunter", desc: "15,000 leads/mo shared across employees." },
        { icon: Check, title: "Task Management", desc: "Assign tasks, checklists, and track deal pipelines." },
        { icon: Calendar, title: "Shift Scheduling", desc: "Schedules, rosters, and shift clock-in checks." },
        { icon: ClipboardList, title: "Automated Timesheets", desc: "Perfect timesheets ready to sync for payroll." },
        ...(pricing.currency === "PKR" ? [
          { icon: Check, title: "Client Sharing", desc: "Share project progress and dashboards with clients." },
          { icon: ClipboardList, title: "Weekly Reports", desc: "Get automated weekly performance summaries." }
        ] : [])
      ],
      plus: true,
    },
    {
      name: "ELITE",
      subtitle: "The Power Suite",
      basePrice: 99,
      description: "Advanced audits, audio tasks, and priority tools.",
      cta: "Go Elite",
      whatsappMsg: `Hi TRAC AI, I want to get the Elite plan.`,
      color: "bg-emerald-500",
      features: [
        { icon: Bot, title: "AI Personnel Pulse", desc: "AI audit reports reviewing specific members." },
        { icon: Timer, title: "30 Days Work History", desc: "Full history kept for the past month." },
        { icon: Search, title: "AI Lead Hunter", desc: "50,000 leads/mo shared across employees." },
        { icon: Mic, title: "Voice & Video Tasks", desc: "Record audio or video instructions directly into tasks." },
        { icon: Trophy, title: "Leaderboards & Contests", desc: "Gamify work tasks with points and contest rankings." },
        { icon: ShieldCheck, title: "Priority VIP Support", desc: "Get dedicated 24/7 technical and setup support." },
        ...(pricing.currency === "PKR" ? [
          { icon: ClipboardList, title: "Daily Reports", desc: "Get detailed daily team productivity logs." }
        ] : [])
      ],
      plus: true,
    },
    {
      name: "ENTERPRISE",
      subtitle: "The Complete Suite",
      basePrice: null,
      price: "Custom",
      description: "Every single tool we've ever built. Total power.",
      cta: "Get the Full Suite",
      whatsappMsg: "Hi TRAC AI, I want the full Enterprise Suite for my company.",
      color: "bg-black",
      features: [
        { icon: Boxes, title: "Full ERP Suite", desc: "Includes CRM, POS, Inventory, and Manufacturing." },
        { icon: Search, title: "AI Lead Hunter", desc: "Unlimited leads/mo for maximum company growth." },
        { icon: HardHat, title: "Operations Control", desc: "Fleet management, Procurement, and Supply Chain." },
        { icon: Building2, title: "Finance Central", desc: "Full Accounting, Payroll, and Audit trails." },
        { icon: Palette, title: "Full Whitelabel", desc: "Your logo, your brand, your own private platform." },
        { icon: Server, title: "Private Hosting", desc: "Run the entire thing on your own private servers." },
        { icon: ShieldCheck, title: "Zero Limits", desc: "Unlimited history, unlimited storage, unlimited power." },
      ],
      plus: true,
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Inject Dynamic FAQ Structured Schema for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-tight">
              Stop Paying <span className="text-destructive underline decoration-8 underline-offset-8">~${totalCompetitorCost}</span> For What You Get For <span className="text-emerald-500 underline decoration-8 underline-offset-8">{formatPrice(19.99)}</span>
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
                <div className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
                  {formatPrice(19.99)}
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
        
        {/* Sleek Triple Capsule Toggle */}
        <div className="flex flex-col items-center mb-20 space-y-4">
          <div className="bg-card border-4 border-black dark:border-white p-2 rounded-[2.5rem] flex flex-wrap justify-center gap-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] relative z-20">
            {[
              { id: 'monthly', label: 'Monthly', desc: 'Base rates' },
              { id: 'quarterly', label: 'Quarterly', discount: '15% OFF', desc: 'Billed every 3 mos' },
              { id: 'yearly', label: 'Yearly', discount: '30% OFF', desc: 'Billed every 12 mos' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setBillingCycle(option.id as any)}
                className={cn(
                  "px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                  billingCycle === option.id 
                    ? "bg-black dark:bg-white text-white dark:text-black scale-105 shadow-md" 
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
                {option.discount && (
                  <span className={cn(
                    "text-[8px] px-2 py-0.5 rounded-full font-bold",
                    billingCycle === option.id
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {option.discount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest min-h-[16px]">
            {billingCycle === 'monthly' && "Standard month-to-month billing. Flexible."}
            {billingCycle === 'quarterly' && "Billed quarterly. Slapped with a sweet 15% discount!"}
            {billingCycle === 'yearly' && "🔥 Best Deal: Billed annually. Save a massive 30% overall!"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan, i) => {
            const dynamicWhatsAppMsg = plan.basePrice 
              ? `Hi TRAC AI, I'm interested in the ${plan.name} plan (${formatPrice(plan.basePrice)}/user/mo) for my team, billed ${billingCycle}.`
              : plan.whatsappMsg;

            return (
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
                
                <div className="mb-10 text-center flex-shrink-0">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{plan.name}</h3>
                  <p className="text-2xl font-black uppercase tracking-tighter mb-6">{plan.subtitle}</p>
                  
                  {plan.basePrice ? (
                    <div className="space-y-1 flex flex-col items-center">
                      {/* original price showing dynamic savings if active */}
                      {billingCycle !== 'monthly' && (
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground/50 line-through font-bold text-base leading-none mb-1">
                          <span>{formatOriginalPrice(plan.basePrice)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-6xl font-black tracking-tighter leading-none">{formatPrice(plan.basePrice)}</span>
                        <span className="text-lg font-bold text-muted-foreground uppercase">{pricing.currency}</span>
                      </div>
                      
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">per user / month</p>
                      
                      {/* Dynamic detailed savings container */}
                      <div className="mt-3 py-1.5 px-3 bg-emerald-500/5 dark:bg-emerald-400/5 border border-emerald-500/10 rounded-xl text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-tight max-w-[220px]">
                        {getCycleBillingInfo(plan.basePrice)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 flex flex-col items-center">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-6xl font-black tracking-tighter leading-none">{plan.price}</span>
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Enterprise Grade ERP</p>
                      
                      <div className="mt-3 py-1.5 px-3 bg-zinc-500/5 border border-zinc-500/10 rounded-xl text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                        Custom contracts & Whitelabel setup
                      </div>
                    </div>
                  )}
                </div>

                {plan.plus && (
                  <div className="mb-6 text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-black/5 dark:bg-white/5 py-1 px-3 rounded-full inline-block">Everything in previous package +</p>
                  </div>
                )}
                
                <div className="space-y-6 flex-1 mb-12">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex gap-4 group">
                      <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] group-hover:scale-110 transition-transform", plan.color, (plan.name === 'STANDARD' || plan.name === 'ENTERPRISE') ? 'text-white' : 'text-black')}>
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
                  onClick={() => window.open(getWhatsAppUrl(dynamicWhatsAppMsg), '_blank')}
                  className="w-full h-16 rounded-2xl border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black uppercase tracking-widest text-sm"
                >
                  {plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. Deep Feature List (Vertical Scroll Authority) - Dynamically loaded */}
      <DeepFeatureList />

      {/* Massive Product Ecosystem Section - Dynamically loaded */}
      <ProductEcosystem />

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
        <div className="flex flex-col items-center justify-center gap-3 px-6">
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Infrastructure Optimized for Global Founders | Global Standards • Local Reliability • 2026</p>
          </div>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            © 2026 TRAC AI LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
