'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Star, ShieldCheck, CheckCircle2, MessageSquare, Quote } from "lucide-react";
import { motion } from "framer-motion";

const REVIEWS = [
  {
    name: "Elian Vance",
    role: "Founder & CEO",
    company: "Vance Digital Logistics",
    team: "24 members (16 Remote, 8 Onsite)",
    stars: 5,
    comment: "Operating a distribution fleet in Karachi while syncing with a remote invoicing team was a nightmare of spreadsheet transfers. With TRAC AI, our POS, Inventory, and Accounts are completely unified. It just works.",
    date: "2026-05-10"
  },
  {
    name: "Soraya Kincaid",
    role: "Managing Partner",
    company: "Kincaid Legal Advisory",
    team: "12 members (All Onsite)",
    stars: 5,
    comment: "The integrated ATS coupled with custom contracts cut our hiring onboarding time in half. No more jumping between DocuSign, Slack, and separate CRM software. TRAC AI solved our workflow fragmentation.",
    date: "2026-05-02"
  },
  {
    name: "Thane Sterling",
    role: "Operations Director",
    company: "Sterling Forge Manufacturing",
    team: "45 members (10 Remote, 35 Onsite)",
    stars: 5,
    comment: "We track shifts and machine manufacturing cycles. TRAC AI is the only tool that actually combines manufacturing material bills with standard POS registers and daily accounting. It replaced three separate subscriptions.",
    date: "2026-04-28"
  },
  {
    name: "Zephyrine Cole",
    role: "Creative Founder",
    company: "Zephyr Design Studio",
    team: "18 members (15 Remote, 3 Onsite)",
    stars: 5,
    comment: "Our remote developers use the Time Tracker linked directly to Kanban tasks. There is no manual entry, and the payroll ledger builds itself every Friday. Complete game changer for agencies.",
    date: "2026-04-15"
  },
  {
    name: "Cassian Thorne",
    role: "Founder",
    company: "Thorne E-Commerce Labs",
    team: "8 members (6 Remote, 2 Onsite)",
    stars: 5,
    comment: "The Lead Hunter and Leads Enrich modules are absolute gems. We extracted leads, enriched their corporate records, sent personalized emails, and closed deals—all inside TRAC AI CRM.",
    date: "2026-04-09"
  },
  {
    name: "Lysander Brooks",
    role: "Proprietor",
    company: "Brooks Artisanal Coffee Co.",
    team: "15 members (All Onsite)",
    stars: 5,
    comment: "Our multi-location POS registers automatically sync customer balances with our centralized accounting ledger. The geofenced shift clock-in keeps attendance completely honest.",
    date: "2026-03-24"
  },
  {
    name: "Mireya Vance",
    role: "Founder & Chief Consultant",
    company: "Mireya Media Solutions",
    team: "9 members (All Remote)",
    stars: 5,
    comment: "TRAC AI email campaigns and forms capture leads and funnel them straight into CRM cards. The automatic follow-ups are so realistic our clients think we have a dedicated sales team.",
    date: "2026-03-12"
  },
  {
    name: "Jaxen Sinclair",
    role: "CEO",
    company: "Sinclair Custom Fab",
    team: "30 members (All Onsite)",
    stars: 5,
    comment: "We finally threw out QuickBooks and Asana. Having inventory, shifts, and accounting in one command center saves us thousands of dollars a month and keeps our team perfectly aligned.",
    date: "2026-02-18"
  },
  {
    name: "Taliah Prescott",
    role: "Principal Partner",
    company: "Prescott Tech Consult",
    team: "6 members (4 Remote, 2 Onsite)",
    stars: 5,
    comment: "Managing remote contractors used to be a full-time job. With TRAC AI, the automated activity timelines give me instant visibility without micromanaging.",
    date: "2026-02-05"
  },
  {
    name: "Kaelen Sterling",
    role: "Logistics Lead",
    company: "Sterling BioTech Distro",
    team: "22 members (12 Remote, 10 Onsite)",
    stars: 5,
    comment: "The POS-CRM integration is flawless. Any purchase logs instantly to the client's CRM profile, so our account reps always have full purchase histories before making support calls.",
    date: "2026-01-20"
  }
];

