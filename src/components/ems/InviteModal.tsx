"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ticket, Copy, Check, UserCircle, Link as LinkIcon, MessageCircle, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { useRouter } from "next/navigation";

interface InviteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "employee" | "manager" | "manual";

export function InviteModal({ isOpen, onOpenChange }: InviteModalProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [orgData, setOrgData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("employee");

  useEffect(() => {
    async function fetchOrgDetails() {
      const targetOrgId = userData?.ownedOrgId || userData?.orgId;
      if (targetOrgId && isOpen) {
        const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
        if (orgDoc.exists()) setOrgData({ id: orgDoc.id, ...orgDoc.data() });
      }
    }
    fetchOrgDetails();
  }, [userData, isOpen]);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: message });
  };

  const sendToWhatsApp = () => {
    if (!orgData?.inviteCode) return;
    const message = `Hey! Here are your detailed instructions to join ${userData?.orgName || 'the team'} on Trac EMS:\n\n*1. Download & Install Trac Diary*\nVisit https://www.heytracai.com/trac-diary and download the app for your operating system.\n\n*2. Account Authentication*\nOpen the app and Login using your registered work email address.\n\n*3. Access Profile*\nNavigate to the Profile section via the sidebar menu within the app.\n\n*4. Connect Organization*\nPaste the code ${orgData.inviteCode} into the "Organization Code" field and click Connect.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const inviteCode = orgData?.inviteCode || "------";
  
  // Custom manager invite link using inviteCode as the token
  const managerInviteLink = typeof window !== "undefined" 
    ? `${window.location.origin}/invite/${inviteCode}` 
    : `/invite/${inviteCode}`;

  const instructionsMarkdown = `
### Quick Setup Guide For Employees
1. **Download & Install**
   Visit [https://www.heytracai.com/trac-diary](https://www.heytracai.com/trac-diary) and download the **Trac Diary** app for your operating system.
   
2. **Account Authentication**
   Open the app and **Login** using your registered work email address.
   
3. **Access Profile**
   Navigate to the **Profile** section via the sidebar menu within the app.
   
4. **Connect Organization**
   Paste the code \`${inviteCode}\` into the "Organization Code" field and click **Connect**.
`;

  const handleManualAdd = () => {
    onOpenChange(false);
    router.push("/attendance/payroll?addUser=true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto rounded-[2rem] sm:rounded-[3rem] border-border bg-card shadow-2xl p-0 custom-scrollbar outline-none border-none">
        <div className="p-6 sm:p-12 space-y-8">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                <Ticket size={40} className="text-primary" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Grow Your Team</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Choose the best way to onboard members to {userData?.orgName || "your organization"}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Custom Modern Tabs */}
          <div className="flex flex-col sm:flex-row p-1 sm:p-1.5 bg-secondary/30 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("employee")}
              className={cn(
                "flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                activeTab === "employee" ? "bg-background text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Invite Employee
            </button>
            {/* <button
              onClick={() => setActiveTab("manager")}
              className={cn(
                "flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                activeTab === "manager" ? "bg-background text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Invite Manager
            </button> */}
            <button
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                activeTab === "manual" ? "bg-background text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create Yourself
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === "employee" && (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              {/* Main Invite Code */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-orange-500 to-rose-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-secondary/80 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 border border-white/10 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-4">Master Invite Code</p>
                    <h3 className="text-3xl sm:text-7xl font-black tracking-[0.15em] sm:tracking-[0.5em] text-foreground mb-8 pl-1 sm:pl-6 tabular-nums select-all text-center">
                      {inviteCode}
                    </h3>
                    <Button 
                      onClick={() => copyToClipboard(inviteCode, "Invite code ready for the Trac Diary app.")} 
                      className="rounded-2xl font-black uppercase tracking-widest text-xs h-14 sm:h-16 px-12 shadow-2xl shadow-primary/20 w-full sm:w-auto transition-all active:scale-95 gap-3"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                      {copied ? "Copied" : "Copy Code"}
                    </Button>
                </div>
              </div>

              {/* Markdown Instructions */}
              <div className="bg-secondary/20 rounded-[2rem] border border-border/50 p-6 sm:p-8">
                <div className="prose prose-sm dark:prose-invert max-w-none 
                  prose-headings:uppercase prose-headings:tracking-widest prose-headings:font-black prose-headings:text-primary
                  prose-p:text-muted-foreground prose-p:font-medium prose-p:leading-relaxed
                  prose-strong:text-foreground prose-strong:font-black
                  prose-code:bg-primary/10 prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                  prose-li:text-muted-foreground prose-li:font-medium
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                ">
                  <ReactMarkdown>{instructionsMarkdown}</ReactMarkdown>
                </div>
              </div>

              {/* WhatsApp Action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                    onClick={sendToWhatsApp}
                    className="flex-1 h-16 sm:h-20 rounded-3xl bg-[#25D366] hover:bg-[#22c35e] text-white font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                    <div className="size-10 sm:size-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        <img src="/whatsapp-real.svg" alt="WA" className="size-6 sm:size-7" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] opacity-80 mb-0.5 font-bold uppercase tracking-widest">Share via WhatsApp</span>
                        <span className="text-sm">Send to Employee</span>
                    </div>
                </Button>
              </div>
            </div>
          )}

          {/* {activeTab === "manager" && (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              <div className="relative bg-secondary/20 rounded-[2.5rem] border border-border/50 p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={32} className="text-primary" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Invite Dashboard Manager</h4>
                <p className="text-xs text-muted-foreground max-w-md leading-relaxed mb-8">
                  Share this unique link with your managers or administrative staff. This bypasses client-side onboarding and grants them direct dashboard access once they register.
                </p>

                <div className="w-full flex flex-col sm:flex-row items-center gap-3 bg-background border border-border/80 rounded-2xl p-2.5 max-w-xl">
                  <span className="text-[11px] font-bold text-muted-foreground px-3 truncate select-all flex-1 text-left">
                    {managerInviteLink}
                  </span>
                  <Button
                    onClick={() => copyToClipboard(managerInviteLink, "Manager registration link copied to clipboard.")}
                    className="rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
                  >
                    {copied ? <Check size={14} /> : <LinkIcon size={14} />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>
            </div>
          )} */}

          {activeTab === "manual" && (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              <div className="relative bg-secondary/20 rounded-[2.5rem] border border-border/50 p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <UserPlus size={32} className="text-primary" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Create User Profile Yourself</h4>
                <p className="text-xs text-muted-foreground max-w-md leading-relaxed mb-8">
                  Set up a profile manually, input their role, designate basic departments, base salary metadata and print/share system credentials immediately.
                </p>

                <Button 
                  onClick={handleManualAdd}
                  className="rounded-2xl font-black uppercase tracking-widest text-xs h-14 sm:h-16 px-12 transition-all active:scale-95 shadow-xl shadow-primary/20 gap-3"
                >
                  <span>Go to Attendance & Payroll</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
