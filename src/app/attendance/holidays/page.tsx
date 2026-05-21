"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CalendarDays, Plus, Calendar as CalendarIcon, 
  Trash2, ChevronLeft, ChevronRight, X, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useAttendance } from "@/hooks/use-attendance";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { 
  format, isSameDay, startOfMonth, endOfMonth, 
  eachDayOfInterval, isWithinInterval, parseISO, 
  startOfDay, addMonths, subMonths, startOfWeek, endOfWeek,
  isSameMonth
} from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";

// Import the reusable Calendar only for the Modal range selection
import { Calendar as UICalendar } from "@/components/ui/calendar";

interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export default function HolidaysPage() {
  const { userData } = useAuth();
  const { holidays, orgData, loading: attendanceLoading } = useAttendance();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Custom Calendar State
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const orgId = userData?.ownedOrgId || userData?.orgId

  useEffect(() => {
    if (!attendanceLoading) {
      setLoading(false);
    }
  }, [attendanceLoading]);

  const handleAddHoliday = async () => {
    if (!newHolidayName || !dateRange?.from || !dateRange?.to) {
      toast.error("Please provide a name and select a date range");
      return;
    }

    const holiday: Holiday = {
      id: crypto.randomUUID(),
      name: newHolidayName,
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
    };

    try {
      await updateDoc(doc(db, "organizations", orgId!), {
        holidays: arrayUnion(holiday)
      });
      // holidays list updates automatically via useAttendance hook's listener
      setIsModalOpen(false);
      setNewHolidayName("");
      setDateRange({ from: new Date(), to: new Date() });
      toast.success("Holiday added successfully");
    } catch (err) {
      console.error("Error adding holiday:", err);
      toast.error("Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      await updateDoc(doc(db, "organizations", orgId!), {
        holidays: arrayRemove(holiday)
      });
      // holidays list updates automatically via useAttendance hook's listener
      toast.success("Holiday removed");
    } catch (err) {
      console.error("Error removing holiday:", err);
      toast.error("Failed to remove holiday");
    }
  };

  const isHoliday = (day: Date) => {
    return (holidays as Holiday[]).some((h: Holiday) => {
      const start = startOfDay(parseISO(h.startDate));
      const end = startOfDay(parseISO(h.endDate));
      return isWithinInterval(startOfDay(day), { start, end });
    });
  };

  const isOffDay = (day: Date) => {
    const dayName = format(day, "EEEE");
    const shortDayName = format(day, "EEE");
    const offDays: string[] = (orgData as any)?.settings?.offDays || [];
    return offDays.includes(dayName) || offDays.includes(shortDayName);
  };

  // Bespoke Calendar Generation
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentViewDate));
    const end = endOfWeek(endOfMonth(currentViewDate));
    return eachDayOfInterval({ start, end });
  }, [currentViewDate]);

  if (loading && !orgData) {
    return <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="size-12 rounded-full bg-secondary/50" />
        <div className="h-4 w-48 bg-secondary/50 rounded" />
      </div>
    </div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CalendarDays size={24} />
            </div>
            Holidays
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage organizational holidays and off-days.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-6 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              <Plus size={18} />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[850px] w-[95vw] rounded-3xl border-border/50 shadow-2xl backdrop-blur-xl p-0 overflow-hidden">
            <div className="p-8 bg-secondary/5 border-b border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Create Holiday</DialogTitle>
                <DialogDescription className="text-base">Select the dates for the organizational holiday.</DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Holiday Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Eid Al-Fitr, Independence Day" 
                  className="h-14 rounded-2xl border-border/50 bg-secondary/20 px-5 text-lg font-medium focus:ring-emerald-500/20"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Date Range</Label>
                  <div className="flex items-center gap-2">
                    {dateRange?.from && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
                        <span className="opacity-60 text-[8px] uppercase tracking-tighter mr-1">Start</span>
                        {format(dateRange.from, "MMM d, yyyy")}
                        <button 
                          onClick={() => setDateRange(prev => prev ? ({ ...prev, from: undefined }) : undefined)}
                          className="ml-1 p-0.5 hover:bg-emerald-500/20 rounded-md transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {dateRange?.from && dateRange?.to && <ChevronRight size={14} className="text-muted-foreground opacity-30" />}
                    {dateRange?.to && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
                        <span className="opacity-60 text-[8px] uppercase tracking-tighter mr-1">End</span>
                        {format(dateRange.to, "MMM d, yyyy")}
                        <button 
                          onClick={() => setDateRange(prev => prev ? ({ ...prev, to: undefined }) : undefined)}
                          className="ml-1 p-0.5 hover:bg-emerald-500/20 rounded-md transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center p-6 rounded-[2.5rem] border border-border/50 bg-secondary/5 overflow-x-auto shadow-inner">
                  <UICalendar
                    initialFocus
                    mode="range"
                    showOutsideDays={false}
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="rounded-md"
                    classNames={{
                      months: "flex flex-col md:flex-row space-y-4 md:space-x-12 md:space-y-0",
                      day_range_start: "bg-emerald-600 text-white rounded-l-xl",
                      day_range_end: "bg-emerald-600 text-white rounded-r-xl",
                      day_range_middle: "bg-emerald-500/20 text-emerald-600 rounded-none",
                      day_selected: "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white",
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-secondary/5 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-12 px-8 rounded-2xl font-bold text-base">Cancel</Button>
              <Button onClick={handleAddHoliday} className="h-12 px-10 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">Save Holiday</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* Bespoke Custom Calendar - 70% */}
        <Card className="lg:col-span-7 border-border/50 shadow-sm rounded-[2rem] overflow-hidden bg-card/50 backdrop-blur-sm flex flex-col">
          <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between bg-secondary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CalendarIcon size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase">{format(currentViewDate, "MMMM yyyy")}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentViewDate(subMonths(currentViewDate, 1))} className="rounded-xl size-10 border-border/50 hover:bg-secondary">
                <ChevronLeft size={18} />
              </Button>
              <Button variant="outline" className="px-4 font-bold rounded-xl border-border/50 hover:bg-secondary text-xs uppercase tracking-widest" onClick={() => setCurrentViewDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentViewDate(addMonths(currentViewDate, 1))} className="rounded-xl size-10 border-border/50 hover:bg-secondary">
                <ChevronRight size={18} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 flex flex-col">
            {/* Custom Grid */}
            <div className="grid grid-cols-7 border-b border-border/30 bg-secondary/10">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-4 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{day}</span>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 flex-1">
              {calendarDays.map((day, i) => {
                const holiday = isHoliday(day);
                const offDay = isOffDay(day);
                const isCurrentMonth = isSameMonth(day, currentViewDate);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[120px] p-3 border-r border-b border-border/30 transition-all relative group",
                      !isCurrentMonth && "bg-secondary/5 opacity-30",
                      holiday && "bg-emerald-500/[0.03]",
                      offDay && "bg-rose-500/[0.02]"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "size-8 flex items-center justify-center rounded-xl text-sm font-black transition-all",
                        isToday ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110" : "text-foreground/80",
                        !isCurrentMonth && "font-medium"
                      )}>
                        {format(day, "d")}
                      </span>
                      
                      {holiday && (
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 animate-in fade-in zoom-in duration-300">
                          <CalendarIcon size={12} />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-1">
                      {holiday && (
                        <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter truncate">
                            {(holidays as Holiday[]).find((h: Holiday) => isWithinInterval(startOfDay(day), { start: startOfDay(parseISO(h.startDate)), end: startOfDay(parseISO(h.endDate)) }))?.name}
                          </p>
                        </div>
                      )}
                      {offDay && !holiday && (
                        <div className="px-2 py-1 rounded-lg bg-rose-500/5 border border-rose-500/10">
                          <p className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest">Off Day</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Embedded Legend */}
            <div className="p-6 grid grid-cols-2 gap-8 bg-secondary/5 border-t border-border/30">
               <div className="flex items-center gap-4">
                  <div className="size-4 rounded-lg bg-emerald-500/20 border-2 border-emerald-500/30 shadow-sm" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black leading-none uppercase tracking-tight">Scheduled Holiday</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Full Organization Off</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="size-4 rounded-lg bg-rose-500/10 border-2 border-rose-500/20 shadow-sm" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black leading-none uppercase tracking-tight">Weekly Off-Day</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Standard Policy</span>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Holidays Sidebar - 30% */}
        <div className="lg:col-span-3">
          <Card className="border-border/50 shadow-sm rounded-[2rem] overflow-hidden h-full flex flex-col bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/5">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Plus className="size-5 text-emerald-500" />
                Company Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[850px]">
              <div className="divide-y divide-border/50">
                {holidays.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="size-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto opacity-20">
                      <CalendarIcon className="size-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold">No holidays</p>
                      <p className="text-xs text-muted-foreground">Add organizational holidays here.</p>
                    </div>
                  </div>
                ) : (
                  [...(holidays as Holiday[])]
                    .sort((a: Holiday, b: Holiday) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((holiday: Holiday) => (
                      <div key={holiday.id} className="p-5 flex items-center justify-between hover:bg-secondary/20 transition-all group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="size-10 rounded-xl bg-emerald-500/10 flex flex-col items-center justify-center text-emerald-600 font-black shrink-0">
                            <span className="text-[9px] uppercase leading-none">{format(parseISO(holiday.startDate), "MMM")}</span>
                            <span className="text-base leading-none">{format(parseISO(holiday.startDate), "dd")}</span>
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-bold text-sm truncate group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{holiday.name}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1 truncate">
                              {format(parseISO(holiday.startDate), "MMM d")} 
                              {holiday.startDate !== holiday.endDate && (
                                <>
                                  <ChevronRight size={8} />
                                  {format(parseISO(holiday.endDate), "MMM d")}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteHoliday(holiday)}
                          className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-white hover:bg-destructive shadow-sm active:scale-90 shrink-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
