"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Plus, Calendar, ChevronLeft, ChevronRight, 
  MoreHorizontal, Users, Clock, AlertCircle, 
  Check, X, Share2, Info, UserPlus, Search, Menu, ArrowLeft,
  Sparkles, Loader2, Trash2, GripVertical, Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay, parse } from "date-fns";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useSidebar } from "@/hooks/use-sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// --- SIMPLE TYPES ---
interface WorkTime { id: string; staffId: string; day: string; startTime: string; endTime: string; note: string; color: string; isDraft: boolean; }
interface Staff { id: string; name: string; role: string; photo: string; }
interface Group { id: string; name: string; members: Staff[]; }
interface TimeOffRequest { id: string; staffId: string; day: string; note: string; }

// --- DUMMY DATA ---
const GROUPS: Group[] = [
  { id: "g1", name: "Front Desk", members: [{ id: "s1", name: "Sarah Miller", role: "Morning Lead", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sarah" }, { id: "s2", name: "John Davis", role: "Reception", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=John" }] },
  { id: "g2", name: "Sales Team", members: [{ id: "s3", name: "Mike Ross", role: "Closer", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Mike" }, { id: "s4", name: "Anna Specter", role: "Support", photo: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Anna" }] }
];
const getAutoColor = (staffId: string) => staffId === 'open' ? 'gray' : (GROUPS.find(g => g.members.some(m => m.id === staffId))?.id === 'g1' ? 'blue' : 'purple');
const DUMMY_USER_DATA = { settings: { offDays: ["Sat", "Sun"] } };
const TIME_OFF_REQUESTS: TimeOffRequest[] = [
  { id: "to1", staffId: "s2", day: format(addDays(new Date(), 1), 'yyyy-MM-dd'), note: "Doctor's Appointment" },
  { id: "to2", staffId: "s4", day: format(addDays(new Date(), 2), 'yyyy-MM-dd'), note: "Personal Day" }
];

