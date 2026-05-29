"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Wallet, 
  Activity, 
  ShieldCheck, 
  Clock, 
  User, 
  ArrowUpRight,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

// --- DUMMY DATA ---
const EMPLOYEES = [
  { id: '1', name: 'Arjun Singh', role: 'Sr. Backend Engineer', velocity: 98, focus: 92, productivity: 94, totalSeconds: 26640, yield: 142, status: 'active', tier: 'Elite' },
  { id: '2', name: 'Sarah Chen', role: 'Product Manager', velocity: 94, focus: 88, productivity: 90, totalSeconds: 20880, yield: 128, status: 'away', tier: 'Elite' },
  { id: '3', name: 'Leo Martinez', role: 'UX Designer', velocity: 89, focus: 95, productivity: 82, totalSeconds: 15120, yield: 112, status: 'active', tier: 'High' },
  { id: '4', name: 'Chloe Kim', role: 'Frontend Engineer', velocity: 84, focus: 72, productivity: 86, totalSeconds: 14760, yield: 105, status: 'active', tier: 'High' },
  { id: '5', name: 'Emma Wilson', role: 'QA Lead', velocity: 76, focus: 82, productivity: 78, totalSeconds: 17640, yield: 92, status: 'idle', tier: 'Core' },
];

const formatHours = (seconds: number) => (seconds / 3600).toFixed(1);

// --- THEME TOGGLE COMPONENT ---
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-2xl h-12 w-12 border-border/50 bg-background/50 backdrop-blur-md"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-primary" />}
    </Button>
  );
}

