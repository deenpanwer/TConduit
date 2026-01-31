'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  Users, 
  Clock, 
  Zap, 
  Globe, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal,
  Sun,
  Moon,
  ShieldCheck,
  MousePointer2,
  HardDrive,
  MapPin,
  ChevronRight,
  Activity,
  Award,
  Sparkles,
  Link as LinkIcon,
  Layers,
  Target
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

// --- Configuration & Constants ---
const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const employees = [
  {
    name: "Deen Panwer",
    role: "Dev Lead",
    hoursToday: 9.4,
    prevHours: [7.2, 8.1, 9.4],
    photoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLZLwJYLJDy3PkVyYfhub8bjEtWIkv8bGuIVaAlBhmNS5aOfw=s96-c",
    location: { country: "Pakistan", city: "Karachi", lat: 24.86, lng: 67.01, region: "Sindh" },
    email: "deenpanwer@gmail.com",
    attachedAt: "January 29, 2026",
    os: "Windows_NT 10.0.19045 (x64)",
    ip: "68.166.184.55",
    version: "1.0.4",
    stability: 85,
    yield: 92
  },
  {
    name: "Sarah Chen",
    role: "Senior Engineer",
    hoursToday: 8.2,
    prevHours: [8.5, 7.8, 8.2],
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    location: { country: "Canada", city: "Toronto", lat: 43.65, lng: -79.38, region: "Ontario" },
    email: "sarah.c@trac.ai",
    attachedAt: "January 12, 2026",
    os: "Darwin 23.2.0 (arm64)",
    ip: "142.250.190.46",
    version: "1.0.4",
    stability: 94,
    yield: 88
  },
  {
    name: "Alex Rivera",
    role: "UI Designer",
    hoursToday: 7.8,
    prevHours: [9.0, 8.5, 7.8],
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    location: { country: "Spain", city: "Madrid", lat: 40.41, lng: -3.70, region: "Madrid" },
    email: "alex.r@trac.ai",
    attachedAt: "January 05, 2026",
    os: "Windows_NT 11.0.22621 (x64)",
    ip: "82.158.18.90",
    version: "1.0.3",
    stability: 72,
    yield: 95
  }
];

const milestones = [
  { name: "Project Alpha (Platform Core)", progress: 82, status: "Ahead", color: "#3b82f6" },
  { name: "Mobile App Refactor", progress: 45, status: "On Track", color: "#8b5cf6" },
  { name: "Global Edge Expansion", progress: 20, status: "Optimizing", color: "#10b981" }
];

const compositionData = [
  { name: 'Core Build', value: 65, color: '#3b82f6' },
  { name: 'Maintenance', value: 25, color: '#64748b' },
  { name: 'Administrative', value: 10, color: '#94a3b8' },
];

const growthData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  hours: Math.floor(Math.random() * 15) + 30 + (i * 1.8),
}));

// --- Types ---
interface Employee {
  name: string;
  role: string;
  hoursToday: number;
  prevHours: number[];
  photoUrl: string;
  location: { country: string; city: string; lat: number; lng: number; region: string };
  email: string;
  attachedAt: string;
  os: string;
  ip: string;
  version: string;
  stability: number;
  yield: number;
}

interface SankeyNode {
  name: string;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  value?: number;
  color?: string;
  icon?: any;
}

interface SankeyLink {
  source: SankeyNode | number;
  target: SankeyNode | number;
  value: number;
  width?: number;
  focus?: string;
}

// --- UI Components ---

const GlassCard = ({ children, className = "", elevated = false }: { children: React.ReactNode; className?: string; elevated?: boolean }) => (
  <div className={`
    rounded-[2.5rem] transition-all duration-700
    ${elevated 
      ? 'bg-white dark:bg-[#111113] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/5' 
      : 'bg-[#fcfdfe] dark:bg-[#0c0c0e] border border-gray-100 dark:border-gray-800/40'}
    ${className}
  `}>
    {children}
  </div>
);

