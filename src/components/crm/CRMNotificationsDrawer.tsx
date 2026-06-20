"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, Bell, AlertCircle, ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistance } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface CRMNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CRMNotificationsDrawer({ isOpen, onClose }: CRMNotificationsDrawerProps) {
  const { user } = useAuth();
  const [crmNotifications, setCrmNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("type", "==", "crm_missed_followup"),
      where("status", "==", "pending")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setCrmNotifications(list.slice(0, 50));
    });
    return () => unsubscribe();
  }, [user]);

  const totalNotifications = crmNotifications.length;

  const handleCrmNotificationAcknowledge = async (notif: any) => {
    const reason = prompt(`Please enter the explanation/reason for missing the follow-up with ${notif.leadName || "this lead"}:`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert("A reason is required to acknowledge this notification.");
      return;
    }

    try {
      // Add comment or note history entry to the CRM Entity's history
      const leadRef = doc(db, "organizations", notif.orgId, "crm_entities", notif.leadId);
      const leadSnap = await getDoc(leadRef);
      if (leadSnap.exists()) {
        const leadData = leadSnap.data();
        const newHistoryLog = {
          id: crypto.randomUUID(),
          type: 'System',
          action: 'MISSED_FOLLOWUP_REASON',
          content: `Missed follow-up reason submitted: "${reason}"`,
          userId: user?.uid || notif.recipientId,
          userName: user?.displayName || user?.email || 'User',
          timestamp: new Date().toISOString()
        };
        const currentHistory = leadData.history || [];
        const updatedHistory = [newHistoryLog, ...currentHistory].slice(0, 50); // limit to 50 items
        
        await updateDoc(leadRef, {
          history: updatedHistory,
          updatedAt: serverTimestamp()
        });
      }

      // Mark notification as acknowledged under users/{userId}/notifications
      const notifRef = doc(db, "users", user!.uid, "notifications", notif.id);
      await updateDoc(notifRef, {
        status: 'acknowledged',
        acknowledgedAt: serverTimestamp(),
        reason: reason // Save reason to the notification document
      });

      toast.success("Missed follow-up documented successfully");
    } catch (err: any) {
      console.error("Error acknowledging crm notification:", err);
      toast.error(`Failed to acknowledge: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l-4 border-black dark:border-white shadow-2xl z-[101] flex flex-col"
      >
        <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-sm relative">
              <Bell size={28} />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full border-2 border-background text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-blue-500">Notifications</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">CRM Follow-ups Required</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X size={24} />
          </Button>
        </div>

        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-6 space-y-6">
            {totalNotifications === 0 ? (
              <div className="text-center py-20 opacity-20">
                <Sparkles size={64} className="mx-auto mb-4" />
                <p className="font-black uppercase text-xs tracking-[0.2em]">All clear!</p>
                <p className="text-[10px] font-bold mt-2">No pending follow-ups to review.</p>
              </div>
            ) : (
              crmNotifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-[2rem] border-2 border-border bg-card hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-12 rounded-2xl flex items-center justify-center border-2 shrink-0 shadow-sm text-red-500 bg-red-500/10 border-red-500/20">
                      <AlertCircle size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Missed CRM Follow-up</span>
                        <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">
                          {notif.createdAt ? formatDistance(notif.createdAt.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt), new Date(), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-base font-black tracking-tight text-foreground truncate">{notif.leadName || "CRM Lead"}</p>
                      <p className="text-[11px] font-bold text-muted-foreground leading-tight mt-1 line-clamp-2">{notif.body || "Follow-up was missed. Click to document reason."}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleCrmNotificationAcknowledge(notif)}
                      size="sm"
                      className="flex-1 h-9 rounded-xl font-black uppercase text-[10px] bg-red-600 hover:bg-red-700 border-2 border-black/10 text-white"
                    >
                      Submit Reason
                    </Button>
                    <Button 
                      onClick={() => { window.location.href = `/crm/leads/${notif.leadId}`; onClose(); }}
                      size="sm"
                      variant="ghost"
                      className="size-9 p-0 rounded-xl border-2 border-transparent hover:border-border"
                    >
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </>
  );
}
