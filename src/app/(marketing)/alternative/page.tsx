import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Layers, 
  Zap, 
  Search, 
  Users, 
  ShieldCheck, 
  Globe, 
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingNavbar } from "@/components/ui/pricing-navbar";
import dynamic from "next/dynamic";

const ContactForm = dynamic(() => import("@/components/home/ContactForm").then((mod) => mod.ContactForm), {
  ssr: true
});

const Footer = dynamic(() => import("@/components/home/Footer").then((mod) => mod.Footer), {
  ssr: true
});

export const metadata = {
  title: "TRAC AI Comparisons & Alternatives | All-in-One Operations OS",
  description: "Compare TRAC AI against Hubstaff, ClickUp, and other software trackers. Find out how consolidations of time tracking, CRM, ATS, and payroll save high-performance teams up to 70% in monthly costs.",
};

const COMPETITOR_MATCHUPS = [
  {
    name: "TRAC AI vs Hubstaff",
    description: "Compare random screenshot capturing, click monitoring, and integrated features. See why founders choose a consolidated platform.",
    href: "/alternative/hubstaff",
    badge: "Most Popular",
    icon: Users,
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20"
  },
  {
    name: "TRAC AI vs ClickUp",
    description: "Compare manual task tracking vs high-fidelity contractor tracking, CRM, ATS, and financial ledgers in one operating system.",
    href: "/alternative/clickup",
    badge: "Productivity",
    icon: Layers,
    color: "from-purple-500/10 to-pink-500/10 border-purple-500/20"
  },
  {
    name: "TRAC AI vs Hubstaff India",
    description: "Regional pricing optimization, contractor invoicing, and localized payroll details for high-growth tech teams in India.",
    href: "/alternative/hubstaff-india",
    badge: "Asia-Pacific",
    icon: Globe,
    color: "from-orange-500/10 to-yellow-500/10 border-orange-500/20"
  },
  {
    name: "TRAC AI vs Hubstaff Pakistan",
    description: "Comparing time logs, local bank disbursements, and tax compliance systems for development teams based in Pakistan.",
    href: "/alternative/hubstaff-pakistan",
    badge: "Asia-Pacific",
    icon: Globe,
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
  },
  {
    name: "TRAC AI vs Hubstaff UAE & Dubai",
    description: "Localized compliance, contractor verification, and multi-currency billing comparison for modern Dubai agencies.",
    href: "/alternative/hubstaff-uae",
    badge: "Middle East",
    icon: Globe,
    color: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20"
  }
];

const BUYING_GUIDES = [
  {
    name: "10 Best Employee Management Systems (EMS)",
    description: "An expert review of the top 10 Employee Management Systems evaluated on time logs, AI features, and total subscription value.",
    href: "/best-ems-software",
    badge: "EMS Review",
    icon: ShieldCheck,
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
  },
  {
    name: "Best Lead Finder Software & Tools (2026)",
    description: "A complete analysis of the best search-engine lookup databases, B2B email lead generators, and data enrichment engines.",
    href: "/best-lead-finder",
    badge: "Sales & Leads",
    icon: Search,
    color: "from-indigo-500/10 to-violet-500/10 border-indigo-500/20"
  }
];

