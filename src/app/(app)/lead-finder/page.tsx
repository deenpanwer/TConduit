"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ShieldCheck, Database, 
  Trash2, Send, Phone, Briefcase, Plus, 
  ChevronLeft, ChevronRight, RefreshCw,
  SlidersHorizontal, Edit2, ArrowUpDown, ChevronDown, Check, X, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useLeadFinderStore, LeadFinderLead } from "@/store/use-lead-finder-store";
import { DealModal } from "@/components/crm/forms/DealModal";
import { OutreachSetupModal } from "@/components/OutreachSetupModal";
import { TierStatusModal } from "@/components/crm/shared/TierStatusModal";
import { Button } from "@/components/ui/button";
import { PaywallWrapper } from "@/components/ems/PaywallWrapper";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const US_STATES = [
  { value: "AL", label: "AL - Alabama" },
  { value: "AK", label: "AK - Alaska" },
  { value: "AZ", label: "AZ - Arizona" },
  { value: "AR", label: "AR - Arkansas" },
  { value: "CA", label: "CA - California" },
  { value: "CO", label: "CO - Colorado" },
  { value: "CT", label: "CT - Connecticut" },
  { value: "DE", label: "DE - Delaware" },
  { value: "FL", label: "FL - Florida" },
  { value: "GA", label: "GA - Georgia" },
  { value: "HI", label: "HI - Hawaii" },
  { value: "ID", label: "ID - Idaho" },
  { value: "IL", label: "IL - Illinois" },
  { value: "IN", label: "IN - Indiana" },
  { value: "IA", label: "IA - Iowa" },
  { value: "KS", label: "KS - Kansas" },
  { value: "KY", label: "KY - Kentucky" },
  { value: "LA", label: "LA - Louisiana" },
  { value: "ME", label: "ME - Maine" },
  { value: "MD", label: "MD - Maryland" },
  { value: "MA", label: "MA - Massachusetts" },
  { value: "MI", label: "MI - Michigan" },
  { value: "MN", label: "MN - Minnesota" },
  { value: "MS", label: "MS - Mississippi" },
  { value: "MO", label: "MO - Missouri" },
  { value: "MT", label: "MT - Montana" },
  { value: "NE", label: "NE - Nebraska" },
  { value: "NV", label: "NV - Nevada" },
  { value: "NH", label: "NH - New Hampshire" },
  { value: "NJ", label: "NJ - New Jersey" },
  { value: "NM", label: "NM - New Mexico" },
  { value: "NY", label: "NY - New York" },
  { value: "NC", label: "NC - North Carolina" },
  { value: "ND", label: "ND - North Dakota" },
  { value: "OH", label: "OH - Ohio" },
  { value: "OK", label: "OK - Oklahoma" },
  { value: "OR", label: "OR - Oregon" },
  { value: "PA", label: "PA - Pennsylvania" },
  { value: "RI", label: "RI - Rhode Island" },
  { value: "SC", label: "SC - South Carolina" },
  { value: "SD", label: "SD - South Dakota" },
  { value: "TN", label: "TN - Tennessee" },
  { value: "TX", label: "TX - Texas" },
  { value: "UT", label: "UT - Utah" },
  { value: "VT", label: "VT - Vermont" },
  { value: "VA", label: "VA - Virginia" },
  { value: "WA", label: "WA - Washington" },
  { value: "WV", label: "WV - West Virginia" },
  { value: "WI", label: "WI - Wisconsin" },
  { value: "WY", label: "WY - Wyoming" },
  { value: "DC", label: "DC - Washington D.C." },
  { value: "AS", label: "AS - American Samoa" },
  { value: "GU", label: "GU - Guam" },
  { value: "PR", label: "PR - Puerto Rico" },
  { value: "VI", label: "VI - Virgin Islands" },
  { value: "AB", label: "AB - Alberta (Canada)" },
  { value: "BC", label: "BC - British Columbia (Canada)" },
  { value: "MB", label: "MB - Manitoba (Canada)" },
  { value: "NB", label: "NB - New Brunswick (Canada)" },
  { value: "NL", label: "NL - Newfoundland (Canada)" },
  { value: "NS", label: "NS - Nova Scotia (Canada)" },
  { value: "NT", label: "NT - NW Territories (Canada)" },
  { value: "ON", label: "ON - Ontario (Canada)" },
  { value: "PE", label: "PE - Prince Edward Island" },
  { value: "QC", label: "QC - Quebec (Canada)" },
  { value: "SK", label: "SK - Saskatchewan (Canada)" },
  { value: "YT", label: "YT - Yukon (Canada)" },
];

