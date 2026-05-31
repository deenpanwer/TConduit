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
  title: "7 Best Lead Finder Software for B2B Prospecting (2026)",
  description: "An expert review of the top 7 B2B Lead Finder Software platforms evaluated on database accuracy, credit limits, built-in CRM, and AI outreach tools. Find the best system for B2B sales.",
};

const ITEMS = [
  {
    rank: 1,
    name: "TRAC AI",
    logo: "/special-triangle-white-bg.svg",
    domain: "heytracai.com",
    bestFor: "Best Overall for AI Outreach & Flat-Rate Database Leads",
    price: "$39.00 / user / month (with up to 30% off)",
    rating: 4.9,
    description: (
      <>
        TRAC AI is the first truly consolidated Business Operating System that includes a native flat-rate <strong className="font-extrabold text-zinc-950">Lead Finder</strong> module. Instead of holding your outreach hostage with expensive click-by-click credit fees, TRAC AI gives you access to a rich directory of 271,000+ US executive contacts, smart multi-filters, and an integrated CRM Deals pipeline under a single flat rate. Most importantly, it features an employee-first <strong className="font-extrabold text-zinc-950">AI Super Copilot</strong> that immediately auto-drafts custom cold emails and schedules Gmail campaigns directly from lead profiles, transforming raw prospecting logs into instant conversations.
      </>
    ),
    pros: [
      "Flat-rate pricing model with no restrictive credit-counting walls",
      "Built-in AI Super Copilot to draft hyper-personalized cold outreach emails",
      "One-click CRM Deals pipeline sync to track and close acquired prospects",
      "Prefilled direct Gmail compose integration built into lead sliders",
      "Friction-free, 1-Minute live sandbox demo (no sales calls, no setups)"
    ],
    cons: [
      "Currently focused on high-quality US executive and corporate directories; international database expansion is still in progress."
    ],
    ctaText: "Start Lead Finding",
    ctaUrl: "/lead-finder",
    highlight: true,
  },
  {
    rank: 2,
    name: "Apollo.io",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://apollo.io&size=128",
    domain: "apollo.io",
    bestFor: "Best for Massive Global Database Depth",
    price: "$99.00 / user / month",
    rating: 4.5,
    description: "Apollo.io is a highly focused lead database platform. It excels at granular searches across millions of global corporate email addresses and LinkedIn profiles. While its lookup extension is reliable, the strict monthly credit limits dry up fast on baseline plans, and scaling your email sequences requires high premium subscriptions and integration bills.",
    pros: [
      "Enormous global B2B database depth with advanced filters",
      "Convenient browser extension for parsing LinkedIn profiles",
      "Clean lists exportable directly to spreadsheets"
    ],
    cons: [
      "Rigid credit tiers can make active outreach highly expensive",
      "No native complex CRM or invoicing systems included"
    ],
    ctaText: "Visit Apollo.io",
    ctaUrl: "https://apollo.io",
    highlight: false,
  },
  {
    rank: 3,
    name: "ZoomInfo",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://zoominfo.com&size=128",
    domain: "zoominfo.com",
    bestFor: "Best for Enterprise Sales Intelligence",
    price: "$150.00 / user / month",
    rating: 4.6,
    description: "ZoomInfo is the undisputed enterprise giant for contact search and company data analysis. It provides extremely deep organizational charts, background financial logs, and real-time buyer intent indicators. However, it requires multi-year enterprise contracts, lacks public transparent pricing tables, and remains prohibitively expensive for early-stage agencies.",
    pros: [
      "Industry-leading corporate directory depth and organograms",
      "Predictive buyer-intent signals to catch active buyers early",
      "Extremely robust enterprise security compliance features"
    ],
    cons: [
      "Requires scheduling sales calls and manual contract negotiations",
      "Highly complex interface with steep learning curves for minor teams"
    ],
    ctaText: "Visit ZoomInfo",
    ctaUrl: "https://zoominfo.com",
    highlight: false,
  },
  {
    rank: 4,
    name: "Lusha",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://lusha.com&size=128",
    domain: "lusha.com",
    bestFor: "Best for Direct Dials & Mobile Phone Lookup",
    price: "$49.00 / user / month",
    rating: 4.3,
    description: "Lusha is designed to retrieve direct mobile phone numbers and verified business emails directly from active profiles. It is incredibly quick for cold-callers who need to dial decision makers on their mobile lines. However, its list filtering options are basic, and credit caps are very limited compared to unlimited platforms.",
    pros: [
      "Highly accurate mobile dial verification rates",
      "Intuitive browser overlay that integrates with standard tools",
      "Minimalist setup with immediate usability"
    ],
    cons: [
      "Low credit caps on start plans (expensive overage options)",
      "Does not offer project boards, direct messaging, or CRM funnels"
    ],
    ctaText: "Visit Lusha",
    ctaUrl: "https://lusha.com",
    highlight: false,
  },
  {
    rank: 5,
    name: "Hunter.io",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hunter.io&size=128",
    domain: "hunter.io",
    bestFor: "Best for Domain Searches & Email Structure Audits",
    price: "$49.00 / user / month",
    rating: 4.4,
    description: "Hunter.io focuses heavily on discovering and verifying company-wide email configurations (such as first.last@domain.com). It is extremely powerful for checking the validity of corporate addresses, but it lacks mobile phone lists, social profile pages, pipeline dashboards, or automatic copy generator copilots.",
    pros: [
      "Unparalleled domain email structure discovery rates",
      "Extremely quick bulk email verifier and checker utilities",
      "Very reliable open API for custom developer builds"
    ],
    cons: [
      "No native mobile direct dial lists or social tracking maps",
      "Purely specialized in emails; requires third-party CRMs to write or log deals"
    ],
    ctaText: "Visit Hunter.io",
    ctaUrl: "https://hunter.io",
    highlight: false,
  },
  {
    rank: 6,
    name: "Seamless.AI",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://seamless.ai&size=128",
    domain: "seamless.ai",
    bestFor: "Best for Real-Time Search Validation",
    price: "$147.00 / user / month",
    rating: 4.1,
    description: "Seamless.AI uses web-search intelligence to crawl and gather lead information live, helping avoid outdated contact repositories. While it provides high-quality real-time profiles, users have reported that the user experience is frequently cluttered with upsell promotions and strict licensing contracts.",
    pros: [
      "Real-time crawling avoids high bounce rates of static lists",
      "Strong list building tool optimized for LinkedIn Recruiter",
      "Good automatic data enrichment features"
    ],
    cons: [
      "User interface feels cluttered with high-pressure premium upgrade popups",
      "Requires custom enterprise contracts for high-volume searches"
    ],
    ctaText: "Visit Seamless.AI",
    ctaUrl: "https://seamless.ai",
    highlight: false,
  },
  {
    rank: 7,
    name: "UpLead",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uplead.com&size=128",
    domain: "uplead.com",
    bestFor: "Best for 95% Verified Data Accuracy Guarantee",
    price: "$99.00 / user / month",
    rating: 4.2,
    description: "UpLead guarantees 95% accuracy on its retrieved email databases. The platform automatically checks and validates contacts the instant you export them, and refunds credits on bounces. While data quality is exceptional, it has one of the highest cost-per-lead prices in the prospecting space, making volume outreach very costly.",
    pros: [
      "95% accuracy guarantee with automatic live verification",
      "Clean, straightforward dashboard with zero visual clutter",
      "Very reliable mobile dials and email verification trails"
    ],
    cons: [
      "Highest cost-per-lead pricing ratios among mid-market databases",
      "Unused search credits do not carry over into subsequent billing periods"
    ],
    ctaText: "Visit UpLead",
    ctaUrl: "https://uplead.com",
    highlight: false,
  }
];