export default function AlternativePage() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "TRAC AI Alternatives & Comparison Guides",
    "description": "Compare TRAC AI against Hubstaff, ClickUp, and other software trackers. Find out how consolidations of time tracking, CRM, ATS, and payroll save high-performance teams up to 70% in monthly costs.",
    "url": "https://heytracai.com/alternative",
    "mainEntity": {
      "@type": "ItemList",
      "name": "TRAC AI Comparison Resources",
      "numberOfItems": 7,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://heytracai.com/alternative/hubstaff",
          "name": "TRAC AI vs Hubstaff"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://heytracai.com/alternative/clickup",
          "name": "TRAC AI vs ClickUp"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "https://heytracai.com/alternative/hubstaff-india",
          "name": "TRAC AI vs Hubstaff India"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "url": "https://heytracai.com/alternative/hubstaff-pakistan",
          "name": "TRAC AI vs Hubstaff Pakistan"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "url": "https://heytracai.com/alternative/hubstaff-uae",
          "name": "TRAC AI vs Hubstaff UAE & Dubai"
        },
        {
          "@type": "ListItem",
          "position": 6,
          "url": "https://heytracai.com/best-ems-software",
          "name": "10 Best Employee Management Systems (EMS)"
        },
        {
          "@type": "ListItem",
          "position": 7,
          "url": "https://heytracai.com/best-lead-finder",
          "name": "Best Lead Finder Software & Tools (2026)"
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-950 selection:bg-primary/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <PricingNavbar />

      {/* Hero Section */}
      <header className="pt-36 pb-20 border-b border-zinc-100 bg-zinc-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
            TRAC AI Alternatives & Compare Guides
          </h1>
          <p className="text-base sm:text-lg font-medium text-zinc-700 max-w-2xl mx-auto leading-relaxed uppercase">
            Gluing 15 separate subscriptions together is expensive and slow. Discover how TRAC AI stacks up against single-purpose apps and learn how much you can save.
          </p>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="py-20 max-w-5xl mx-auto px-6 space-y-16">
        {/* Direct Competitor Matchups */}
        <section className="space-y-8">
          <div className="pb-2 border-b border-zinc-100">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Direct Head-to-Head Comparisons</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPETITOR_MATCHUPS.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="group flex flex-col justify-between border border-zinc-200 rounded-3xl p-6 bg-white hover:border-black shadow-sm transition-all hover:translate-y-[-2px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-2xl border bg-zinc-50 flex items-center justify-center p-2.5">
                        <Icon className="size-5 text-zinc-700" />
                      </div>
                      <Badge className="bg-zinc-100 text-zinc-800 border-none font-bold uppercase text-[9px] tracking-wider px-2.5 py-1 rounded-full">
                        {item.badge}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-zinc-600 uppercase tracking-tight leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-900 group-hover:text-primary transition-colors">
                    View Matchup <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Industry Reviews & Buying Guides */}
        <section className="space-y-8">
          <div className="pb-2 border-b border-zinc-100">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Expert Buying Guides & Reviews</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BUYING_GUIDES.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="group flex flex-col justify-between border border-zinc-200 rounded-3xl p-6 bg-white hover:border-black shadow-sm transition-all hover:translate-y-[-2px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-2xl border bg-zinc-50 flex items-center justify-center p-2.5">
                        <Icon className="size-5 text-zinc-700" />
                      </div>
                      <Badge className="bg-zinc-100 text-zinc-800 border-none font-bold uppercase text-[9px] tracking-wider px-2.5 py-1 rounded-full">
                        {item.badge}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-zinc-950 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-zinc-600 uppercase tracking-tight leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-900 group-hover:text-primary transition-colors">
                    Read Review Guide <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Feature Consolidation Callout */}
        <section className="border-4 border-black rounded-[2.5rem] bg-zinc-50 p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-left">
              <Badge className="bg-emerald-500 text-black border-2 border-black border-dashed font-black uppercase text-[9px] tracking-widest px-4 py-1.5 rounded-full">
                🚀 flat billing model
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
                Consolidate 20+ SaaS tools into one flat rate
              </h2>
              <p className="text-xs md:text-sm font-bold text-zinc-700 uppercase leading-relaxed">
                Why pay Slack, Hubstaff, Salesforce CRM, Ashby ATS, and QuickBooks separately? TRAC AI offers all these functional modules in a unified operating system starting at just $39/mo (with up to 30% off).
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link href="/ems/signup">
                  <Button className="h-12 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    Get Started Free <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ContactForm />
      <Footer />
    </div>
  );
}
