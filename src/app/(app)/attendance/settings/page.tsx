"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Save, Clock, Calendar as CalendarIcon, Info,
  CheckCircle2, LayoutGrid, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useAttendance } from "@/hooks/use-attendance";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAYS = [
  { id: "Mon", label: "Monday" },
  { id: "Tue", label: "Tuesday" },
  { id: "Wed", label: "Wednesday" },
  { id: "Thu", label: "Thursday" },
  { id: "Fri", label: "Friday" },
  { id: "Sat", label: "Saturday" },
  { id: "Sun", label: "Sunday" }
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  return { id: String(day), label: `${day}${suffix}` };
});

export default function AttendanceSettingsPage() {
  const { userData } = useAuth();
  const { attendanceSettings, offDays: initialOffDays, loading: attendanceLoading } = useAttendance();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    payrollCycleStart: "25",
    payrollCycleEnd: "25",
    offDays: [] as string[],
    currency: "PKR"
  });

  const orgId = userData?.ownedOrgId || userData?.orgId;

  useEffect(() => {
    if (!attendanceLoading) {
      setSettings({
        payrollCycleStart: attendanceSettings.payrollCycleStart || "25",
        payrollCycleEnd: attendanceSettings.payrollCycleEnd || "25",
        offDays: initialOffDays || [],
        currency: attendanceSettings.currency || "PKR"
      });
      setLoading(false);
    }
  }, [attendanceLoading, attendanceSettings, initialOffDays]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "organizations", orgId), {
        attendanceSettings: {
          payrollCycleStart: settings.payrollCycleStart,
          payrollCycleEnd: settings.payrollCycleEnd,
          currency: settings.currency || "PKR",
        },
        'settings.offDays': settings.offDays
      });
      toast.success("Attendance configurations synchronized.");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to synchronize settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleOffDay = (dayId: string) => {
    setSettings(prev => ({
      ...prev,
      offDays: prev.offDays.includes(dayId)
        ? prev.offDays.filter(d => d !== dayId)
        : [...prev.offDays, dayId]
    }));
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="size-12 rounded-full bg-secondary/50" />
        <div className="h-4 w-48 bg-secondary/50 rounded" />
      </div>
    </div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {/* Banner Area (EMS Style) */}
        <div className="w-full h-48 md:h-64 lg:h-72 rounded-[2.5rem] overflow-hidden relative shadow-lg">
          <img
            src={`https://picsum.photos/seed/${userData?.orgName || 'attendance'}/1600/400`}
            alt="Organization Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info Area */}
        <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-4 md:px-8 z-10 relative mb-12">
          <div className="flex-shrink-0">
            <div className="h-28 w-28 md:h-40 md:w-40 border-4 border-background rounded-[2.5rem] shadow-xl bg-card overflow-hidden flex items-center justify-center">
              <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Settings size={64} className="opacity-40" />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:ml-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">{userData?.orgName || 'Attendance Module'}</h1>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-lg uppercase font-black tracking-widest text-[9px]">Official Command</Badge>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm opacity-60">System Configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-xl shadow-primary/20 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <RotateCcw className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
                Sync Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Cards Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
          
          {/* Payroll Policy */}
          <Card className="border-border/50 shadow-sm rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm border-l-4 border-l-emerald-500/50">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CalendarIcon className="size-5" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Payroll Policy</CardTitle>
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Define the monthly cycle for ledger calculation</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cycle Starts On</Label>
                  <Select 
                    value={settings.payrollCycleStart} 
                    onValueChange={(v) => setSettings({...settings, payrollCycleStart: v})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-secondary/20 px-5 font-bold border-2 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                      {MONTH_DAYS.map((day) => (
                        <SelectItem key={day.id} value={day.id} className="rounded-xl font-bold">{day.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center pt-6 opacity-20">
                    <Clock size={24} />
                </div>

                <div className="flex-1 w-full space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cycle Ends On</Label>
                  <Select 
                    value={settings.payrollCycleEnd} 
                    onValueChange={(v) => setSettings({...settings, payrollCycleEnd: v})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-secondary/20 px-5 font-bold border-2 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                      {MONTH_DAYS.map((day) => (
                        <SelectItem key={day.id} value={day.id} className="rounded-xl font-bold">{day.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border/50">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Default Payroll Currency</Label>
                <Select 
                  value={settings.currency || "PKR"} 
                  onValueChange={(v) => setSettings({...settings, currency: v})}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-secondary/20 px-5 font-bold border-2 focus:ring-emerald-500/20">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                    <SelectItem value="PKR" className="rounded-xl font-bold">PKR (₨) - Pakistani Rupee</SelectItem>
                    <SelectItem value="USD" className="rounded-xl font-bold">USD ($) - US Dollar</SelectItem>
                    <SelectItem value="INR" className="rounded-xl font-bold">INR (₹) - Indian Rupee</SelectItem>
                    <SelectItem value="EUR" className="rounded-xl font-bold">EUR (€) - Euro</SelectItem>
                    <SelectItem value="GBP" className="rounded-xl font-bold">GBP (£) - British Pound</SelectItem>
                    <SelectItem value="AED" className="rounded-xl font-bold">AED (د.إ) - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center p-4 rounded-2xl border border-dashed border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-600/40">
                  Global Configuration Active
              </div>
            </CardContent>
          </Card>

          {/* Standard Workdays */}
          <Card className="border-border/50 shadow-sm rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm border-l-4 border-l-blue-500/50">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <LayoutGrid className="size-5" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Standard Workdays</CardTitle>
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Default Organizational Off-Days</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="grid grid-cols-4 gap-3">
                {DAYS.map((day) => {
                  const isActive = settings.offDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => toggleOffDay(day.id)}
                      className={cn(
                        "h-20 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden",
                        isActive 
                          ? "bg-blue-500/10 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/10 scale-105" 
                          : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{day.id}</span>
                      <span className="text-[10px] font-bold opacity-60">{day.label}</span>
                      {isActive && (
                        <div className="absolute top-0 right-0 p-1.5 bg-blue-500 text-white rounded-bl-xl shadow-md">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-3 items-start p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-blue-600/80 leading-relaxed uppercase tracking-tight">
                  Selected days are globally marked as non-working. The ledger will exclude these from required attendance counts unless overrides are manually applied.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