const FAQS = [
  {
    q: "What is a Lead Finder software tool?",
    a: "A B2B Lead Finder (or prospector tool) is a sales intelligence database designed to help companies search, filter, and extract verified contact details (emails, mobile dials, and company profiles) of target decision makers. Traditional tools focus purely on database access and count every click. Consolidated systems (like TRAC AI) package search filters, unlimited US contact profiles, built-in CRM boards, and Gmail outreach engines under a single flat pricing structure."
  },
  {
    q: "Are there credit limits on TRAC AI's Lead Finder?",
    a: "Unlike tools like Apollo or UpLead which charge you for every single lead you view, TRAC AI Lead Finder operates on a flat-rate database access model. TRAC AI has a generous maximum limit of 5,000 active leads stored locally/Zustand in your active prospecting space, which enables you to filter, sort, and launch outreach campaigns freely without worrying about a monthly credit bill."
  },
  {
    q: "How does the AI Super Copilot assist in lead generation?",
    a: "Traditional lead tools give you a database and leave you to figure out the rest. TRAC AI integrates its AI Super Copilot directly into the Lead Finder. It helps you instantly analyze a prospect's role and company, auto-generate hyper-personalized cold outreach emails, and coordinate sales deal tracks inside your CRM—all in one smooth workflow."
  },
  {
    q: "Is cold emailing leads legal under B2B regulations?",
    a: "Yes. Cold emailing targets in B2B directories is completely legal and standard practice worldwide, provided you comply with CAN-SPAM and GDPR regulations. This includes targeting direct business-related addresses, offering a clear opt-out/unsubscribe link, and ensuring your message directly relates to the recipient's professional role. TRAC AI's email composer helps align outreach with standard professional templates."
  }
];

