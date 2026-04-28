"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Users, LayoutDashboard, FileText, CheckCircle2, 
  ChevronRight, ArrowLeft, Loader2, Download, Printer, 
  Plus, DollarSign, Clock, BarChart3, X, User, Upload, Sparkles,
  Calendar, History, Paperclip, AlertCircle, MoreVertical, GripVertical, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useCRMLeads } from "@/hooks/use-crm-leads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import confetti from 'canvas-confetti';
import { toast } from "sonner";

// --- Mock Components for Preview ---

const MockTable = ({ clients, visibleColumns, title = "Leads" }: { clients: string[], visibleColumns: string[], title?: string }) => (
  <div className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl scale-110 transition-transform duration-500">
    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{title}</h3>
      <div className="flex gap-2">
        <div className="size-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="size-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
    <table className="w-full text-left text-[11px] font-bold uppercase tracking-widest">
      <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-black">
        <tr>
          <th className="p-5 w-1"><div className="w-1 h-5 bg-emerald-500 rounded-full" /></th>
          <th className="p-5 w-14"><div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800" /></th>
          <th className="p-5 min-w-[150px]">Name</th>
          {visibleColumns.includes("status") && <th className="p-5">Status</th>}
          {visibleColumns.includes("date") && <th className="p-5">Due date</th>}
          {visibleColumns.includes("money") && <th className="p-5">Budget</th>}
          {visibleColumns.includes("notes") && <th className="p-5">Notes</th>}
          {visibleColumns.includes("updated") && <th className="p-5">Updated</th>}
          {visibleColumns.includes("files") && <th className="p-5">Files</th>}
          {visibleColumns.includes("priority") && <th className="p-5">Priority</th>}
          {visibleColumns.includes("timeline") && <th className="p-5">Timeline</th>}
          <th className="p-5 w-14"><Plus size={14} className="text-slate-300" /></th>
        </tr>
      </thead>
      <tbody>
        {clients.map((name, i) => (
          <motion.tr 
            key={i} 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="border-b border-slate-100 dark:border-slate-800/50 group"
          >
            <td className="p-5 w-1"><div className={cn("w-1 h-10 rounded-full", i % 2 === 0 ? "bg-emerald-500" : "bg-rose-500")} /></td>
            <td className="p-5"><div className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-800" /></td>
            <td className="p-5 text-slate-900 dark:text-white font-black text-xs">{name || "..."}</td>
            
            {visibleColumns.includes("status") && (
              <td className="p-5">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9px] font-black px-3 py-1">NEW</Badge>
              </td>
            )}
            {visibleColumns.includes("date") && <td className="p-5 text-slate-400 font-black">JUL 12</td>}
            {visibleColumns.includes("money") && <td className="p-5 text-emerald-600 font-black">$0</td>}
            {visibleColumns.includes("notes") && <td className="p-5 text-slate-300"><FileText size={14} /></td>}
            {visibleColumns.includes("updated") && <td className="p-5 text-[9px] text-slate-400 uppercase font-black">2m ago</td>}
            {visibleColumns.includes("files") && <td className="p-5 text-slate-300"><Paperclip size={14} /></td>}
            {visibleColumns.includes("priority") && (
              <td className="p-5">
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black px-3 py-1">MED</Badge>
              </td>
            )}
            {visibleColumns.includes("timeline") && (
              <td className="p-5">
                <div className="w-20 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-blue-500" />
                </div>
              </td>
            )}
            <td className="p-5" />
          </motion.tr>
        ))}
        <tr className="bg-slate-50/30 dark:bg-slate-900/10">
          <td className="p-5 w-1"><div className="w-1 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
          <td className="p-5"><div className="w-5 h-5 rounded-md border border-slate-100 dark:border-slate-900" /></td>
          <td colSpan={10} className="p-5 text-[10px] text-slate-400 font-black tracking-widest">+ ADD ITEM</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const MockKanban = ({ clients }: { clients: string[] }) => (
  <div className="flex gap-6 h-[500px] overflow-hidden scale-110 transition-transform duration-500">
    {[
      { label: "New", count: clients.length, color: "#00a9ff", items: clients },
      { label: "In Progress", count: 0, color: "#a25ddc", items: [] },
      { label: "Done", count: 0, color: "#00ca72", items: [] }
    ].map((stage, i) => (
      <div key={stage.label} className="w-80 shrink-0 bg-[#f5f6f8] dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xl">
        {/* Stage Header */}
        <div 
          style={{ backgroundColor: stage.color }}
          className="p-4 flex items-center justify-between min-h-[56px] text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest drop-shadow-sm">{stage.label}</h3>
            <span className="text-[10px] font-black bg-black/10 px-2.5 py-1 rounded-full">{stage.count}</span>
          </div>
          <div className="flex gap-2">
            <Plus size={16} className="opacity-80" />
            <MoreVertical size={16} className="opacity-80" />
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          {stage.items.map((name, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md group hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white truncate">{name}</p>
              </div>
              <div className="space-y-2 ml-6">
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[8px] font-black text-blue-500 border border-blue-500/20">AI</div>
                  <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center ml-6">
                <div className="flex gap-3 text-slate-300">
                  <MessageSquare size={12} />
                  <Paperclip size={12} />
                </div>
                <div className="size-5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
              </div>
            </motion.div>
          ))}
          {stage.items.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-40">
              <Plus size={20} className="text-slate-300" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Add Lead</span>
            </div>
          )}
        </div>
      </div>
    ))}
    {/* Add Stage Placeholder */}
    <div className="w-14 shrink-0 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-10 opacity-30">
      <Plus size={20} className="text-slate-400" />
      <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.3em] mt-6 text-slate-400">Add Stage</span>
    </div>
  </div>
);

