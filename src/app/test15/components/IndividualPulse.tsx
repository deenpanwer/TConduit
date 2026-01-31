'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Zap, Target, TrendingUp, MapPin, Calendar, Cpu, MousePointer2, 
  Keyboard, Eye, ShieldCheck, ChevronLeft, Sparkles, AlertCircle, 
  Activity, Repeat, BrainCircuit
} from 'lucide-react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  Tooltip, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { GlassCard } from '@/components/dashboard/main/shared/GlassCard';
import { HoverShimmer } from '@/components/dashboard/main/shared/Shimmer';


interface IndividualPulseProps {
  employee: any;
  onBack?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

const MetricBox = ({ label, value, icon: Icon, subValue, trend }: any) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ y: -5, scale: 1.02 }}
    className="flex flex-col p-8 rounded-[2.5rem] bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
  >
    <HoverShimmer />
    <div className="flex items-center justify-between mb-6 relative z-10">
      <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <span className="text-[10px] font-black font-poppins uppercase tracking-[0.25em] text-gray-400">{label}</span>
    </div>
    <div className="flex items-baseline space-x-3 relative z-10">
      <span className="text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter">{value}</span>
      {subValue && (
        <div className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
           <TrendingUp className="w-3 h-3 mr-1" />
           {subValue}
        </div>
      )}
    </div>
  </motion.div>
);