const AIInsightBrief = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#f1f5f9] dark:bg-[#161619] rounded-[2.5rem] p-8 mb-16 flex flex-col md:flex-row items-center justify-between border border-gray-200/50 dark:border-white/5 relative overflow-hidden shadow-sm"
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
    <div className="flex items-center space-x-8 relative z-10">
      <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5">
        <Sparkles className="w-7 h-7 text-blue-500" />
      </div>
      <div>
        <div className="flex items-center space-x-2 mb-1.5">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.25em]">Morning Performance Brief</p>
          <div className="w-1 h-1 rounded-full bg-blue-500/30" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">January 30, 2026</span>
          <div className="w-1 h-1 rounded-full bg-blue-500/30 ml-1" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sentiment: Peak Flow</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed italic max-w-xl">
          "System performance is operating at 114% velocity today. High-impact Focus Blocks are peaking in the Canada region, while milestone 'Alpha' remains on a 4-day early delivery trajectory."
        </p>
      </div>
    </div>
    
    <div className="flex items-center space-x-12 relative z-10 mt-8 md:mt-0">
      <div className="h-20 w-px bg-gray-200 dark:bg-gray-800 hidden lg:block" />
      <div className="scale-75 origin-center">
        <VelocityDial value={114} />
      </div>
      <div className="hidden lg:flex flex-col items-end">
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confidence Score</span>
         <div className="flex space-x-1">
            {[1, 1, 1, 1, 0.4].map((o, i) => <div key={i} className={`w-4 h-1 rounded-full ${o === 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'}`} />)}
         </div>
      </div>
    </div>
  </motion.div>
);

const VelocityDial = ({ value = 114 }: { value?: number }) => (
  <div className="relative w-44 h-44 flex items-center justify-center group">
    <svg className="w-full h-full -rotate-90 overflow-visible">
      <circle
        cx="88" cy="88" r="82"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1"
        className="opacity-10 animate-ping"
      />
      <circle
        cx="88" cy="88" r="76"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        className="text-gray-50 dark:text-gray-800/50"
      />
      <motion.circle
        cx="88" cy="88" r="76"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="14"
        strokeDasharray={480}
        initial={{ strokeDashoffset: 480 }}
        animate={{ strokeDashoffset: 480 - (480 * (value / 150)) }}
        transition={{ duration: 2, ease: "circOut" }}
        strokeLinecap="round"
      />
      <foreignObject x="48" y="48" width="80" height="80">
        <div className="flex items-center justify-center h-full w-full rotate-90">
           <div className="flex items-end space-x-0.5 h-6">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] }}
                  transition={{ repeat: Infinity, duration: 0.6 + (i * 0.1), ease: "easeInOut" }}
                  className="w-1 bg-blue-500/30 rounded-full"
                />
              ))}
           </div>
        </div>
      </foreignObject>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{value}%</span>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Output Speed</span>
    </div>
  </div>
);

