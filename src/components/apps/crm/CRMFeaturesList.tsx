"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Users, ListTodo, Briefcase, ShoppingCart, 
  Wallet, Calculator, CalendarClock, UserSearch, 
  LifeBuoy, LineChart, MessageSquare, Database,
  Settings, Globe, Shield, Zap, Sparkles, Phone, Mail, MessageCircle, ArrowRight,
  TrendingUp, Search, Calendar, Smartphone, Globe2, BarChart2, PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    title: "Sell Faster",
    features: [
      { name: "Mobile App", description: "Manage your sales on the go. Everything is synced in real-time.", icon: Smartphone },
      { name: "Fast Lead Entry", description: "Add new leads with just a few clicks. No long forms.", icon: Zap },
      { name: "Live Chat", description: "Talk to visitors on your website and turn them into leads instantly.", icon: MessageSquare },
      { name: "Lead Scoring", description: "Our AI scores leads so you know who is most likely to buy.", icon: Sparkles }
    ]
  },
  {
    title: "Manage Opportunities",
    features: [
      { name: "Pipeline Management", description: "The Kanban view gives you a bird's eye view of all your deals.", icon: ListTodo },
      { name: "Custom Stages", description: "Create your own stages to match how your business actually works.", icon: Settings },
      { name: "Smart Reminders", description: "Never miss a follow-up with automatic reminders and tasks.", icon: CalendarClock },
      { name: "Lost Reasons", description: "Track why deals are lost to improve your sales process.", icon: Shield }
    ]
  },
  {
    title: "Communicate Better",
    features: [
      { name: "Email Integration", description: "Connect your Gmail or Outlook. Everything is tracked in the CRM.", icon: Mail },
      { name: "Call from Browser", description: "Click to call leads directly from their profile. No phone needed.", icon: Phone },
      { name: "SMS Marketing", description: "Send text messages to your leads for even faster responses.", icon: Smartphone },
      { name: "Shared Inbox", description: "Collaborate with your team on customer conversations.", icon: Users }
    ]
  },
  {
    title: "Reporting & Insights",
    features: [
      { name: "Sales Forecasts", description: "See how much revenue is coming in for the next few months.", icon: TrendingUp },
      { name: "Team Performance", description: "Track how your team is doing with clear, simple dashboards.", icon: BarChart2 },
      { name: "Lead Sources", description: "Know exactly where your best customers are coming from.", icon: PieChart },
      { name: "Export to Excel", description: "Need to do more analysis? Export everything in one click.", icon: Database }
    ]
  }
];

export function CRMFeaturesList() {
  return (
    <section className="py-32 px-6 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-32">
          {CATEGORIES.map((category, catIndex) => (
            <div key={category.title} className="flex flex-col md:flex-row gap-16 md:gap-32">
              <div className="md:w-1/3">
                <div className="sticky top-32">
                   <h2 className="text-4xl md:text-6xl font-black font-poppins tracking-tighter uppercase italic mb-8">{category.title}</h2>
                   <div className="h-1 w-20 bg-blue-500 rounded-full" />
                </div>
              </div>
              
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-16">
                 {category.features.map((feature, index) => (
                   <motion.div
                     key={feature.name}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: index * 0.05 }}
                     className="group"
                   >
                     <div className="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                        <feature.icon size={24} strokeWidth={2.5} />
                     </div>
                     <h3 className="text-xl font-black mb-3 font-poppins tracking-tighter uppercase italic">{feature.name}</h3>
                     <p className="text-muted-foreground font-medium leading-relaxed">
                       {feature.description}
                     </p>
                   </motion.div>
                 ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
