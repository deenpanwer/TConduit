"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Copy, Check, Search, Mail, Download, Github,
  Package, ExternalLink, Box, User, Users, ChevronLeft,
  ChevronRight, History, Code2, Star, Zap, Globe, TrendingUp,
  BrainCircuit, ShieldCheck, Award, Share2, Terminal,
  Cpu, Rocket, Sparkles, Filter, Settings2, BarChart3
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

export default function TalentRadarTestPage() {
  const [nicheCount, setNicheCount] = useState(2);
  const [packageLimit, setPackageLimit] = useState(100);
  
  const [loading, setLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [registryLogs, setRegistryLogs] = useState<string[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [copiedAi, setCopiedAi] = useState(false);
  const [copiedReg, setCopiedReg] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const runAiScout = async () => {
    setLoading(true);
    setAiLogs(["🤖 Initializing Strategy Engine..."]);
    setRegistryLogs(["Awaiting AI targets..."]);
    setEngineers([]);
    setCurrentIndex(0);

    try {
      const res = await fetch("/api/test-npm-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicheCount, packageLimit }), 
      });

      const data = await res.json();
      if (data.aiLogs) setAiLogs(data.aiLogs);
      if (data.registryLogs) setRegistryLogs(data.registryLogs);
      
      if (data.engineers) {
        setEngineers(data.engineers);
      }
      
      if (!data.success) {
        setAiLogs(prev => [...prev, "❌ ERROR: " + data.error]);
      }
    } catch (e: any) {
      setAiLogs(prev => [...prev, "❌ SYSTEM ERROR: " + e.message]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string[], type: 'ai' | 'reg') => {
    navigator.clipboard.writeText(text.join('\n'));
    if (type === 'ai') {
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2000);
    } else {
      setCopiedReg(true);
      setTimeout(() => setCopiedReg(false), 2000);
    }
  };

  const currentEngineer = engineers[currentIndex];

  // Dynamic Chart Data Calculation
  const chartData = useMemo(() => {
    if (!currentEngineer?.allProjects) return [];
    
    // Group projects by month of release
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }

    currentEngineer.allProjects.forEach((p: any) => {
      const d = new Date(p.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (months.hasOwnProperty(key)) {
        months[key] += 1; // Count of releases per month
      }
    });

    return Object.entries(months).map(([name, count]) => ({ name, count }));
  }, [currentEngineer]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden pb-20">
      
      {/* Dynamic Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 lg:p-12 max-w-[1600px] mx-auto">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-3 rounded-2xl shadow-lg">
                  <Rocket className="w-8 h-8 text-slate-950" />
               </div>
               <div>
                 <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                   TALENT <span className="text-cyan-400 not-italic">RADAR</span>
                 </h1>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="h-1 w-12 bg-cyan-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Autonomous AI Intelligence</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-8 bg-slate-900/60 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border border-white/10 w-full sm:w-auto shadow-2xl">
              <div className="flex flex-col border-r border-white/10 pr-8">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Niches</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setNicheCount(Math.max(1, nicheCount-1))} className="text-slate-500 hover:text-white font-black">-</button>
                  <span className="text-xl font-black text-cyan-400 tabular-nums min-w-[20px] text-center">{nicheCount}</span>
                  <button onClick={() => setNicheCount(Math.min(5, nicheCount+1))} className="text-slate-500 hover:text-white font-black">+</button>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Discovery Depth</span>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number" 
                    value={packageLimit} 
                    onChange={(e) => setPackageLimit(Number(e.target.value))} 
                    className="w-16 h-6 bg-transparent border-none p-0 text-xl font-black text-cyan-400 focus-visible:ring-0"
                  />
                  <span className="text-[10px] font-bold text-slate-600 uppercase italic">Pkgs</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={runAiScout} 
              disabled={loading} 
              className="h-16 bg-white text-slate-950 hover:bg-cyan-400 transition-all px-12 rounded-[1.5rem] font-black uppercase tracking-tight shadow-[0_0_30px_rgba(6,182,212,0.3)] min-w-[200px]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Zap className="w-5 h-5 mr-3 fill-slate-900" />}
              {loading ? "INITIALIZING..." : "LAUNCH AI SCOUT"}
            </Button>
          </div>
        </div>

        {/* DUAL MONITOR PANELS (Always Visible) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
           <MonitorPanel 
             title="Strategy Session" 
             logs={aiLogs} 
             color="cyan" 
             onCopy={() => copyToClipboard(aiLogs, 'ai')}
             isCopied={copiedAi}
           />
           <MonitorPanel 
             title="Technical Pipeline" 
             logs={registryLogs} 
             color="emerald" 
             onCopy={() => copyToClipboard(registryLogs, 'reg')}
             isCopied={copiedReg}
           />
        </div>

        {/* RESULTS SECTION */}
        <AnimatePresence mode="wait">
        {currentEngineer ? (
          <motion.div 
            key={currentEngineer.username}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-10"
          >
            {/* LEFT PROFILE COLUMN */}
            <div className="xl:col-span-4 space-y-8">
              <Card className="bg-[#0B1120] border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                <div className="h-48 bg-gradient-to-br from-cyan-600 via-blue-900 to-slate-950 relative" />
                <CardContent className="px-10 pb-12 relative">
                   <div className="flex flex-col items-center -mt-24">
                      <div className="relative group">
                        <div className="w-44 h-44 rounded-[3rem] bg-[#0B1120] p-2 shadow-[0_0_60px_-12px_rgba(6,182,212,0.6)]">
                           <img 
                             src={currentEngineer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentEngineer.username}`}
                             className="w-full h-full rounded-[2.5rem] object-cover"
                             alt={currentEngineer.username}
                           />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 border-[6px] border-[#0B1120] rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h2 className="text-4xl font-black text-white mt-8 tracking-tight text-center leading-none italic uppercase">
                        {currentEngineer.name || currentEngineer.username}
                      </h2>
                      <p className="text-cyan-400 font-black tracking-[0.3em] text-[10px] uppercase mt-4 border border-cyan-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
                        @{currentEngineer.username}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-10">
                      <MetricCard label="Weekly Impact" value={(currentEngineer.total_downloads_weekly / 1000).toFixed(1) + 'k'} sub="Downloads" />
                      <MetricCard label="Registry Breadth" value={currentEngineer.total_packages} sub="Total Pkgs" />
                   </div>

                   <div className="mt-10 space-y-4">
                      <Button variant="outline" className="w-full h-14 border-white/10 hover:bg-slate-800 text-slate-300 rounded-[1.5rem] font-black text-xs gap-3" asChild>
                        <a href={`https://www.npmjs.com/~${currentEngineer.username}`} target="_blank">VIEW REGISTRY PROFILE</a>
                      </Button>
                      {currentEngineer.email && (
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center gap-3 overflow-hidden">
                           <Mail className="w-4 h-4 text-cyan-500 shrink-0" />
                           <span className="text-[10px] font-mono text-cyan-400 truncate tracking-tight uppercase font-black">{currentEngineer.email}</span>
                        </div>
                      )}
                   </div>
                </CardContent>
              </Card>

              {/* IMPACT CHART */}
              <Card className="bg-slate-900/50 border-white/5 rounded-[2.5rem] p-10">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <BarChart3 className="w-5 h-5 text-emerald-500" />
                       <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Release Frequency</h3>
                    </div>
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-3 font-black text-[9px] uppercase tracking-widest">
                      Activity: {chartData.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0)} per yr
                    </Badge>
                 </div>
                 <div className="h-40 flex items-end gap-1.5 px-2">
                    {chartData.map((d: { name: string; count: number }, i: number) => {
                      const max = Math.max(...chartData.map((cd: { count: number }) => cd.count), 1);
                      const height = (d.count / max) * 100;
                      return (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, 5)}%` }}
                          transition={{ delay: i * 0.05, duration: 1 }}
                          className={`flex-1 bg-gradient-to-t ${d.count > 0 ? 'from-cyan-500/20 to-cyan-500' : 'from-slate-800 to-slate-700'} rounded-t-md relative group`}
                        >
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl border border-white/5">
                              {d.count} releases
                           </div>
                        </motion.div>
                      );
                    })}
                 </div>
                 <div className="flex justify-between mt-4 px-2">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{chartData[0]?.name}</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{chartData[chartData.length-1]?.name}</span>
                 </div>
              </Card>
            </div>

            {/* RIGHT PORTFOLIO COLUMN */}
            <div className="xl:col-span-8 space-y-10">
              
              {/* RANKING NAV */}
              <div className="flex items-center justify-between bg-slate-900/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/5 shadow-2xl">
                 <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setCurrentIndex(i => Math.max(0, i-1))} disabled={currentIndex === 0} className="hover:bg-slate-800 text-slate-400 rounded-2xl h-14 w-14">
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Separator orientation="vertical" className="h-8 bg-white/5" />
                    <Button variant="ghost" onClick={() => setCurrentIndex(i => Math.min(engineers.length-1, i+1))} disabled={currentIndex === engineers.length - 1} className="hover:bg-slate-800 text-slate-400 rounded-2xl h-14 w-14">
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                 </div>
                 <div className="text-right pr-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-1">Intelligence Rank</p>
                    <p className="text-base font-black text-white">{currentIndex + 1} / {engineers.length} Scoped Leads</p>
                 </div>
              </div>

              {/* PRIMARY EVIDENCE */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                   <Sparkles className="w-6 h-6 text-cyan-500" />
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Primary Evidence</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentEngineer.matchedProjects?.map((project: any, idx: number) => (
                    <Card key={project.name + idx} className="bg-[#0B1120]/60 border-cyan-500/20 hover:border-cyan-500/50 transition-all rounded-[3rem] overflow-hidden backdrop-blur-md group">
                      <CardContent className="p-8 space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="space-y-2">
                               <h4 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors truncate max-w-[220px] uppercase italic tracking-tight">
                                 {project.name}
                               </h4>
                               <Badge className="bg-cyan-500 text-slate-950 border-none text-[9px] font-black py-1 px-3 rounded-full">v{project.version}</Badge>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-2xl text-center min-w-[90px] border border-white/5">
                               <p className="text-lg font-black text-emerald-400 leading-none">{project.downloads?.toLocaleString() || 0}</p>
                               <p className="text-[8px] font-black text-slate-500 uppercase mt-1">Wkly DL</p>
                            </div>
                         </div>
                         <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 min-h-[3rem] font-medium italic">
                           "{project.description || "System logic core."}"
                         </p>
                         <Separator className="bg-white/5" />
                         <div className="flex items-center gap-6">
                            <a href={project.npm_url} target="_blank" className="text-[10px] font-black text-slate-500 hover:text-white flex items-center gap-2 transition-colors tracking-widest uppercase">
                               <Package className="w-3.5 h-3.5" /> Registry
                            </a>
                            {project.github_url && (
                               <a href={project.github_url} target="_blank" className="text-[10px] font-black text-slate-500 hover:text-white flex items-center gap-2 transition-colors tracking-widest uppercase">
                                 <Github className="w-3.5 h-3.5" /> Source
                               </a>
                            )}
                         </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* FULL ECOSYSTEM */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                   <Box className="w-6 h-6 text-slate-500" />
                   <h3 className="text-xl font-black text-slate-400 tracking-tighter uppercase italic">Ecosystem Footprint</h3>
                </div>
                <div className="bg-slate-950/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
                   <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentEngineer.allProjects
                          ?.filter((p: any) => !currentEngineer.matchedProjects?.find((mp: any) => mp.name === p.name))
                          .map((project: any, idx: number) => (
                          <div key={project.name + idx} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 transition-all group">
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-black text-slate-300 truncate max-w-[200px] group-hover:text-cyan-400">{project.name}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase">v{project.version}</span>
                             </div>
                             <p className="text-[11px] text-slate-500 line-clamp-1 mb-4 italic font-medium">{project.description}</p>
                             <div className="flex items-center justify-between">
                                <a href={project.npm_url} target="_blank" className="text-[9px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-tighter">Inspect</a>
                                <span className="text-[8px] font-black text-slate-800 uppercase tabular-nums">{new Date(project.date).getFullYear()}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              {/* RAW DATA INSPECTOR */}
              <div className="bg-slate-950 border border-white/5 rounded-[3rem] p-8">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <Terminal className="w-4 h-4 text-cyan-500" />
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Decentralized Intelligence Node</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(currentEngineer, null, 2));
                        setJsonCopied(true);
                        setTimeout(() => setJsonCopied(false), 2000);
                      }}
                      className="h-8 text-[10px] font-black text-slate-500 hover:text-cyan-400 hover:bg-white/5 rounded-xl gap-2"
                    >
                      {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {jsonCopied ? "COPIED" : "COPY JSON"}
                    </Button>
                 </div>
                 <pre className="p-6 bg-black/40 rounded-2xl text-[11px] font-mono text-cyan-500/60 leading-relaxed overflow-x-auto border border-white/5">
                    {JSON.stringify(currentEngineer, null, 2)}
                 </pre>
              </div>
            </div>
          </motion.div>
        ) : (
          <EmptyDiscovery loading={loading} logs={registryLogs} />
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MonitorPanel({ title, logs, color, onCopy, isCopied }: { title: string, logs: string[], color: string, onCopy: () => void, isCopied: boolean }) {
  const accent = color === "cyan" ? "border-cyan-500" : "border-emerald-500";
  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl border-l-4 ${accent} rounded-2xl shadow-2xl overflow-hidden flex flex-col h-64 border border-white/5`}>
      <div className="px-6 py-3 bg-slate-950/50 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</span>
        <div className="flex items-center gap-4">
          <button onClick={onCopy} className="text-[10px] font-black text-slate-600 hover:text-white flex items-center gap-2 transition-colors">
            {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {isCopied ? "COPIED" : "COPY"}
          </button>
          <div className={`w-2 h-2 rounded-full ${logs.length ? (color === "cyan" ? "bg-cyan-500 animate-pulse" : "bg-emerald-500 animate-pulse") : "bg-slate-800"}`} />
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto font-mono text-[10px] text-slate-400 leading-relaxed space-y-1 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 border-b border-white/5 pb-1 mb-1 last:border-0">
            <span className="text-slate-700 select-none tabular-nums">[{i+1}]</span>
            <span className={log.includes('✅') ? 'text-emerald-400 font-bold' : log.includes('❌') ? 'text-red-400' : ''}>{log}</span>
          </div>
        ))}
        {logs.length === 0 && <span className="text-slate-700 italic uppercase tracking-widest font-black">Standing by...</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string, value: string | number, sub: string }) {
  return (
    <div className="p-6 rounded-[2.5rem] bg-slate-900/40 border border-white/5 text-center transition-all hover:border-cyan-500/20 group/item">
       <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{label}</p>
       <p className="text-3xl font-black text-white group-hover/item:text-cyan-400 transition-colors tabular-nums">{value}</p>
       <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase italic tracking-tighter">{sub}</p>
    </div>
  );
}

function EmptyDiscovery({ loading, logs }: { loading: boolean, logs: string[] }) {
  return (
    <div className="max-w-4xl mx-auto text-center py-40 space-y-16">
      <div className="relative inline-block">
         <motion.div 
           animate={loading ? { 
             scale: [1, 1.1, 1], 
             rotate: [0, 5, -5, 0],
             boxShadow: ["0 0 20px rgba(6,182,212,0.2)", "0 0 60px rgba(6,182,212,0.5)", "0 0 20px rgba(6,182,212,0.2)"] 
           } : {}}
           transition={{ repeat: Infinity, duration: 3 }}
           className="w-40 h-40 rounded-[4rem] bg-slate-900 border border-white/10 flex items-center justify-center mx-auto relative z-10"
         >
           {loading ? <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" /> : <Cpu className="w-16 h-16 text-slate-700" />}
         </motion.div>
         <div className="absolute inset-0 bg-cyan-500/20 blur-[120px] rounded-full animate-pulse" />
      </div>
      
      <div className="space-y-6">
        <h3 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
          {loading ? "Initializing Sweep" : "Radar Standby"}
        </h3>
        <p className="text-slate-500 font-bold text-lg max-w-lg mx-auto leading-relaxed">
          {loading 
            ? "Executing autonomous AI scouting mission across the registry..." 
            : "Launch AI Scout to discover the world's most critical technical leads."}
        </p>
      </div>
    </div>
  );
}
