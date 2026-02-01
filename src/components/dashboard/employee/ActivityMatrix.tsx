"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { Zap, MousePointer2, Keyboard, Move } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActivityMatrixProps {
  screenshots: any[];
}

export function ActivityMatrix({ screenshots }: ActivityMatrixProps) {
  // Helper to extract JS Date safely
  const getDate = (ts: any) => {
    if (!ts) return new Date(0);
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  // Filter for LAST HOUR (Last 60 Minutes)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const lastHourLogs = screenshots.filter(s => {
    const date = getDate(s.timestamp);
    return date >= oneHourAgo;
  }).sort((a, b) => {
    const tA = getDate(a.timestamp).getTime();
    const tB = getDate(b.timestamp).getTime();
    return tA - tB;
  });

  if (screenshots.length === 0) {
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

  // Process screenshot activity data for the chart
  const chartData = lastHourLogs.map(s => {
    const date = getDate(s.timestamp);
    return {
        time: date.getTime() > 0 ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
        keystrokes: s.activity?.keystrokes || 0,
        clicks: s.activity?.mouseClicks || 0,
        distance: (s.activity?.mouseDistance || 0) / 100, // scaled for chart
    };
  });

  const totals = lastHourLogs.reduce((acc, s) => ({
    keys: acc.keys + (s.activity?.keystrokes || 0),
    clicks: acc.clicks + (s.activity?.mouseClicks || 0),
    distance: acc.distance + (s.activity?.mouseDistance || 0),
  }), { keys: 0, clicks: 0, distance: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Real-time Velocity Area Chart */}
      <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Activity Intensity</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Real-time interaction matrix (Last 60 Mins)</p>
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
                        interval="preserveStartEnd" 
                        minTickGap={30}
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
            sub="Today"
            color="text-primary"
        />
        <StatCard
            icon={MousePointer2}
            label="Total Interactions"
            value={totals.clicks.toLocaleString()}
            sub="Clicks & Selects"
            color="text-purple-500"
        />
        <StatCard
            icon={Move}
            label="Cursor Distance"
            value={`${(totals.distance / 1000).toFixed(1)}k`}
            sub="Pixels Traversed"
            color="text-blue-500"
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