// --- 1. THE VELOCITY PULSE (Performance-First) ---
function VelocityPulse() {
  return (
    <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 overflow-hidden relative shadow-xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
            <Zap size={14} className="fill-primary" /> Velocity Leaderboard
          </h2>
          <p className="text-2xl font-black text-foreground uppercase tracking-tight font-poppins">Performance Pulse // Mar 04</p>
        </div>
        <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <TrendingUp size={18} />
        </div>
      </div>

      <div className="space-y-4">
        {EMPLOYEES.slice(0, 3).map((e, i) => (
          <motion.div 
            key={e.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex items-center justify-between p-6 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-3xl transition-all"
          >
            <div className="flex items-center gap-6">
              <span className="text-sm font-black text-muted-foreground/20 tabular-nums">0{i + 1}</span>
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-primary font-black">{e.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">{e.name}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{e.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">⚡ {e.velocity}% Velocity</p>
                <div className="flex gap-1">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className={cn("h-1.5 w-6 rounded-full", j < Math.floor(e.velocity / 12) ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
              </div>
              <div className="hidden md:block text-right min-w-[120px]">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Yield: +{formatHours(e.totalSeconds)}h</p>
                <div className="text-[10px] font-black text-foreground uppercase tracking-widest mt-1">F: {e.focus} | P: {e.productivity}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- 2. THE STEALTH MINIMALIST (Focus-First) ---
function StealthMinimalist() {
  return (
    <div className="bg-card rounded-[3rem] p-12 border border-border shadow-2xl">
      <div className="flex justify-between items-baseline mb-16 font-montserrat">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">[ MAR 04 ] // DEEP WORK</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 cursor-pointer hover:opacity-100 transition-opacity">View Historical Data</span>
      </div>

      <div className="space-y-8">
        {EMPLOYEES.map((e, i) => (
          <div key={e.id} className="group flex items-center gap-6">
            <span className="text-[10px] font-black text-muted-foreground/40 tabular-nums font-montserrat">0{i + 1}</span>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground min-w-[140px] font-montserrat">{e.name.split(' ')[0]}</span>
            <div className="flex-1 border-b border-dashed border-border relative top-[-4px]" />
            <div className="flex items-center gap-8 tabular-nums font-montserrat">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-16 text-right">[ {formatHours(e.totalSeconds)}H ]</span>
              <span className="text-xs font-black text-foreground w-20 text-right">{e.focus} FOCUS</span>
              <div className={cn("size-2 rounded-full", e.focus > 90 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 3. THE MATRIX INTENSITY (Activity-First) ---
function MatrixIntensity() {
  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-10 overflow-hidden relative font-poppins shadow-xl">
      <div className="flex justify-between items-center mb-12 border-b border-border pb-8">
         <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3">
           <Activity size={14} className="text-emerald-500" /> TEAM PULSE <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] animate-pulse">LIVE</span>
         </h2>
         <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-orange-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Away</span>
            </div>
         </div>
      </div>

      <div className="space-y-10">
        {EMPLOYEES.map((e) => (
          <div key={e.id} className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 w-48">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">
                {e.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-wider">{e.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn("size-1.5 rounded-full", e.status === 'active' ? 'bg-emerald-500' : e.status === 'away' ? 'bg-orange-500' : 'bg-muted-foreground/30')} />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{e.status === 'active' ? 'Online' : e.status === 'away' ? 'Away' : 'Idle'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-1">
              {Array.from({ length: 12 }).map((_, j) => {
                const isActive = j < Math.ceil(parseFloat(formatHours(e.totalSeconds)));
                return (
                  <div 
                    key={j} 
                    className={cn(
                        "flex-1 h-3 rounded-sm transition-all duration-1000",
                        isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-muted"
                    )} 
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-4 min-w-[80px] justify-end">
                <span className="text-xs font-black text-foreground">{e.velocity}%</span>
                <Zap size={14} className={cn(e.velocity > 90 ? "text-primary" : "text-muted-foreground/20")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 4. THE ELITE TIERS (Competitive Hierarchy) ---
function EliteTiers() {
  const elite = EMPLOYEES.filter(e => e.tier === 'Elite');
  const high = EMPLOYEES.filter(e => e.tier === 'High');

  return (
    <div className="bg-card border border-border rounded-[3rem] p-12 overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Trophy size={160} className="text-primary" />
      </div>

      <div className="space-y-16">
        <section>
          <div className="flex items-center gap-4 mb-10">
            <h2 className="font-playfair text-2xl italic text-foreground/90">The Elite</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">(TOP 5%)</span>
          </div>
          
          <div className="space-y-6">
            {elite.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-8">
                  <span className="font-playfair text-xl italic text-muted-foreground/20 w-8">{i + 1}</span>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground/90 uppercase tracking-tight">{e.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{e.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-16">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">⚡ {e.velocity}</p>
                    <div className="h-0.5 w-24 bg-muted relative">
                        <div className="absolute inset-0 bg-primary" style={{ width: `${e.velocity}%` }} />
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Yield Efficiency</p>
                    <p className="text-xs font-black text-foreground tabular-nums">${e.yield}/H OUTPUT</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-10">
            <h2 className="font-playfair text-xl italic text-muted-foreground">High Performance</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          <div className="space-y-6">
            {high.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-8">
                  <span className="font-playfair text-xl italic text-muted-foreground/10 w-8">{elite.length + i + 1}</span>
                  <h3 className="text-sm font-black text-foreground/80 uppercase tracking-wide">{e.name}</h3>
                </div>
                <div className="flex items-center gap-16">
                   <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">⚡ {e.velocity}</p>
                   <p className="hidden md:block text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">${e.yield}/H</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- 5. THE YIELD ECONOMICS (Efficiency-First) ---
function YieldEconomics() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden font-montserrat shadow-2xl">
       <div className="p-8 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground/90">Capital Efficiency Ledger</h2>
          <div className="text-right">
             <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Org Yield (Mar 04)</p>
             <p className="text-lg font-black text-emerald-500">124.5 PRODUCED HRS</p>
          </div>
       </div>

       <div className="overflow-x-auto">
         <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Rank</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Member</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Produced</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Focus</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Status</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 text-right">Output Value</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((e, i) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-6 text-[10px] font-black text-muted-foreground/20 tabular-nums">#{i + 1}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="size-6 rounded bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                        {e.name.charAt(0)}
                      </div>
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-foreground tabular-nums">{formatHours(e.totalSeconds)}h</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{e.focus}%</span>
                      <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${e.focus}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <Zap size={14} className={cn(e.status === 'active' ? 'text-primary' : 'text-muted-foreground/20')} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 group-hover:translate-x-[-4px] transition-transform">
                      <span className="text-xs font-black text-emerald-500 tabular-nums">${Math.round(e.yield * parseFloat(formatHours(e.totalSeconds)))}</span>
                      <ArrowUpRight size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
       </div>

       <div className="p-8 bg-muted/10 flex justify-center">
          <button className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors">
            Analyze Unit Economics ↗
          </button>
       </div>
    </div>
  );
}

// --- 6. THE NEO-BRUTAL BLUEPRINT (High-Contrast / Hard Shadows) ---
function NeoBrutalBlueprint() {
  return (
    <div className="bg-background border-[4px] border-foreground p-1 shadow-[8px_8px_0px_0px_rgba(var(--primary-rgb),0.3)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
      <div className="border-[4px] border-foreground p-8 bg-primary text-primary-foreground">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Performance.Raw()</h2>
        <p className="text-[10px] font-black uppercase tracking-widest border-t-2 border-primary-foreground pt-2">No Slop. No Blur. Just Output.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-foreground">
        {EMPLOYEES.map((e, i) => (
          <div key={e.id} className="bg-background border-[2px] border-foreground p-6 hover:bg-primary hover:text-primary-foreground transition-colors group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-4xl font-black opacity-10 group-hover:opacity-100">0{i+1}</span>
              <div className="bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase group-hover:bg-background group-hover:text-foreground">
                {e.tier}
              </div>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-1">{e.name}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-60 group-hover:opacity-100">{e.role}</p>
            <div className="flex items-center gap-4">
               <div className="flex-1 h-8 border-2 border-foreground relative group-hover:border-primary-foreground">
                  <div className="absolute inset-0 bg-primary group-hover:bg-background" style={{ width: `${e.velocity}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black mix-blend-difference">{e.velocity}% VELOCITY</span>
               </div>
               <div className="size-8 border-2 border-foreground flex items-center justify-center group-hover:border-primary-foreground">
                  <ArrowUpRight size={16} />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 7. THE RAW TERMINAL (Industrial Grid / Monospace) ---
function RawTerminal() {
  return (
    <div className="bg-black text-emerald-500 font-mono border-2 border-emerald-500/30 p-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
      <div className="mb-8 border-b-2 border-emerald-500/30 pb-4 flex justify-between items-end">
        <div>
          <div className="text-[10px] leading-none mb-1 opacity-50">SYSTEM::LEADERBOARD_v4.0.1</div>
          <div className="text-xl font-bold tracking-tighter">PHASE_04_YIELD_REPORT</div>
        </div>
        <div className="text-[10px] text-right">
          <div>LOC::PAKISTAN_EAST</div>
          <div className="animate-pulse">STATUS::RECORDING_LIVE</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-12 gap-4 text-[10px] font-bold opacity-30 px-4 py-2 border-b border-emerald-500/10">
          <div className="col-span-1">RANK</div>
          <div className="col-span-4">IDENTIFIER</div>
          <div className="col-span-2 text-right">VELOCITY</div>
          <div className="col-span-2 text-right">FOCUS</div>
          <div className="col-span-3 text-right">YIELD_OUTPUT</div>
        </div>
        
        {EMPLOYEES.map((e, i) => (
          <div key={e.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-emerald-500 hover:text-black transition-colors cursor-crosshair group">
            <div className="col-span-1 tabular-nums">[{i + 1}]</div>
            <div className="col-span-4 font-bold truncate">{e.name.toUpperCase().replace(' ', '_')}</div>
            <div className="col-span-2 text-right tabular-nums">{e.velocity}.00%</div>
            <div className="col-span-2 text-right tabular-nums">{e.focus}.00%</div>
            <div className="col-span-3 text-right tabular-nums font-bold">+{formatHours(e.totalSeconds)}H_PULSE</div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t-2 border-emerald-500/30 flex justify-between items-center text-[10px]">
        <div className="flex gap-4">
          <span>[SHIFTS: 124]</span>
          <span>[UPTIME: 99.9%]</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
          <span>DATA_SYNC_COMPLETED</span>
        </div>
      </div>
    </div>
  );
}


// --- MAIN PAGE ---
export default function LeaderboardTestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-20 space-y-32 selection:bg-primary selection:text-primary-foreground">
      {/* Theme Toggle & Header Nav */}
      <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Founders' Interface v2.0</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-poppins leading-none">
          Talent Yield <br /> <span className="text-primary italic">Leaderboards</span>
        </h1>
        <p className="text-lg text-muted-foreground font-medium max-w-xl font-poppins leading-relaxed">
          Five divergent architectural patterns for performance visualization. Designed for density, psychological drive, and Modern Founder aesthetics.
        </p>
      </header>

      {/* Variation 1 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">01 // The Velocity Pulse</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Cognitive-Report Focus</span>
        </div>
        <VelocityPulse />
      </section>

      {/* Variation 2 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">02 // The Stealth Minimalist</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Minimalist Density</span>
        </div>
        <StealthMinimalist />
      </section>

      {/* Variation 3 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">03 // The Matrix Intensity</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Real-time Pulse Architecture</span>
        </div>
        <MatrixIntensity />
      </section>

      {/* Variation 4 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">04 // The Elite Tiers</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Aspirational Hierarchy</span>
        </div>
        <EliteTiers />
      </section>

      {/* Variation 5 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">05 // The Yield Economics</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Financialized Output Ledger</span>
        </div>
        <YieldEconomics />
      </section>

      {/* Variation 6 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">06 // The Neo-Brutal Blueprint</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Hard-Shadow Brutalism</span>
        </div>
        <NeoBrutalBlueprint />
      </section>

      {/* Variation 7 */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">07 // The Raw Terminal</h3>
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Industrial Monospace</span>
        </div>
        <RawTerminal />
      </section>

      <footer className="pt-20 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Built by TRAC AI // Founder-Designer Edition</p>
         <div className="flex gap-8">
            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Documentation</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">System Health</button>
         </div>
      </footer>
    </div>
  );
}