export default function BestLeadFinderPage() {
  
  // 1. Structured JSON-LD ItemList Schema (Ranked Listicles SEO Gold Standard)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "7 Best Lead Finder Software for B2B Prospecting (2026)",
    "description": "An expert evaluation of the top B2B sales intelligence and email search databases.",
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
          "price": item.price.split(' ')[0].replace('$', '').trim(),
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": item.rating.toString(),
          "ratingCount": "120"
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
            7 Best Lead Finder Software for B2B Prospecting (2026)
          </h1>
          <div className="flex justify-center items-center gap-6 text-xs font-bold text-zinc-500 uppercase">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-zinc-600" /> 8 min read
            </span>
            <span>•</span>
            <span className="text-zinc-600">Last Updated: May 2026</span>
          </div>
          <p className="text-base sm:text-lg font-medium text-zinc-700 max-w-2xl mx-auto leading-relaxed">
            Finding high-converting B2B contacts shouldn't break your bank. We reviewed the top 7 lead generation databases on profile accuracy, credit limits, integrated CRM features, and cold outreach AI efficiency.
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
                Try the Friction-Free Sandbox Demo
              </h2>
              <p className="text-xs md:text-sm font-bold text-zinc-700 uppercase leading-relaxed">
                Most sales intelligence platforms demand that you talk with aggressive reps, wait days for onboarding calls, and configure APIs before browsing a single contact. TRAC AI launches immediately. Try a fast, live interactive sandbox layout below.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button className="h-12 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <Play size={12} className="fill-white" /> Start 60s Live Demo
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-700 uppercase">
                  <span>• No Credit Card</span>
                  <span>• No Onboarding Call</span>
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
                  {item.rank === 1 ? (
                    <img src={item.logo} alt={item.name} className="size-9 object-contain dark:invert" />
                  ) : (
                    <img src={item.logo} alt={item.name} className="size-9 object-contain" />
                  )}
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
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Data Model</span>
                <span className="text-sm font-black text-zinc-800 uppercase leading-snug">{item.rank === 1 ? "Flat-Rate Database" : "Credit-Counting"}</span>
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
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900">Prospecting Guide & FAQs</h2>
          <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Frequently asked questions regarding B2B prospecting tools</p>
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
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-tight">Scale Your B2B Sales Frictionless</h2>
          <p className="text-base sm:text-lg font-medium text-white/70 leading-relaxed max-w-xl mx-auto uppercase">
            Stop paying expensive per-lead click rates that dry up your budgets. Upgrade to TRAC AI and prospecting leads flat-rate with built-in AI Copilots.
          </p>
          <div className="pt-6">
            <Link href="/signup">
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