export default function TeamWorkTimesPage() {
  const { setIsMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const userData = DUMMY_USER_DATA;
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workTimes, setWorkTimes] = useState<WorkTime[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<Partial<WorkTime> | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const daysOfWeek = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)), [selectedDate]);

  const weeklyHours = useMemo(() => {
    const hours: Record<string, number> = {};
    GROUPS.flatMap(g => g.members).forEach(m => hours[m.id] = 0);
    workTimes.forEach(w => {
      if (w.staffId !== 'open') {
        try {
            const start = parse(w.startTime, 'p', new Date());
            const end = parse(w.endTime, 'p', new Date());
            const shiftHours = (end.getTime() - start.getTime()) / 3600000;
            hours[w.staffId] = (hours[w.staffId] || 0) + (shiftHours > 0 ? shiftHours : 0);
        } catch (e) { /* ignore parse error */ }
      }
    });
    return hours;
  }, [workTimes]);

  const moveShift = (workTimeId: string, targetStaffId: string, targetDay: string) => {
    const isConflict = workTimes.some(w => w.id !== workTimeId && w.staffId === targetStaffId && w.day === targetDay) || TIME_OFF_REQUESTS.some(to => to.staffId === targetStaffId && to.day === targetDay);
    if (isConflict) { toast.error("Cannot schedule over an existing shift or time off."); return; }
    setWorkTimes(prev => prev.map(w => w.id === workTimeId ? { ...w, staffId: targetStaffId, day: targetDay, color: getAutoColor(targetStaffId), isDraft: true } : w));
    toast.success("Shift moved!");
  };

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>, workTimeId: string) => { e.dataTransfer.setData("workTimeId", workTimeId); setDraggedItem(workTimeId); };
  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>, targetStaffId: string, targetDay: string) => { e.preventDefault(); setDraggedItem(null); moveShift(e.dataTransfer.getData("workTimeId"), targetStaffId, targetDay); };

  const handleMobileDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, shiftId: string) => {
    let dropped = false;
    for (const [dayStr, ref] of Object.entries(dayRefs.current)) {
      if (ref) {
        const { top, bottom } = ref.getBoundingClientRect();
        if (info.point.y >= top && info.point.y <= bottom) { moveShift(shiftId, "any", dayStr); dropped = true; break; }
      }
    }
    setDraggedOverDay(null);
  };

  const handleCellClick = (staffId: string, day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (TIME_OFF_REQUESTS.some(to => to.staffId === staffId && to.day === dayStr)) return;
    const existing = workTimes.find(w => w.staffId === staffId && w.day === dayStr);
    setEditingTime(existing || { staffId, day: dayStr, startTime: "9:00 AM", endTime: "5:00 PM", note: "", color: getAutoColor(staffId), isDraft: true });
    setIsDrawerOpen(true);
  };
  
  const saveWorkTime = () => {
    if (!editingTime) return;
    const final = { ...editingTime, id: editingTime.id || Math.random().toString(36).substr(2, 9), color: getAutoColor(editingTime.staffId || '') } as WorkTime;
    setWorkTimes(prev => editingTime.id ? prev.map(w => w.id === editingTime.id ? final : w) : [...prev, final]);
    setIsDrawerOpen(false);
  };

  const weekLabel = useMemo(() => {
    const startOfCurrent = startOfWeek(new Date(), { weekStartsOn: 1 });
    const label = isSameDay(daysOfWeek[0], startOfCurrent) ? "This Week" : isSameDay(daysOfWeek[0], addDays(startOfCurrent, 7)) ? "Next Week" : isSameDay(daysOfWeek[0], addDays(startOfCurrent, -7)) ? "Last Week" : format(daysOfWeek[0], 'MMMM yyyy');
    return (
      <div className="flex flex-col items-center"><span className="text-[10px] font-black uppercase text-primary tracking-widest">{label}</span><span className="text-[9px] font-bold text-muted-foreground opacity-60">{format(daysOfWeek[0], 'MMM d')} - {format(daysOfWeek[6], 'MMM d')}</span></div>
    );
  }, [daysOfWeek]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 min-w-0"><Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setIsMobileOpen(true)}><Menu size={20} /></Button><Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0"><ArrowLeft size={20} /></Button><h1 className="font-black uppercase tracking-widest text-xs md:text-sm truncate">Team Work Times</h1></div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="flex items-center bg-secondary/50 rounded-xl p-1 border-2 border-border shadow-inner"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, -7))}><ChevronLeft size={16} /></Button><div className="min-w-[100px] md:min-w-[160px] flex items-center justify-center">{weekLabel}</div><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, 7))}><ChevronRight size={16} /></Button></div>
             <div className="flex items-center gap-1.5 md:gap-2">
                <Button onClick={()=>{}} disabled={isAutoFilling} variant="outline" className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-primary/20 bg-primary/5 text-primary active:scale-95", isMobile && "h-10 w-10 p-0")}>{isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={isMobile ? 18 : 14} />}</Button>
                <Button onClick={()=>{}} className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", isMobile ? "h-10 w-10 p-0" : "h-10 px-6")}><Share2 size={isMobile ? 18 : 14} /></Button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-zinc-950 p-4 md:p-8">
            <div className="min-w-[1000px] bg-card rounded-[2.5rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
              <div className="flex border-b-2 border-border bg-secondary/30">
                <div className="w-72 p-6 border-r-2 border-border shrink-0 flex items-center gap-3"><Users size={20} className="text-primary" /><span className="text-xs font-black uppercase tracking-widest">Team Members</span></div>
                <div className="flex flex-1">{daysOfWeek.map(day => (<div key={day.toISOString()} className={cn("flex-1 p-4 text-center border-r-2 last:border-r-0", isSameDay(day, new Date()) && "bg-primary/5", DUMMY_USER_DATA.settings.offDays.includes(format(day, 'EEE')) && "bg-secondary/20")}><span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{format(day, 'EEE')}{DUMMY_USER_DATA.settings.offDays.includes(format(day, 'EEE')) && <span className="ml-1 text-[8px] text-rose-500">(OFF)</span>}</span><span className={cn("text-lg font-black tracking-tighter", isSameDay(day, new Date()) && "text-primary", DUMMY_USER_DATA.settings.offDays.includes(format(day, 'EEE')) && "opacity-30")}>{format(day, 'd')}</span></div>))}</div>
              </div>
              <div className="divide-y-2 divide-border">
                {GROUPS.map(group => (
                  <div key={group.id} className="flex flex-col">
                    <div className="flex bg-secondary/50 border-b-2 border-border"><div className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{group.name}</div></div>
                    {group.members.map(member => (
                      <div key={member.id} className="flex hover:bg-slate-50/50 dark:hover:bg-white/5">
                        <div className="w-72 p-4 border-r-2 border-border shrink-0 flex items-center justify-between"><div className="flex items-center gap-4"><Avatar className="size-10 border-2"><AvatarImage src={member.photo} /><AvatarFallback>{member.name[0]}</AvatarFallback></Avatar><div><p className="text-sm font-black tracking-tight">{member.name}</p><p className="text-[10px] font-bold uppercase">{member.role}</p></div></div><div className={cn("text-xs font-bold rounded-lg px-2.5 py-1", weeklyHours[member.id] > 40 ? 'bg-amber-500/20 text-amber-600' : 'bg-secondary')}>{weeklyHours[member.id]}h</div></div>
                        <div className="flex flex-1">{daysOfWeek.map(day => {
                          const dayStr = format(day, 'yyyy-MM-dd');
                          const time = workTimes.find(w => w.staffId === member.id && w.day === dayStr);
                          const timeOff = TIME_OFF_REQUESTS.find(to => to.staffId === member.id && to.day === dayStr);
                          const isOffDay = DUMMY_USER_DATA.settings.offDays.includes(format(day, 'EEE'));
                          const isConflict = !!draggedItem && (!!time || !!timeOff || isOffDay);
                          return (
                            <div key={day.toISOString()} onDragOver={e => e.preventDefault()} onDrop={e => handleNativeDrop(e, member.id, dayStr)} onDragLeave={() => setDraggedItem(null)} onDragEnd={() => setDraggedItem(null)} onClick={() => !isOffDay && !timeOff && handleCellClick(member.id, day)} className={cn("flex-1 p-2 border-r-2 last:border-r-0 min-h-[100px] flex items-center justify-center relative", isOffDay || timeOff ? "cursor-not-allowed" : "cursor-pointer hover:bg-secondary/20", isConflict && "ring-2 ring-rose-500")}>
                              {isOffDay ? <div className="text-xs font-black uppercase opacity-10 rotate-[-45deg]">Closed</div> : time ? <WorkTimeBlock time={time} onNativeDragStart={e => handleNativeDragStart(e, time.id)} /> : timeOff ? <TimeOffBlock request={timeOff}/> : <Plus size={16} className="text-muted-foreground/30 opacity-0 hover:opacity-100" />}
                            </div>
                          );
                        })}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
        </div>

        <AnimatePresence>{isDrawerOpen && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l-4 z-50 flex flex-col">
              <div className="p-8 border-b-2 flex items-center justify-between"><div className="flex items-center gap-4"><div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Clock size={24} /></div><div><h2 className="text-2xl font-black uppercase">Add Work Time</h2><p className="text-[10px] font-bold uppercase">Setup schedule</p></div></div><Button variant="ghost" size="icon" onClick={() => setIsDrawerOpen(false)}><X size={24} /></Button></div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8"><div className="space-y-4"><label className="text-[10px] font-black uppercase ml-1">Work Note</label><Input value={editingTime?.note || ""} onChange={e => setEditingTime(p => ({ ...p, note: e.target.value }))} placeholder="e.g. Morning Shift" className="h-14 rounded-xl font-bold" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-4"><label className="text-[10px] font-black uppercase ml-1">Start</label><Input value={editingTime?.startTime || ""} onChange={e => setEditingTime(p => ({ ...p, startTime: e.target.value }))} className="h-14 rounded-xl" /></div><div className="space-y-4"><label className="text-[10px] font-black uppercase ml-1">End</label><Input value={editingTime?.endTime || ""} onChange={e => setEditingTime(p => ({ ...p, endTime: e.target.value }))} className="h-14 rounded-xl" /></div></div></div>
              <div className="p-8 border-t-2 flex gap-4"><Button variant="outline" onClick={() => { setWorkTimes(p => p.filter(w => w.id !== editingTime?.id)); setIsDrawerOpen(false); }} className="flex-1 h-14 rounded-xl font-black uppercase text-destructive">Delete</Button><Button onClick={saveWorkTime} className="flex-[2] h-14 rounded-xl font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Save</Button></div>
            </motion.div>
        )}</AnimatePresence>
      </main>
    </div>
  );
}

function WorkTimeBlock({ time, onNativeDragStart }: { time: WorkTime; onNativeDragStart: (e: React.DragEvent<HTMLDivElement>) => void; }) {
  const colorClasses = { blue: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300", purple: "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300", gray: "bg-zinc-500/10 border-zinc-500/30 text-zinc-700 dark:text-zinc-300" };
  return (
    <motion.div draggable onDragStart={onNativeDragStart as any} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("w-full h-full p-3 rounded-2xl border-2 flex flex-col justify-between relative group/block overflow-hidden", colorClasses[time.color as keyof typeof colorClasses] || colorClasses.blue, time.isDraft && "border-dashed")}>
      {time.isDraft && <div className="absolute top-0 right-0 p-1 bg-amber-500 text-[8px] font-black text-white px-2 rounded-bl-lg">Draft</div>}
      <div><div className="flex items-center gap-1.5 mb-1"><Clock size={10} /><span className="text-[10px] font-black uppercase">{time.startTime} - {time.endTime}</span></div><p className="text-[11px] font-black leading-tight uppercase line-clamp-2">{time.note || "Work Time"}</p></div>
      <div className="mt-2 flex justify-end"><MoreHorizontal size={12} className="opacity-0 group-hover/block:opacity-100" /></div>
    </motion.div>
  );
}

function TimeOffBlock({request}: {request: TimeOffRequest}) {
    return (
        <div className="w-full h-full p-3 rounded-2xl border-2 border-dashed border-zinc-500/30 flex flex-col justify-center items-center text-center bg-zinc-500/5 cursor-not-allowed">
            <Coffee size={14} className="text-zinc-500 mb-1" />
            <p className="text-[10px] font-black uppercase text-zinc-500">TIME OFF</p>
            <p className="text-[9px] font-bold text-zinc-500/60 leading-tight line-clamp-2">{request.note}</p>
        </div>
    )
}