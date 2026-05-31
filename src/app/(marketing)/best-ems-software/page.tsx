import React from "react";
import Link from "next/link";
import { 
  Check, 
  X, 
  Star, 
  ArrowRight, 
  Clock,
  Play,
  Tv
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PricingNavbar } from "@/components/ui/pricing-navbar";
import dynamic from "next/dynamic";

const ContactForm = dynamic(() => import("@/components/home/ContactForm").then((mod) => mod.ContactForm), {
  ssr: true
});

const Footer = dynamic(() => import("@/components/home/Footer").then((mod) => mod.Footer), {
  ssr: true
});

export const metadata = {
  title: "10 Best Employee Management Systems (EMS) for Remote Teams (2026)",
  description: "An expert review of the top 10 Employee Management Systems (EMS) evaluated on time logs, screenshot tracking, AI features, and value. Find the best system for your remote workforce.",
};

const ITEMS = [
  {
    rank: 1,
    name: "TRAC AI",
    logo: "/special-triangle-white-bg.svg",
    domain: "heytracai.com",
    bestFor: "Best Overall All-in-One Operations System",
    price: "$39.00 / user / month (with up to 30% off)",
    rating: 4.9,
    description: (
      <>
        TRAC AI is the first truly integrated Business Operating System. Unlike traditional EMS platforms that only track time and spy on employees, TRAC AI houses time tracking, idle detection, screenshots, direct chats, shift schedules, an Applicant Tracking System (ATS), CRM pipelines, and multi-currency bookkeeping under a single, flat flat rate. Most importantly, TRAC AI features a built-in employee-first <strong className="font-extrabold text-zinc-950">AI Super Copilot</strong> that proactively assists staff (drafting emails, summarizing meetings, organizing tasks), turning a micromanagement surveillance tool into an active driver of high-performance output.
      </>
    ),
    pros: [
      "Built-in employee-first AI Super Copilot to help staff work faster",
      "One-Minute friction-free sandbox demo (no sales calls, no setups)",
      "Consolidates 20+ separate SaaS tools into one unified dashboard",
      "Native high-fidelity screenshot time tracking and idle logs",
      "Saves up to $2,500/month in software subscription overlaps"
    ],
    cons: [
      "Our flat minimum plan starts at $39.00, which is higher than one-dimensional basic trackers if you only want absolute raw click count logs."
    ],
    ctaText: "Start Free Trial",
    ctaUrl: "/ems/signup",
    highlight: true,
  },
  {
    rank: 2,
    name: "Hubstaff",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubstaff.com&size=128",
    domain: "hubstaff.com",
    bestFor: "Best for Basic Screenshot & Clicks Log",
    price: "$25.00 / user / month",
    rating: 4.4,
    description: "Hubstaff is a highly focused time-tracking application. It excels at capturing random screen logs, monitoring contractor keyboard/mouse activity metrics, and managing simple client timesheets. However, at its top tier pricing, it is extremely expensive for just tracking hours. It lacks direct team messaging, CRM, hiring ATS, or helper AI assistants, forcing companies to purchase multiple external subscriptions.",
    pros: [
      "Very reliable random screenshot capture and activity metrics",
      "Simple GPS geo-fencing features for mobile crews",
      "Clean, user-friendly desktop client app"
    ],
    cons: [
      "Extremely limited feature set (requires separate bills for Slack, QuickBooks, and CRMs)",
      "Recommends strict click monitoring which can create negative workplace trust"
    ],
    ctaText: "Visit Hubstaff",
    ctaUrl: "https://hubstaff.com",
    highlight: false,
  },
  {
    rank: 3,
    name: "Teramind",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://teramind.co&size=128",
    domain: "teramind.co",
    bestFor: "Best for Enterprise Security & Insider Audits",
    price: "$50.00 / user / month",
    rating: 4.7,
    description: "Teramind is a highly robust user activity monitoring and data loss prevention (DLP) system designed for enterprise compliance audits. It provides high-fidelity session recordings, keylogging, and advanced risk scoring. While it is incredibly powerful for preventing security leaks in banks and large corporations, it is too complex and excessively expensive for standard startups and agencies.",
    pros: [
      "Deep user session video recordings and live screen viewing",
      "Automated risk scores and behavior anomaly alerts",
      "Advanced data loss prevention (DLP) and document leak tracking"
    ],
    cons: [
      "Extremely expensive ($50/user/month for full monitoring features)",
      "Heavy surveillance focus that can cause employee friction and anxiety"
    ],
    ctaText: "Visit Teramind",
    ctaUrl: "https://teramind.co",
    highlight: false,
  },
  {
    rank: 4,
    name: "Insightful",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://insightful.io&size=128",
    domain: "insightful.io",
    bestFor: "Best for Workplace Productivity Analytics",
    price: "$18.00 / user / month",
    rating: 4.6,
    description: "Insightful (formerly Workpuls) is a clean, modern employee monitoring and productivity analytics platform. It focuses on mapping active vs inactive software hours and website usage to help teams optimize workflows. It offers a friendly, less intrusive user experience, but it lacks collaborative tools like project boards, team chats, client CRM, and bookkeeping.",
    pros: [
      "Beautiful, modern dashboard and clean productivity reports",
      "Real-time active app and website categorization",
      "Flexible stealth or visible tracking modes"
    ],
    cons: [
      "No native messaging or team collaboration features",
      "Requires manual data exporting for invoicing and bookkeeping reconciliation"
    ],
    ctaText: "Visit Insightful",
    ctaUrl: "https://insightful.io",
    highlight: false,
  },
  {
    rank: 5,
    name: "Time Doctor",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://timedoctor.com&size=128",
    domain: "timedoctor.com",
    bestFor: "Best for Mid-Market Contractor Verification",
    price: "$20.00 / user / month",
    rating: 4.3,
    description: "Time Doctor is a time-monitoring application tailored for mid-market teams. It monitors website and app usage, tracks computer active hours, and takes screenshots. It is useful for verifying remote contractor invoices, but its interface feels quite dated compared to modern SaaS apps, and it lacks the collaborative PM, CRM, and accounting features required by startups.",
    pros: [
      "Reliable client integration links to share proof of work directly",
      "Detailed time audits across specific website domains",
      "Flexible break and lunch tracking triggers"
    ],
    cons: [
      "Interface design feels outdated and clunky",
      "Purely micromanagement-focused without cooperative workflow tools"
    ],
    ctaText: "Visit Time Doctor",
    ctaUrl: "https://timedoctor.com",
    highlight: false,
  },
  {
    rank: 6,
    name: "ActivTrak",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://activtrak.com&size=128",
    domain: "activtrak.com",
    bestFor: "Best for Quiet Productivity Audits",
    price: "$27.00 / user / month",
    rating: 4.2,
    description: "ActivTrak focuses on analyzing employee behavior and digital activity to optimize team efficiency. It is designed to work silently in the background, categorizing applications and identifying employee burnout risks. While it provides solid administrative reports, it lacks direct chat tools, project management columns, and invoicing systems.",
    pros: [
      "Strong employee burnout and disengagement predictors",
      "Silent background monitoring with no active desktop client required",
      "Detailed software license utilization charts"
    ],
    cons: [
      "Pricing is high ($27/user for the professional tier)",
      "Does not offer direct contractor payroll or timesheet bookkeeping features"
    ],
    ctaText: "Visit ActivTrak",
    ctaUrl: "https://activtrak.com",
    highlight: false,
  },
  {
    rank: 7,
    name: "ClickUp",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://clickup.com&size=128",
    domain: "clickup.com",
    bestFor: "Best for Project Management Customization",
    price: "$29.00 / user / month",
    rating: 4.5,
    description: "ClickUp is a highly customizable project management platform designed to track task workflows. It features list grids, Kanban boards, and documents. While it is great for mapping complex project pipelines, its time tracking is strictly manual and lacks native screenshot monitoring or idle activity tracking, forcing companies to purchase separate surveillance tools.",
    pros: [
      "Extremely customizable views, custom fields, and document collaboration",
      "Hundreds of integrations with external software tools",
      "Great for mapping complex, multi-stage project pipelines"
    ],
    cons: [
      "Can feel slow and bloated under heavy task volumes",
      "No native screenshot tracking or contractor idle monitoring"
    ],
    ctaText: "Visit ClickUp",
    ctaUrl: "https://clickup.com",
    highlight: false,
  },
  {
    rank: 8,
    name: "DeskTime",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://desktime.com&size=128",
    domain: "desktime.com",
    bestFor: "Best for Automatic Time Logging",
    price: "$20.00 / user / month",
    rating: 4.1,
    description: "DeskTime is a fully automatic time tracker that starts recording active software usage the second a computer boot-up is detected. It automatically tracks URLs and categorizes them into productive vs unproductive lists. While it is great for understanding personal time distribution, it is highly administrative and lacks hiring databases, chats, and CRMs.",
    pros: [
      "100% automatic tracking with no manual play/stop buttons required",
      "Private time tracking options for employee peace of mind",
      "Clean calendar shift logging"
    ],
    cons: [
      "Does not offer native project management task card boards",
      "High subscription fees for basic automatic logging features"
    ],
    ctaText: "Visit DeskTime",
    ctaUrl: "https://desktime.com",
    highlight: false,
  },
  {
    rank: 9,
    name: "Veriato",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://veriato.com&size=128",
    domain: "veriato.com",
    bestFor: "Best for Forensic Activity Logs",
    price: "$25.00 / user / month",
    rating: 4.0,
    description: "Veriato (formerly SpectorSoft) is a deep corporate security and user behavior monitoring suite. It provides forensic-level keystroke auditing, file download logs, and complete email archives. It is primarily used by IT administrators to investigate security breaches or active misconduct, but is completely unsuitable for day-to-day agile collaboration.",
    pros: [
      "Deep forensic activity trails and keylogging capabilities",
      "Screenshots, keystrokes, and complete email message logs",
      "Strict administrator-only visibility settings"
    ],
    cons: [
      "Extremely heavy clientside software that can slow down computers",
      "Highly invasive surveillance that damages employee trust"
    ],
    ctaText: "Visit Veriato",
    ctaUrl: "https://veriato.com",
    highlight: false,
  },
  {
    rank: 10,
    name: "WebWork Time Tracker",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://webworktracker.com&size=128",
    domain: "webworktracker.com",
    bestFor: "Best for Basic Hourly Billing Reports",
    price: "$15.00 / user / month",
    rating: 3.9,
    description: "WebWork is a lightweight and affordable time tracker built primarily for freelance contractors and small agencies. It tracks work activity, takes random screenshots, and outputs clean PDF timesheet reports for clients. While it is highly functional for basic hourly logs, it provides zero advanced ATS recruiting features, CRM pipelines, or helper AI copilots.",
    pros: [
      "Lightweight desktop client with zero computer slowdowns",
      "Clean, simple invoice generation from logged hours",
      "Easy client portal viewing permissions"
    ],
    cons: [
      "Extremely basic features with zero collaboration or messaging systems",
      "Does not offer multi-currency ledger bookkeeping or double-entry charts"
    ],
    ctaText: "Visit WebWork",
    ctaUrl: "https://webworktracker.com",
    highlight: false,
  }
];

