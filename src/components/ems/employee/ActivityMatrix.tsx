"use client";

import React, { useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MousePointer2, Keyboard, Move, ScrollText } from "lucide-react";
import { format } from "date-fns";
import { useTeam } from "@/hooks/use-team";

interface ActivityMatrixProps {
  workShifts: any[];
  screenshots: any[];
}

export function ActivityMatrix({ workShifts }: ActivityMatrixProps) {
  const { selectedDate } = useTeam();
  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // State to toggle lines dynamically
  const [visibleLines, setVisibleLines] = useState({
    keys: true,
    clicks: true,
    distance: true,
    scroll: true,
  });

  const { chartData, totals } = useMemo(() => {
    // 1. Initialize 24-hour buckets
    const hourlyBuckets: Record<string, { time: string; keystrokes: number; clicks: number; distance: number; scroll: number }> = {};
    
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      hourlyBuckets[hour] = {
        time: `${hour}:00`,
        keystrokes: 0,
        clicks: 0,
        distance: 0,
        scroll: 0,
      };
    }

    let totalKeys = 0;
    let totalClicks = 0;
    let totalDistance = 0;
    let totalScroll = 0;

    // 2. Aggregate data from the selected date's workShifts
    workShifts.forEach((shift) => {
      // Ensure we only process shifts for the selected date
      if (!shift.id.startsWith(dateStr)) return;

      if (shift.hourlyPulse) {
        Object.entries(shift.hourlyPulse).forEach(([hour, data]: [string, any]) => {
          // Normalise/Pad the hour string (e.g. "9" -> "09") to ensure it matches the 24h buckets perfectly
          const normalizedHour = hour.toString().padStart(2, "0");
          
          if (hourlyBuckets[normalizedHour]) {
            // SCHEMA NORMALIZATION: Handle Modern (nested metrics) vs Legacy (flat)
            const metrics = data?.metrics || data;
            
            const ks = metrics.keystrokes || 0;
            const mc = metrics.mouseClicks || 0;
            const md = metrics.mouseDistance || 0;
            const sd = metrics.mouseScrolls || metrics.mouseScroll || metrics.scrollDistance || metrics.scrollAmount || 0;

            hourlyBuckets[normalizedHour].keystrokes += ks;
            hourlyBuckets[normalizedHour].clicks += mc;
            hourlyBuckets[normalizedHour].distance += md;
            hourlyBuckets[normalizedHour].scroll += sd;

            totalKeys += ks;
            totalClicks += mc;
            totalDistance += md;
            totalScroll += sd;
          }
        });
      }
    });

    // 3. Create log-scaled data points to prevent perfect overlap and maintain magnitude visibility
    const normalizedData = Object.values(hourlyBuckets).map((bucket) => ({
      time: bucket.time,
      // Raw/absolute metrics for Tooltip rendering
      rawKeystrokes: bucket.keystrokes,
      rawClicks: bucket.clicks,
      rawDistance: bucket.distance,
      rawScroll: bucket.scroll,
      // Log scaled metrics for visual separation
      keystrokes: bucket.keystrokes > 0 ? Math.log10(bucket.keystrokes + 1) : 0,
      clicks: bucket.clicks > 0 ? Math.log10(bucket.clicks + 1) : 0,
      distance: bucket.distance > 0 ? Math.log10(bucket.distance + 1) : 0,
      scroll: bucket.scroll > 0 ? Math.log10(bucket.scroll + 1) : 0,
    }));

    console.log("[ActivityMatrix Data Engine]", {
      totalKeys,
      totalClicks,
      totalDistance,
      totalScroll
    });

    return {
      chartData: normalizedData,
      totals: {
        keys: totalKeys,
        clicks: totalClicks,
        distance: totalDistance,
        scroll: totalScroll,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
             <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Activity Chart</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Logarithmic Daily Trendline (Click legend to toggle)</p>
             </div>
             <div className="flex flex-wrap gap-2">
                <LegendItem 
                  color="bg-[#3b82f6]" 
                  label="Keys" 
                  active={visibleLines.keys}
                  onClick={() => setVisibleLines(prev => ({ ...prev, keys: !prev.keys }))}
                />
                <LegendItem 
                  color="bg-[#a855f7]" 
                  label="Clicks" 
                  active={visibleLines.clicks}
                  onClick={() => setVisibleLines(prev => ({ ...prev, clicks: !prev.clicks }))}
                />
                <LegendItem 
                  color="bg-[#f59e0b]" 
                  label="Distance" 
                  active={visibleLines.distance}
                  onClick={() => setVisibleLines(prev => ({ ...prev, distance: !prev.distance }))}
                />
                <LegendItem 
                  color="bg-[#10b981]" 
                  label="Scroll" 
                  active={visibleLines.scroll}
                  onClick={() => setVisibleLines(prev => ({ ...prev, scroll: !prev.scroll }))}
                />
             </div>
        </div>

        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorKeys" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorScroll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                    <YAxis hide={true} domain={[0, 'dataMax + 0.5']} />
                    <Tooltip
                        formatter={(value: any, name: string, props: any) => {
                            const rawKeyMap: Record<string, string> = {
                                keystrokes: "rawKeystrokes",
                                clicks: "rawClicks",
                                distance: "rawDistance",
                                scroll: "rawScroll"
                            };
                            const rawName = rawKeyMap[name] || name;
                            const rawValue = props.payload?.[rawName] ?? value;

                            const displayNames: Record<string, string> = {
                                keystrokes: "Keystrokes",
                                clicks: "Clicks & Selects",
                                distance: "Mouse Distance",
                                scroll: "Scroll Distance"
                            };
                            const displayName = displayNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
                            
                            const suffixMap: Record<string, string> = {
                                keystrokes: " keys",
                                clicks: " clicks",
                                distance: " px moved",
                                scroll: " px scrolled"
                            };
                            const suffix = suffixMap[name] || "";

                            return [`${rawValue.toLocaleString()}${suffix}`, displayName];
                        }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '16px',
                            fontSize: '10px',
                            fontWeight: 900,
                            textTransform: 'uppercase'
                        }}
                    />
                    {visibleLines.keys && (
                        <Area type="monotone" dataKey="keystrokes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorKeys)" />
                    )}
                    {visibleLines.clicks && (
                        <Area type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                    )}
                    {visibleLines.distance && (
                        <Area type="monotone" dataKey="distance" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorDistance)" />
                    )}
                    {visibleLines.scroll && (
                        <Area type="monotone" dataKey="scroll" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScroll)" />
                    )}
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
            color="text-[#3b82f6]"
        />
        <StatCard
            icon={MousePointer2}
            label="Total Interactions"
            value={totals.clicks.toLocaleString()}
            sub="Clicks & Selects"
            color="text-[#a855f7]"
        />
        <StatCard
            icon={Move}
            label="Mouse Distance"
            value={totals.distance.toLocaleString()}
            sub="Pixels Moved"
            color="text-[#f59e0b]"
        />
        <StatCard
            icon={ScrollText}
            label="Scroll Distance"
            value={totals.scroll.toLocaleString()}
            sub="Pixels Scrolled"
            color="text-[#10b981]"
        />
      </div>
    </div>
  );
}

function LegendItem({ 
  color, 
  label, 
  active, 
  onClick 
}: { 
  color: string; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 transition-all duration-300 hover:scale-105 active:scale-95 ${
        active 
          ? "bg-muted/80 opacity-100 shadow-sm" 
          : "bg-transparent opacity-40 hover:opacity-75"
      }`}
    >
      <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-300 ${active ? "scale-100" : "scale-75 bg-muted-foreground"} ${color}`} />
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
    </button>
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
