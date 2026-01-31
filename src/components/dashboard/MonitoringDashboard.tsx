"use client";

import { motion } from "framer-motion";
import { 
  Activity, Zap, ShieldCheck, Clock, Star, Code2, ChevronRight, Monitor
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface MonitoringDashboardProps {
  employees: any[];
}

export function MonitoringDashboard({ employees }: MonitoringDashboardProps) {
  const router = useRouter();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Technical Intelligence</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-1">
            Monitoring <span className="text-primary font-black">{employees.length}</span> Active {employees.length === 1 ? 'Node' : 'Nodes'}
          </p>
        </div>
        <div className="flex gap-2">
            {["24H", "7D", "30D"].map(period => (
                <button key={period} className="px-4 py-1.5 rounded-full border border-border text-[10px] font-black uppercase hover:bg-secondary transition-colors">
                    {period}
                </button>
            ))}
        </div>
      </div>

      {/* 2. Global Aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <MetricCard icon={Activity} label="Engineering Velocity" value="84.2%" trend="+5.2%" color="text-blue-500" />
        <MetricCard icon={Zap} label="Average Focus" value="72/100" trend="-2.1%" color="text-yellow-500" />
        <MetricCard icon={ShieldCheck} label="Compliance Health" value="100%" trend="STABLE" color="text-green-500" />
        <MetricCard icon={Clock} label="Aggregated Time" value="1,420h" trend="+124h" color="text-purple-500" />
      </div>

      {/* 3. Live Monitoring Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                Live Workforce
            </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
                <div key={emp.id} className="bg-card border border-border p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="size-14 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border border-border shadow-inner">
                            <img 
                                src={emp.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.email}`} 
                                alt={emp.name} 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-black uppercase tracking-tight truncate text-base">{emp.name || emp.email}</h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{emp.role || 'Active Member'}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-black text-green-500 uppercase">Live</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                        <div className="p-3 bg-secondary/50 rounded-2xl border border-border/50">
                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Activity</p>
                            <p className="text-lg font-black">88%</p>
                        </div>
                        <div className="p-3 bg-secondary/50 rounded-2xl border border-border/50">
                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Time</p>
                            <p className="text-lg font-black">6h 12m</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center relative z-10">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="size-6 rounded-lg bg-secondary border border-background flex items-center justify-center">
                                    <Code2 size={12} className="text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                            className="rounded-xl font-black uppercase text-[10px] h-8 hover:bg-primary hover:text-white transition-colors px-4"
                        >
                            Deep Dive <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                </div>
            ))}
        </div>
      </section>

      {/* 4. Engineering Output Adaption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <Card className="lg:col-span-2 bg-card border-none shadow-xl p-8 flex flex-col justify-between h-[450px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h4 className="text-xl font-black tracking-tight uppercase">Organizational Output</h4>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aggregated performance across 24h</p>
                </div>
            </div>
            <div className="flex-1 flex items-end gap-2 px-4 mb-4">
                {Array.from({ length: 32 }).map((_, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 70 + 20}%` }}
                        transition={{ delay: i * 0.02, duration: 1 }}
                        className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors cursor-help group relative"
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                            {Math.floor(Math.random() * 50)} Actions
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="mt-6 flex justify-between px-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-t pt-4">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
            </div>
        </Card>

        <Card className="bg-card border-none shadow-xl p-8 relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8">Skill Density</h4>
            <div className="space-y-8">
                <SkillBar label="Velocity" percent={88} color="bg-blue-500" />
                <SkillBar label="Reliability" percent={92} color="bg-green-500" />
                <SkillBar label="Compliance" percent={100} color="bg-purple-500" />
            </div>
            <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
                    <Star className="size-6" />
                </div>
                <div>
                    <div className="text-xs font-black uppercase text-primary">Top Performer</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Deen Panwer</div>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, color }: any) {
    return (
        <Card className="border-none bg-card shadow-lg p-6 rounded-3xl group hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("size-10 rounded-xl bg-secondary flex items-center justify-center", color)}>
                    <Icon size={20} />
                </div>
                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full bg-secondary", 
                    trend.startsWith('+') ? 'text-green-500' : trend === 'STABLE' ? 'text-blue-500' : 'text-red-500'
                )}>
                    {trend}
                </span>
            </div>
            <div className="text-2xl font-black tracking-tighter mb-1">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        </Card>
    );
}

function SkillBar({ label, percent, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                <span className="text-sm font-black">{percent}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color)}
                />
            </div>
        </div>
    );
}
