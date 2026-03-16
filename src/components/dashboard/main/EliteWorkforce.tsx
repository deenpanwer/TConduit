'use client';

import React from 'react';
import { TrendingUp, MapPin, Users, Zap, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GlassCard } from './shared/GlassCard';
import { getUserAvatar } from '@/lib/utils';

const EmployeeCard = ({ emp, isLoading = false }: { emp: any, isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <div className="h-[380px] w-full bg-card border border-border rounded-[2.5rem] p-8 animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div className="size-14 rounded-2xl bg-muted" />
          <div className="h-8 w-10 bg-muted rounded-xl" />
        </div>
        <div className="space-y-3 mb-8">
          <div className="h-10 w-3/4 bg-muted rounded-lg" />
          <div className="h-3 w-1/2 bg-muted/50 rounded-md" />
        </div>
        <div className="mt-auto space-y-4">
          <div className="h-10 w-16 bg-muted rounded-xl" />
          <div className="h-20 w-full bg-muted/30 rounded-2xl" />
        </div>
      </div>
    );
  }
  
  const isLive = emp.isLive;
  const chartData = emp.prevHours?.map((v: number, i: number) => ({ v, i })) || [0,0,0,0,0,0].map((v, i) => ({ v, i }));

  return (
    <GlassCard elevated className="p-8 lg:p-10 relative group overflow-hidden border-b-4 border-b-transparent hover:border-b-primary transition-all duration-500 hover:shadow-2xl h-full flex flex-col min-h-[380px]">
      {/* 1. Header Row: Meta Identity */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="size-14 rounded-2xl overflow-hidden relative z-10 border-2 border-background shadow-xl transition-transform duration-700 group-hover:scale-110 bg-muted/20">
                <img src={getUserAvatar(emp)} className="w-full h-full object-cover" alt={emp.name} />
            </div>
            <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card z-20 ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
        </div>
        
        <div className={`shrink-0 flex items-center ${isLive ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-400/10 border-slate-400/10'} px-3 py-2 rounded-xl border transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:border-primary shadow-sm`}>
             <Zap className={`w-4 h-4 ${isLive ? 'fill-current animate-pulse' : ''}`} />
        </div>
      </div>

      {/* 2. Identity Row: Massive Vertical Name */}
      <div className="mb-6 min-h-[100px] flex flex-col justify-center">
        <h4 className="font-black text-3xl lg:text-4xl tracking-tighter uppercase leading-[0.8] mb-2 text-foreground group-hover:text-primary transition-colors whitespace-pre-wrap break-words">
            {emp.name.split(' ').join('\n')}
        </h4>
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] opacity-80 leading-tight">
            {emp.role}
        </p>
      </div>

      {/* 3. Metrics Row: Output */}
      <div className="mb-6">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Work Hours Today</p>
        <h5 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">
            {emp.hoursToday}<span className="text-xl font-bold ml-1 text-muted-foreground/30">h</span>
        </h5>
      </div>

      {/* 4. Visual Row: High-impact Sparkline */}
      <div className="w-full h-20 lg:h-24 relative mt-auto mb-6">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
            <defs>
                <linearGradient id={`grad-${emp.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isLive ? '#10b981' : '#3b82f6'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isLive ? '#10b981' : '#3b82f6'} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={isLive ? '#10b981' : '#3b82f6'} strokeWidth={4} fill={`url(#grad-${emp.id})`} isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 5. Footer Row: Geography */}
      <div className="pt-6 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 group/loc">
           <MapPin className="size-3 text-primary shrink-0 transition-transform group-hover/loc:scale-125" />
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[120px]">{emp.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <span className="text-[9px] font-black uppercase text-primary tracking-tighter opacity-60">Verified Profile</span>
        </div>
      </div>
    </GlassCard>
  );
};

interface EliteWorkforceProps {
  employees: any[];
  totalHours: string | number;
  isLoading?: boolean;
}

export const EliteWorkforce = ({ employees = [], totalHours = "0.0", isLoading = false }: EliteWorkforceProps) => {
  const visibleEmployees = employees.slice(0, 2);
  
  // Sum only the visible employees' hours
  const cumulativeHours = visibleEmployees.reduce((acc, emp) => {
    return acc + parseFloat(emp.hoursToday || 0);
  }, 0).toFixed(1);

  // Aggregate activity scores for the summary chart
  const aggregatedData = React.useMemo(() => {
    const dataPoints = 10;
    const combined = Array(dataPoints).fill(0);
    
    visibleEmployees.forEach(emp => {
      const scores = emp.prevHours || [];
      // Align to the last 10 points
      scores.slice(-dataPoints).forEach((score: number, idx: number) => {
        combined[idx] += score;
      });
    });

    return combined.map((hours, index) => ({ hours, index }));
  }, [visibleEmployees]);

  return (
    <div className="mb-16 space-y-8">
      <div className="flex items-center gap-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/40 whitespace-nowrap">Top Performers</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <EmployeeCard key={i} isLoading={true} emp={null} />)
        ) : (
          visibleEmployees.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))
        )}

        {/* Aggregate Audit Card */}
        <GlassCard elevated className="border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] flex flex-col justify-between p-8 lg:p-10 group relative overflow-hidden min-h-[380px]" hoverEffect={false}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 shadow-inner">
                  <Users size={24} />
              </div>
              <div className="flex items-center text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-lg backdrop-blur-md">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span>+12.4%</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/50 mb-3">Combined Work Time</p>
              <div className="flex items-baseline gap-2">
                  <h4 className="text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{cumulativeHours}</h4>
                  <span className="text-2xl font-bold text-gray-400 dark:text-white/20 uppercase">h</span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-white/30 mt-4 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-primary/60" /> Active Session Overview
              </p>
            </div>
          </div>
          
          <div className="mt-auto relative z-10 pt-8">
             <div className="h-16 lg:h-20 w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aggregatedData}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={5} fill="url(#totalGrad)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
             <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">Team Scaling</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Consistent Output</span>
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
