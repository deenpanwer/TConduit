'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from './shared/GlassCard';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

interface PerformanceHorizonProps {
  data?: any[];
}

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const actual = payload.find((p: any) => p.dataKey === "actualHours")?.value;
    const projected = payload.find((p: any) => p.dataKey === "projectedHours")?.value;

    return (
      <div className="bg-card/95 backdrop-blur-2xl border border-border rounded-3xl p-6 shadow-2xl min-w-[200px] text-card-foreground">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{data.fullDate || label}</span>
            <div className="h-px w-full bg-border/40 my-2" />
          </div>
          
          {actual !== null && actual !== undefined && (
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Confirmed Activity</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground tracking-tighter">{parseFloat(actual).toFixed(1)}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase">Hours</span>
              </div>
            </div>
          )}

          {projected !== null && projected !== undefined && (
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Estimated Yield</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary/80 tracking-tighter">{parseFloat(projected).toFixed(1)}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase">Hours</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const PerformanceHorizon = ({ data = [] }: PerformanceHorizonProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <GlassCard className="p-10 h-[450px] flex items-center justify-center" hoverEffect={false}>
        <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Awaiting Productivity Data...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-10" hoverEffect={false}>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black font-poppins text-gray-900 dark:text-white leading-none tracking-tighter uppercase">Activity Chart</h2>
          <p className="text-gray-400 mt-3 text-[10px] font-black font-poppins uppercase tracking-[0.3em] italic">Today's activity across the day</p>
        </div>
        <div className="flex items-center gap-8 pb-1">
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real Output</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-blue-500/40" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Forecast</span>
          </div>
        </div>
      </div>
      <div className="h-[380px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="4 4" 
              vertical={false} 
              stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 
            />
            <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8', letterSpacing: '0.1em' }}
                interval={2}
                padding={{ left: 30, right: 30 }}
            />
            <YAxis 
                hide 
                domain={['auto', 'dataMax + 1']} 
            />
            <RechartsTooltip 
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '8 8', opacity: 0.3 }}
              content={<CustomTooltip isDark={isDark} />}
            />
            <Area 
              type="monotone" 
              dataKey="actualHours" 
              stroke="#3b82f6" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorOutput)" 
              animationDuration={2500}
              activeDot={{ r: 8, strokeWidth: 4, stroke: isDark ? '#09090b' : '#fff', fill: '#3b82f6' }}
              connectNulls={false}
            />
            <Area 
              type="monotone" 
              dataKey="projectedHours" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              strokeDasharray="8 4" 
              fill="url(#colorForecast)" 
              opacity={0.5} 
              activeDot={{ r: 6, strokeWidth: 3, stroke: isDark ? '#09090b' : '#fff', fill: '#3b82f6', opacity: 0.6 }}
              connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
