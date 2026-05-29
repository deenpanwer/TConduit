"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, UserSearch, CalendarClock, Timer, 
  ClipboardList, Trophy, Target, FileText, 
  ShoppingCart, MessageSquare, Search, Mail, 
  Package, Briefcase, Factory, Users, LayoutDashboard,
  MailOpen, Zap, Boxes
} from "lucide-react";

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

export default function ProductEcosystem() {
  return (
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
                  <span className="text-sm font-sans font-bold text-destructive line-through decoration-2 uppercase tracking-wide">{product.replaces}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Their Price</span>
                  <span className="text-sm font-sans font-bold text-destructive uppercase tracking-wider">{product.price}</span>
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
  );
}
