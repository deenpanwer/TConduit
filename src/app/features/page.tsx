'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import FeaturesHero from '@/components/features/FeaturesHero';
import PurposeSection from '@/components/features/PurposeSection';
import FeatureCardsGrid from '@/components/features/FeatureCardsGrid';
import { 
  ChevronDown, 
  Menu, 
  X, 
  Calculator, 
  Users, 
  MessageSquare, 
  Target, 
  LayoutDashboard, 
  Mail, 
  ClipboardList, 
  UserPlus, 
  Package, 
  Search, 
  BarChart3, 
  Database, 
  Factory, 
  CreditCard, 
  ShoppingCart, 
  TrendingUp, 
  Users2, 
  CheckSquare, 
  Timer 
} from 'lucide-react';

const Header = () => {
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const apps = [
    { name: 'Accounting', path: '/apps/accounting', icon: <Calculator className="w-4 h-4" /> },
    { name: 'ATS', path: '/apps/ats', icon: <Users className="w-4 h-4" /> },
    { name: 'Chats', path: '/apps/chats', icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'CRM', path: '/apps/crm', icon: <Target className="w-4 h-4" /> },
    { name: 'Dashboard', path: '/apps/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Email', path: '/apps/email', icon: <Mail className="w-4 h-4" /> },
    { name: 'Forms', path: '/apps/forms', icon: <ClipboardList className="w-4 h-4" /> },
    { name: 'Hiring', path: '/apps/hiring', icon: <UserPlus className="w-4 h-4" /> },
    { name: 'Inventory', path: '/apps/inventory', icon: <Package className="w-4 h-4" /> },
    { name: 'Lead Hunter', path: '/apps/lead-hunter', icon: <Search className="w-4 h-4" /> },
    { name: 'Leaderboards', path: '/apps/leaderboards', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Leads Enrich', path: '/apps/leads-enrich', icon: <Database className="w-4 h-4" /> },
    { name: 'Manufacturing', path: '/apps/manufacturing', icon: <Factory className="w-4 h-4" /> },
    { name: 'POS', path: '/apps/pos', icon: <CreditCard className="w-4 h-4" /> },
    { name: 'Procurement', path: '/apps/procurement', icon: <ShoppingCart className="w-4 h-4" /> },
    { name: 'Sales', path: '/apps/sales', icon: <TrendingUp className="w-4 h-4" /> },
    { name: 'Shifts', path: '/apps/shifts', icon: <Users2 className="w-4 h-4" /> },
    { name: 'Tasks', path: '/apps/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { name: 'Time Tracking', path: '/apps/time-tracking', icon: <Timer className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        
        {/* Mobile: Left Hamburger */}
        <div className="flex items-center gap-4 lg:hidden">
          <button 
            className="p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="text-xl font-black text-[#1a1919] tracking-tighter flex items-center gap-1">
            TRAC <span className="text-[#7B61FF]">AI</span>
          </Link>
        </div>

        {/* Desktop: Left Logo & Nav */}
        <div className="hidden lg:flex items-center gap-12">
          <Link href="/" className="text-2xl font-black text-[#1a1919] tracking-tighter flex items-center gap-2">
            TRAC <span className="text-[#7B61FF]">AI</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">
              Home
            </Link>
            <div 
              className="relative"
              onMouseEnter={() => setIsProductsOpen(true)}
              onMouseLeave={() => setIsProductsOpen(false)}
            >
              <button className="text-sm font-bold text-gray-600 hover:text-black transition-colors flex items-center gap-1 py-8">
                Products <ChevronDown className={`w-4 h-4 transition-transform ${isProductsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Full-width Dropdown */}
              {isProductsOpen && (
                <div className="fixed top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl p-10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-w-7xl mx-auto grid grid-cols-4 gap-x-8 gap-y-2">
                    {apps.map((app) => (
                      <Link 
                        key={app.path} 
                        href={app.path}
                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-[#7B61FF]/10 group-hover:text-[#7B61FF] transition-colors">
                          {app.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-[#7B61FF] transition-colors">
                            {app.name}
                          </span>
                          <span className="text-[10px] text-gray-400">Explore features</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/pricing" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">
              Pricing
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 mr-4">
            <Link 
              href="https://calendly.com/kaayfkhan/discovery-call"
              target="_blank"
              className="text-sm font-bold text-gray-600 hover:text-black transition-colors"
            >
              Get a demo
            </Link>
            <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">
              Log in
            </Link>
          </div>
          <Link 
            href="/signup" 
            className="px-4 sm:px-6 py-2 sm:py-3 bg-[#1a1919] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-black transition-all shadow-lg shadow-black/5 whitespace-nowrap"
          >
            Sign up
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl p-6 space-y-8 animate-in fade-in slide-in-from-top-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          <Link href="/" className="block text-xl font-bold border-b border-gray-50 pb-4">Home</Link>
          
          <div className="space-y-6">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Products</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {apps.map(app => (
                <Link key={app.path} href={app.path} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="text-[#7B61FF]">{app.icon}</div>
                  <span className="font-bold text-gray-700">{app.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <Link href="/pricing" className="block text-xl font-bold border-t border-gray-50 pt-6">Pricing</Link>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col gap-4 pb-4">
            <Link 
              href="https://calendly.com/kaayfkhan/discovery-call"
              target="_blank"
              className="text-center font-bold text-gray-600 py-3 border border-gray-100 rounded-xl"
            >
              Get a demo
            </Link>
            <Link href="/login" className="text-center font-bold text-gray-600 py-3">Log in</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default function FeaturesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Business Software Operating System",
    "provider": {
      "@type": "Organization",
      "name": "TRAC AI (PRIVATE) LIMITED",
      "logo": "https://www.traconomics.com/trac-ai-logo.png"
    },
    "name": "TRAC AI Product Suite",
    "description": "Unified business operating system consolidating ATS, CRM, Accounting, chats, shift scheduling, POS, time tracking, and inventory.",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "TRAC AI Business Apps",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "TRAC AI Accounting",
            "description": "Auto-invoicing, bank sync, P&L reporting."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "TRAC AI CRM",
            "description": "Lead captures, pipeline management, client tracking."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "TRAC AI Applicant Tracking System (ATS)",
            "description": "Job boards, pipelines, hiring onboarding trackers."
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "TRAC AI Time Tracking",
            "description": "Activity timeline logs, remote team tracker synced with payroll."
          }
        }
      ]
    }
  };

  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Inject Structured Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Header />
      <FeaturesHero />
      <PurposeSection />
      <FeatureCardsGrid />
    </main>
  );
}
