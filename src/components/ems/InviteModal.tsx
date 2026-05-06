"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ticket, Copy, Check, Download, LogIn, UserCircle, Link as LinkIcon, MessageCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

interface InviteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ isOpen, onOpenChange }: InviteModalProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [orgData, setOrgData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Code Copied!", description: "Invite code ready for the Trac Diary app." });
  };

  const sendToWhatsApp = () => {
    if (!orgData?.inviteCode) return;
    const message = `Hey! Here are your detailed instructions to join ${userData?.orgName || 'the team'} on Trac EMS:\n\n*1. Download & Install Trac Diary*\nVisit https://www.traconomics.com/trac-diary and download the app for your operating system.\n\n*2. Account Authentication*\nOpen the app and Login using your registered work email address.\n\n*3. Access Profile*\nNavigate to the Profile section via the sidebar menu within the app.\n\n*4. Connect Organization*\nPaste the code ${orgData.inviteCode} into the "Organization Code" field and click Connect.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const inviteCode = orgData?.inviteCode || "------";

  const instructionsMarkdown = `
### Quick Setup Guide For Employees
1. **Download & Install**
   Visit [https://www.traconomics.com/trac-diary](https://www.traconomics.com/trac-diary) and download the **Trac Diary** app for your operating system.
   
2. **Account Authentication**
   Open the app and **Login** using your registered work email address.
   
3. **Access Profile**
   Navigate to the **Profile** section via the sidebar menu within the app.
   
4. **Connect Organization**
   Paste the code \`${inviteCode}\` into the "Organization Code" field and click **Connect**.
`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto rounded-[2rem] sm:rounded-[3rem] border-border bg-card shadow-2xl p-0 custom-scrollbar outline-none border-none">
        <div className="p-6 sm:p-12 space-y-10">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                <Ticket size={40} className="text-primary" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Onboard Employee</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Setup instructions for {userData?.orgName || "your organization"}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Main Invite Code */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-orange-500 to-rose-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-secondary/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 border border-white/10 flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-4">Master Invite Code</p>
                <h3 className="text-5xl sm:text-7xl font-black tracking-[0.3em] sm:tracking-[0.5em] text-foreground mb-8 pl-2 sm:pl-6 tabular-nums select-all">
                  {inviteCode}
                </h3>
                <Button 
                  onClick={() => copyToClipboard(inviteCode)} 
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
      </DialogContent>
    </Dialog>
  );
}