const INDUSTRIES = [
  "Agriculture & Mining",
  "Business Services",
  "Computers & Electronics",
  "Conglomerates",
  "Consumer Services",
  "Education",
  "Energy & Utilities",
  "Financial Services",
  "Food & Beverage",
  "Government",
  "Healthcare",
  "Manufacturing",
  "Media & Entertainment",
  "Non-Profit",
  "Other",
  "Real Estate & Construction",
  "Recreation & Leisure",
  "Retail",
  "Retail & Wholesale",
  "Services (Miscellaneous)",
  "Software & Internet",
  "Telecommunications",
  "Transportation & Storage",
  "Travel & Accommodation",
  "Travel, Recreation, and Leisure",
  "Wholesale & Distribution",
];

const PULL_LIMITS = [50, 100, 200, 500];

export default function LeadFinderPage() {
  const { userData } = useAuth();
  
  // Collaborative Zustand store actions mapped directly to team synced Storage JSON
  const { 
    leads, 
    isLoading: storeLoading, 
    addLeads, 
    deleteLeadLocal, 
    clearStore, 
    toggleCallStatus, 
    convertToDeal,
    loadRosterFromServer 
  } = useLeadFinderStore();
  
  // Real-time organization states
  const [orgData, setOrgData] = useState<any>(null);
  const [isPulling, setIsPulling] = useState(false);

  // Dialog / Modal Visibility States
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // Prospect pulling parameters
  const [pullState, setPullState] = useState<string>("all");
  const [pullIndustry, setPullIndustry] = useState<string>("all");
  const [pullKeyword, setPullKeyword] = useState("");
  const [pullCount, setPullCount] = useState<number>(100);

  // Core filtering & sorting states (CRM Style)
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "company" | "revenue" | "updated">("updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterState, setFilterState] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // CRM Deal modal integration
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedLeadForDeal, setSelectedLeadForDeal] = useState<LeadFinderLead | null>(null);

  // Outreach Template config
  const [emailSubject, setEmailSubject] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("lead_finder_email_subject") || "Quick question re: {Company Name}" : "Quick question re: {Company Name}";
  });
  const [emailBody, setEmailBody] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("lead_finder_email_body") || 
      "Hi {First Name},\n\nI was doing some research on {Company Name} and noticed you lead the {Industry} team.\n\nAre you currently taking on new clients, or is your plate full for this quarter?\n\nBest,\n{User Name}" : "Hi {First Name},\n\nI was doing some research on {Company Name} and noticed you lead the {Industry} team.\n\nAre you currently taking on new clients, or is your plate full for this quarter?\n\nBest,\n{User Name}";
  });
  const [callScript, setCallScript] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("lead_finder_call_script") || 
      "Hello {First Name},\n\nI know I'm calling you completely out of the blue. Do you have 30 seconds for me to tell you why I called, and you can decide if it makes sense to keep talking?\n\n(Wait for agreement)\n\nGreat. I noticed that {Company Name} is active in {Industry}. We help organizations in your sector optimize workflow efficiency.\n\nHow are you currently handling that bottleneck, and are you seeing the results you expected, or is that becoming a challenge for your team?\n\n(Listen to response)\n\nI'm not suggesting we make any changes today, but I'd love to share how peers in your industry are benchmarking this. Do you have 15 minutes later this week to compare notes?" : "Hello {First Name},\n\nI know I'm calling you completely out of the blue. Do you have 30 seconds for me to tell you why I called, and you can decide if it makes sense to keep talking?\n\n(Wait for agreement)\n\nGreat. I noticed that {Company Name} is active in {Industry}. We help organizations in your sector optimize workflow efficiency.\n\nHow are you currently handling that bottleneck, and are you seeing the results you expected, or is that becoming a challenge for your team?\n\n(Listen to response)\n\nI'm not suggesting we make any changes today, but I'd love to share how peers in your industry are benchmarking this. Do you have 15 minutes later this week to compare notes?";
  });
 
  const [callMethod, setCallMethod] = useState<"system" | "google-voice" | "justcall" | "ringcentral">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lead_finder_call_method") as "system" | "google-voice" | "justcall" | "ringcentral") || "system";
    }
    return "system";
  });

  const handleSetCallMethod = (method: "system" | "google-voice" | "justcall" | "ringcentral") => {
    setCallMethod(method);
    if (typeof window !== "undefined") {
      localStorage.setItem("lead_finder_call_method", method);
    }
  };

  const [emailMethod, setEmailMethod] = useState<"gmail" | "outlook" | "yahoo">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lead_finder_email_method") as "gmail" | "outlook" | "yahoo") || "gmail";
    }
    return "gmail";
  });

  const handleSetEmailMethod = (method: "gmail" | "outlook" | "yahoo") => {
    setEmailMethod(method);
    if (typeof window !== "undefined") {
      localStorage.setItem("lead_finder_email_method", method);
    }
  };
 
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lead_finder_email_subject", emailSubject);
      localStorage.setItem("lead_finder_email_body", emailBody);
      localStorage.setItem("lead_finder_call_script", callScript);
    }
  }, [emailSubject, emailBody, callScript]);

  const orgId = userData?.ownedOrgId || userData?.orgId;

  const [monthlyUsageData, setMonthlyUsageData] = useState<any>(null);

  // Real-time listener for org data to sync billing plans (isPremium/isStandard/customLimit)
  useEffect(() => {
    if (!orgId) return;
    const unsub = onSnapshot(
      doc(db, "organizations", orgId), 
      (snap) => {
        if (snap.exists()) {
          setOrgData(snap.data());
        }
      },
      (error) => {
        console.error("Firestore organizations listener error:", error);
      }
    );
    return () => unsub();
  }, [orgId]);

  // Real-time listener for monthly usage data (Option B)
  useEffect(() => {
    if (!orgId) return;
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const unsub = onSnapshot(
      doc(db, "organizations", orgId, "leadFinderUsage", currentMonthKey),
      (snap) => {
        if (snap.exists()) {
          setMonthlyUsageData(snap.data());
        } else {
          setMonthlyUsageData(null);
        }
      },
      (error) => {
        console.error("Firestore monthly usage listener error:", error);
      }
    );
    return () => unsub();
  }, [orgId]);

  // Load shared team leads from Firebase Storage on startup
  useEffect(() => {
    if (orgId) {
      loadRosterFromServer(orgId);
    }
  }, [orgId, loadRosterFromServer]);

  // Quota Calculations (Premium / Standard on organization document levels, custom overriding)
  const isPremium = orgData?.isPremium || false;
  const isStandard = orgData?.isStandard || false;
  const customLimit = orgData?.leadFinder?.customLimit;

  let quotaLimit = 1500; // Default Freemium
  if (customLimit !== undefined && customLimit !== null) {
    quotaLimit = Number(customLimit);
  } else if (isPremium) {
    quotaLimit = 10000;
  } else if (isStandard) {
    quotaLimit = 5000;
  }

  // Calculate leadsUsed with Option B and backward compatibility fallback
  let leadsUsed = 0;
  if (monthlyUsageData) {
    leadsUsed = monthlyUsageData.leadsUsed || 0;
  } else {
    // DEPRECATED BACKWARD COMPATIBILITY BLOCK
    // TODO: Remove this block after current month ends (e.g. July 2026).
    leadsUsed = orgData?.leadFinderLeadsUsed !== undefined 
      ? orgData?.leadFinderLeadsUsed 
      : (orgData?.leadFinder?.leadsUsed || 0);
  }

  const leadsLeft = Math.max(0, quotaLimit - leadsUsed);

  // Secure Server-side Lead Fetching
  const handlePullLeads = async () => {
    if (!orgId) {
      toast.error("Organization ID not found.");
      return;
    }
    if (leadsLeft <= 0) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsPulling(true);
    const loadingToast = toast.loading("Mining B2B CEO databases...");

    try {
      const existingIds = leads.map((l) => l.id);

      const response = await fetch("/api/lead-finder/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orgId,
          pullState,
          pullIndustry,
          pullKeyword,
          pullCount,
          existingIds
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.error === "quota_reached") {
          toast.dismiss(loadingToast);
          setIsUpgradeModalOpen(true);
          setIsPulling(false);
          return;
        }
        throw new Error(resData.error || "Failed to query server-side leads database");
      }

      const returnedLeads = resData.leads || [];

      if (returnedLeads.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("No matches found in B2B database.");
        setIsPulling(false);
        return;
      }

      // Sync the retrieved prospects locally and upload flat JSON to storage
      await addLeads(returnedLeads, orgId);

      toast.dismiss(loadingToast);
      toast.success(`Success! Syncing ${returnedLeads.length} team leads.`);
      setIsPullModalOpen(false);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("API error:", err);
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to search leads");
    } finally {
      setIsPulling(false);
    }
  };

  // Helper to resolve outreach templates, stripping optional backticks
  const resolveTemplate = (template: string, lead: LeadFinderLead) => {
    const userName = userData?.name || "Admin";
    const replacements: Record<string, string> = {
      "First Name": lead["First Name"] || "there",
      "Last Name": lead["Last Name"] || "",
      "Company Name": lead["Company Name"] || "your company",
      "Industry": lead.Industry || "your industry",
      "User Name": userName,
    };

    let result = template;
    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\\`?{${key}}\\\`?`, "g");
      result = result.replace(regex, val);
    }
    return result;
  };
  // Click-to-Email outreach composition with dynamic tags
  const handleSendEmail = (lead: LeadFinderLead) => {
    if (!lead.Email) {
      toast.error("Lead does not have an email registered.");
      return;
    }

    const resolvedSubject = resolveTemplate(emailSubject, lead);
    const resolvedBody = resolveTemplate(emailBody, lead);

    let mailUrl = "";
    if (emailMethod === "outlook") {
      mailUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(lead.Email)}&subject=${encodeURIComponent(resolvedSubject)}&body=${encodeURIComponent(resolvedBody)}`;
    } else if (emailMethod === "yahoo") {
      mailUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(lead.Email)}&subj=${encodeURIComponent(resolvedSubject)}&body=${encodeURIComponent(resolvedBody)}`;
    } else {
      mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.Email)}&su=${encodeURIComponent(resolvedSubject)}&body=${encodeURIComponent(resolvedBody)}`;
    }

    window.open(mailUrl, "_blank");
    toast.success(`Launching pre-filled email for ${lead["First Name"] || "Lead"}`);
    
    // Globally sync that this lead has been contacted by this team member
    toggleCallStatus(lead.id, true, userData?.name || "Team Member", orgId);
  };

  // Launch phone call outreach
  const handlePhoneCall = (lead: LeadFinderLead) => {
    if (!lead.Phone) {
      toast.error("Lead does not have a phone number registered.");
      return;
    }

    let cleanPhone = lead.Phone.replace(/[^\d+]/g, "");
    if (cleanPhone.startsWith("1") && !cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    } else if (!cleanPhone.startsWith("+")) {
      if (cleanPhone.length === 10) {
        cleanPhone = "+1" + cleanPhone;
      }
    }

    // Resolve call script and copy to clipboard
    const resolvedScript = resolveTemplate(callScript, lead);
    navigator.clipboard.writeText(resolvedScript).then(() => {
      toast.success("Call script copied to clipboard!");
    }).catch((err) => {
      console.error("Clipboard copy failed:", err);
    });

    if (callMethod === "google-voice") {
      const gvUrl = `https://voice.google.com/u/0/calls?a=nc,${encodeURIComponent(cleanPhone)}`;
      window.open(gvUrl, "_blank");
      toast.success(`Opening Google Voice for ${lead["First Name"] || "Lead"}`);
    } else if (callMethod === "justcall") {
      const jcUrl = `https://app.justcall.io/dialer?numbers=${encodeURIComponent(cleanPhone)}`;
      window.open(jcUrl, "newWin", "width=385,height=665,location=no,status=no,menubar=no,toolbar=no");
      toast.success(`Opening JustCall for ${lead["First Name"] || "Lead"}`);
    } else if (callMethod === "ringcentral") {
      const rcUrl = `rcmobile://call?number=${encodeURIComponent(cleanPhone)}`;
      window.open(rcUrl);
      toast.success(`Opening RingCentral for ${lead["First Name"] || "Lead"}`);
    } else {
      const telUrl = `tel:${cleanPhone}`;
      window.open(telUrl);
      toast.success(`Launching dialer for ${lead["First Name"] || "Lead"}`);
    }

    toggleCallStatus(lead.id, true, userData?.name || "Team Member", orgId);
  };
  // Convert Prospect to active CRM Pipeline Deal
  const handleConvertToDeal = (lead: LeadFinderLead) => {
    setSelectedLeadForDeal(lead);
    setIsDealModalOpen(true);
    
    // Globally sync that this lead has been outreached
    toggleCallStatus(lead.id, true, userData?.name || "Team Member", orgId);
  };

  const dealInitialData = useMemo(() => {
    if (!selectedLeadForDeal) return {};
    const company = selectedLeadForDeal["Company Name"] || "";
    const revRaw = selectedLeadForDeal.Revenue || "";
    const revenueVal = parseFloat(revRaw.replace(/[^0-9.]/g, "")) || 100000;
    return {
      organization: company,
      firstName: selectedLeadForDeal["First Name"] || "",
      lastName: selectedLeadForDeal["Last Name"] || "",
      email: selectedLeadForDeal.Email || "",
      phone: selectedLeadForDeal.Phone || "",
      name: `${company} - Deal`,
      annualRevenue: revenueVal,
      title: selectedLeadForDeal.Title || "CEO",
      leadId: selectedLeadForDeal.id,
      origin: "Lead Finder",
      convertedBy: userData?.name || "Team Member",
    };
  }, [selectedLeadForDeal, userData]);

  // Client side filtering & sorting (CRM Leads hub style)
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Main Text Filter (Name, Company, Industry)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        const fullName = `${l["First Name"] || ""} ${l["Last Name"] || ""}`.toLowerCase();
        const company = (l["Company Name"] || "").toLowerCase();
        const industry = (l.Industry || "").toLowerCase();
        const title = (l.Title || "").toLowerCase();
        return fullName.includes(q) || company.includes(q) || industry.includes(q) || title.includes(q);
      });
    }

    // State dropdown filter
    if (filterState) {
      result = result.filter((l) => l["Primary State"] === filterState);
    }

    // Industry dropdown filter
    if (filterIndustry) {
      result = result.filter((l) => l.Industry === filterIndustry);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a["First Name"] || ""} ${a["Last Name"] || ""}`.trim().toLowerCase();
        const nameB = `${b["First Name"] || ""} ${b["Last Name"] || ""}`.trim().toLowerCase();
        return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === "company") {
        const compA = (a["Company Name"] || "").toLowerCase();
        const compB = (b["Company Name"] || "").toLowerCase();
        return sortDir === "asc" ? compA.localeCompare(compB) : compB.localeCompare(compA);
      }
      if (sortBy === "revenue") {
        const revA = parseFloat((a.Revenue || "").replace(/[^0-9.]/g, "")) || 0;
        const revB = parseFloat((b.Revenue || "").replace(/[^0-9.]/g, "")) || 0;
        return sortDir === "asc" ? revA - revB : revB - revA;
      }
      return sortDir === "asc" ? a.id - b.id : b.id - a.id;
    });

    return result;
  }, [leads, searchQuery, filterState, filterIndustry, sortBy, sortDir]);

  // Paginated roster
  const paginatedLeads = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredLeads.slice(startIdx, startIdx + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  // Unique values for filter lists
  const uniqueStatesInRoster = useMemo(() => {
    const statesSet = new Set(leads.map((l) => l["Primary State"]).filter(Boolean));
    return Array.from(statesSet).sort();
  }, [leads]);

  const uniqueIndustriesInRoster = useMemo(() => {
    const indSet = new Set(leads.map((l) => l.Industry).filter(Boolean));
    return Array.from(indSet).sort();
  }, [leads]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  return (
    <PaywallWrapper>
    <div className="p-4 md:p-6 space-y-6 flex flex-col h-full min-h-screen relative w-full font-sans text-foreground">
      
      {/* Dynamic pre-filled Deal Modal */}
      {selectedLeadForDeal && (
        <DealModal
          isOpen={isDealModalOpen}
          onOpenChange={(open) => {
            setIsDealModalOpen(open);
            if (!open) setSelectedLeadForDeal(null);
          }}
          mode="create"
          deal={null}
          initialData={dealInitialData}
          initialStage="lead"
          onClose={() => {
            setSelectedLeadForDeal(null);
            setIsDealModalOpen(false);
          }}
          onSubmitSuccess={async (dealId) => {
            if (selectedLeadForDeal) {
              await convertToDeal(selectedLeadForDeal.id, dealId, userData?.name || "Team Member", orgId);
              toast.success(`Deal launched successfully! ID: ${dealId}`);
            }
          }}
        />
      )}

      <TierStatusModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        tier={isPremium ? 'Premium' : (isStandard ? 'Standard' : 'Free')}
        leadsUsed={leadsUsed}
        quotaLimit={quotaLimit}
      />

      {/* Header bar: Minimalist, clean Apple design with subtle limit badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase font-poppins flex flex-wrap items-center gap-3">
            Lead Finder
            <button 
              onClick={() => setIsTierModalOpen(true)}
              className="group flex items-center gap-1.5 font-mono text-[9px] text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-bold transition-all cursor-pointer shadow-sm hover:shadow shrink-0 align-middle"
            >
              <Database size={11} className="text-purple-500 group-hover:scale-110 transition-transform" />
              <span>{leadsLeft.toLocaleString()} / {quotaLimit.toLocaleString()} REMAINING</span>
            </button>
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Collaborative Executive CEO Database & Outreach Hub
          </p>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-11 px-5 rounded-xl border-border/40 hover:bg-secondary/40 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all"
          >
            <Edit2 size={13} className="mr-2 text-indigo-500" /> Outreach Setup
          </Button>

          <Button
            onClick={() => {
              if (leadsLeft <= 0) {
                setIsUpgradeModalOpen(true);
              } else {
                setIsPullModalOpen(true);
              }
            }}
            className="h-11 px-6 font-black text-[10px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Search size={14} className="mr-1.5" /> Search Leads
          </Button>
        </div>
      </div>

      {/* Control filters bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-secondary/5 p-4 rounded-2xl border border-border/20">
        
        {/* Unified Search Input */}
        <div className="relative flex-1 group w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" size={16} />
          <Input
            placeholder="SEARCH BY NAME, COMPANY, INDUSTRY OR TITLE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background/50 border-border/40 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-indigo-500/10"
          />
        </div>

        {/* Dropdowns Filters row */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-border/40 font-black text-[10px] uppercase tracking-widest px-4 shadow-sm">
                State: {filterState || "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-60 overflow-y-auto border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-black uppercase py-2" onClick={() => setFilterState(null)}>
                All States
              </DropdownMenuItem>
              {uniqueStatesInRoster.map((st) => (
                <DropdownMenuItem key={st} className="text-[10px] font-bold uppercase py-2" onClick={() => setFilterState(st)}>
                  {st}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-border/40 font-black text-[10px] uppercase tracking-widest px-4 shadow-sm max-w-[200px] truncate">
                Industry: {filterIndustry || "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-black uppercase py-2" onClick={() => setFilterIndustry(null)}>
                All Industries
              </DropdownMenuItem>
              {uniqueIndustriesInRoster.map((ind) => (
                <DropdownMenuItem key={ind} className="text-[10px] font-bold uppercase py-2" onClick={() => setFilterIndustry(ind)}>
                  {ind}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-border/40 font-black text-[10px] uppercase tracking-widest px-4 shadow-sm">
                <ArrowUpDown size={13} className="mr-2 text-indigo-500" /> Sort: {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-bold uppercase py-2" onClick={() => setSortBy("updated")}>
                Default (Added)
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase py-2" onClick={() => setSortBy("name")}>
                Sort by Name
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase py-2" onClick={() => setSortBy("company")}>
                Sort by Company
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase py-2" onClick={() => setSortBy("revenue")}>
                Sort by Revenue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* Grid table representation */}
      <div className="flex-1 min-h-0">
        {storeLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/20 rounded-2xl bg-card/10 space-y-4">
            <RefreshCw className="size-8 text-indigo-500 animate-spin" />
            <h3 className="font-black text-xs uppercase tracking-wider text-muted-foreground animate-pulse">Syncing Team Roster...</h3>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/20 rounded-2xl bg-card/10 space-y-4">
            <Search className="size-10 text-muted-foreground/45" />
            <h3 className="font-black text-sm uppercase">
              {leads.length === 0 ? "Roster is Empty" : "No Matches"}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center max-w-sm mb-2">
              {leads.length === 0 
                ? "Your organization workspace is empty. Search the database to import prospects." 
                : "No loaded contacts match your active filters."}
            </p>
            {leads.length === 0 && (
              <Button
                onClick={() => {
                  if (leadsLeft <= 0) {
                    setIsUpgradeModalOpen(true);
                  } else {
                    setIsPullModalOpen(true);
                  }
                }}
                className="h-11 px-8 font-black text-[10px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 animate-bounce mt-2"
              >
                <Search size={14} /> Search Leads
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-border/20 rounded-2xl overflow-hidden bg-card/20 shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-secondary/15 border-b border-border/25 text-[10px] font-black uppercase tracking-widest text-muted-foreground select-none">
                    <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("name")}>
                      Name
                    </th>
                    <th className="p-4">
                      Title
                    </th>
                    <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("company")}>
                      Company
                    </th>
                    <th className="p-4">
                      Industry
                    </th>
                    <th className="p-4">
                      Location
                    </th>
                    <th className="p-4 cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("revenue")}>
                      Revenue
                    </th>
                    <th className="p-4 text-center">
                      Outreach
                    </th>
                    <th className="p-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10 text-[11px] font-bold">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-secondary/5 transition-all">
                      
                      {/* Full Name */}
                      <td className="p-4">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="block font-black text-sm uppercase italic">
                            {lead["First Name"] || ""} {lead["Last Name"] || ""}
                          </span>
                          {lead.isDeal && (
                            <span 
                              className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-wider border border-blue-500/20 shadow-sm shrink-0"
                              title={`Converted to Deal by ${lead.dealCreatedBy || 'Team Member'} on ${lead.dealCreatedAt ? new Date(lead.dealCreatedAt).toLocaleDateString() : ''} (ID: ${lead.dealId})`}
                            >
                              ✓ CRM Deal
                            </span>
                          )}
                          {lead.isCalled && !lead.isDeal && (
                            <span 
                              className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-sm shrink-0"
                              title={`Contacted by ${lead.calledBy || 'Team Member'} on ${lead.calledAt ? new Date(lead.calledAt).toLocaleDateString() : ''}`}
                            >
                              ✓ Contacted
                            </span>
                          )}
                        </div>
                        {lead.domain && (
                          <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-widest block mt-0.5">
                            {lead.domain}
                          </span>
                        )}
                      </td>

                      {/* Job Title */}
                      <td className="p-4 max-w-[200px] truncate">
                        <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[8px] uppercase font-black tracking-wider">
                          {lead.Title || "CEO"}
                        </span>
                      </td>

                      {/* Company Name */}
                      <td className="p-4 font-black uppercase text-xs tracking-wider">
                        {lead["Company Name"]}
                      </td>

                      {/* Industry Vertical */}
                      <td className="p-4 text-muted-foreground text-[10px] uppercase max-w-[180px] truncate">
                        {lead.Industry || "N/A"}
                      </td>

                      {/* Geographic Location */}
                      <td className="p-4">
                        <span className="block uppercase text-[10px]">
                          {lead["Primary City"] || "N/A"}, {lead["Primary State"] || ""}
                        </span>
                      </td>

                      {/* Company Financial size */}
                      <td className="p-4">
                        <span className="block text-indigo-500 font-black">
                          {lead.Revenue || "N/A"}
                        </span>
                        {lead.Employee && (
                          <span className="text-[9px] text-muted-foreground/60 font-black uppercase block">
                            {lead.Employee} Employees
                          </span>
                        )}
                      </td>

                      {/* Dialer & Email Outreaches */}
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2">
                          {lead.Phone ? (
                            <button
                              onClick={() => handlePhoneCall(lead)}
                              className="size-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-all shadow-sm border border-emerald-500/20 active:scale-95"
                              title={`Call: ${lead.Phone}`}
                            >
                              <Phone className="size-3.5" />
                            </button>
                          ) : (
                            <span className="size-8 rounded-xl bg-secondary/50 text-muted-foreground/20 flex items-center justify-center border border-border/10 cursor-not-allowed">
                              <Phone className="size-3.5 grayscale" />
                            </span>
                          )}

                          {lead.Email ? (
                            <button
                              onClick={() => handleSendEmail(lead)}
                              className="size-8 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 flex items-center justify-center transition-all shadow-sm border border-indigo-500/20 active:scale-95"
                              title={`Compose outreach: ${lead.Email}`}
                            >
                              <Send className="size-3.5" />
                            </button>
                          ) : (
                            <span className="size-8 rounded-xl bg-secondary/50 text-muted-foreground/20 flex items-center justify-center border border-border/10 cursor-not-allowed">
                              <Send className="size-3.5 grayscale" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Roster actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {lead.isDeal ? (
                            <Link href="/crm/deals">
                              <Button
                                size="sm"
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded-xl h-8 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                              >
                                <Check size={11} strokeWidth={3} /> Deal Active
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConvertToDeal(lead)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/15 active:scale-95 transition-all"
                            >
                              <Briefcase className="size-3 mr-1.5" /> Launch Deal
                            </Button>
                          )}
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={async () => {
                              await deleteLeadLocal(lead.id, orgId);
                              toast.info("Prospect removed from shared workspace.");
                            }}
                            className="size-8 rounded-xl text-destructive hover:bg-destructive/10 border border-border/10 hover:border-destructive/20 active:scale-95"
                            title="Remove locally"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grid pagination footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary/5 border-t border-border/20 p-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rows per page</span>
                <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(parseInt(val))}>
                  <SelectTrigger className="h-8 rounded-lg w-16 bg-card border-border/10 text-[10px] font-black">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-card/95 backdrop-blur-xl">
                    {[10, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()} className="text-[10px] font-black py-2">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">
                  Showing {Math.min(filteredLeads.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredLeads.length, currentPage * pageSize)} of {filteredLeads.length} leads
                </span>
              </div>

              {/* Prev / Next Page */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="size-8 rounded-xl bg-card border-border/10 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="size-8 rounded-xl bg-card border-border/10 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG 1: Search Leads Dialog */}
      <Dialog open={isPullModalOpen} onOpenChange={setIsPullModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-2xl border-border/40 rounded-[2rem] p-6 shadow-3xl">
          <DialogHeader className="pb-4 border-b border-border/10">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Search Leads</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Search Keyword (Optional)</label>
              <Input
                placeholder="E.G. TECH, OUTREACH, FORBES..."
                value={pullKeyword}
                onChange={(e) => setPullKeyword(e.target.value)}
                className="h-11 bg-secondary/5 border-border/20 rounded-xl text-[10px] font-black focus:ring-indigo-500/10 uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Target US State</label>
              <Select value={pullState} onValueChange={setPullState}>
                <SelectTrigger className="h-11 rounded-xl bg-secondary/5 border-border/20 text-[10px] font-black uppercase tracking-wider">
                  <SelectValue placeholder="SELECT US STATE..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card/95 backdrop-blur-xl max-h-52">
                  <SelectItem value="all" className="text-[10px] font-black uppercase py-2">All US States</SelectItem>
                  {US_STATES.map((st) => (
                    <SelectItem key={st.value} value={st.value} className="text-[10px] font-black uppercase py-2">
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Industry Vertical</label>
              <Select value={pullIndustry} onValueChange={setPullIndustry}>
                <SelectTrigger className="h-11 rounded-xl bg-secondary/5 border-border/20 text-[10px] font-black uppercase tracking-wider">
                  <SelectValue placeholder="SELECT INDUSTRY..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card/95 backdrop-blur-xl max-h-52">
                  <SelectItem value="all" className="text-[10px] font-black uppercase py-2">All Industries</SelectItem>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind} className="text-[10px] font-black uppercase py-2">
                      {ind.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Pull Size</label>
              <Select value={pullCount.toString()} onValueChange={(val) => setPullCount(parseInt(val))}>
                <SelectTrigger className="h-11 rounded-xl bg-secondary/5 border-border/20 text-[10px] font-black uppercase tracking-wider">
                  <SelectValue placeholder="100 Prospects" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card/95 backdrop-blur-xl">
                  {PULL_LIMITS.map((lim) => (
                    <SelectItem key={lim} value={lim.toString()} className="text-[10px] font-black uppercase py-2">
                      {lim} Prospects
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          <DialogFooter className="pt-4 border-t border-border/10 flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl font-black text-[10px] uppercase tracking-widest h-11 px-5 flex-1"
              onClick={() => setIsPullModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handlePullLeads}
              disabled={isPulling}
              className="rounded-xl font-black text-[10px] uppercase tracking-widest h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex-1"
            >
              {isPulling ? <RefreshCw className="size-4 animate-spin justify-center mx-auto" /> : "Search & Import Leads"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Outreach Template customizer Modal */}      <OutreachSetupModal
        isOpen={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        emailSubject={emailSubject}
        emailBody={emailBody}
        callScript={callScript}
        callMethod={callMethod}
        setCallMethod={handleSetCallMethod}
        emailMethod={emailMethod}
        setEmailMethod={handleSetEmailMethod}
      />
      {/* DIALOG 3: High-Converting Apple-Style Quota Upgrade Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-md border border-border/40 rounded-3xl p-8 bg-card/95 backdrop-blur-2xl text-foreground font-sans shadow-2xl">
          <DialogHeader className="space-y-3 text-center">
            <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-500 shadow-sm animate-pulse">
              <Database size={32} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-center">
              Extend Lead Quota Limit
            </DialogTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
              Accelerate B2B Prospecting Operations
            </p>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <p className="text-xs font-bold text-center text-muted-foreground uppercase leading-relaxed">
              Your organization's B2B Lead Finder quota has been fully utilized. Upgrade your subscription to continue mining verified US corporate executive contacts, sync sales deals globally, and launch AI cold email campaigns.
            </p>
            
            <div className="border border-border/20 rounded-2xl p-4 bg-secondary/5 space-y-3">
              {[
                "Unlimited direct dials & validated emails",
                "Advanced B2B search parameters & filters",
                "Built-in employee-first AI Super Copilot cadences",
                "One-click collaborative CRM Deals board sync"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="h-12 rounded-xl border border-border/40 text-[10px] font-black uppercase tracking-widest flex-1 transition-all"
            >
              Maybe Later
            </Button>
            <Link href="/pricing" className="flex-1" onClick={() => setIsUpgradeModalOpen(false)}>
              <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                Unlock Premium Leads <ArrowRight size={14} />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </PaywallWrapper>
  );
}
