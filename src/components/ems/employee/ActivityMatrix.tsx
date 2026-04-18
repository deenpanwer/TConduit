"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MousePointer2, Keyboard, Move } from "lucide-react";
import { format } from "date-fns";
import { useTeam } from "@/hooks/use-team";

interface ActivityMatrixProps {
  workShifts: any[];
  screenshots: any[];
}

export function ActivityMatrix({ workShifts }: ActivityMatrixProps) {
  const { selectedDate } = useTeam();
  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const parseShiftDate = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    if (ts instanceof Date) return ts;
    if (typeof ts === "string") {
      const parsed = new Date(ts);
      return parsed;
    }
    return null;
  };

  const { chartData, totals } = useMemo(() => {
    // 1. Initialize 24-hour buckets
    const hourlyBuckets: Record<string, { time: string; keystrokes: number; clicks: number; distance: number }> = {};
    
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      hourlyBuckets[hour] = {
        time: `${hour}:00`,
        keystrokes: 0,
        clicks: 0,
        distance: 0,
      };
    }

    let totalKeys = 0;
    let totalClicks = 0;
    let totalDistance = 0;

    // 2. Aggregate data from the selected date's workShifts
    workShifts.forEach((shift) => {
      // Ensure we only process shifts for the selected date
      const sStart = parseShiftDate(shift.startTime);
      if (!sStart || format(sStart, "yyyy-MM-dd") !== dateStr) return;

      if (shift.hourlyPulse) {
        Object.entries(shift.hourlyPulse).forEach(([hour, data]: [string, any]) => {
          if (hourlyBuckets[hour]) {
            // SCHEMA NORMALIZATION: Handle Modern (nested metrics) vs Legacy (flat)
            const metrics = data?.metrics || data;
            
            const ks = metrics.keystrokes || 0;
            const mc = metrics.mouseClicks || 0;
            const md = metrics.mouseDistance || 0;

            hourlyBuckets[hour].keystrokes += ks;
            hourlyBuckets[hour].clicks += mc;
            hourlyBuckets[hour].distance += md;

            totalKeys += ks;
            totalClicks += mc;
            totalDistance += md;
          }
        });
      }
    });

    return {
      chartData: Object.values(hourlyBuckets),
      totals: {
        keys: totalKeys,
        clicks: totalClicks,
        distance: totalDistance,
      },
    };
  }, [workShifts, dateStr]);

  if (workShifts.length === 0) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 h-[380px] flex items-center justify-center">
                <div className="space-y-4 w-full">
                    <div className="h-6 w-48 bg-muted rounded-full mx-auto" />
                    <div className="h-[200px] w-full bg-muted/50 rounded-2xl" />
                </div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-[2rem]" />)}
            </div>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 24-Hour Activity Intensity Chart */}
      <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Activity Chart</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today's Activity Across The Day</p>
             </div>
             <div className="flex gap-4">
                <LegendItem color="bg-primary" label="Keys" />
                <LegendItem color="bg-purple-500" label="Clicks" />
             </div>
        </div>

        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorKeys" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                        interval={2} // Shows ticks every 3 hours (00, 03, 06...)
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '16px',
                            fontSize: '10px',
                            fontWeight: 900,
                            textTransform: 'uppercase'
                        }}
                    />
                    <Area type="monotone" dataKey="keystrokes" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorKeys)" />
                    <Area type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Aggregate Stats Column */}
      <div className="space-y-4">
        <StatCard
            icon={Keyboard}
            label="Total Keystrokes"
            value={totals.keys.toLocaleString()}
            sub="Captured Today"
            color="text-primary"
        />
        <StatCard
            icon={MousePointer2}
            label="Total Interactions"
            value={totals.clicks.toLocaleString()}
            sub="Clicks & Selects"
            color="text-purple-500"
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-[2rem] p-6 shadow-lg flex items-center gap-5 transition-all hover:scale-[1.02]">
      <div className={`p-4 rounded-2xl bg-muted/50 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-2xl font-black tracking-tighter">{value}</h4>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
