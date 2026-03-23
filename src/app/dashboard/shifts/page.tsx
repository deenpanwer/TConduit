"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  Plus, Calendar, ChevronLeft, ChevronRight, 
  MoreHorizontal, Users, Clock, AlertCircle, 
  Check, X, Share2, Info, UserPlus, Search, Menu, ArrowLeft,
  Sparkles, Loader2, Trash2, GripVertical, Coffee, History as HistoryIcon,
  MessageSquare, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getUserAvatar } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay, parse, differenceInHours, isToday, addWeeks, subWeeks, parseISO, isWithinInterval } from "date-fns";
import { motion, AnimatePresence, PanInfo, LayoutGroup } from "framer-motion";
import { useSidebar } from "@/hooks/use-sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useShift, ScheduledShift, LeaveRequest } from "@/hooks/use-shift";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function ShiftsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, owner, loading: teamLoading } = useTeam();
  const { setIsMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const orgId = userData?.ownedOrgId || userData?.orgId;
  const [orgData, setOrgData] = useState<any>(null);

  useEffect(() => {
    if (orgId) {
      const fetchOrg = async () => {
        const { getDoc, doc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, "organizations", orgId));
        if (snap.exists()) setOrgData(snap.data());
      };
      fetchOrg();
    }
  }, [orgId]);
  
  const { 
    shifts, 
    leaveRequests, 
    history, 
    loading: shiftsLoading, 
    isPublishing,
    hasChanges,
    addShift, 
    updateShift, 
    deleteShift, 
    publishChanges,
    discardChanges,
    smartFill, 
    submitLeaveRequest
  } = useShift(currentDate, orgId, userData);

  // Consolidate settings (Owner doc vs Org doc)
  const combinedSettings = useMemo(() => {
    return orgData?.settings || owner?.settings || userData?.settings || {
      offDays: ["Sun"],
      defaultShiftSeconds: 32400
    };
  }, [orgData, owner, userData]);

  // -- STATES --
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLeaveDrawerOpen, setIsLeaveDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRequestInboxOpen, setIsRequestInboxOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<Partial<ScheduledShift> | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }
  }, []);
  
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const daysOfWeek = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const isManager = useMemo(() => {
    const role = userData?.role?.toLowerCase();
    return role === 'manager' || role === 'owner' || role === 'founder' || !!userData?.ownedOrgId;
  }, [userData]);

  const handleCellClick = (userId: string | null, day: Date) => {
    if (!isManager) return;
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // Check if on leave
    if (userId && leaveRequests.some(l => l.userId === userId && l.status === 'approved' && dayStr >= l.startDate && dayStr <= l.endDate)) {
      toast.error("This person is on leave today.");
      return;
    }

    const existing = shifts.find(s => s.userId === userId && s.date === dayStr);
    const userName = userId ? (employees.find(e => e.id === userId || e.uid === userId)?.name || 'Unknown') : 'Open Shift';
    
    setEditingTime(existing || { 
      userId, 
      userName,
      date: dayStr, 
      startTime: "09:00", 
      endTime: "17:00", 
      status: 'draft' 
    });
    setIsDrawerOpen(true);
  };

  const handleApproveLeave = async (req: LeaveRequest) => {
    if (!orgId) return;
    try {
      const ref = doc(db, "organizations", orgId, "leave_requests", req.id);
      await updateDoc(ref, {
        status: 'approved',
        reviewedBy: user?.uid,
        reviewedByName: userData?.name || user?.displayName,
        updatedAt: serverTimestamp()
      });
      toast.success(`Leave request for ${req.userName} approved.`);
    } catch (e) {
      toast.error("Failed to approve leave.");
    }
  };

  const handleDenyLeave = async (req: LeaveRequest) => {
    if (!orgId) return;
    try {
      const ref = doc(db, "organizations", orgId, "leave_requests", req.id);
      await updateDoc(ref, {
        status: 'denied',
        reviewedBy: user?.uid,
        reviewedByName: userData?.name || user?.displayName,
        updatedAt: serverTimestamp()
      });
      toast.success(`Leave request for ${req.userName} denied.`);
    } catch (e) {
      toast.error("Failed to deny leave.");
    }
  };

  const pendingLeaves = useMemo(() => leaveRequests.filter(l => l.status === 'pending'), [leaveRequests]);

  useEffect(() => {
    const currentPending = pendingLeaves.length;
    if (currentPending > pendingCount && isManager) {
        new Notification("New Time Off Request", {
            body: "An employee has submitted a request for review.",
            icon: "/logo.svg"
        });
        toast.info("New Time Off Request Received");
    }
    setPendingCount(currentPending);
  }, [leaveRequests, isManager]);


  const weekLabel = useMemo(() => {
    const startOfCurrent = startOfWeek(new Date(), { weekStartsOn: 1 });
    const isCurrent = isSameDay(daysOfWeek[0], startOfCurrent);
    const isFuture = daysOfWeek[0] > startOfCurrent;
    const isPast = daysOfWeek[0] < startOfCurrent;

    const label = isCurrent ? "This Week" : isSameDay(daysOfWeek[0], addDays(startOfCurrent, 7)) ? "Next Week" : isSameDay(daysOfWeek[0], addDays(startOfCurrent, -7)) ? "Last Week" : format(daysOfWeek[0], 'MMMM yyyy');
    
    const colorClass = isCurrent ? "text-primary" : isFuture ? "text-blue-400/80" : "text-muted-foreground/60";

    return (
      <div className="flex flex-col items-center">
        <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", colorClass)}>{label}</span>
        <span className="text-[9px] font-bold text-muted-foreground opacity-60">{format(daysOfWeek[0], 'MMM d')} - {format(daysOfWeek[6], 'MMM d')}</span>
      </div>
    );
  }, [daysOfWeek]);
  
  // MERGE LOCAL HISTORY WITH REMOTE PROVENANCE (ZERO READS)
  const globalHistory = useMemo(() => {
    // 1. Extract all provenance entries from the currently visible shifts
    const remoteEntries = shifts.flatMap(s => 
      (s.provenance || []).map(p => ({
        id: `${s.id}_${p.at instanceof Object ? p.at.toMillis() : new Date(p.at).getTime()}`,
        action: p.action,
        details: `Shift for ${s.userName} (${s.date})`,
        timestamp: p.at?.toDate ? p.at.toDate() : new Date(p.at),
        user: p.by,
        isLocal: false
      }))
    );
  
    // 2. Format local history to match the schema
    const localEntries = history.map(h => ({
      ...h,
      user: 'You (Draft)',
      isLocal: true
    }));
  
    // 3. Merge and Sort by Time (Newest First)
    return [...remoteEntries, ...localEntries].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [shifts, history]);

  if (authLoading || teamLoading || shiftsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setIsMobileOpen(true)}><Menu size={20} /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0"><ArrowLeft size={20} /></Button>
            <h1 className="font-black uppercase tracking-widest text-xs md:text-sm truncate">Shift Management</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             <div className="hidden sm:flex items-center bg-secondary/50 rounded-xl p-1 border-2 border-border shadow-inner">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}><ChevronLeft size={16} /></Button>
                <div className="min-w-[100px] md:min-w-[160px] flex items-center justify-center cursor-pointer hover:bg-white/5 rounded-lg transition-colors" onClick={handleToday}>{weekLabel}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}><ChevronRight size={16} /></Button>
             </div>
             
             <div className="flex items-center gap-1.5 md:gap-2">
                 <Button onClick={() => setIsLeaveDrawerOpen(true)} variant="outline" className="rounded-xl h-10 px-4 border-2 hover:bg-secondary">
                    <Coffee size={18} className="mr-2"/> Apply for Leave
                 </Button>
                {isManager && (
                  <>
                    <Button 
                      onClick={() => smartFill(
                        employees.map(e => e.id || e.uid), 
                        employees, 
                        combinedSettings
                      )} 
                      variant="outline" 
                      className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-primary/20 bg-primary/5 text-primary active:scale-95 transition-all", isMobile ? "h-10 w-10 p-0" : "h-10 px-6")}
                    >
                        <Sparkles size={isMobile ? 18 : 14} className={cn(!isMobile && "mr-2")} />
                        {!isMobile && "Smart Fill"}
                    </Button>
                    <div className="relative">
                      <Button onClick={() => setIsRequestInboxOpen(true)} variant="outline" className="rounded-xl h-10 w-10 p-0 border-2 hover:bg-secondary">
                        <MessageSquare size={18} />
                      </Button>
                      {pendingLeaves.length > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full border-2 border-background text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                          {pendingLeaves.length}
                        </span>
                      )}
                    </div>
                  </>
                )}
                <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="rounded-xl h-10 w-10 p-0 border-2 hover:bg-secondary">
                  <HistoryIcon size={18} />
                </Button>
                
                {isManager && (
                  <Button 
                    onClick={publishChanges} 
                    disabled={!hasChanges || isPublishing}
                    className={cn(
                      "rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all", 
                      (!hasChanges || isPublishing) && "opacity-50 grayscale cursor-not-allowed translate-y-[1px] shadow-none",
                      isMobile ? "h-10 w-10 p-0" : "h-10 px-6"
                    )}
                  >
                    {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={isMobile ? 18 : 14} className={cn(!isMobile && "mr-2")} />}
                    {!isMobile && "Share with Team"}
                  </Button>
                )}
             </div>
          </div>
        </header>

        {/* MOBILE WEEK SELECTOR SUB-HEADER */}
        <div className="sm:hidden bg-card/30 border-b border-border/50 px-4 py-3 flex items-center justify-between backdrop-blur-sm">
           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border bg-background/50 shadow-sm" onClick={handlePrevWeek}><ChevronLeft size={18} /></Button>
           <div className="flex-1 flex justify-center" onClick={handleToday}>{weekLabel}</div>
           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border bg-background/50 shadow-sm" onClick={handleNextWeek}><ChevronRight size={18} /></Button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-zinc-950 custom-scrollbar">
          {isMobile ? (
            <div className="flex flex-col gap-6 p-4 pb-32">
              <LayoutGroup>
              {daysOfWeek.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayName = format(day, 'EEE');
                const isOffDay = combinedSettings.offDays?.includes(dayName);
                const dayShifts = shifts.filter(w => w.date === dayStr);
                const dayLeaves = leaveRequests.filter(l => l.status === 'approved' && dayStr >= l.startDate && dayStr <= l.endDate);
                
                return (
                  <motion.div layout key={dayStr} ref={el => { dayRefs.current[dayStr] = el; }} className={cn("space-y-3 p-2 rounded-3xl transition-colors", isToday(day) && "bg-primary/10 dark:bg-primary/5", isOffDay && "opacity-60")}>
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tighter">{format(day, 'EEEE')}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase">{format(day, 'MMM d')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOffDay && <Badge variant="outline" className="text-[8px] font-black uppercase bg-slate-200/50 dark:bg-secondary/50 border-border">Closed</Badge>}
                        {isToday(day) && <Badge variant="outline" className="text-[8px] font-black uppercase border-primary text-primary bg-primary/10 dark:bg-primary/5">Today</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {dayShifts.map(shift => {
                        const staff = employees.find(m => m.id === shift.userId || m.uid === shift.userId);
                        return (
                          <div key={shift.id} onClick={() => !isOffDay && handleCellClick(shift.userId, day)} className="touch-none cursor-pointer">
                            <div className={cn(
                              "p-4 rounded-[1.5rem] border-2 flex items-center justify-between bg-card shadow-sm transition-all",
                              shift.status === 'draft' ? "border-dashed border-slate-300 dark:border-muted-foreground/30 opacity-80" : "border-border"
                            )}>
                              <div className="flex items-center gap-4">
                                <Avatar className="size-10 border-2 border-border shadow-inner">
                                  <AvatarImage src={getUserAvatar(staff)}/>
                                  <AvatarFallback>{shift.userName?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-black uppercase tracking-tight">{shift.userName}</p>
                                  <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase flex items-center gap-1">
                                    <Clock size={10} />{shift.startTime} - {shift.endTime}
                                  </p>
                                </div>
                              </div>
                              {shift.status === 'draft' && <Badge variant="secondary" className="text-[8px] font-black uppercase">Unsaved</Badge>}
                            </div>
                          </div>
                        );
                      })}
                      {dayLeaves.map(leave => (
                        <div key={leave.id} className="p-4 rounded-[1.5rem] border-2 border-dashed border-red-500/20 bg-red-500/5 flex items-center gap-4">
                           <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                             <Coffee size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-black uppercase tracking-tight text-red-500/80">{leave.userName}</p>
                              <p className="text-[10px] font-bold text-red-500/50 uppercase">Time Off Request Approved</p>
                           </div>
                        </div>
                      ))}
                      {dayShifts.length === 0 && dayLeaves.length === 0 && (
                        <div onClick={() => !isOffDay && handleCellClick(null, day)} className={cn(
                          "p-10 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all",
                          isOffDay 
                            ? "border-slate-200 dark:border-muted-foreground/20 bg-transparent cursor-not-allowed opacity-40" 
                            : "border-slate-200 dark:border-border/60 bg-slate-100/50 dark:bg-secondary/5 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-secondary/20 active:scale-[0.98]"
                        )}>
                          <div className="size-10 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                            {isOffDay ? <X size={20} className="text-slate-300 dark:text-muted-foreground/40" /> : <Plus size={20} className="text-slate-400 dark:text-muted-foreground/60" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-muted-foreground/40">
                            {isOffDay ? "Day Off" : "Empty Schedule"}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </LayoutGroup>
            </div>
          ) : (
            <div className="p-8">
              <div className="min-w-[1000px] bg-card rounded-[2.5rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
                <div className="flex border-b-2 border-border bg-slate-100/50 dark:bg-secondary/30">
                  <div className="w-72 p-6 border-r-2 border-border shrink-0 flex items-center gap-3">
                    <Users size={20} className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest">Command Roster</span>
                  </div>
                  <div className="flex flex-1">
                    {daysOfWeek.map(day => {
                      const dayName = format(day, 'EEE');
                      const isOffDay = combinedSettings.offDays?.includes(dayName);
                      return (
                        <div key={day.toISOString()} className={cn(
                          "flex-1 p-4 text-center border-r-2 last:border-r-0 transition-colors", 
                          isToday(day) && "bg-primary/5",
                          isOffDay && "bg-slate-200/30 dark:bg-secondary/20 opacity-60"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-muted-foreground">
                            {format(day, 'EEE')}
                            {isOffDay && <span className="ml-1 text-[8px] text-red-500 font-black">(OFF)</span>}
                          </span>
                          <div className="flex flex-col items-center">
                            <span className={cn("text-lg font-black tracking-tighter", isToday(day) ? "text-primary" : "text-foreground")}>{format(day, 'd')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="divide-y-2 divide-border">
                  {/* --- OPEN SPOTS --- */}
                  <div className="flex bg-amber-500/[0.03]">
                    <div className="w-72 p-6 border-r-2 border-border shrink-0 flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
                        <UserPlus size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Open Shifts</span>
                    </div>
                    <div className="flex flex-1">
                      {daysOfWeek.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const dayName = format(day, 'EEE');
                        const isOffDay = combinedSettings.offDays?.includes(dayName);
                        const shift = shifts.find(w => w.userId === null && w.date === dayStr);
                        return (
                          <div key={dayStr} onClick={() => !isOffDay && handleCellClick(null, day)} className={cn(
                            "flex-1 p-2 border-r-2 last:border-r-0 min-h-[120px] flex items-center justify-center relative transition-all",
                            isOffDay ? "bg-slate-200/20 dark:bg-secondary/10 cursor-not-allowed opacity-40" : "hover:bg-amber-500/[0.05] cursor-pointer group"
                          )}>
                            {isOffDay ? (
                              <X className="text-slate-300 dark:text-muted-foreground/20" size={16} />
                            ) : shift ? (
                              <WorkTimeBlock shift={shift} onDelete={() => deleteShift(shift.id)} />
                            ) : (
                              <div className="size-10 rounded-full border-2 border-dashed border-amber-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={18} className="text-amber-500/40" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Employee Rows */}
                  {employees.map(member => (
                    <div key={member.id || member.uid} className="flex hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors group">
                      <div className="w-72 p-4 border-r-2 border-border shrink-0 flex items-center justify-between bg-card group-hover:bg-transparent">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-11 border-2 border-border shadow-inner">
                            <AvatarImage src={getUserAvatar(member)} />
                            <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-black tracking-tight truncate">{member.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase truncate tracking-widest">{member.role || 'Member'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1">
                        {daysOfWeek.map(day => {
                          const dayStr = format(day, 'yyyy-MM-dd');
                          const dayName = format(day, 'EEE');
                          const isOffDay = combinedSettings.offDays?.includes(dayName);
                          const shift = shifts.find(w => w.userId === (member.id || member.uid) && w.date === dayStr);
                          const leave = leaveRequests.find(l => l.userId === (member.id || member.uid) && l.status === 'approved' && dayStr >= l.startDate && dayStr <= l.endDate);
                          
                          return (
                            <div key={dayStr} onClick={() => !leave && !isOffDay && handleCellClick(member.id || member.uid, day)} className={cn(
                              "flex-1 p-2 border-r-2 last:border-r-0 min-h-[120px] flex items-center justify-center relative transition-all group/cell",
                              (leave || isOffDay) ? "bg-red-500/5 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100 dark:hover:bg-secondary/20"
                            )}>
                              {isOffDay ? (
                                <div className="text-center space-y-1">
                                  <p className="text-[8px] font-black uppercase text-slate-300 dark:text-muted-foreground/30 tracking-widest rotate-[-45deg]">Closed</p>
                                </div>
                              ) : leave ? (
                                <div className="text-center space-y-1">
                                  <Coffee size={18} className="mx-auto text-red-500/40" />
                                  <p className="text-[10px] font-black uppercase text-red-500/40 tracking-widest">Time Off</p>
                                </div>
                              ) : shift ? (
                                <WorkTimeBlock shift={shift} onDelete={() => deleteShift(shift.id)} />
                              ) : (
                                <div className="size-10 rounded-full border-2 border-dashed border-border/30 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                  <Plus size={18} className="text-slate-300 dark:text-muted-foreground/20" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- ADD/EDIT DRAWER --- */}
        <AnimatePresence>{isDrawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l-4 border-black dark:border-white shadow-2xl z-50 flex flex-col">
                <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-sm">
                      <Clock size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Modify Shift</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Personnel Coordination</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)} className="rounded-xl"><X size={24} /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Work Focus / Note</label>
                    <Input 
                      value={editingTime?.note || ""} 
                      onChange={e => setEditingTime(p => ({ ...p, note: e.target.value }))} 
                      placeholder="What is the objective?" 
                      className="h-14 rounded-xl border-2 font-bold bg-secondary/20 shadow-inner focus:ring-primary/20" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">Start Time</label>
                      <Input 
                        type="time"
                        value={editingTime?.startTime || ""} 
                        onChange={e => setEditingTime(p => ({ ...p, startTime: e.target.value }))} 
                        className="h-14 rounded-xl border-2 font-mono font-bold text-lg" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase ml-1 tracking-widest text-muted-foreground">End Time</label>
                      <Input 
                        type="time"
                        value={editingTime?.endTime || ""} 
                        onChange={e => setEditingTime(p => ({ ...p, endTime: e.target.value }))} 
                        className="h-14 rounded-xl border-2 font-mono font-bold text-lg" 
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-primary/5 border-2 border-primary/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Status Information</span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                      Changes made here are <span className="text-foreground underline decoration-primary decoration-2">temporary drafts</span>. 
                      They will not be visible to the employee until you click <span className="italic font-black">"Share with Team"</span> on the main dashboard.
                    </p>
                  </div>
                </div>

                <div className="p-8 border-t-2 flex gap-4 bg-secondary/10">
                  {editingTime?.id && !editingTime.id.startsWith('local_') && (
                    <Button 
                      variant="outline" 
                      onClick={() => { deleteShift(editingTime.id!); setIsDrawerOpen(false); }} 
                      className="flex-1 h-14 rounded-xl font-black uppercase text-red-500 border-red-500/20 hover:bg-red-500/5"
                    >
                      Delete
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      if (editingTime?.id) {
                        updateShift(editingTime.id, editingTime);
                      } else {
                        addShift(editingTime as any);
                      }
                      setIsDrawerOpen(false);
                    }} 
                    className="flex-[2] h-14 rounded-xl font-black uppercase border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[2px] transition-all"
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </>
        )}</AnimatePresence>

        {/* --- LEAVE REQUEST DRAWER --- */}
        <AnimatePresence>{isLeaveDrawerOpen && (
          <LeaveRequestForm 
            onClose={() => setIsLeaveDrawerOpen(false)} 
            onSubmit={submitLeaveRequest} 
          />
        )}</AnimatePresence>

        {/* --- TIME OFF INBOX --- */}
        <AnimatePresence>{isRequestInboxOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRequestInboxOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l-4 border-black dark:border-white shadow-2xl z-50 flex flex-col">
                <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border-2 border-rose-500/20 shadow-sm">
                      <Coffee size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Time Off Hub</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Employee Absence Review</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsRequestInboxOpen(false)} className="rounded-xl"><X size={24} /></Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {pendingLeaves.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                      <Check size={64} className="mx-auto mb-4 text-green-500" />
                      <p className="font-black uppercase text-xs tracking-[0.2em]">All requests reviewed</p>
                    </div>
                  ) : (
                    pendingLeaves.map(req => (
                      <div key={req.id} className="p-6 rounded-[2rem] border-2 border-border bg-secondary/10 space-y-4 hover:border-primary/20 transition-all group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10 border-2 border-border">
                              <AvatarFallback>{req.userName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight">{req.userName}</p>
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/40 text-primary/80">{req.reasonType}</Badge>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground uppercase">{req.startDate} to {req.endDate}</span>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-card border border-border/50 text-xs font-bold leading-relaxed text-muted-foreground">
                          {req.description || "No details provided."}
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border/50 text-xs font-bold leading-relaxed text-muted-foreground">
                           <p>Handover Note: {req.handoverNote || "N/A"}</p>
                           <p>Emergency Contact: {req.emergencyPhone || "N/A"}</p>
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            onClick={() => handleApproveLeave(req)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] bg-green-500 hover:bg-green-600 border-2 border-black/10 text-white"
                          >
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleDenyLeave(req)}
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] text-red-500 border-2 border-red-500/10 hover:bg-red-500/5"
                          >
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
        )}</AnimatePresence>

        {/* --- HISTORY DRAWER --- */}
        <AnimatePresence>{isHistoryOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l-4 border-black dark:border-white shadow-2xl z-50 flex flex-col">
                <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border-2 border-orange-500/20 shadow-sm">
                      <HistoryIcon size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Session Log</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit Trail & Activity</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}><X size={24} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {globalHistory.length === 0 ? (
                    <div className="text-center py-20 opacity-20">
                      <HistoryIcon size={48} className="mx-auto mb-4"/>
                      <p className="font-black uppercase text-xs tracking-[0.2em]">No activity recorded</p>
                    </div>
                  ) : (
                    globalHistory.map(entry => (
                      <div key={entry.id} className="relative pl-6 border-l-2 border-border pb-6 last:pb-0">
                        <div className={cn(
                          "absolute -left-[9px] top-0 size-4 rounded-full border-2",
                          entry.isLocal ? "bg-background border-primary" : "bg-primary border-primary"
                        )} />
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-primary tracking-widest">{entry.action}</span>
                          <span className="text-[8px] font-bold text-muted-foreground">{format(entry.timestamp, 'MMM d, hh:mm a')}</span>
                        </div>
                        <p className="text-sm font-bold leading-tight mb-1">{entry.details}</p>
                        <p className="text-[9px] font-black uppercase text-muted-foreground/50">
                          {entry.isLocal ? "Local Draft" : `By ${entry.user}`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                {history.length > 0 && (
                  <div className="p-8 border-t-2 bg-secondary/10 flex gap-4">
                     <Button variant="outline" onClick={discardChanges} className="flex-1 h-14 rounded-xl font-black uppercase text-red-500 border-2 border-red-500/10 hover:bg-red-500/5 transition-all">Discard All</Button>
                     <Button onClick={publishChanges} disabled={isPublishing} className="flex-[2] h-14 rounded-xl font-black uppercase border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[2px] transition-all">
                       {isPublishing ? <Loader2 size={18} className="animate-spin" /> : "Share with Team"}
                     </Button>
                  </div>
                )}
              </motion.div>
            </>
        )}</AnimatePresence>
      </main>
    </div>
  );
}

function WorkTimeBlock({ shift, onDelete }: { shift: ScheduledShift; onDelete: () => void; }) {
  const isDraft = shift.status === 'draft';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "w-full h-full p-3 rounded-2xl border-2 flex flex-col justify-between relative group/block overflow-hidden transition-all",
            isDraft 
              ? "bg-amber-100/50 dark:bg-amber-500/5 border-dashed border-amber-500/40 text-amber-900 dark:text-amber-200" 
              : "bg-primary/10 dark:bg-primary/5 border-primary/20 text-primary dark:text-primary",
            "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          )}>
            {isDraft && (
              <div className="absolute top-0 right-0 p-1 bg-amber-500 text-[8px] font-black text-white px-2 rounded-bl-lg uppercase tracking-widest shadow-sm">
                Unsaved
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-1 opacity-70">
                <Clock size={10} />
                <span className="text-[10px] font-black tracking-tighter uppercase leading-none">{shift.startTime} - {shift.endTime}</span>
              </div>
              <p className="text-[11px] font-black leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-sm">{shift.note || "Work Cycle"}</p>
            </div>
            <div className="mt-2 flex justify-end">
              <div 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="size-6 rounded-lg bg-black/5 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="border-2 border-black dark:border-white rounded-xl p-3 
      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] 
      max-w-xs">
          <div className="text-[10px] space-y-3">
            <div className="flex items-center gap-2">
              <HistoryIcon size={12} className="text-primary" />
              <span className="font-black uppercase tracking-widest">Shift Provenance</span>
            </div>
            
            {/* Show last 3 history entries */}
            {(shift.provenance || []).slice(-3).reverse().map((entry, idx) => (
              <div key={idx} className="space-y-0.5 border-l-2 border-border pl-3">
                <p className="text-muted-foreground font-bold uppercase text-[8px]">{entry.action}</p>
                <p className="font-black text-foreground">{entry.by}</p>
                <p className="font-bold text-muted-foreground/70 text-[9px]">
                  {(() => {
                    try {
                      // Safe date parsing for both Firestore Timestamp and JS Date
                      const date = entry.at?.toDate ? entry.at.toDate() : new Date(entry.at);
                      return isNaN(date.getTime()) ? 'Syncing...' : format(date, 'MMM d, h:mm a');
                    } catch (e) {
                      return 'Just now';
                    }
                  })()}
                </p>
              </div>
            ))}

            {/* Fallback if no detailed history exists (Legacy shifts) */}
            {(shift.provenance || []).length === 0 && (
               <div className="space-y-0.5 border-l-2 border-border pl-3">
                <p className="text-muted-foreground font-bold uppercase text-[8px]">Last Action</p>
                <p className="font-black text-foreground">{shift.lastModifiedByName || 'Manager'}</p>
                <p className="font-bold text-muted-foreground/70 text-[9px]">
                   {(() => {
                    try {
                      const date = shift.updatedAt?.toDate ? shift.updatedAt.toDate() : new Date(shift.updatedAt);
                      return isNaN(date.getTime()) ? 'Syncing...' : format(date, 'MMM d, h:mm a');
                    } catch (e) {
                      return 'Just now';
                    }
                  })()}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const LeaveRequestForm = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void; }) => {
  const [leaveData, setLeaveData] = useState({
    reasonType: 'Vacation',
    startDate: '',
    endDate: '',
    type: 'full_day',
    handoverNote: '',
    emergencyPhone: '',
    description: ''
  });

  const handleSubmit = () => {
    onSubmit(leaveData);
    onClose();
  }

  return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l-4 border-black dark:border-white shadow-2xl z-50 flex flex-col">
          <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Request Time Off</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={24} /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

            {/* Section 1: The Basics */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">The Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={leaveData.reasonType} onValueChange={value => setLeaveData(p => ({...p, reasonType: value}))}>
                        <SelectTrigger className="border-2 border-black dark:border-white"><SelectValue placeholder="Leave Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Vacation">Vacation</SelectItem>
                            <SelectItem value="Sick">Sick</SelectItem>
                            <SelectItem value="Casual">Casual</SelectItem>
                            <SelectItem value="Maternity">Maternity</SelectItem>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={leaveData.type} onValueChange={value => setLeaveData(p => ({...p, type: value as any}))}>
                        <SelectTrigger className="border-2 border-black dark:border-white"><SelectValue placeholder="Shift Impact" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="full_day">Full Day</SelectItem>
                            <SelectItem value="morning_half">Half Day (Morning)</SelectItem>
                            <SelectItem value="afternoon_half">Half Day (Afternoon)</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input className="border-2 border-black dark:border-white" type="date" value={leaveData.startDate} onChange={e => setLeaveData(p => ({...p, startDate: e.target.value}))} />
                    <Input className="border-2 border-black dark:border-white" type="date" value={leaveData.endDate} onChange={e => setLeaveData(p => ({...p, endDate: e.target.value}))} />
                </div>
            </div>

            {/* Section 2: Professional Responsibility */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Professional Responsibility</h3>
                <Input className="border-2 border-black dark:border-white" placeholder="Handover To (e.g., Who is covering your tasks?)" value={leaveData.handoverNote} onChange={e => setLeaveData(p => ({...p, handoverNote: e.target.value}))} />
                <Input className="border-2 border-black dark:border-white" placeholder="Emergency Contact" value={leaveData.emergencyPhone} onChange={e => setLeaveData(p => ({...p, emergencyPhone: e.target.value}))} />
            </div>

            {/* Section 3: Context */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Context</h3>
                <Textarea className="border-2 border-black dark:border-white" placeholder="Reason" value={leaveData.description} onChange={e => setLeaveData(p => ({...p, description: e.target.value}))} />
            </div>
          </div>

          <div className="p-8 border-t-2 bg-secondary/10">
              <Button onClick={handleSubmit} className="w-full h-14 rounded-xl font-black uppercase border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[2px] transition-all">Submit Request</Button>
          </div>
        </motion.div>
      </>
  );
}

