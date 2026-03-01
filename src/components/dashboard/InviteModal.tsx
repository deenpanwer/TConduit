"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Ticket, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
        if (orgDoc.exists()) setOrgData(orgDoc.data());
      }
    }
    fetchOrgDetails();
  }, [userData, isOpen]);

  const copyInviteCode = () => {
    if (orgData?.inviteCode) {
      navigator.clipboard.writeText(orgData.inviteCode);
      setCopied(true);
      toast({ title: "Code Copied!", description: "Invite code ready for the Trac Diary app." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-border bg-card shadow-2xl p-8">
        <DialogHeader className="items-center text-center">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Ticket size={32} className="text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Invite Staff Member</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Direct your team to enter this code in the Trac EMS Profile.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 pt-4">
          <div className="w-full p-8 bg-secondary/50 rounded-3xl border-2 border-dashed border-border flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Organization Code</p>
              <h3 className="text-5xl font-black tracking-[0.3em] text-foreground mb-6 pl-4 tabular-nums">{orgData?.inviteCode || "------"}</h3>
              <Button onClick={copyInviteCode} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-lg shadow-primary/20">
                  {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? "Copied" : "Copy Code"}
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