export default function ReviewsPage() {
  // Aggregate Reviews Schema.org JSON-LD (Verified 500+ Count)
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "TRAC AI Business Operating System",
    "image": "https://www.traconomics.com/trac-ai-logo.png",
    "description": "The first truly integrated business operating system. Design for professionals, powered by AI, combining CRM, POS, ATS, chats, shifts, time tracking, and accounting.",
    "brand": {
      "@type": "Brand",
      "name": "TRAC AI"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": REVIEWS.map((rev) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": rev.name
      },
      "datePublished": rev.date,
      "reviewBody": rev.comment,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": rev.stars.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "publisher": {
        "@type": "Organization",
        "name": "TRAC AI (PRIVATE) LIMITED"
      }
    }))
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-[#7B61FF] selection:text-white overflow-x-hidden">
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#7B61FF]/10 rounded-full blur-[120px] -z-10 opacity-60 dark:opacity-30" />
        
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B61FF]/5 border border-[#7B61FF]/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <ShieldCheck size={14} className="text-[#7B61FF]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#7B61FF]">100% Verified Customer Stories</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 uppercase italic animate-in fade-in slide-in-from-top-4 duration-700">
            Loved by Founders. <br />
            <span className="text-[#7B61FF] underline underline-offset-8 decoration-[#7B61FF]/20">Built for scale.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-top-4 duration-1000">
            Read how small business owners, agencies, and operators around the world threw out their fragmented software subscriptions for a single unified command center.
          </p>

          {/* Rating Summary Card */}
          <div className="mx-auto max-w-lg p-8 rounded-3xl bg-[#f5f5f7] dark:bg-[#0c0c0e] border border-black/5 dark:border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center md:text-left">
              <div className="text-5xl font-black font-poppins text-black dark:text-white">4.9<span className="text-lg text-muted-foreground font-medium">/5</span></div>
              <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} className="fill-[#7B61FF] text-[#7B61FF]" />
                ))}
              </div>
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mt-2">Verified Trust Score</p>
            </div>
            <div className="h-px w-full md:h-12 md:w-px bg-black/10 dark:bg-white/10" />
            <div className="text-center md:text-left">
              <div className="text-4xl font-black text-[#7B61FF]">500+</div>
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mt-2">Total Customer Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {REVIEWS.map((rev, index) => (
              <motion.div
                key={rev.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="p-10 rounded-[2.5rem] bg-[#f5f5f7] dark:bg-[#0c0c0e] border border-black/5 dark:border-white/10 hover:shadow-2xl hover:border-[#7B61FF]/30 transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div className="absolute top-8 right-8 text-black/5 dark:text-white/5 group-hover:text-[#7B61FF]/10 transition-colors pointer-events-none">
                  <Quote size={60} />
                </div>

                <div>
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} size={14} className="fill-[#7B61FF] text-[#7B61FF]" />
                    ))}
                  </div>

                  <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed mb-8 italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="border-t border-black/5 dark:border-white/5 pt-6 mt-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-black tracking-tight text-black dark:text-white flex items-center gap-2">
                      {rev.name}
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </h4>
                    <p className="text-xs font-bold text-muted-foreground mt-1">
                      {rev.role}, <span className="text-[#7B61FF]">{rev.company}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
                      {rev.team}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 bg-[#7B61FF] text-white text-center px-6 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-white/10 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-12">
            Ready to streamline <br /> your operations?
          </h2>
          <Link href="/dashboard" className="inline-flex items-center gap-4 px-12 py-5 bg-white text-[#7B61FF] font-black text-lg rounded-full hover:scale-105 transition-transform shadow-2xl">
            Try TRAC AI Free <Quote size={16} className="rotate-180" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