const FAQS = [
  {
    q: "What is an Employee Management System (EMS)?",
    a: "An Employee Management System (EMS) is a business operating suite designed to track, schedule, and support a workforce. Traditional EMS platforms focus strictly on time logs and screenshot tracking (like Hubstaff). Modern solutions (like TRAC AI) consolidate time logs with project boards, hiring pipelines, client CRM, and billing systems into a single flat subscription."
  },
  {
    q: "Who is the most affordable EMS for remote teams?",
    a: "TRAC AI is the most affordable Employee Management System (EMS) for remote teams. While basic trackers start at $10 to $20/mo, they force you to purchase separate licenses for Slack, CRM, ATS, and QuickBooks. By integrating all 20+ operational modules for $39/mo (with up to 30% off), TRAC AI eliminates tool overlaps and cuts monthly SaaS overhead by 70%."
  },
  {
    q: "Is it safe to use screenshot-tracking EMS platforms?",
    a: "Yes. Screen tracking is standard for remote contractor management. Best-in-class systems like TRAC AI encryption protect data in transit (TLS) and at rest, and offer private on-premise cloud servers for enterprise security compliance."
  },
  {
    q: "How does TRAC AI's AI Super Copilot work?",
    a: "Traditional time trackers act as passive surveillance (spying). TRAC AI reverses this with the AI Super Copilot. It proactively assists employees throughout the workday by summarizing meetings, auto-drafting client emails, tracking task dependencies, and writing documentation. It is the only EMS that actively helps employees do more work rather than just counting their keyboard clicks."
  }
];

