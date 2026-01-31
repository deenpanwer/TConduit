'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, MapPin, Users, Zap, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GlassCard } from './shared/GlassCard';
import { Shimmer } from './shared/Shimmer';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";

const EmployeeCard = ({ emp, isLoading = false }: { emp: any, isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <div className="h-[280px] w-full bg-card border border-border rounded-[2.5rem] p-8 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="size-12 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted/50 rounded" />
          </div>
        </div>
        <div className="mt-auto space-y-4">
          <div className="h-10 w-20 bg-muted rounded" />
          <div className="h-12 w-full bg-muted/30 rounded-xl" />
        </div>
      </div>
    );
  }
  
  const isLive = emp.isLive;
  const chartData = emp.prevHours?.map((v: number, i: number) => ({ v, i })) || [0,0,0,0,0,0].map((v, i) => ({ v, i }));

  return (
    <GlassCard elevated className="p-8 pb-10 relative group overflow-hidden border-b-4 border-b-transparent hover:border-b-primary transition-all duration-500 hover:shadow-2xl h-full flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4 min-w-0 flex-1">
           <div className="relative shrink-0">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="size-12 rounded-2xl overflow-hidden relative z-10 border-2 border-background shadow-xl transition-transform duration-700 group-hover:scale-110 bg-muted/20">
                <img src={emp.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.name}`} className="w-full h-full object-cover" alt={emp.name} />
             </div>
             <div className={`absolute -bottom-1 -right-1 size-3.5 ${isLive ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-card rounded-full z-20 shadow-lg`} />
           </div>
           <div className="min-w-0 flex-1">
             <h4 className="font-black text-lg md:text-xl tracking-tighter uppercase leading-none mb-1 text-foreground">{emp.name}</h4>
             <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-80 leading-tight">{emp.role}</p>
           </div>
        </div>
        
        <div className={`shrink-0 flex items-center ${isLive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'} px-2 py-1 rounded-lg border border-current/10 ml-4`}>
             <Zap className={`w-3 h-3 ${isLive ? 'fill-current animate-pulse' : ''}`} />
        </div>
      </div>

      <div className="mt-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
           <div className="space-y-1">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Output Today</p>
             <h5 className="text-4xl font-black tracking-tighter leading-none">{emp.hoursToday}<span className="text-sm font-medium ml-1 text-muted-foreground/40">h</span></h5>
           </div>
           <div className="flex-1 h-12 relative min-w-0 max-w-[100px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id={`grad-${emp.id}`} x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={isLive ? '#10b981' : '#3b82f6'} stopOpacity={0.3}/>
                     <stop offset="95%" stopColor={isLive ? '#10b981' : '#3b82f6'} stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Area type="monotone" dataKey="v" stroke={isLive ? '#10b981' : '#3b82f6'} strokeWidth={3} fill={`url(#grad-${emp.id})`} isAnimationActive={false} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg w-fit border border-border/50 max-w-full">
           <MapPin className="size-2.5 text-primary shrink-0" />
           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate">{emp.location}</span>
        </div>
      </div>
    </GlassCard>
  );
};

export const EliteWorkforce = ({ employees = [] }: { employees?: any[] }) => {
  const [loading, setLoading] = useState(true);
  const [workforceData, setWorkforceData] = useState<any[]>([]);
  const [totalOrgHours, setTotalOrgHours] = useState("0.0");

  useEffect(() => {
    if (employees.length === 0) return;

    const fetchWorkforceTelemetry = async () => {
      setLoading(true);
      const todayStr = format(new Date(), "yyyy-MM-dd");
      let totalSeconds = 0;

      try {
        const results = await Promise.all(employees.map(async (emp) => {
          // 1. Fetch Today's Time Entries
          const timeRef = collection(db, "users", emp.id, "timeEntries");
          const timeSnap = await getDocs(timeRef);
          let empSeconds = 0;
          
          timeSnap.docs.forEach((doc) => {
            const data = doc.data();
            const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(0);
            if (format(start, "yyyy-MM-dd") === todayStr) {
                empSeconds += (data.duration || 0);
            }
          });
          totalSeconds += empSeconds;

          // 2. Fetch Latest Screenshots for Sparkline & Status
          const screenRef = collection(db, "users", emp.id, "screenshots", todayStr, "images");
          const screenQuery = query(screenRef, orderBy("timestamp", "desc"), limit(10));
          const screenSnap = await getDocs(screenQuery);
          const logs = screenSnap.docs.map(d => d.data());
          
          let isLive = false;
          if (logs.length > 0) {
            const lastTime = logs[0].timestamp?.seconds * 1000 || 0;
            isLive = (Date.now() - lastTime) < (10 * 60 * 1000);
          }

          return {
            id: emp.id,
            name: emp.name,
            role: emp.role || "Staff Member",
            photoUrl: emp.photoUrl,
            location: emp.lastLoginLocation?.city || "Remote",
            hoursToday: (empSeconds / 3600).toFixed(1),
            isLive,
            prevHours: logs.reverse().map(l => l.keystrokes || 0)
          };
        }));

        setWorkforceData(results.slice(0, 3));
        setTotalOrgHours((totalSeconds / 3600).toFixed(1));
        setLoading(false);
      } catch (error) {
        console.error("Workforce telemetry fetch failed:", error);
        setLoading(false);
      }
    };

    fetchWorkforceTelemetry();
  }, [employees]);

  const totalHoursData = Array.from({ length: 12 }, (_, i) => ({ 
    hours: 80 + Math.random() * 40,
    index: i 
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <EmployeeCard key={i} isLoading={true} emp={null} />)
      ) : (
        workforceData.map((emp, i) => (
          <EmployeeCard key={emp.id} emp={emp} />
        ))
      )}

      {/* Aggregate Audit Card */}
      <GlassCard elevated className="bg-slate-950 dark:bg-slate-900 border-none shadow-2xl flex flex-col justify-between p-8 group relative overflow-hidden min-h-[320px]" hoverEffect={false}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Users size={20} />
            </div>
            <div className="flex items-center text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-lg backdrop-blur-md">
                <TrendingUp className="w-3 h-3 mr-1.5" />
                <span>+12.4%</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2">Total Shift Yield</p>
            <div className="flex items-baseline gap-2">
                <h4 className="text-6xl font-black text-white tracking-tighter leading-none">{totalOrgHours}</h4>
                <span className="text-xl font-bold text-white/30 uppercase">h</span>
            </div>
            <p className="text-[10px] font-bold text-white/40 mt-3 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} className="text-primary" /> Combined Node Activity
            </p>
          </div>
        </div>
        
        <div className="mt-auto relative z-10 pt-8">
           <div className="h-16 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={totalHoursData}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={4} fill="url(#totalGrad)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
           <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Expansion Rate</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Stable Growth</span>
           </div>
        </div>
      </GlassCard>
    </div>
  );
};