const MockInvoice = ({ clientName, userName }: { clientName: string, userName: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    className="w-full max-w-[700px] bg-white dark:bg-slate-950 shadow-[0_60px_120px_rgba(0,0,0,0.15)] rounded-sm aspect-[1/1.4142] p-12 md:p-16 flex flex-col text-slate-800 dark:text-slate-200 relative overflow-hidden scale-110"
  >
    {/* Header */}
    <div className="flex justify-between items-start mb-12">
      <div className="space-y-6">
        <div className="h-14 w-28 bg-slate-100 dark:bg-slate-900/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Sparkles className="text-blue-500" size={24} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">INVOICE</h1>
          <p className="text-xs font-black text-blue-600/60 tracking-[0.3em]">#INV-94021</p>
        </div>
      </div>
      <div className="text-right space-y-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Outstanding</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white">$5,000.00</p>
        </div>
      </div>
    </div>

    {/* Parties Grid */}
    <div className="grid grid-cols-2 gap-10 mb-12 bg-slate-50/50 dark:bg-slate-900/30 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">FROM</p>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase text-slate-900 dark:text-white">{userName || 'Your Name'}</p>
          <p className="text-[11px] font-medium opacity-60 leading-tight">Your Business Address</p>
        </div>
      </div>
      <div className="space-y-3 text-right">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-600">BILL TO</p>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase text-slate-900 dark:text-white">{clientName || 'Client Name'}</p>
          <p className="text-[11px] font-medium opacity-60 ml-auto leading-tight">Client Billing Address</p>
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="flex-1">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-slate-900 dark:border-white">
            <th className="py-5 text-[10px] font-black uppercase tracking-[0.3em]">Description</th>
            <th className="py-5 text-right text-[10px] font-black uppercase tracking-[0.3em] w-32">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          <tr>
            <td className="py-6 pr-4">
              <p className="text-[14px] font-black uppercase text-slate-900 dark:text-white">Professional Services</p>
              <p className="text-[11px] font-medium opacity-50 uppercase mt-1">Lead Conversion & CRM Setup</p>
            </td>
            <td className="py-6 text-right text-[14px] font-black text-slate-900 dark:text-white">$5,000.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="mt-12 pt-10 border-t-2 border-slate-900 dark:border-white flex justify-between items-end">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Payment Instructions</p>
        <p className="text-[11px] font-mono font-bold opacity-70 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          Bank: Central International<br/>Account: 0094-2819-4402
        </p>
      </div>
      <div className="text-right">
        <div className="inline-block border-b-2 border-slate-900 dark:border-white min-w-[200px] text-center pb-2">
          <p className="text-3xl font-dancing italic tracking-[0.1em] text-slate-900 dark:text-white">
            {userName || 'Signature'}
          </p>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-3">Authorized Acceptance</p>
      </div>
    </div>
  </motion.div>
);

const MockDashboard = () => (
  <div className="grid grid-cols-2 gap-8 w-full max-w-5xl scale-110">
    <div className="col-span-2 bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Revenue Overview</h3>
      <div className="flex items-end gap-4 h-48">
        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.1 }}
            className="flex-1 bg-blue-600 rounded-t-2xl shadow-lg"
          />
        ))}
      </div>
    </div>
    <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center">
      <div className="size-32 rounded-full border-[10px] border-blue-600 border-t-transparent animate-spin-slow shadow-inner" />
      <p className="text-xs font-black uppercase tracking-[0.3em] mt-8 text-slate-400">Leads Split</p>
    </div>
    <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-center">
      <p className="text-5xl font-black text-blue-600 tracking-tighter">$45,280</p>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Total Pipeline</p>
    </div>
  </div>
);

