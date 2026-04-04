"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Bell, Coffee, UserPlus, Check, 
  ChevronRight, Clock, AlertCircle, MessageSquare,
  ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getUserAvatar } from "@/lib/utils";
import { format, parseISO, formatDistance } from "date-fns";
import { useShift, LeaveRequest, ShiftClaim } from "@/hooks/use-shift";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const { user, userData } = useAuth();
  const { employees } = useTeam();
  const orgId = userData?.ownedOrgId || userData?.orgId;
  
  const shiftUser = useMemo(() => {
    if (!userData && !user) return null;
    return {
      ...userData,
      uid: user?.uid || userData?.id
    };
  }, [userData, user]);

  const { 
    allPendingLeaves, 
    allPendingClaims,
    approveClaim,
    denyClaim,
    approveLeave,
    denyLeave
  } = useShift(new Date(), orgId, shiftUser, employees);

  const totalNotifications = allPendingLeaves.length + allPendingClaims.length;

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
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Notifications</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Personnel Action Required</p>
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
                <p className="text-[10px] font-bold mt-2">No pending items to review.</p>
              </div>
            ) : (
              <>
                {/* Leave Requests */}
                {allPendingLeaves.map((req) => (
                  <NotificationItem 
                    key={req.id}
                    type="leave"
                    title="Leave Request"
                    userName={req.userName}
                    userId={req.userId}
                    details={`${req.reasonType}: ${format(parseISO(req.startDate), 'MMM d')} - ${format(parseISO(req.endDate), 'MMM d')}`}
                    timestamp={req.createdAt}
                    onApprove={() => approveLeave(req)}
                    onDeny={() => denyLeave(req, 'Declined via notifications')}
                    onView={() => { window.location.href = '/dashboard/shifts'; onClose(); }}
                  />
                ))}

                {/* Shift Claims */}
                {allPendingClaims.map((claim) => (
                  <NotificationItem 
                    key={claim.id}
                    type="claim"
                    title="Shift Claim"
                    userName={claim.userName}
                    userId={claim.userId}
                    details={`${format(parseISO(claim.date), 'EEE, MMM d')} (${claim.startTime} - ${claim.endTime})`}
                    timestamp={claim.createdAt}
                    onApprove={() => approveClaim(claim)}
                    onDeny={() => denyClaim(claim, 'Declined via notifications')}
                    onView={() => { window.location.href = '/dashboard/shifts'; onClose(); }}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t-2 bg-secondary/10">
          <Button 
            onClick={() => { window.location.href = '/dashboard/shifts'; onClose(); }}
            className="w-full h-12 rounded-xl font-black uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] active:translate-y-[2px] transition-all"
          >
            Manage All in Shifts <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function NotificationItem({ type, title, userName, userId, details, timestamp, onApprove, onDeny, onView }: any) {
  const Icon = type === 'leave' ? Coffee : UserPlus;
  const colorClass = type === 'leave' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-[2rem] border-2 border-border bg-card hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={cn("size-12 rounded-2xl flex items-center justify-center border-2 shrink-0 shadow-sm", colorClass)}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</span>
            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">
              {timestamp ? formatDistance(timestamp.toDate ? timestamp.toDate() : new Date(timestamp), new Date(), { addSuffix: true }) : 'Just now'}
            </span>
          </div>
          <p className="text-base font-black tracking-tight text-foreground truncate">{userName}</p>
          <p className="text-[11px] font-bold text-muted-foreground leading-tight mt-1 line-clamp-2">{details}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={onApprove}
          size="sm"
          className="flex-1 h-9 rounded-xl font-black uppercase text-[10px] bg-emerald-500 hover:bg-emerald-600 border-2 border-black/10 text-white"
        >
          Approve
        </Button>
        <Button 
          onClick={onDeny}
          size="sm"
          variant="outline"
          className="flex-1 h-9 rounded-xl font-black uppercase text-[10px] text-red-500 border-2 border-red-500/10 hover:bg-red-500/5"
        >
          Deny
        </Button>
        <Button 
          onClick={onView}
          size="sm"
          variant="ghost"
          className="size-9 p-0 rounded-xl border-2 border-transparent hover:border-border"
        >
          <ArrowRight size={16} />
        </Button>
      </div>
    </motion.div>
  );
}