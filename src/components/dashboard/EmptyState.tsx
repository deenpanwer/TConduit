"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, Download, Copy, Check, Share2, Ticket, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { MonitoringDashboard } from "@/components/dashboard/MonitoringDashboard";

interface EmptyStateProps {
  orgName: string;
  inviteCode: string;
  onCopy: () => void;
  onShare: () => void;
  copied: boolean;
}

export function EmptyState({ orgName, inviteCode, onCopy, onShare, copied }: EmptyStateProps) {
  // Dummy data for the preview
  const dummyEmployees = [
    { id: 1, name: "Sarah Chen", role: "Senior Engineer", email: "sarah@trac.ai" },
    { id: 2, name: "Mike Ross", role: "Product Designer", email: "mike@trac.ai" },
    { id: 3, name: "Jessica Lee", role: "DevOps Lead", email: "jess@trac.ai" }
  ];

  return (
    <div className="max-w-6xl mx-auto mt-4 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Invite Hero Section */}
      <div className="bg-card border-2 border-primary/20 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-primary/10 transition-colors" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="size-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-inner rotate-3">
            <UserPlus size={40} className="text-primary" />
          </div>
          
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              Add Your First Employee
            </h1>
            <p className="text-muted-foreground font-medium text-base md:text-lg uppercase tracking-tight">
              Your dashboard will stay empty until you connect <span className="text-foreground font-bold">{orgName}</span> to your first staff member.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border/50 text-left space-y-4">
              <div className="size-10 bg-background rounded-xl flex items-center justify-center border shadow-sm font-black text-primary">1</div>
              <h3 className="font-black uppercase tracking-widest text-xs">Send the App Link</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase">
                Ask your employee to download the Trac Diary app on their computer.
              </p>
              <Link href="/trac-diary" className="inline-flex items-center text-[10px] font-black text-primary uppercase hover:underline">
                View App Link <ExternalLink size={12} className="ml-1" />
              </Link>
            </div>

            <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border/50 text-left space-y-4">
              <div className="size-10 bg-background rounded-xl flex items-center justify-center border shadow-sm font-black text-primary">2</div>
              <h3 className="font-black uppercase tracking-widest text-xs">Share Your Code</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase">
                Give them the unique code below to paste into their app profile to connect.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase">
                <Check size={12} /> Connects Instantly
              </div>
            </div>
          </div>

          {/* Code Container */}
          <div className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 shadow-xl space-y-6">
            <div className="flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Your Invite Code</p>
                <div className="text-5xl font-black tracking-[0.4em] text-foreground tabular-nums mb-8 pl-4">
                    {inviteCode || "------"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
                    <Button 
                        onClick={onCopy} 
                        size="lg" 
                        className="rounded-2xl min-h-[3.5rem] h-auto py-3 font-black uppercase tracking-tight sm:tracking-widest gap-2 shadow-xl shadow-primary/20 text-xs sm:text-sm whitespace-normal text-center"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "Copied" : "Copy Code"}
                    </Button>
                    <Button 
                        onClick={onShare} 
                        variant="outline" 
                        size="lg" 
                        className="rounded-2xl min-h-[3.5rem] h-auto py-3 font-black uppercase tracking-tight sm:tracking-widest gap-2 text-xs sm:text-sm whitespace-normal text-center"
                    >
                        <Share2 size={18} />
                        Share
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blurred Preview Section */}
      <div className="relative">
        {/* Overlay Label */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-md border border-border px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
                <div className="size-3 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Waiting for your first employee...</span>
            </div>
        </div>

        {/* The Blurred Dashboard */}
        <div className="opacity-30 grayscale blur-[2px] pointer-events-none select-none">
            <MonitoringDashboard employees={dummyEmployees} />
        </div>
      </div>
    </div>
  );
}