export const IndividualPulse = ({ employee, onBack }: IndividualPulseProps) => {
  const intensity = parseFloat(employee.intensity) || 1.0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-16 pb-32"
    >
      {/* 0: Navigation */}
      <motion.button 
        variants={itemVariants}
        onClick={onBack}
        className="flex items-center space-x-3 text-gray-400 hover:text-blue-500 transition-all group px-4 py-2 rounded-xl hover:bg-blue-500/5"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em]">Vault / Audit / {employee.name}</span>
      </motion.button>

      {/* HUB 1: MONOLITHIC BIO COCKPIT */}
      <motion.div variants={itemVariants}>
        <GlassCard elevated className="p-16 relative overflow-hidden group/hero" hoverEffect={false}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover/hero:bg-blue-500/10 transition-colors duration-1000" />
          
          <div className="flex flex-col xl:flex-row gap-20 relative z-10">
            <div className="flex items-center space-x-12">
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-2xl rounded-full opacity-50" 
                />
                <img 
                  src={employee.photoUrl} 
                  className="w-56 h-52 rounded-[4rem] object-cover relative z-10 border-4 border-white dark:border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] group-hover/hero:scale-105 transition-transform duration-700" 
                  alt={employee.name} 
                />
                <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-emerald-500 border-[6px] border-white dark:border-[#111113] rounded-full z-20 flex items-center justify-center shadow-2xl">
                  <Zap className="w-6 h-6 text-white fill-current animate-pulse" />
                </div>
              </div>
              
              <div>
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="inline-flex items-center px-5 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8"
                >
                  <Cpu className="w-3.5 h-3.5 text-blue-500 mr-2" />
                  <span className="text-[10px] font-black font-poppins text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">{employee.role}</span>
                </motion.div>
                <h1 className="text-8xl font-black font-playfair text-gray-900 dark:text-white tracking-tight leading-none mb-6">
                  {employee.name}
                </h1>
                <div className="flex items-center space-x-8 text-gray-400">
                  <div className="flex items-center space-x-3 group/info">
                    <Calendar className="w-4 h-4 group-hover/info:text-blue-500 transition-colors" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">TENURE: 24 DAYS</span>
                  </div>
                  <div className="flex items-center space-x-3 group/info">
                    <MapPin className="w-4 h-4 group-hover/info:text-rose-500 transition-colors" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{employee.lastLoginLocation.city} • {employee.lastLoginLocation.country}</span>
                  </div>
                </div>
              </div>
            </div>

                      <div className="grid grid-cols-2 gap-8 flex-1">
                        <MetricBox label="Active Yield" value={`${employee.activeHours}h`} icon={Zap} subValue="PRO" />
                        <MetricBox label="Idle Loss" value={`${employee.idleHours}h`} icon={Clock} trend="down" />
                        <MetricBox label="Clocked Today" value={`${employee.totalHoursClocked}h`} icon={Calendar} />
                        <MetricBox label="Yield Efficiency" value={`${employee.productivityScore}%`} icon={Target} subValue="High" />
                      </div>          </div>
        </GlassCard>
      </motion.div>

      {/* HUB 2: PSYCHOLOGY & AI AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2">
           <GlassCard className="p-10 border-l-8 border-l-blue-500 bg-blue-50/20 dark:bg-blue-500/5 relative overflow-hidden" hoverEffect={false}>
             <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center space-x-2 text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                   <Activity className="w-3 h-3" />
                   <span>Neural Scan Active</span>
                </div>
             </div>
             <div className="flex items-start space-x-8 relative z-10">
               <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">
                 <Sparkles className="w-8 h-8 text-white" />
               </div>
               <div>
                 <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-4">Founder's Narrative Audit</h4>
                 <p className="text-xl text-gray-800 dark:text-gray-200 font-medium font-poppins leading-relaxed">
                   "{employee.name} is demonstrating <span className="text-blue-500 font-black">Elite Flow Performance</span>. Despite {employee.contextSwitches} context switches, the Flow Rhythm is steady at {employee.flowScore}%. Their cognitive load is optimal, suggesting high comfort with the current task complexity."
                 </p>
                 <div className="flex items-center mt-8 space-x-10">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Context Switches</span>
                       <span className="text-2xl font-black text-gray-900 dark:text-white">{employee.contextSwitches}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Flow Rhythm</span>
                       <span className="text-2xl font-black text-gray-900 dark:text-white">{employee.flowScore}%</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cognitive Load</span>
                       <span className="text-2xl font-black text-blue-500">{employee.cognitiveLoad}</span>
                    </div>
                 </div>
               </div>
             </div>
           </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
           <GlassCard className="p-10 h-full flex flex-col justify-between overflow-hidden relative group" hoverEffect={false}>
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Live Output Intensity</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-6xl font-black font-poppins text-gray-900 dark:text-white">{(intensity * 100).toFixed(0)}</span>
                  <span className="text-xl font-black text-blue-500 uppercase tracking-widest">Tension</span>
                </div>
              </div>
              <div className="w-full h-24 flex items-center justify-center relative z-10">
                <svg width="100%" height="80" viewBox="0 0 1000 80" className="overflow-visible">
                  <motion.path
                    d="M 0 40 Q 50 40, 100 40 T 200 40 T 300 40 T 400 40 T 500 40 T 600 40 T 700 40 T 800 40 T 900 40 T 1000 40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    strokeLinecap="round"
                    animate={{
                      d: [
                        `M 0 40 Q 50 ${40 - (35*intensity)}, 100 40 T 200 40 T 300 40 T 400 40 T 500 40 T 600 40 T 700 40 T 800 40 T 900 40 T 1000 40`,
                        `M 0 40 Q 50 ${40 + (35*intensity)}, 100 40 T 200 40 T 300 40 T 400 40 T 500 40 T 600 40 T 700 40 T 800 40 T 900 40 T 1000 40`,
                        `M 0 40 Q 50 ${40 - (35*intensity)}, 100 40 T 200 40 T 300 40 T 400 40 T 500 40 T 600 40 T 700 40 T 800 40 T 900 40 T 1000 40`,
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 / intensity, ease: "easeInOut" }}
                  />
                </svg>
              </div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] italic">"{employee.heartbeat.lastActiveWindow}"</p>
           </GlassCard>
        </motion.div>
      </div>

      {/* NEW HUB: YIELD DISTRIBUTION */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-10 relative overflow-hidden" hoverEffect={false}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Yield Distribution</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Extrapolated from minute-by-minute telemetry</p>
            </div>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase text-gray-500">Active ({100 - parseInt(employee.idleRatio)}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-white/10" />
                <span className="text-[10px] font-black uppercase text-gray-500">Idle ({employee.idleRatio}%)</span>
              </div>
            </div>
          </div>
          
          <div className="h-12 w-full bg-gray-100 dark:bg-white/5 rounded-2xl flex overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${100 - parseInt(employee.idleRatio)}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] relative group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Primary Production</p>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 italic">"High density execution period. No anomalies detected."</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Idle Threshold</p>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 italic">"Normal physiological breaks and context stabilization."</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* HUB 3: GEOMETRIC DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants}>
           <GlassCard className="p-12" hoverEffect={false}>
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Performance Geometry</h3>
                <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl">
                   <Repeat className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="h-[250px] w-full flex items-end space-x-1.5">
                {employee.screenshots.map((log: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(log.keystrokes / 150) * 100}%` }}
                    whileHover={{ scaleY: 1.1, backgroundColor: '#3b82f6' }}
                    className={`flex-1 rounded-t-xl transition-all duration-300 ${log.keystrokes > 60 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/5'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 <span>-15 MINS</span>
                 <span>LIVE NOW</span>
              </div>
           </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
           <GlassCard className="p-12" hoverEffect={false}>
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Interaction DNA</h3>
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                   <BrainCircuit className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="keys" hide domain={[0, 150]} />
                    <YAxis type="number" dataKey="mouse" hide domain={[0, 100]} />
                    <ZAxis type="number" range={[150, 600]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '1rem', color: '#fff' }}
                    />
                    <Scatter name="DNA" data={employee.interactionDNA}>
                      {employee.interactionDNA.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.keys > 60 ? '#3b82f6' : '#8b5cf6'} className="drop-shadow-xl" />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-4 space-x-10 text-[10px] font-black uppercase tracking-widest">
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> EXECUTION</div>
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-purple-500 mr-2" /> EXPLORATION</div>
              </div>
           </GlassCard>
        </motion.div>
      </div>

      {/* HUB 4: THE CHRONICLE & AUDIT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div variants={itemVariants}>
           <GlassCard className="p-10" hoverEffect={false}>
             <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">System Stack Yield</h3>
             <div className="space-y-10">
               {employee.projects.map((p: any, i: number) => (
                 <div key={i} className="group/stack">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-black text-gray-400 group-hover/stack:text-blue-500 transition-colors uppercase tracking-widest">{p.name}</span>
                     <span className="text-lg font-black text-gray-900 dark:text-white">{(p.totalTime / 3600).toFixed(1)}h</span>
                   </div>
                   <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min((p.totalTime / 50000) * 100, 100)}%` }}
                       className="h-full rounded-full shadow-lg"
                       style={{ backgroundColor: p.color }}
                     />
                   </div>
                 </div>
               ))}
             </div>
           </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-2">
           <GlassCard className="p-10" hoverEffect={false}>
             <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10">The Performance Chronicle</h3>
             <div className="space-y-8 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
               {employee.chronicle.map((event: any, i: number) => (
                 <motion.div 
                  key={i} 
                  whileHover={{ x: 10 }}
                  className="flex items-center space-x-8 group cursor-default"
                 >
                   <div className="text-xs font-black text-blue-500 bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-blue-500/20">{event.duration}m</div>
                   <div className="flex-1 p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group-hover:bg-blue-500/5 group-hover:border-blue-500/30 transition-all shadow-sm">
                     <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{event.title}</p>
                     <div className="flex items-center mt-2 space-x-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.app}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           </GlassCard>
        </motion.div>
      </div>

      {/* HUB 5: VISUAL EVIDENCE SLIDER */}
      <motion.div variants={itemVariants} className="space-y-10">
        <div className="flex items-end justify-between px-4">
          <div>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Visual Audit Stream</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Minute-by-Minute Telemetry Capture</p>
          </div>
          <div className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
            <span className="text-sm font-black text-blue-500">{employee.screenshots.length}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verified Captures</span>
          </div>
        </div>
        
        <div className="flex space-x-8 overflow-x-auto pb-16 pt-4 px-4 custom-scrollbar">
          {employee.screenshots.map((s: any, i: number) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.05, y: -15 }}
              className="flex-shrink-0 w-96 group cursor-pointer"
            >
              <div className="relative aspect-video rounded-[3rem] overflow-hidden border-[6px] border-white dark:border-white/5 shadow-2xl transition-all group-hover:shadow-blue-500/20">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <img src={s.base64} className="w-full h-full object-cover relative z-10 opacity-90 group-hover:opacity-100 transition-opacity" alt="Audit Capture" />
                
                {/* Overlay Metrics */}
                <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between">
                   <div className="flex space-x-3">
                     <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center space-x-2">
                        <Keyboard className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[11px] font-black text-white">{s.keystrokes}</span>
                     </div>
                     <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 flex items-center space-x-2">
                        <MousePointer2 className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[11px] font-black text-white">{s.mouseClicks}</span>
                     </div>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                   </div>
                </div>
              </div>
              <div className="mt-8 text-center">
                 <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Capture #{i+1}</p>
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FOOTER: SYSTEM LEDGER */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-12 mt-20 bg-gray-900 border-none shadow-[0_40px_80px_rgba(0,0,0,0.4)]" hoverEffect={false}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
            <div className="space-y-4">
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Network Node</p>
               <p className="text-lg font-black font-poppins text-white">{employee.lastLoginIpAddress}</p>
               <div className="inline-flex items-center text-[9px] font-bold text-emerald-400 uppercase bg-emerald-400/10 px-3 py-1 rounded-full">Secure Connection</div>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Hardware Layer</p>
               <p className="text-lg font-black font-poppins text-white truncate">{employee.lastLoginOs}</p>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Binary Version</p>
               <p className="text-lg font-black font-poppins text-white">BUILD v{employee.lastLoginAppVersion}</p>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Heartbeat Sync</p>
               <p className="text-lg font-black font-poppins text-white">{employee.heartbeat.currentLatency}ms <span className="text-[10px] text-emerald-500 uppercase ml-2">Stable</span></p>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.5em] text-gray-600">
             <span>TRAC-AUDIT-PROTO-15</span>
             <span className="mt-4 md:mt-0">Encrypted Telemetry Stream • Verified Identity</span>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};