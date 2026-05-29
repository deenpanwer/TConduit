"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Check, 
  X, 
  Zap, 
  HelpCircle, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Users,
  ShieldCheck,
  Building2,
  Phone,
  Calculator,
  UserCheck,
  Calendar,
  FileText,
  MousePointer2,
  Info,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompetitorData } from "@/lib/data/competitor-data";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

const ContactForm = dynamic(() => import("@/components/home/ContactForm").then((mod) => mod.ContactForm), {
  ssr: true
});

const Footer = dynamic(() => import("@/components/home/Footer").then((mod) => mod.Footer), {
  ssr: true
});

const WHATSAPP_NUMBER = "923178005465";

const getWhatsAppUrl = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

interface AlternativeContentProps {
  data: CompetitorData;
}

export function AlternativeContent({ data }: AlternativeContentProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const [showDiffsOnly, setShowDiffsOnly] = useState(false);
  const [activeTab, setActiveTab] = useState(data.personaStories[0]?.tabId || "");
  const [teamSize, setTeamSize] = useState(15);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');

  // Calculates financial ROI
  const competitorPricing = data.roiCalculator.competitorBasePrice;
  const tracPricingBase = data.roiCalculator.tracBasePrice;

  // Calculate dynamic TRAC AI price based on cycle discounts
  const getTracPrice = () => {
    let rate = tracPricingBase;
    if (billingCycle === 'quarterly') rate = rate * 0.85; // 15% off
    if (billingCycle === 'yearly') rate = rate * 0.70;    // 30% off
    return rate;
  };

  const currentTracPrice = getTracPrice();

  // Competitor full stack cost (competitor + external apps they make you buy)
  const externalToolsCost = data.roiCalculator.requiredExternalTools.reduce((acc, curr) => acc + curr.costPerUserMonth, 0);
  const competitorFullCostPerUser = competitorPricing + externalToolsCost;

  const totalCompetitorMonthly = competitorFullCostPerUser * teamSize;
  const totalTracMonthly = currentTracPrice * teamSize;
  const monthlySavings = Math.max(0, totalCompetitorMonthly - totalTracMonthly);
  const annualSavings = monthlySavings * 12;

  // Filter features comparison if "Show Differences Only" is active
  const filteredComparison = data.featuresComparison.map(cat => {
    const filteredFeatures = cat.features.filter(f => {
      if (!showDiffsOnly) return true;
      // Convert value types to unified compare
      const tracHas = typeof f.tracVal === 'boolean' ? f.tracVal : true;
      const compHas = typeof f.compVal === 'boolean' ? f.compVal : false;
      return tracHas !== compHas;
    });
    return { ...cat, features: filteredFeatures };
  }).filter(cat => cat.features.length > 0);

  const dynamicWhatsAppMsg = `Hi TRAC AI, I want to migrate my team from ${data.name} to TRAC AI. I've reviewed the ROI breakdown for our team of ${teamSize} users.`;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-foreground">
      {/* 1. Header/Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border/10">
        <Link href="/dashboard" className="flex items-center gap-3">
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
          <span className="font-poppins font-bold text-2xl text-foreground tracking-tighter leading-none uppercase">
            TRAC AI
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="hidden sm:block text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-2 px-4 transition-colors">
            Pricing
          </Link>
          <Link href="/features" className="hidden sm:block text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-2 px-4 transition-colors">
            Features
          </Link>
          <Link href="/ems/signup">
            <Button className="rounded-none font-black uppercase text-[10px] tracking-widest border-[3px] border-black dark:border-white hover:bg-primary/5 transition-all active:scale-95 h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
              Start Here
            </Button>
          </Link>
        </div>
      </nav>

      {/* 2. Empathy-Driven Hero */}
      <header className="relative pt-36 pb-20 overflow-hidden border-b-4 border-black dark:border-white bg-card">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* Dynamic VS Matchup Logo Block */}
            <div className="flex items-center justify-center gap-6 mb-8 select-none">
              <div className="size-16 rounded-2xl bg-white border-2 border-black/10 dark:border-white/10 shadow-lg p-2.5 flex items-center justify-center">
                <img src={data.logo} alt={`${data.name} Logo`} className="size-10 object-contain" />
              </div>
              <div className="size-10 rounded-full border-2 border-black dark:border-white bg-background flex items-center justify-center font-black text-xs uppercase tracking-widest text-muted-foreground shadow-md">
                VS
              </div>
              <div className="size-16 rounded-2xl bg-white border-2 border-black/10 dark:border-white/10 shadow-lg p-2.5 flex items-center justify-center">
                <img src="/special-triangle-white-bg.svg" alt="TRAC AI Logo" className="size-10 object-contain" />
              </div>
            </div>

            <p className="text-xl md:text-2xl font-black text-destructive uppercase tracking-widest">
              {data.hero.painPoint}
            </p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none text-foreground">
              {data.hero.headline}
            </h1>
            
            <p className="text-base md:text-lg font-bold text-muted-foreground uppercase leading-relaxed max-w-3xl mx-auto">
              {data.hero.validation}
            </p>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6">
              <Button 
                onClick={() => window.open(getWhatsAppUrl(dynamicWhatsAppMsg), '_blank')}
                className="h-16 px-10 rounded-2xl border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black uppercase tracking-widest text-sm"
              >
                Migrate in 24 Hours
              </Button>
              <Button 
                onClick={() => document.getElementById("comparison-table")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline"
                className="h-16 px-10 rounded-2xl border-4 border-black dark:border-white bg-transparent hover:bg-black/5 dark:hover:bg-white/5 font-black uppercase tracking-widest text-sm"
              >
                Show Differences
              </Button>
            </div>
            
            <div className="pt-6 flex justify-center items-center gap-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="text-emerald-500" size={16} />
              <span>Zero contract limits • 30-day money-back guarantee • Free migration assistance</span>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </header>

      {/* 3. Direct Side-by-Side Comparison Card Section */}
      <section id="comparison-table" className="py-24 container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Direct Side-by-Side Contrast
          </h2>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Why pay for multiple licenses when one flat plan runs your business?
          </p>
          
          {/* Show Differences Toggle Capsule */}
          <div className="pt-8 flex justify-center">
            <button
              onClick={() => setShowDiffsOnly(!showDiffsOnly)}
              className={cn(
                "px-6 py-3 border-4 border-black dark:border-white rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
                showDiffsOnly ? "bg-black dark:bg-white text-white dark:text-black" : "bg-card text-foreground"
              )}
            >
              <Zap size={14} className={showDiffsOnly ? "text-emerald-500 fill-emerald-500" : ""} />
              {showDiffsOnly ? "Showing Differences Only" : "Show Differences Only"}
            </button>
          </div>
        </div>

        {/* Dynamic Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Competitor Card */}
          <div className="bg-card border-4 border-black dark:border-white rounded-[3rem] p-8 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block mb-2">Legacy Competitor</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-xl bg-white border border-black/10 p-2 flex items-center justify-center shrink-0 shadow-sm">
                  <img src={data.logo} alt={`${data.name} Logo`} className="size-8 object-contain" />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tight">{data.name}</h3>
              </div>
              
              <ul className="space-y-6">
                {data.primarySpecs.map((spec, index) => (
                  <li key={index} className="flex justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{spec.label}</span>
                    <span className="text-xs font-black uppercase text-destructive">{spec.competitorValue}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-10 pt-6 border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive leading-tight mb-2">⛔ The Problem:</p>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Requires gluing multiple separate expensive app licenses (Slack, QuickBooks, HubSpot) together to run operations.
              </p>
            </div>
          </div>

          {/* TRAC AI - Asymmetrical Highlighted Winner Column */}
          <div className="bg-card border-4 border-emerald-500 dark:border-emerald-400 rounded-[3rem] p-8 flex flex-col justify-between shadow-[12px_12px_0px_0px_rgba(16,185,129,0.2)] relative scale-102">
            <div className="absolute top-0 right-12 -translate-y-1/2 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full border-2 border-black border-dashed">
              Highly Recommended Choice
            </div>
            
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 block mb-2">Unified Solution</span>
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-xl bg-white border border-black/10 p-2 flex items-center justify-center shrink-0 shadow-sm">
                  <img src="/special-triangle-white-bg.svg" alt="TRAC AI Logo" className="size-8 object-contain" />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tight text-emerald-500">TRAC AI</h3>
              </div>
              
              <ul className="space-y-6">
                {data.primarySpecs.map((spec, index) => (
                  <li key={index} className="flex justify-between border-b border-emerald-500/20 pb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{spec.label}</span>
                    <span className="text-xs font-black uppercase text-emerald-500">{spec.tracValue}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-10 pt-6 border-t border-emerald-500/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 leading-tight mb-2">⭐ The Trac Advantage:</p>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                100% unified code stack. Direct native operations without brittle API connectors.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Dense Deep-Dive Faceted Grid (No Empty Cells, row-hover, and tooltips) */}
        <div className="mt-20 border-4 border-black dark:border-white rounded-[3rem] bg-card overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <TooltipProvider delayDuration={150}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b-4 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/50">
                    <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground w-1/2">Capabilities & Modules</th>
                    <th className="p-6 text-center w-1/4">
                      <div className="flex flex-col items-center gap-2">
                        <img src={data.logo} alt={`${data.name} Logo`} className="size-7 object-contain bg-white rounded-lg p-1 border border-black/5 shadow-sm" />
                        <span className="text-xs font-black uppercase tracking-widest text-destructive">{data.name}</span>
                      </div>
                    </th>
                    <th className="p-6 text-center w-1/4 bg-emerald-500/[0.01]">
                      <div className="flex flex-col items-center gap-2">
                        <img src="/special-triangle-white-bg.svg" alt="TRAC AI Logo" className="size-7 object-contain bg-white rounded-lg p-1 border border-black/5 shadow-sm" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-500">TRAC AI</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredComparison.map((cat, catIdx) => (
                    <React.Fragment key={catIdx}>
                      <tr className="bg-zinc-100/50 dark:bg-zinc-900/20">
                        <td colSpan={3} className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.features.map((feat, featIdx) => (
                        <tr key={featIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black uppercase text-foreground leading-none">{feat.name}</span>
                              {feat.jargonTooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="text-muted-foreground/40 hover:text-primary transition-colors focus:outline-none">
                                      <Info size={14} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-black dark:bg-white text-white dark:text-black rounded-xl p-3 max-w-xs text-xs font-bold uppercase tracking-tight">
                                    {feat.jargonTooltip}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 leading-tight">{feat.description}</p>
                          </td>
                          
                          {/* Competitor Cell (No Empty Cells) */}
                          <td className="p-6 text-center">
                            {typeof feat.compVal === 'boolean' ? (
                              feat.compVal ? (
                                <div className="inline-flex items-center justify-center size-8 rounded-full bg-emerald-500/10 text-emerald-500">
                                  <Check size={16} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center size-8 rounded-full bg-destructive/10 text-destructive">
                                  <X size={16} strokeWidth={3} />
                                </div>
                              )
                            ) : (
                              <span className="text-xs font-black uppercase text-destructive bg-destructive/10 py-1 px-3 rounded-full">{feat.compVal}</span>
                            )}
                          </td>

                          {/* TRAC AI Cell */}
                          <td className="p-6 text-center bg-emerald-500/[0.01] group-hover:bg-emerald-500/[0.03] transition-colors">
                            {typeof feat.tracVal === 'boolean' ? (
                              feat.tracVal ? (
                                <div className="inline-flex items-center justify-center size-8 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                                  <Check size={16} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center size-8 rounded-full bg-destructive/20 text-destructive border border-destructive/40">
                                  <X size={16} strokeWidth={3} />
                                </div>
                              )
                            ) : (
                              <span className="text-xs font-black uppercase text-emerald-500 bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20">{feat.tracVal}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        </div>
      </section>

      {/* 5. Use-Case Storytelling & Persona Tab Sections */}
      <section className="py-24 bg-black text-white overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block">Tailored Storytelling</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Who This Switch Is For</h2>
          </div>

          {/* Persona Tab Switcher Selector */}
          <div className="flex justify-center gap-4 mb-16">
            {data.personaStories.map((tab) => (
              <button
                key={tab.tabId}
                onClick={() => setActiveTab(tab.tabId)}
                className={cn(
                  "px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300",
                  activeTab === tab.tabId 
                    ? "bg-white text-black scale-105 shadow-lg" 
                    : "hover:bg-white/10 text-white/60 hover:text-white"
                )}
              >
                {tab.tabLabel}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <AnimatePresence mode="wait">
            {data.personaStories.map((tab) => {
              if (tab.tabId !== activeTab) return null;
              return (
                <motion.div
                  key={tab.tabId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                >
                  <div className="space-y-6">
                    <h3 className="text-3xl md:text-4xl font-black uppercase leading-tight italic">
                      {tab.title}
                    </h3>
                    <p className="text-base text-white/70 font-medium leading-relaxed">
                      {tab.description}
                    </p>
                  </div>

                  <div className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
                    <div className="space-y-2 border-b border-white/10 pb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-destructive block">⛔ With {data.name}:</span>
                      <p className="text-xs font-bold text-white/60 uppercase leading-relaxed">{tab.competitorPain}</p>
                    </div>
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block">⭐ With TRAC AI:</span>
                      <p className="text-xs font-bold text-white/80 uppercase leading-relaxed">{tab.tracGain}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* 6. Visual "The Switch" Pain-Point Matrix */}
      <section className="py-24 container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Why Founders Make The Switch</h2>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Identify your pain point. Deploy your solution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.switchMatrix.map((item, index) => (
            <div key={index} className="bg-card border-4 border-black dark:border-white p-6 rounded-[2.5rem] flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Pain Point #{index + 1}</span>
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">{item.painPoint}</h3>
                
                <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed mb-6">
                  {item.competitorShortcoming}
                </p>
              </div>
              
              <div className="pt-4 border-t border-border">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">✔ TRAC Solution:</span>
                <p className="text-xs font-black uppercase leading-relaxed text-foreground">
                  {item.tracSolution}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-emerald-500/5 dark:bg-emerald-400/5 border-2 border-emerald-500 border-dashed rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Migration Assurance</span>
            <h4 className="text-xl font-black uppercase">We do all the lifting for you</h4>
            <p className="text-xs font-bold text-muted-foreground uppercase">Our team will migrate your contractor rosters, time logs, and deal balances from {data.name} in under 24 hours.</p>
          </div>
          <Badge className="bg-emerald-500 text-black border-2 border-black border-dashed font-black uppercase py-2 px-6 tracking-widest shrink-0">
            Verified Migration Badge
          </Badge>
        </div>
      </section>

      {/* 7. Interactive ROI & Cost-Savings Calculator */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-y-4 border-black dark:border-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block">Real Savings Clear ROI</span>
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Compute Your Immediate Savings</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">
                Add up the cost of paying for time tracking + team chats + ATS systems + accounting suites. Watch how fast TRAC AI pays for itself.
              </p>

              {/* Dynamic Billing Cycles Toggle */}
              <div className="bg-card border-2 border-black dark:border-white p-1 rounded-full flex gap-1 w-fit shadow-md">
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'quarterly', label: 'Quarterly (15% off)' },
                  { id: 'yearly', label: 'Yearly (30% off)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBillingCycle(opt.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wider transition-all",
                      billingCycle === opt.id
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Slider Input */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase tracking-widest">Team Size</span>
                  <span className="text-3xl font-black text-primary">{teamSize} Users</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="150" 
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value))}
                  className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>5 Users</span>
                  <span>50 Users</span>
                  <span>100 Users</span>
                  <span>150 Users</span>
                </div>
              </div>
            </div>

            {/* Visual Progress ROI Dial */}
            <div className="bg-card border-4 border-black dark:border-white rounded-[3rem] p-10 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 block">Calculated Yearly Savings</span>
                <h3 className="text-6xl font-black uppercase tracking-tight text-emerald-500">
                  ${annualSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Billed annually, including tool consolidation</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
                <div className="text-center border-r border-border">
                  <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Legacy Stack Cost</span>
                  <span className="text-xl font-black uppercase text-destructive">${totalCompetitorMonthly.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">TRAC AI Cost</span>
                  <span className="text-xl font-black uppercase text-emerald-500">${totalTracMonthly.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                <span>All tools consolidated</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <Check size={12} strokeWidth={3} /> Save {Math.round((monthlySavings / totalCompetitorMonthly) * 100)}%
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Contact Form & confettis */}
      <ContactForm />

      {/* 9. Global Footer */}
      <Footer />
    </div>
  );
}
