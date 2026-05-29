"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Plus, Calendar, ChevronLeft, ChevronRight, 
  MoreHorizontal, Users, Clock, AlertCircle, 
  Check, X, Share2, Info, UserPlus, Search, Menu, ArrowLeft,
  Sparkles, Loader2, Trash2, GripVertical, Coffee, History as HistoryIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay, parse, differenceInHours } from "date-fns";
import { motion, AnimatePresence, PanInfo, LayoutGroup } from "framer-motion";
import { useSidebar } from "@/hooks/use-sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// --- TYPES ---
interface WorkTime {
  id: string;
  staffId: string;
  day: string; // yyyy-MM-dd
  startTime: string;
  endTime: string;
  note: string;
  color: string;
  isDraft: boolean;
}

interface Staff { id: string; name: string; role: string; photo: string; }
interface Group { id: string; name: string; members: Staff[]; }
interface TimeOffRequest { id: string; staffId: string; day: string; note: string; }
interface HistoryEntry { id: string; action: string; timestamp: Date; details: string; user: string; }

// --- DUMMY DATA ---
const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Front Desk",
    members: [
      { id: "s1", name: "Sarah Miller", role: "Morning Lead", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sarah" },
      { id: "s2", name: "John Davis", role: "Reception", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=John" },
    ]
  },
  {
    id: "g2",
    name: "Sales Team",
    members: [
      { id: "s3", name: "Mike Ross", role: "Closer", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Mike" },
      { id: "s4", name: "Anna Specter", role: "Support", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Anna" },
    ]
  }
];

const TIME_OFF_REQUESTS: TimeOffRequest[] = [
  { id: "to1", staffId: "s2", day: format(addDays(new Date(), 1), 'yyyy-MM-dd'), note: "Doctor's Appointment" },
  { id: "to2", staffId: "s4", day: format(addDays(new Date(), 3), 'yyyy-MM-dd'), note: "Family Event" },
];

const getAutoColor = (staffId: string) => {
  if (staffId === 'open') return 'gray';
  const group = GROUPS.find(g => g.members.some(m => m.id === staffId));
  return group?.id === 'g1' ? 'blue' : group?.id === 'g2' ? 'purple' : 'emerald';
};

const DUMMY_USER_DATA = { settings: { offDays: ["Sat", "Sun"] } };

export default function TeamWorkTimesPage() {
  const { setIsMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const userData = DUMMY_USER_DATA;
  const router = useRouter();
  
  // -- STATES --
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workTimes, setWorkTimes] = useState<WorkTime[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<Partial<WorkTime> | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);
  
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const daysOfWeek = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  // -- CALCULATE WEEKLY HOURS --
  const weeklyHours = useMemo(() => {
    const stats: Record<string, number> = {};
    workTimes.forEach(w => {
      if (w.staffId === 'open') return;
      // Simple parse for dummy data
      const hStart = parseInt(w.startTime.split(':')[0]);
      const hEnd = parseInt(w.endTime.split(':')[0]);
      const duration = hEnd + 12 - hStart; // Logic for PM shift
      stats[w.staffId] = (stats[w.staffId] || 0) + 8; // Defaulting to 8 for simplicity
    });
    return stats;
  }, [workTimes]);

  const addHistory = (action: string, details: string) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: new Date(),
      details,
      user: "Admin (You)"
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  // -- DRAG & DROP LOGIC --
  const moveShift = (workTimeId: string, targetStaffId: string, targetDay: string) => {
    const isConflict = workTimes.some(w => w.id !== workTimeId && w.staffId === targetStaffId && w.day === targetDay) || 
                       TIME_OFF_REQUESTS.some(to => to.staffId === targetStaffId && to.day === targetDay);
    
    if (isConflict) {
      toast.error("Conflict! This person is busy or has requested time off.");
      return;
    }

    setWorkTimes(prev => prev.map(w => {
      if (w.id === workTimeId) {
        const staffName = GROUPS.flatMap(g => g.members).find(m => m.id === targetStaffId)?.name || "Staff";
        addHistory("Moved Shift", `Moved shift to ${staffName} on ${targetDay}`);
        return { ...w, staffId: targetStaffId === 'any' ? w.staffId : targetStaffId, day: targetDay, color: getAutoColor(targetStaffId === 'any' ? w.staffId : targetStaffId), isDraft: true };
      }
      return w;
    }));
    toast.info("Shift moved!");
  };

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>, workTimeId: string) => {
    e.dataTransfer.setData("workTimeId", workTimeId);
    setDraggedItem(workTimeId);
  };

  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>, targetStaffId: string, targetDay: string) => {
    e.preventDefault();
    setDraggedItem(null);
    const workTimeId = e.dataTransfer.getData("workTimeId");
    moveShift(workTimeId, targetStaffId, targetDay);
  };

  const handleMobileDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, shiftId: string) => {
    let droppedDay = null;
    for (const [dayStr, ref] of Object.entries(dayRefs.current)) {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (info.point.y >= rect.top && info.point.y <= rect.bottom) {
          droppedDay = dayStr;
          break;
        }
      }
    }
    if (droppedDay) moveShift(shiftId, 'any', droppedDay);
    setDraggedOverDay(null);
  };

  const handleMobileDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    let overDay = null;
    for (const [dayStr, ref] of Object.entries(dayRefs.current)) {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (info.point.y >= rect.top && info.point.y <= rect.bottom) {
          overDay = dayStr;
          break;
        }
      }
    }
    setDraggedOverDay(overDay);
  };

  // -- SMART FILL --
  const autoFillWeek = () => {
    setIsAutoFilling(true);
    const offDays = userData.settings.offDays;
    setTimeout(() => {
      setWorkTimes(prev => {
        let currentList = [...prev];
        const allStaff = GROUPS.flatMap(g => g.members);
        daysOfWeek.forEach((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          if (offDays.includes(format(day, 'EEE'))) return;
          allStaff.forEach((staff, idx) => {
            const hasShift = currentList.some(w => w.staffId === staff.id && w.day === dayStr);
            const isOff = TIME_OFF_REQUESTS.some(to => to.staffId === staff.id && to.day === dayStr);
            if (!hasShift && !isOff) {
              const startHour = 8 + (idx % 3);
              currentList.push({ id: Math.random().toString(36).substr(2,9), staffId: staff.id, day: dayStr, startTime: `${startHour}:00 AM`, endTime: `${startHour+8-12}:00 PM`, note: "Regular Shift", color: getAutoColor(staff.id), isDraft: true });
            }
          });
        });
        return currentList;
      });
      addHistory("Smart Fill", "Automatically generated a full week of shifts.");
      setIsAutoFilling(false);
      toast.success("Week generated!");
    }, 800);
  };

  const publishSchedule = () => {
    setWorkTimes(prev => prev.map(w => ({ ...w, isDraft: false })));
    addHistory("Published", "Shared the schedule with the entire team.");
    toast.success("Schedule published!");
  };

  const handleCellClick = (staffId: string, day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (TIME_OFF_REQUESTS.some(to => to.staffId === staffId && to.day === dayStr)) return;
    const existing = workTimes.find(w => w.staffId === staffId && w.day === dayStr);
    setEditingTime(existing || { staffId, day: dayStr, startTime: "09:00 AM", endTime: "05:00 PM", note: "", color: getAutoColor(staffId), isDraft: true });
    setIsDrawerOpen(true);
  };

  const saveWorkTime = () => {
    if (!editingTime) return;
    const final = { ...editingTime, color: getAutoColor(editingTime.staffId || ''), id: editingTime.id || Math.random().toString(36).substr(2,9) } as WorkTime;
    setWorkTimes(prev => editingTime.id ? prev.map(w => w.id === editingTime.id ? final : w) : [...prev, final]);
    addHistory(editingTime.id ? "Updated Shift" : "Created Shift", `Modified schedule for ${editingTime.day}`);
    setIsDrawerOpen(false);
  };

  const weekLabel = useMemo(() => {
    const startOfCurrent = startOfWeek(new Date(), { weekStartsOn: 1 });
    const label = isSameDay(daysOfWeek[0], startOfCurrent) ? "This Week" : isSameDay(daysOfWeek[0], addDays(startOfCurrent, 7)) ? "Next Week" : isSameDay(daysOfWeek[0], addDays(startOfCurrent, -7)) ? "Last Week" : format(daysOfWeek[0], 'MMMM yyyy');
    return (
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{label}</span>
        <span className="text-[9px] font-bold text-muted-foreground opacity-60">{format(daysOfWeek[0], 'MMM d')} - {format(daysOfWeek[6], 'MMM d')}</span>
      </div>
    );
  }, [daysOfWeek]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setIsMobileOpen(true)}><Menu size={20} /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0"><ArrowLeft size={20} /></Button>
            <h1 className="font-black uppercase tracking-widest text-xs md:text-sm truncate">Shift Orchestrator</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex items-center bg-secondary/50 rounded-xl p-1 border-2 border-border shadow-inner">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, -7))}><ChevronLeft size={16} /></Button>
                <div className="min-w-[100px] md:min-w-[160px] flex items-center justify-center">{weekLabel}</div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, 7))}><ChevronRight size={16} /></Button>
             </div>
             <div className="flex items-center gap-1.5 md:gap-2">
                <Button onClick={autoFillWeek} disabled={isAutoFilling} variant="outline" className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-primary/20 bg-primary/5 text-primary active:scale-95 transition-all", isMobile ? "h-10 w-10 p-0" : "h-10 px-6")}>
                    {isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={isMobile ? 18 : 14} className={cn(!isMobile && "mr-2")} />}
                    {!isMobile && "Smart Fill"}
                </Button>
                <Button onClick={() => setIsHistoryOpen(true)} variant="outline" className="rounded-xl h-10 w-10 p-0 border-2 hover:bg-secondary"><HistoryIcon size={18} /></Button>
                <Button onClick={publishSchedule} className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all", isMobile ? "h-10 w-10 p-0" : "h-10 px-6")}>
                    <Share2 size={isMobile ? 18 : 14} className={cn(!isMobile && "mr-2")} />
                    {!isMobile && "Share"}
                </Button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-zinc-950 custom-scrollbar">
          {isMobile ? (
            <div className="flex flex-col gap-6 p-4 pb-32">
              <LayoutGroup>
              {daysOfWeek.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isOff = userData.settings.offDays.includes(format(day, 'EEE'));
                const dayShifts = workTimes.filter(w => w.day === dayStr && w.staffId !== 'open');
                const dayTimeOffs = TIME_OFF_REQUESTS.filter(to => to.day === dayStr);
                
                return (
                  <motion.div layout key={dayStr} ref={el => { dayRefs.current[dayStr] = el; }} className={cn("space-y-3 p-2 rounded-3xl transition-colors", isOff && "opacity-40", draggedOverDay === dayStr && "ring-2 ring-primary bg-primary/5")}>
                    <div className="flex items-center justify-between px-2"><div className="flex items-center gap-2"><span className="text-xl font-black tracking-tighter">{format(day, 'EEEE')}</span><span className="text-xs font-bold text-muted-foreground uppercase">{format(day, 'MMM d')}</span></div>{isOff && <Badge variant="outline" className="text-[8px] font-black uppercase">Closed</Badge>}</div>
                    <div className="grid grid-cols-1 gap-3">
                      {dayShifts.map(shift => {
                        const staff = GROUPS.flatMap(g => g.members).find(m => m.id === shift.staffId);
                        return (
                          <motion.div layout key={shift.id} drag="y" dragSnapToOrigin dragElastic={0.1} whileDrag={{ zIndex: 50, scale: 1.05 }} onDrag={handleMobileDrag} onDragEnd={(e, i) => handleMobileDragEnd(e, i, shift.id)} className="touch-none z-10">
                            <div className={cn("p-4 rounded-[1.5rem] border-2 flex items-center justify-between bg-card shadow-sm", shift.color === 'blue' ? "border-blue-500/20" : "border-purple-500/20")}>
                              <div className="flex items-center gap-4"><div className="p-1 text-muted-foreground/30"><GripVertical size={16} /></div><Avatar className="size-10 border-2 border-border"><AvatarImage src={staff?.photo}/><AvatarFallback>??</AvatarFallback></Avatar><div><p className="text-sm font-black uppercase tracking-tight">{staff?.name}</p><p className="text-[10px] font-bold text-muted-foreground uppercase"><Clock size={10} className="inline mr-1"/>{shift.startTime} - {shift.endTime}</p></div></div>
                              <Button variant="ghost" size="icon" onClick={() => { setEditingTime(shift); setIsDrawerOpen(true); }}><MoreHorizontal size={18}/></Button>
                            </div>
                          </motion.div>
                        );
                      })}
                      {dayTimeOffs.map(to => <TimeOffBlock key={to.id} request={to} mobile />)}
                      {!isOff && dayShifts.length === 0 && dayTimeOffs.length === 0 && <div className="p-6 rounded-2xl border-2 border-dashed border-border/50 text-center text-muted-foreground/30 uppercase text-[10px] font-bold tracking-widest">Empty</div>}
                    </div>
                  </motion.div>
                );
              })}
              </LayoutGroup>
            </div>
          ) : (
            <div className="p-8"><div className="min-w-[1000px] bg-card rounded-[2.5rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
              <div className="flex border-b-2 border-border bg-secondary/30">
                <div className="w-72 p-6 border-r-2 border-border shrink-0 flex items-center gap-3"><Users size={20} className="text-primary" /><span className="text-xs font-black uppercase tracking-widest">Team Members</span></div>
                <div className="flex flex-1">{daysOfWeek.map(day => (
                  <div key={day.toISOString()} className={cn("flex-1 p-4 text-center border-r-2 last:border-r-0", isSameDay(day, new Date()) && "bg-primary/5", userData.settings.offDays.includes(format(day, 'EEE')) && "bg-secondary/20")}>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{format(day, 'EEE')}{userData.settings.offDays.includes(format(day, 'EEE')) && <span className="ml-1 text-[8px] text-rose-500">(OFF)</span>}</span>
                    <span className={cn("text-lg font-black tracking-tighter", isSameDay(day, new Date()) && "text-primary", userData.settings.offDays.includes(format(day, 'EEE')) && "opacity-30")}>{format(day, 'd')}</span>
                  </div>
                ))}</div>
              </div>
              <div className="divide-y-2 divide-border">
                {/* --- OPEN SPOTS (DESKTOP) --- */}
                <div className="flex bg-amber-500/[0.03]">
                  <div className="w-72 p-6 border-r-2 border-border shrink-0 flex items-center gap-3"><div className="size-8 rounded-lg bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-600"><Clock size={16} /></div><span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Open Spots</span></div>
                  <div className="flex flex-1">{daysOfWeek.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const isOff = userData.settings.offDays.includes(format(day, 'EEE'));
                    const time = workTimes.find(w => w.staffId === 'open' && w.day === dayStr);
                    return (
                      <div key={dayStr} onDragOver={e => e.preventDefault()} onDrop={e => handleNativeDrop(e, 'open', dayStr)} onClick={() => !isOff && handleCellClick('open', day)} className={cn("flex-1 p-2 border-r-2 last:border-r-0 min-h-[100px] flex items-center justify-center relative", isOff ? "bg-secondary/40 cursor-not-allowed" : "hover:bg-secondary/20 cursor-pointer")}>
                        {isOff ? <X className="opacity-10" /> : (time ? <WorkTimeBlock time={time} onNativeDragStart={e => handleNativeDragStart(e, time.id)} /> : <Plus size={16} className="text-muted-foreground/30 opacity-0 hover:opacity-100" />)}
                      </div>
                    );
                  })}</div>
                </div>

                {GROUPS.map(group => (
                  <div key={group.id} className="flex flex-col">
                    <div className="flex bg-secondary/50 border-b-2 border-border"><div className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><div className="size-2 rounded-full bg-primary" />{group.name} ({group.members.length})</div></div>
                    {group.members.map(member => (
                      <div key={member.id} className="flex hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <div className="w-72 p-4 border-r-2 border-border shrink-0 flex items-center justify-between">
                          <div className="flex items-center gap-4"><Avatar className="size-10 border-2 border-border"><AvatarImage src={member.photo} /><AvatarFallback>{member.name[0]}</AvatarFallback></Avatar><div><p className="text-sm font-black tracking-tight truncate">{member.name}</p><p className="text-[10px] font-bold text-muted-foreground uppercase truncate">{member.role}</p></div></div>
                          <div className={cn("text-[10px] font-black rounded-full px-2 py-1", weeklyHours[member.id] > 40 ? 'bg-amber-500/20 text-amber-600' : 'bg-secondary')}>{weeklyHours[member.id] || 0}h</div>
                        </div>
                        <div className="flex flex-1">{daysOfWeek.map(day => {
                          const dayStr = format(day, 'yyyy-MM-dd');
                          const isOff = userData.settings.offDays.includes(format(day, 'EEE'));
                          const time = workTimes.find(w => w.staffId === member.id && w.day === dayStr);
                          const timeOff = TIME_OFF_REQUESTS.find(to => to.staffId === member.id && to.day === dayStr);
                          const isConflict = !!draggedItem && (!!time || !!timeOff || isOff);
                          return (
                            <div key={dayStr} onDragOver={e => e.preventDefault()} onDrop={e => handleNativeDrop(e, member.id, dayStr)} onClick={() => !isOff && !timeOff && handleCellClick(member.id, day)} className={cn("flex-1 p-2 border-r-2 last:border-r-0 min-h-[100px] flex items-center justify-center relative transition-all", isOff || timeOff ? "cursor-not-allowed" : "cursor-pointer hover:bg-secondary/20", isConflict && "ring-2 ring-rose-500 bg-rose-500/10")}>
                              {isOff ? <div className="text-[8px] font-black uppercase opacity-10 rotate-[-45deg]">Closed</div> : time ? <WorkTimeBlock time={time} onNativeDragStart={e => handleNativeDragStart(e, time.id)} /> : timeOff ? <TimeOffBlock request={timeOff}/> : <Plus size={16} className="text-muted-foreground/30 opacity-0 hover:opacity-100" />}
                            </div>
                          );
                        })}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div></div>
          )}
        </div>

        {/* --- ADD/EDIT DRAWER --- */}
        <AnimatePresence>{isDrawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l-4 border-black dark:border-white shadow-2xl z-50 flex flex-col">
                <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30"><div className="flex items-center gap-4"><div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20"><Clock size={24} /></div><div><h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Modify Shift</h2><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Refine the schedule</p></div></div><Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}><X size={24} /></Button></div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8"><div className="space-y-4"><label className="text-[10px] font-black uppercase ml-1">Work Note</label><Input value={editingTime?.note || ""} onChange={e => setEditingTime(p => ({ ...p, note: e.target.value }))} placeholder="What is the job?" className="h-14 rounded-xl border-2 font-bold bg-secondary/20" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-4"><label className="text-[10px] font-black uppercase ml-1">Start Time</label><Input value={editingTime?.startTime || ""} onChange={e => setEditingTime(p => ({ ...p, startTime: e.target.value }))} className="h-14 rounded-xl border-2 font-mono" /></div><div className="space-y-4"><label className="text-[10px] font-black uppercase ml-1">End Time</label><Input value={editingTime?.endTime || ""} onChange={e => setEditingTime(p => ({ ...p, endTime: e.target.value }))} className="h-14 rounded-xl border-2 font-mono" /></div></div></div>
                <div className="p-8 border-t-2 flex gap-4 bg-secondary/10">{editingTime?.id && <Button variant="outline" onClick={() => { setWorkTimes(prev => prev.filter(w => w.id !== editingTime.id)); setIsDrawerOpen(false); }} className="flex-1 h-14 rounded-xl font-black uppercase text-destructive border-destructive/20">Delete</Button>}<Button onClick={saveWorkTime} className="flex-[2] h-14 rounded-xl font-black uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Save Change</Button></div>
              </motion.div>
            </>
        )}</AnimatePresence>

        {/* --- HISTORY DRAWER --- */}
        <AnimatePresence>{isHistoryOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l-4 border-black dark:border-white shadow-2xl z-50 flex flex-col">
                <div className="p-8 border-b-2 flex items-center justify-between bg-secondary/30"><div className="flex items-center gap-4"><div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border-2 border-orange-500/20"><HistoryIcon size={24} /></div><div><h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Log History</h2><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit Trail</p></div></div><Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}><X size={24} /></Button></div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-20 opacity-20"><HistoryIcon size={48} className="mx-auto mb-4"/><p className="font-black uppercase text-xs">No entries yet</p></div>
                  ) : (
                    history.map(entry => (
                      <div key={entry.id} className="relative pl-6 border-l-2 border-border pb-6 last:pb-0">
                        <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-background border-2 border-primary" />
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-black uppercase text-primary tracking-widest">{entry.action}</span><span className="text-[8px] font-bold text-muted-foreground">{format(entry.timestamp, 'hh:mm a')}</span></div>
                        <p className="text-sm font-bold leading-tight mb-1">{entry.details}</p>
                        <p className="text-[9px] font-black uppercase text-muted-foreground/50">By {entry.user}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
        )}</AnimatePresence>
      </main>
    </div>
  );
}

function WorkTimeBlock({ time, onNativeDragStart }: { time: WorkTime; onNativeDragStart?: (e: React.DragEvent<HTMLDivElement>) => void; }) {
  const colorClasses = { blue: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300", purple: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300", gray: "bg-zinc-500/10 border-zinc-500/30 text-zinc-700 dark:text-zinc-300" };
  return (
    <motion.div layout draggable={!!onNativeDragStart} onDragStart={onNativeDragStart as any} className={cn("w-full h-full p-3 rounded-2xl border-2 flex flex-col justify-between relative group/block overflow-hidden transition-all cursor-grab active:cursor-grabbing", colorClasses[time.color as keyof typeof colorClasses] || colorClasses.blue, time.isDraft && "border-dashed opacity-80 shadow-sm")}>
      {time.isDraft && time.staffId !== 'open' && <div className="absolute top-0 right-0 p-1 bg-amber-500 text-[8px] font-black text-white px-2 rounded-bl-lg uppercase">Draft</div>}
      <div><div className="flex items-center gap-1.5 mb-1"><Clock size={10} /><span className="text-[10px] font-black tracking-tighter uppercase leading-none">{time.startTime} - {time.endTime}</span></div><p className="text-[11px] font-black leading-tight uppercase tracking-tight line-clamp-2">{time.note || "Work Time"}</p></div>
      <div className="mt-2 flex justify-end"><div className="size-5 rounded-lg bg-black/5 flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-opacity"><MoreHorizontal size={12} /></div></div>
    </motion.div>
  );
}

function TimeOffBlock({request, mobile}: {request: TimeOffRequest, mobile?: boolean}) {
    return (
        <div className={cn("rounded-2xl border-2 border-dashed border-zinc-500/30 flex flex-col justify-center items-center text-center bg-zinc-500/5 cursor-not-allowed", mobile ? "p-4" : "w-full h-full p-3")}>
            <Coffee size={mobile ? 20 : 14} className="text-zinc-500 mb-1" />
            <p className={cn("font-black uppercase text-zinc-500", mobile ? "text-xs" : "text-[10px]")}>TIME OFF</p>
            <p className={cn("font-bold text-zinc-500/60 leading-tight line-clamp-2", mobile ? "text-[10px]" : "text-[9px]")}>{request.note}</p>
        </div>
    )
}