const MetricSubBox = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="flex flex-col p-5 rounded-[2rem] bg-[#f9fafc] dark:bg-[#161619] border border-gray-50 dark:border-white/5 shadow-sm group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-12" />
    <div className="flex items-center space-x-2 mb-3">
      <div className={`p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{label}</span>
    </div>
    <div className="flex items-baseline space-x-1">
      <span className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{value}</span>
    </div>
  </div>
);

const StabilityMatrix = () => {
  const data = employees.map(e => ({ name: e.name, x: e.yield, y: e.stability, z: 200 }));
  
  return (
    <div className="h-[300px] w-full relative">
      {/* Quadrant Labels */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full text-[40px] font-black uppercase tracking-tighter text-center">
          <div className="flex items-center justify-center border-r border-b border-gray-400">Stable Growth</div>
          <div className="flex items-center justify-center border-b border-gray-400">Peak Performance</div>
          <div className="flex items-center justify-center border-r border-gray-400">Retention Risk</div>
          <div className="flex items-center justify-center">Burnout Zone</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" hide domain={[50, 100]} />
          <YAxis type="number" dataKey="y" hide domain={[50, 100]} />
          <ZAxis type="number" dataKey="z" range={[400, 401]} />
          <RechartsTooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.y < 75 ? '#ef4444' : '#3b82f6'} strokeWidth={4} stroke="#ffffff" />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

const CollaborationNetwork = () => {
  const nodes = [
    { x: 150, y: 150, name: 'Dev', color: '#3b82f6' },
    { x: 450, y: 100, name: 'Design', color: '#8b5cf6' },
    { x: 750, y: 150, name: 'Ops', color: '#10b981' },
    { x: 450, y: 250, name: 'Support', color: '#64748b' }
  ];
  
  return (
    <div className="h-[300px] w-full flex items-center justify-center overflow-hidden">
      <svg width="100%" height="300" viewBox="0 0 900 300" className="overflow-visible">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Connections */}
        <line x1="150" y1="150" x2="450" y2="100" stroke="#3b82f620" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="450" y1="100" x2="750" y2="150" stroke="#3b82f620" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="150" y1="150" x2="450" y2="250" stroke="#3b82f620" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="450" y1="250" x2="750" y2="150" stroke="#3b82f620" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="450" y1="100" x2="450" y2="250" stroke="#3b82f620" strokeWidth="2" strokeDasharray="5 5" />

        {nodes.map((n, i) => (
          <g key={i}>
            <motion.circle 
              cx={n.x} cy={n.y} r="25" fill={n.color}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}
              className="shadow-xl"
            />
            <text x={n.x} y={n.y + 45} textAnchor="middle" fill="#94a3b8" className="text-[10px] font-black uppercase tracking-widest">{n.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const EmployeeSoftCard = ({ emp }: { emp: Employee }) => {
  const isUp = emp.hoursToday >= emp.prevHours[1];
  const chartData = emp.prevHours.map((v, i) => ({ v, i }));

  return (
    <GlassCard elevated className="p-6 relative group overflow-hidden border-b-4 border-b-transparent hover:border-b-blue-500 transition-all duration-500">
      <div className="absolute top-0 right-0 p-5">
        {isUp ? 
          <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
             <TrendingUp className="w-3 h-3 mr-1" />
             <span className="text-[10px] font-black tracking-widest uppercase">Stable</span>
          </div> : 
          <div className="flex items-center text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg">
             <TrendingDown className="w-3 h-3 mr-1" />
             <span className="text-[10px] font-black tracking-widest uppercase">Variable</span>
          </div>
        }
      </div>
      
      <div className="flex flex-col h-full">
        <div className="flex items-center space-x-4 mb-6">
           <div className="relative">
             <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <img src={emp.photoUrl} className="w-14 h-14 rounded-2xl object-cover relative z-10 border-2 border-white dark:border-gray-800 shadow-md transition-transform duration-500 group-hover:scale-110" alt={emp.name} />
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full z-20" />
           </div>
           <div>
             <h4 className="font-black text-gray-900 dark:text-white tracking-tight">{emp.name}</h4>
             <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{emp.role}</p>
           </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-end justify-between mb-4">
             <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Activity Pulse</p>
               <h5 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{emp.hoursToday}<span className="text-sm font-medium ml-0.5 text-blue-500">h</span></h5>
             </div>
             <div className="w-16 h-8">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                   <Line type="monotone" dataKey="v" stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth={3} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400">
             <MapPin className="w-3 h-3" />
             <span className="uppercase tracking-tighter">{emp.location.city}, {emp.location.country}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const WorkforceSankey = () => {
  const data = {
    nodes: [
      { name: "ORGANIZATION", icon: ShieldCheck, color: "#3b82f6" },
      { name: "Development", icon: Zap, color: "#3b82f6" }, 
      { name: "Design", icon: MousePointer2, color: "#8b5cf6" }, 
      { name: "Management", icon: Globe, color: "#64748b" },
      { name: "Focus Projects", icon: Users, color: "#10b981" }, 
      { name: "Internal Sync", icon: Clock, color: "#f59e0b" }, 
      { name: "Support", icon: Activity, color: "#94a3b8" }
    ],
    links: [
      { source: 0, target: 1, value: 60, focus: "deep" }, 
      { source: 0, target: 2, value: 30, focus: "deep" }, 
      { source: 0, target: 3, value: 10, focus: "admin" },
      { source: 1, target: 4, value: 45, focus: "deep" }, 
      { source: 1, target: 5, value: 15, focus: "sync" },
      { source: 2, target: 4, value: 20, focus: "deep" }, 
      { source: 2, target: 6, value: 10, focus: "admin" },
      { source: 3, target: 5, value: 5, focus: "sync" }, 
      { source: 3, target: 6, value: 5, focus: "admin" }
    ]
  };

  const { nodes, links } = useMemo(() => {
    const s = sankey<SankeyNode, SankeyLink>().nodeWidth(12).nodePadding(35).extent([[0, 0], [1000, 300]]);
    return s(data as any);
  }, []);

  const getLinkColor = (focus: string) => {
    switch(focus) {
      case 'deep': return '#3b82f6';
      case 'sync': return '#f59e0b';
      case 'admin': return '#94a3b8';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="w-full h-full group">
      <svg width="100%" height="300" viewBox="0 0 1000 300" className="overflow-visible">
        <g fill="none" strokeOpacity="0.15">
          {links.map((link, i) => (
            <path
              key={i}
              d={sankeyLinkHorizontal()(link as any) || undefined}
              stroke={getLinkColor((data.links[i] as any).focus)}
              strokeWidth={Math.max(1, link.width || 0)}
              className="hover:stroke-opacity-40 transition-all duration-500 cursor-pointer"
            />
          ))}
        </g>
        <g>
          {nodes.map((node, i) => {
            const nodeData = data.nodes[i];
            const Icon = nodeData.icon;
            return (
              <g key={i} className="group/node">
                <rect 
                  x={node.x0 || 0} y={node.y0 || 0} 
                  width={(node.x1 || 0) - (node.x0 || 0)} 
                  height={(node.y1 || 0) - (node.y0 || 0)} 
                  fill={nodeData.color} 
                  rx={6} 
                  className="group-hover/node:brightness-110 transition-all duration-300"
                />
                <foreignObject
                  x={(node.x0 || 0) < 500 ? (node.x1 || 0) + 10 : (node.x0 || 0) - 160}
                  y={((node.y1 || 0) + (node.y0 || 0)) / 2 - 10}
                  width="150"
                  height="20"
                >
                  <div className={`flex items-center space-x-2 ${(node.x0 || 0) < 500 ? 'justify-start' : 'justify-end'} h-full`}>
                    {(node.x0 || 0) >= 500 && <span className="text-[10px] font-black text-blue-500 opacity-60">{(node.value as number).toFixed(0)}h</span>}
                    {Icon && <Icon className="w-3 h-3 text-gray-400" />}
                    <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter truncate">
                      {node.name}
                    </span>
                    {(node.x0 || 0) < 500 && <span className="text-[10px] font-black text-blue-500 opacity-60">{(node.value as number).toFixed(0)}h</span>}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// --- Main Page ---

export default function Test14Page() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#09090b] transition-colors duration-700 selection:bg-blue-500/20 selection:text-blue-900 overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        body { font-family: 'Poppins', sans-serif !important; }
      `}</style>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-8 right-8 z-[100] p-4 rounded-3xl bg-white/80 dark:bg-[#141416]/80 backdrop-blur-xl shadow-2xl border border-gray-100 dark:border-gray-800 group hover:scale-110 transition-all duration-500"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
      </button>

      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative">
        
        {/* HUB 1: THE OWNER'S COCKPIT */}
        <GlassCard elevated className="mb-12 p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col lg:flex-row lg:items-center gap-16 relative z-10">
            {/* Branding & Identity */}
            <div className="flex items-center space-x-12">
              <div className="w-44 h-44 rounded-[3.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 flex items-center justify-center shadow-[0_20px_40px_rgba(59,130,246,0.3)] border-2 border-white/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <ShieldCheck className="w-20 h-20 text-white drop-shadow-lg relative z-10" />
              </div>
              <div className="h-32 w-px bg-gray-100 dark:bg-gray-800 hidden lg:block" />
              <div>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-2" />
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Global Operations Control</span>
                </div>
                <h1 className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.85]">TRAC<br/>STUDIO</h1>
                <div className="mt-6 flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm">
                    <img src={employees[0].photoUrl} className="w-full h-full object-cover" alt="Owner" />
                  </div>
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Owner: <span className="text-blue-500">Deen Panwer</span></p>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 lg:pl-12">
              <MetricSubBox icon={Users} label="Total Staff" value="12" />
              <MetricSubBox icon={Clock} label="Month Output" value="1,842h" />
              <MetricSubBox icon={Award} label="Top Performer" value="Deen P." />
              <MetricSubBox icon={Activity} label="System Load" value="Optimal" />
              <MetricSubBox icon={HardDrive} label="Capacity" value="100%" />
              <MetricSubBox icon={Globe} label="Regional Presence" value="4 Regions" />
            </div>
          </div>
        </GlassCard>

        {/* HUB 2: THE INTELLIGENCE UNIT */}
        <AIInsightBrief />

        {/* HUB 3: PERFORMANCE & IMPACT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Performance Horizon Chart */}
          <GlassCard className="lg:col-span-2 p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tighter uppercase">Performance Horizon</h2>
                <p className="text-gray-400 mt-2 text-xs font-medium uppercase tracking-widest">Aggregate output with 14-day projection</p>
              </div>
              <div className="flex bg-gray-50 dark:bg-[#111113] p-1.5 rounded-2xl border border-gray-100 dark:border-white/5">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Monthly</button>
                <button className="px-6 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">Weekly</button>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" opacity={theme === 'dark' ? 0.05 : 1} />
                  <XAxis dataKey="day" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 10']} />
                  <RechartsTooltip 
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', backdropFilter: 'blur(16px)', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#18181b' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={6} fillOpacity={1} fill="url(#colorPulse)" />
                  <Area type="monotone" data={growthData.slice(-10).map(d => ({ ...d, hours: d.hours * (1 + (Math.random() * 0.1)) }))} dataKey="hours" stroke="#3b82f6" strokeWidth={2} strokeDasharray="10 10" fill="transparent" opacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Milestone Countdown */}
          <GlassCard className="p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <Target className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Milestones</h3>
              </div>
              <div className="space-y-8">
                {milestones.map((m, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter truncate max-w-[150px]">{m.name}</span>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{m.status}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${m.progress}%` }} transition={{ duration: 1, delay: i * 0.2 }}
                        className="h-full rounded-full" style={{ backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-blue-500 transition-colors mt-8">
              View Strategy Roadmap
            </button>
          </GlassCard>
        </div>

        {/* HUB 4: CULTURAL HEALTH & NETWORK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <GlassCard className="p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Workforce Stability</h3>
                <p className="text-gray-400 mt-1 text-[10px] font-medium uppercase tracking-widest">Mapping Yield vs. Retention Balance</p>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                 <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <StabilityMatrix />
          </GlassCard>

          <GlassCard className="p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Collaboration Network</h3>
                <p className="text-gray-400 mt-1 text-[10px] font-medium uppercase tracking-widest">Visualizing knowledge flow across departments</p>
              </div>
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                 <LinkIcon className="w-4 h-4" />
              </div>
            </div>
            <CollaborationNetwork />
          </GlassCard>
        </div>

        {/* HUB 5: QUALITY FLOW & FOCUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <GlassCard className="lg:col-span-2 p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Work Quality Flow</h3>
                <p className="text-gray-400 mt-1 text-[10px] font-medium uppercase tracking-widest">Quality breakdown across primary nodes</p>
              </div>
              <div className="flex items-center space-x-3">
                 <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Deep</span></div>
                 <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sync</span></div>
                 <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-gray-400" /><span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Admin</span></div>
              </div>
            </div>
            <WorkforceSankey />
          </GlassCard>

          <GlassCard className="p-10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 text-center">Output Composition</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={compositionData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                    {compositionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-8">
               {compositionData.map((c, i) => (
                 <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{c.name}</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{c.value}%</span>
                 </div>
               ))}
            </div>
          </GlassCard>
        </div>

        {/* HUB 6: FRONT LINE & GEOGRAPHY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {employees.map((emp) => (
            <EmployeeSoftCard key={emp.name} emp={emp} />
          ))}
          <GlassCard elevated className="bg-[#111113] dark:bg-blue-600 text-white border-none shadow-[0_25px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_50px_rgba(37,99,235,0.4)] flex flex-col justify-between p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 dark:text-blue-100 mb-2">Aggregate Output Summary</p>
              <h4 className="text-5xl font-black leading-none tracking-tighter">124.8<span className="text-lg font-medium ml-1">h</span></h4>
              <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-widest">Total Daily Production</p>
            </div>
            <div className="mt-8">
               <div className="h-14 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={growthData.slice(-10)}><Area type="step" dataKey="hours" stroke="white" strokeWidth={3} fill="rgba(255,255,255,0.05)" dot={false} /></AreaChart></ResponsiveContainer></div>
               <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest">Growth Vector</span><span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">Expanding</span></div>
                  <div className="flex items-center text-xs font-black bg-blue-500/30 dark:bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10"><TrendingUp className="w-3 h-3 mr-1 text-blue-400 dark:text-white" /><span>+12.4%</span></div>
               </div>
            </div>
          </GlassCard>
        </div>

        {/* WORLD MAP */}
        <GlassCard className="p-8 mb-16 min-h-[600px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-10 left-10 z-20">
             <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Regional Presence</h3>
             <p className="text-gray-400 mt-2 text-[10px] font-medium uppercase tracking-widest italic">3 active continents • Live workforce telemetry</p>
          </div>
          <ComposableMap projectionConfig={{ scale: 160 }}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const isActive = ["Pakistan", "Canada", "Spain"].includes(countryName);
                  return (
                    <Geography
                      key={geo.rsmKey} geography={geo}
                      fill={isActive ? (theme === 'dark' ? '#3b82f620' : '#3b82f610') : (theme === 'dark' ? '#18181b' : '#f8fafc')}
                      stroke={isActive ? "#3b82f6" : (theme === 'dark' ? '#27272a' : '#f1f5f9')}
                      strokeWidth={0.5}
                      onMouseEnter={() => isActive && setHoveredCountry(countryName)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{ default: { outline: "none" }, hover: { fill: isActive ? "#3b82f640" : (theme === 'dark' ? '#27272a' : '#f1f5f9'), outline: "none" } }}
                    />
                  )
                })
              }
            </Geographies>
            {employees.map((emp) => (
              <Marker key={emp.name} coordinates={[emp.location.lng, emp.location.lat]}>
                <g className="cursor-pointer group" onMouseEnter={() => setHoveredCountry(emp.location.country)} onMouseLeave={() => setHoveredCountry(null)}>
                  <defs><clipPath id={`clip-${emp.name.replace(/\s+/g, '-')}`}><circle cx="0" cy="0" r="14" /></clipPath></defs>
                  <circle r="18" fill="#3b82f6" className="animate-pulse opacity-20" /><circle r="16" fill="white" stroke="#3b82f6" strokeWidth={2} />
                  <image href={emp.photoUrl} x="-14" y="-14" width="28" height="28" clipPath={`url(#clip-${emp.name.replace(/\s+/g, '-')})`} />
                  <AnimatePresence>
                    {hoveredCountry === emp.location.country && (
                      <motion.g initial={{ opacity: 0, scale: 0.5, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <rect x="-60" y="-85" width="120" height="50" rx="16" fill={theme === 'dark' ? '#18181b' : '#ffffff'} className="shadow-2xl" />
                        <path d="M-10,-35 L0,-25 L10,-35" fill={theme === 'dark' ? '#18181b' : '#ffffff'} />
                        <text y="-65" textAnchor="middle" fill={theme === 'dark' ? '#ffffff' : '#000000'} className="text-[10px] font-black uppercase tracking-widest">{emp.name}</text>
                        <text y="-52" textAnchor="middle" fill="#3b82f6" className="text-[8px] font-black uppercase tracking-tighter">{emp.location.city} • ACTIVE</text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </g>
              </Marker>
            ))}
          </ComposableMap>
        </GlassCard>

        {/* HUB 7: WORKFORCE ACTIVITY LEDGER */}
        <div className="mt-24">
           <div className="flex items-center justify-between mb-10">
             <div><h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Workforce Activity</h2><p className="text-gray-400 mt-2 text-[10px] font-medium uppercase tracking-[0.2em]">Daily activity audit for all connected members</p></div>
             <button className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-blue-500 transition-all"><MoreHorizontal className="w-6 h-6" /></button>
           </div>
           <div className="overflow-x-auto pb-10">
             <table className="w-full border-separate border-spacing-y-4">
               <thead>
                 <tr className="text-left"><th className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Identity</th><th className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Position & OS</th><th className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Activity Status</th><th className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Network ID</th><th className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Audit</th></tr>
               </thead>
               <tbody>
                 {employees.map((emp) => (
                   <motion.tr key={emp.email} whileHover={{ y: -4 }} className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/5 rounded-[2rem] group">
                     <td className="px-8 py-6 rounded-l-[2rem]"><div className="flex items-center space-x-4"><img src={emp.photoUrl} className="w-12 h-12 rounded-2xl border border-gray-100 dark:border-gray-800" alt={emp.name} /><div><p className="font-black text-gray-900 dark:text-white tracking-tight leading-none">{emp.name}</p><p className="text-[11px] text-gray-400 font-medium mt-1.5">{emp.email}</p></div></div></td>
                     <td className="px-8 py-6"><p className="text-sm font-black text-gray-800 dark:text-gray-200 leading-none">{emp.role}</p><p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter mt-1.5">{emp.os}</p></td>
                     <td className="px-8 py-6"><p className="text-sm font-bold text-gray-600 dark:text-gray-400 leading-none">{emp.attachedAt}</p><div className="flex items-center mt-2"><div className="flex space-x-0.5 items-end h-3 mr-2">{[0.4, 0.7, 0.3, 0.9, 0.5].map((h, i) => (<motion.div key={i} animate={{ height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] }} transition={{ repeat: Infinity, duration: 1 + h, ease: "easeInOut" }} className="w-0.5 bg-emerald-500 rounded-full" />))}</div><p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Pulse</p></div></td>
                     <td className="px-8 py-6"><div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 tracking-tighter">{emp.ip}</span></div><p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">v{emp.version}</p></td>
                     <td className="px-8 py-6 text-right rounded-r-[2rem]"><button className="px-6 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white transition-all active:scale-95">Detailed Pulse</button></td>
                   </motion.tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        <footer className="mt-40 pb-20 text-center relative z-10"><div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mb-8 rounded-full" /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">TRAC Intelligence Systems • Autonomous Workforce OS v4.2.0</p></footer>
        <div className="fixed inset-0 pointer-events-none z-0"><div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" /><div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full" /></div>
      </main>
    </div>
  );
}