export default function BestEmsSoftwarePage() {
  
  // 1. Structured JSON-LD ItemList Schema (Ranked Listicles SEO Gold Standard)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "10 Best Employee Management Systems (EMS) for Remote Teams (2026)",
    "description": "An expert evaluation of the top employee tracking and operations management platforms.",
    "itemListElement": ITEMS.map((item) => ({
      "@type": "ListItem",
      "position": item.rank,
      "item": {
        "@type": "SoftwareApplication",
        "name": item.name,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": item.price.split(' ')[0].replace('$', '').replace('Rs', '').trim(),
          "priceCurrency": item.price.includes("Rs") ? "PKR" : "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": item.rating.toString(),
          "ratingCount": "100"
        }
      }
    }))
  };

  // 2. Structured JSON-LD FAQPage Schema
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
    <div className="min-h-screen bg-white font-sans text-zinc-950 selection:bg-primary/20">
      {/* Inject Search Engine Rich Schema scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PricingNavbar />

      {/* Hero Section */}
      <header className="pt-36 pb-20 border-b border-zinc-100 bg-zinc-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
            10 Best Employee Management Systems (EMS) for Remote Teams (2026)
          </h1>
          <div className="flex justify-center items-center gap-6 text-xs font-bold text-zinc-500 uppercase">
            <span className="flex items-center gap-1.5 text-zinc-600">
              <Clock size={14} className="text-zinc-600" /> 10 min read
            </span>
            <span>•</span>
            <span className="text-zinc-600">Last Updated: May 2026</span>
          </div>
          <p className="text-base sm:text-lg font-medium text-zinc-700 max-w-2xl mx-auto leading-relaxed">
            Managing a remote workforce without micromanaging is the ultimate operational challenge. We reviewed the top 10 EMS tools based on tracking reliability, dashboard workflow, AI productivity tools, and overall financial ROI.
          </p>
        </div>
      </header>

      {/* Comparison Summary Grid Table */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-zinc-900">At a Glance: Quick Comparison</h2>
        <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-4 text-xs font-black uppercase tracking-wider text-zinc-500">Rank & Name</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-zinc-500">Best For</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-zinc-500">Price (Top Tier)</th>
                <th className="p-4 text-xs font-black uppercase tracking-wider text-zinc-500 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {ITEMS.map((item) => (
                <tr key={item.rank} className={item.highlight ? "bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors" : "hover:bg-zinc-50 transition-colors"}>
                  <td className="p-4 flex items-center gap-3">
                    <span className="text-sm font-black text-zinc-400">#{item.rank}</span>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg border bg-white flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                        <img src={item.logo} alt={item.name} className="size-5 object-contain" />
                      </div>
                      <span className="font-bold text-sm text-zinc-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold text-zinc-700 uppercase tracking-tight">{item.bestFor}</td>
                  <td className="p-4 text-xs font-black text-zinc-900">
                    {item.rank === 1 ? (
                      <span className="text-emerald-600 font-extrabold">{item.price.split(' ')[0]} <span className="text-[10px] font-bold text-zinc-600">(Lower Minimum)</span></span>
                    ) : (
                      item.price.split(' ')[0]
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 font-black text-xs px-2.5 py-1 rounded-full border border-yellow-500/20">
                      <Star size={12} className="fill-yellow-600" />
                      {item.rating}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 1-Minute Zero-Friction Demo High-Impact Segment */}
      <section className="pb-20 max-w-4xl mx-auto px-6">
        <div className="border-4 border-black rounded-[2.5rem] bg-zinc-50 p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 size-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-lg text-left">
              <Badge className="bg-emerald-500 text-black border-2 border-black border-dashed font-black uppercase text-[9px] tracking-widest px-4 py-1.5 rounded-full">
                📺 INDUSTRY FIRST
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
                Take the 1-Minute Sandbox Demo
              </h2>
              <p className="text-xs md:text-sm font-bold text-zinc-700 uppercase leading-relaxed">
                Traditional employee monitoring tools force you to schedule sales calls, wait for custom enterprise quotes, and submit credit cards before you can even see the interface. TRAC AI runs instantly. Click below to experience a frictionless sandbox demonstration.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button className="h-12 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <Play size={12} className="fill-white" /> Start 60s Live Demo
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-700 uppercase">
                  <span>• No Credit Card</span>
                  <span>• No Sales Call</span>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 size-32 md:size-40 border-4 border-black rounded-2xl bg-white flex items-center justify-center p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 hover:rotate-0 transition-transform">
              <Tv size={64} className="text-zinc-800 stroke-[1.5]" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Ranked List Reviews */}
      <section className="py-12 max-w-4xl mx-auto px-6 space-y-24">
        {ITEMS.map((item) => (
          <article 
            key={item.rank} 
            className={item.highlight ? "relative border-4 border-emerald-500 rounded-[3rem] p-8 md:p-12 bg-white shadow-xl shadow-emerald-500/5" : "border border-zinc-200 rounded-[3rem] p-8 md:p-12 bg-white"}
          >
            {item.highlight && (
              <div className="absolute top-0 left-12 -translate-y-1/2 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full border-2 border-black border-dashed">
                🏆 Editor's #1 Top Choice
              </div>
            )}

            {/* Header Title Matchup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-zinc-300">#0{item.rank}</span>
                <div className="size-14 rounded-2xl border bg-white flex items-center justify-center p-2.5 shadow-sm">
                  <img src={item.logo} alt={item.name} className="size-9 object-contain" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-zinc-900 leading-none mb-1.5">{item.name}</h3>
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest leading-none">{item.domain}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 font-black text-sm px-4 py-1.5 rounded-full border border-yellow-500/20 w-fit">
                <Star size={14} className="fill-yellow-600" />
                {item.rating} / 5.0
              </div>
            </div>

            {/* Structured Specifications Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-zinc-50 border border-zinc-200/60 p-6 rounded-2xl mb-8">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Best For</span>
                <span className="text-sm font-black text-zinc-800 uppercase leading-snug">{item.bestFor}</span>
              </div>
              <div className="space-y-1 sm:border-x sm:border-zinc-200 sm:px-6">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Pricing Tier</span>
                <span className="text-sm font-black text-zinc-800 uppercase leading-snug">{item.price}</span>
              </div>
              <div className="space-y-1 sm:pl-6">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Licensing Model</span>
                <span className="text-sm font-black text-zinc-800 uppercase leading-snug">{item.rank === 1 ? "Flat Flat-Rate ERP" : "Single Time Tracker"}</span>
              </div>
            </div>

            {/* Description Narrative Block */}
            <p className="text-base text-zinc-800 font-medium leading-relaxed mb-8">
              {item.description}
            </p>

            {/* Pros and Cons Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Check size={16} strokeWidth={3} /> Pro Advantages
                </span>
                <ul className="space-y-3">
                  {item.pros.map((pro, index) => (
                    <li key={index} className="flex gap-2 text-xs font-bold text-zinc-800 uppercase leading-snug">
                      <span className="text-emerald-500 shrink-0">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-black text-destructive uppercase tracking-widest flex items-center gap-1.5">
                  <X size={16} strokeWidth={3} /> Cons & Limits
                </span>
                <ul className="space-y-3">
                  {item.cons.map((con, index) => (
                    <li key={index} className="flex gap-2 text-xs font-bold text-zinc-700 uppercase leading-snug">
                      <span className="text-destructive shrink-0">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Call to Action Button */}
            <Link href={item.ctaUrl}>
              <Button className={item.highlight ? "h-16 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black border-4 border-black font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all hover:translate-x-[2px] hover:translate-y-[2px]" : "h-16 px-10 rounded-2xl border-4 border-black bg-transparent hover:bg-zinc-50 text-black font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all hover:translate-x-[2px] hover:translate-y-[2px]"}>
                {item.ctaText} <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </article>
        ))}
      </section>

      {/* Common FAQ Accordion Section */}
      <section className="py-24 max-w-3xl mx-auto px-6 border-t border-zinc-100">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900">Buying Guide & FAQs</h2>
          <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Frequently asked questions regarding Employee Management Suites</p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-zinc-200 rounded-3xl px-6 bg-white shadow-sm">
              <AccordionTrigger className="text-base font-black uppercase tracking-tight text-zinc-800 hover:no-underline py-6 text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm font-bold text-zinc-700 uppercase leading-relaxed pb-6">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 bg-zinc-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-tight">Consolidate & Save 70% Now</h2>
          <p className="text-base sm:text-lg font-medium text-white/70 leading-relaxed max-w-xl mx-auto uppercase">
            Stop paying separate monthly bills for Slack, Greenhouse ATS, QuickBooks, and Hubstaff. Upgrade to TRAC AI and run your entire business flat flat-rate.
          </p>
          <div className="pt-6">
            <Link href="/ems/signup">
              <Button className="h-16 px-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black border-4 border-black font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Get Started Instantly
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ContactForm />
      <Footer />
    </div>
  );
}