// --- Main Page ---

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const { addEntity: addLead } = useCRMLeads();
  const [finishing, setFinishing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || "/crm/leads";

  const [formData, setFormData] = useState({
    client1: "Jane Cooper",
    client2: "",
    dealValue: "",
    visibleColumns: ["status", "date"] as string[],
    viewType: "list" as "list" | "kanban",
  });

  const handleFinish = async () => {
    if (!user || !userData) return;
    setFinishing(true);
    try {
      // Helper to split names
      const splitName = (fullName: string) => {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return { firstName: parts[0], lastName: "" };
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ");
        return { firstName, lastName };
      };

      // 1. Create real leads
      if (formData.client1 !== "Jane Cooper" && formData.client1.trim()) {
        const { firstName, lastName } = splitName(formData.client1);
        await addLead({ 
          name: formData.client1, 
          data: { 
            firstName, 
            lastName, 
            status: 'new', 
            source: 'onboarding', 
            value: formData.dealValue 
          } 
        });
      }
      if (formData.client2.trim()) {
        const { firstName, lastName } = splitName(formData.client2);
        await addLead({ 
          name: formData.client2, 
          data: { 
            firstName, 
            lastName, 
            status: 'new', 
            source: 'onboarding' 
          } 
        });
      }

      // 2. Mark tour as complete
      await updateDoc(doc(db, "users", user.uid), {
        crmTourCompleted: true,
        updatedAt: new Date().toISOString()
      });

      await refreshUserData();

      // Haptic feedback
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }

      // Premium Confetti Burst
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      toast.success("Welcome to your Business Hub!", {
        description: "Your workspace is primed and ready for launch."
      });
      
      setTimeout(() => {
        router.push(callbackUrl);
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete setup.");
      setFinishing(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.client2.trim()) {
      toast.error("Please enter at least two lead names.");
      return;
    }
    if (step === 6) handleFinish();
    else setStep(s => s + 1);
  };

  const clients = useMemo(() => [formData.client1 || "Jane Cooper", formData.client2 || "Guy Hawkins"], [formData.client1, formData.client2]);
  const userName = userData?.name || user?.displayName || "Member";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const Branding = () => (
    <div className="flex items-center gap-3">
      <div className="size-12 bg-blue-500/10 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/5">
        <Sparkles size={24} className="text-foreground fill-foreground" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black uppercase tracking-tight text-foreground">trac ai</span>
        <span className="text-3xl font-light uppercase tracking-tight text-foreground">crm</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-background flex flex-col md:flex-row overflow-hidden font-poppins relative text-foreground">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        .font-dancing { font-family: 'Dancing Script', cursive; }
        .perspective-1000 { perspective: 1000px; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sandbox-recessed {
            box-shadow: inset 0 20px 80px -20px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.05);
        }
        .dark .sandbox-recessed {
            box-shadow: inset 0 20px 80px -20px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>

      {/* Left Panel: Conversation (40%) */}
      <div className="w-full md:w-[40%] h-full border-r border-border/40 flex flex-col bg-card/50 backdrop-blur-xl shrink-0 z-20 shadow-2xl relative">
        <div className="p-8 md:p-12 pb-0">
          <div className="flex flex-col gap-4 w-full">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
              THIS ONLY TAKES A MINUTE
            </span>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
               <motion.div 
                className="h-full bg-blue-600" 
                animate={{ width: `${(step / 6) * 100}%` }} 
               />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full py-12 text-foreground">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Branding />
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">Next, add a few <span className="text-blue-600 italic">leads</span></h1>
                  </div>
                  <p className="text-base font-medium text-muted-foreground leading-relaxed italic opacity-80">
                    💡 Each row represents a single lead. You can add more information later.
                  </p>
                  <div className="space-y-4">
                    <Input 
                      placeholder="e.g. Jane Cooper" 
                      value={formData.client1} 
                      onChange={(e) => setFormData({...formData, client1: e.target.value})}
                      className="h-16 bg-secondary/40 border-none rounded-2xl text-[13px] font-black uppercase tracking-widest px-8 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-foreground"
                    />
                    <Input 
                      placeholder="e.g. Guy Hawkins" 
                      value={formData.client2} 
                      onChange={(e) => setFormData({...formData, client2: e.target.value})}
                      className={cn(
                        "h-16 bg-secondary/40 border-none rounded-2xl text-[13px] font-black uppercase tracking-widest px-8 transition-all focus-visible:ring-2 focus-visible:ring-blue-500/20 text-foreground",
                        !formData.client2.trim() && "ring-2 ring-blue-500/20"
                      )}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Branding />
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">Select your <span className="text-blue-600 italic">columns</span></h1>
                  </div>
                  <p className="text-base font-medium text-muted-foreground leading-relaxed italic opacity-80">
                    💡 Choose from the most popular column types for your work.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'status', label: 'Status', icon: CheckCircle2, color: "text-emerald-500" },
                      { id: 'date', label: 'Due date', icon: Calendar, color: "text-purple-500" },
                      { id: 'money', label: 'Budget', icon: DollarSign, color: "text-amber-500" },
                      { id: 'notes', label: 'Notes', icon: FileText, color: "text-amber-400" },
                      { id: 'updated', label: 'Last updated', icon: History, color: "text-purple-400" },
                      { id: 'files', label: 'Files', icon: Paperclip, color: "text-rose-500" },
                      { id: 'priority', label: 'Priority', icon: AlertCircle, color: "text-emerald-400" },
                      { id: 'timeline', label: 'Timeline', icon: Clock, color: "text-purple-500" }
                    ].map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          const exists = formData.visibleColumns.includes(tool.id);
                          setFormData({...formData, visibleColumns: exists ? formData.visibleColumns.filter(c => c !== tool.id) : [...formData.visibleColumns, tool.id]});
                        }}
                        className={cn(
                          "p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all h-32",
                          formData.visibleColumns.includes(tool.id) ? "border-blue-600 bg-blue-600/5 text-blue-600 shadow-lg" : "border-slate-100 dark:border-slate-800 bg-secondary/20 hover:border-slate-300"
                        )}
                      >
                        <tool.icon size={28} className={cn(!formData.visibleColumns.includes(tool.id) && tool.color)} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Branding />
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">Add a <span className="text-blue-600 italic">view layout</span></h1>
                  </div>
                  <p className="text-base font-medium text-muted-foreground leading-relaxed italic opacity-80">
                    💡 Transform the way you see and manage your work with more unique views. You can always add more later.
                  </p>
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => setFormData({...formData, viewType: 'list'})}
                      className={cn(
                        "p-8 rounded-[2rem] border-2 flex items-center justify-between transition-all shadow-sm",
                        formData.viewType === 'list' ? "border-blue-600 bg-blue-600/5" : "border-slate-100 dark:border-slate-800 bg-secondary/20"
                      )}
                    >
                      <div className="flex items-center gap-6 text-left">
                        <div className={cn("p-4 rounded-2xl", formData.viewType === 'list' ? "bg-blue-600 text-white shadow-xl" : "bg-card text-muted-foreground")}><LayoutDashboard size={32} /></div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest text-foreground">Clean List</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Best for scanning details</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setFormData({...formData, viewType: 'kanban'})}
                      className={cn(
                        "p-8 rounded-[2rem] border-2 flex items-center justify-between transition-all shadow-sm",
                        formData.viewType === 'kanban' ? "border-blue-600 bg-blue-600/5" : "border-slate-100 dark:border-slate-800 bg-secondary/20"
                      )}
                    >
                      <div className="flex items-center gap-6 text-left">
                        <div className={cn("p-4 rounded-2xl", formData.viewType === 'kanban' ? "bg-blue-600 text-white shadow-xl" : "bg-card text-muted-foreground")}><Users size={32} /></div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest text-foreground">Visual Board</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Best for tracking progress</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Branding />
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">Got the <span className="text-blue-600 italic">sale!</span></h1>
                  </div>
                  <p className="text-base font-medium text-muted-foreground leading-relaxed italic opacity-80">
                    💡 One of your leads is ready to convert! Turn {clients[0]} into an active business opportunity.
                  </p>
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase text-blue-600 ml-1 tracking-widest">Deal Value (Optional)</p>
                     <Input 
                        placeholder="e.g. $5,000" 
                        value={formData.dealValue} 
                        onChange={(e) => setFormData({...formData, dealValue: e.target.value})}
                        className="h-16 bg-secondary/40 border-none rounded-2xl text-[13px] font-black uppercase tracking-widest px-8 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-foreground"
                      />
                  </div>
                  <Button 
                    onClick={handleNext}
                    className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    Launch First Deal
                  </Button>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Branding />
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">Get <span className="text-blue-600 italic">Paid.</span></h1>
                  </div>
                  <p className="text-base font-medium text-muted-foreground leading-relaxed italic opacity-80">
                    💡 One click turns your deal with {clients[0]} into a professional request for payment.
                  </p>
                  
                  <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-blue-600 ml-1 tracking-widest">Authorized Signature</p>
                      <div className="relative group">
                          <Input 
                            value={userName} 
                            readOnly
                            className="h-20 bg-secondary/40 border-none rounded-2xl text-3xl font-dancing italic tracking-widest px-8 focus-visible:ring-0 shadow-inner text-foreground"
                          />
                          <div className="absolute top-2 right-4 text-[10px] font-black uppercase text-blue-600/40 text-right">
                              Authenticated as<br/>{userName}
                          </div>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase text-center opacity-60">Signature automatically generated from your profile.</p>
                  </div>

                  <Button 
                    onClick={handleNext}
                    className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    Generate Invoice
                  </Button>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-10 text-center">
                  <div className="size-24 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-10 shadow-2xl shadow-blue-500/40 rotate-3">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight">You're <span className="text-blue-600 italic">Ready!</span></h1>
                    <p className="text-base font-medium text-muted-foreground leading-relaxed opacity-70">
                        Your Business Hub is optimized and ready to handle your first lead.
                    </p>
                  </div>
                  <Button 
                    onClick={handleFinish}
                    disabled={finishing}
                    className="w-full h-20 bg-foreground text-background hover:bg-foreground/90 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-10"
                  >
                    {finishing ? <Loader2 className="animate-spin" /> : "TAKE ME TO MY HUB!"}
                  </Button>
                </div>
              )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="p-8 md:p-12 pt-0">
          <div className="pt-8 border-t border-border/40 flex items-center justify-between gap-4">
            <div className="flex-1">
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground">
                  <ArrowLeft size={16} className="mr-3" /> Back
                </Button>
              )}
            </div>
            <Button onClick={handleNext} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20">
              Continue <ChevronRight size={16} className="ml-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel: Live Stage (60%) */}
      <div className="flex-1 h-full bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center z-10 sandbox-recessed">
        {/* Global Stage Elements */}
        <button 
          onClick={() => setSkipDialogOpen(true)}
          className="absolute top-8 right-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-2xl text-foreground"
        >
          Skip Tour <X size={14} />
        </button>

        <div className="absolute top-8 left-8 z-50">
           <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800/40 rounded-[2rem] p-4 flex items-center gap-4 shadow-2xl">
              <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/40 shrink-0">
                  <CheckCircle2 size={18} />
              </div>
              <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-0.5">Highly Recommended</p>
                  <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase leading-tight opacity-80">
                    Increases efficiency by 10% from the first hour.
                  </p>
              </div>
           </div>
        </div>

        {/* The Evolving UI */}
        <div className="w-full h-full flex items-center justify-center perspective-1000 p-12 md:p-16 lg:p-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.85, rotateX: 5 }}
              animate={{ opacity: 1, scale: 0.95, rotateX: 0 }}
              exit={{ opacity: 0, scale: 1.05, rotateX: -5 }}
              className="w-full h-full flex items-center justify-center"
            >
              {(step === 1 || step === 2) && <MockTable clients={clients} visibleColumns={formData.visibleColumns} title="Leads" />}
              {step === 3 && (formData.viewType === 'list' ? <MockTable clients={clients} visibleColumns={formData.visibleColumns} title="Leads" /> : <MockKanban clients={clients} />)}
              {step === 4 && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="opacity-30 scale-90 blur-sm pointer-events-none transition-all duration-700">
                        <MockTable clients={clients} visibleColumns={formData.visibleColumns} title="Leads" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                            initial={{ y: 50, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] shadow-[0_80px_160px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-800 w-[400px] relative z-20"
                        >
                            <div className="size-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/30"><DollarSign size={28} strokeWidth={3} /></div>
                            <h3 className="text-lg font-black uppercase tracking-[0.1em] mb-4 text-slate-400 leading-tight text-center">New Deal for<br/><span className="text-slate-900 dark:text-white text-2xl">{clients[0]}</span></h3>
                            <div className="space-y-3">
                                <div className="h-14 bg-slate-100 dark:bg-slate-900 rounded-[1.2rem] flex items-center px-6 text-base font-black uppercase tracking-widest text-blue-600 shadow-inner">
                                    {formData.dealValue ? `$${formData.dealValue}` : "Set Value..."}
                                </div>
                                <div className="h-14 bg-slate-100 dark:bg-slate-900 rounded-[1.2rem] flex items-center px-6 opacity-40">
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>
                                <Button className="w-full h-14 bg-blue-600 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] mt-2 shadow-xl">Launch Deal</Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
              )}
              {step === 5 && <div className="scale-90 lg:scale-100 transition-transform"><MockInvoice clientName={clients[0]} userName={userName} /></div>}
              {step === 6 && <div className="grid grid-cols-2 gap-8 w-full scale-90 lg:scale-100 transition-transform"><MockTable clients={clients} visibleColumns={formData.visibleColumns} title="Leads" /><MockDashboard /></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="size-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
              <Sparkles size={32} />
            </div>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter">Skip Onboarding?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-muted-foreground leading-relaxed italic">
              This onboarding is highly recommended to get the most out of your hub. Are you sure you want to skip?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-widest flex-1">Go Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinish}
              className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest flex-1 shadow-lg shadow-blue-500/20"
            >
              Skip Tour
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CRMOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
