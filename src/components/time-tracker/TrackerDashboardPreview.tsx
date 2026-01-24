'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, MousePointer, AppWindow, Clock, Sparkles, Activity, FileText, AlertCircle, ChevronRight, Video, Lock, ShieldCheck } from 'lucide-react';

const USERS = [
  { 
    id: 1, 
    name: "Sarah Connor", 
    role: "Lead Dev", 
    status: "online", 
    app: "VS Code",
    initials: "SC",
    color: "primary",
    efficiency: 96,
    timeTracked: "4h 23m",
    aiSummary: "Sarah has focused primarily on backend architecture today. High keyboard activity detected during the \"API Integration\" block.",
    liveViewType: "code",
    liveContent: (
      <>
        <span className="text-blue-400">import</span> React <span className="text-blue-400">from</span> <span className="text-orange-400">'react'</span>;<br/>
        <span className="text-purple-400">export function</span> <span className="text-yellow-400">AICore</span>() {'{'}<br/>
        &nbsp;&nbsp;<span className="text-gray-500">// Analyzing user patterns...</span><br/>
        &nbsp;&nbsp;<span className="text-blue-400">const</span> efficiency = <span className="text-orange-400">0.98</span>;<br/>
        &nbsp;&nbsp;<span className="text-blue-400">if</span> (efficiency &gt; threshold) {'{'}<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;optimizeWorkflow();<br/>
        &nbsp;&nbsp;{'}'}<br/>
        {'}'}
      </>
    ),
    worklog: [
        { time: "09:00 AM - Current", title: "Feature Implementation", desc: "Writing core logic for the authentication module.", type: "Productive" },
        { time: "08:30 AM - 09:00 AM", title: "Daily Standup", desc: "Video call via Slack.", type: "Meeting" }
    ]
  },
  { 
    id: 2, 
    name: "John Wick", 
    role: "Security", 
    status: "online", 
    app: "Terminal",
    initials: "JW",
    color: "purple",
    efficiency: 92,
    timeTracked: "6h 10m",
    aiSummary: "Security audit in progress. Constant terminal activity detected. No anomalies found in access logs.",
    liveViewType: "terminal",
    liveContent: (
      <>
        <span className="text-green-500">root@trac-ai:~#</span> tail -f /var/log/auth.log<br/>
        <span className="text-gray-400">May 20 10:23:01</span> sshd[123]: Accepted publickey for user<br/>
        <span className="text-gray-400">May 20 10:24:15</span> sudo: pam_unix(sudo:session): session opened<br/>
        <span className="text-green-500">root@trac-ai:~#</span> ./run-diagnostics.sh --full<br/>
        <span className="text-blue-400">[INFO]</span> Scanning network interfaces...<br/>
        <span className="text-blue-400">[INFO]</span> 0 vulnerabilities detected.<br/>
        <span className="text-green-500 animate-pulse">_</span>
      </>
    ),
    worklog: [
        { time: "11:00 AM - Current", title: "System Audit", desc: "Running penetration testing scripts.", type: "Productive" },
        { time: "09:00 AM - 11:00 AM", title: "Log Review", desc: "Analyzing server access logs from previous night.", type: "Productive" }
    ]
  },
  { 
    id: 3, 
    name: "Ellen Ripley", 
    role: "Ops", 
    status: "idle", 
    app: "Slack",
    initials: "ER",
    color: "orange",
    efficiency: 78,
    timeTracked: "3h 45m",
    aiSummary: "User has been idle for 12 minutes. Previous activity was focused on communication via Slack.",
    liveViewType: "idle",
    liveContent: (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Lock className="w-12 h-12 text-muted-foreground mb-2" />
            <div className="text-lg font-bold text-muted-foreground">Screen Locked</div>
            <div className="text-xs font-mono text-muted-foreground/50">Last Active: 12m ago</div>
        </div>
    ),
    worklog: [
        { time: "10:15 AM - 10:30 AM", title: "Team Sync", desc: "Discussion on deployment schedule.", type: "Meeting" },
        { time: "09:00 AM - 10:00 AM", title: "Email Triage", desc: "Clearing support tickets.", type: "Productive" }
    ]
  },
  { 
    id: 4, 
    name: "Marty McFly", 
    role: "Design", 
    status: "offline", 
    app: "-",
    initials: "MM",
    color: "gray",
    efficiency: 0,
    timeTracked: "0h 00m",
    aiSummary: "User is currently offline. No activity recorded for today.",
    liveViewType: "offline",
    liveContent: (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
            <Monitor className="w-12 h-12 text-muted-foreground mb-2" />
            <div className="text-lg font-bold text-muted-foreground">Offline</div>
            <div className="text-xs font-mono text-muted-foreground/50">Last Seen: Yesterday</div>
        </div>
    ),
    worklog: []
  },
];

export function TrackerDashboardPreview() {
  const [selectedUserId, setSelectedUserId] = useState(1);
  const selectedUser = USERS.find(u => u.id === selectedUserId) || USERS[0];

  return (
    <section className="py-24 bg-background overflow-hidden border-t-2 border-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
           <h2 className="text-4xl sm:text-5xl font-black font-poppins uppercase leading-none mb-6">
              Centralized <span className="text-primary">Command.</span>
            </h2>
            <p className="text-xl font-mono text-muted-foreground max-w-2xl mx-auto">
              Manage your entire distributed workforce from one dashboard. Live streams, AI insights, and real-time logs, accessible from anywhere.
            </p>
        </div>

        {/* Command Center Window */}
        <div className="relative max-w-6xl mx-auto bg-background border-2 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] rounded-xl flex flex-col md:flex-row min-h-[600px] md:h-[700px] overflow-hidden">
            
            {/* Sidebar: Team Status */}
            <div className="w-full md:w-64 bg-muted/30 border-b-2 md:border-b-0 md:border-r-2 border-foreground flex flex-col relative">
                <div className="p-4 border-b-2 border-foreground bg-foreground text-background shrink-0 flex justify-between items-center">
                    <h3 className="font-mono font-bold uppercase text-xs tracking-widest">Team Status</h3>
                </div>
                
                {/* Scrollable list: Compact Avatars on mobile, Cards on PC */}
                <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-4 md:p-2 gap-4 md:gap-2 custom-scrollbar shrink-0 md:flex-1 scrollbar-hide snap-x snap-mandatory">
                    {USERS.map((user) => (
                        <div 
                            key={user.id} 
                            onClick={() => setSelectedUserId(user.id)}
                            className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-1 cursor-pointer transition-all shrink-0 snap-center ${
                                selectedUserId === user.id 
                                ? 'md:border-primary md:bg-primary/10 md:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] md:translate-x-1' 
                                : 'md:border-transparent md:hover:border-foreground/20 md:hover:bg-muted/50'
                            } md:border-2 md:p-3 md:rounded md:min-w-0`}
                        >
                            {/* Mobile Avatar View */}
                            <div className="relative md:hidden flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                                    selectedUserId === user.id 
                                    ? 'border-primary bg-primary/20 scale-110 shadow-md ring-2 ring-primary/20' 
                                    : 'border-foreground/20 bg-muted'
                                }`}>
                                    {user.initials}
                                </div>
                                <div className={`absolute bottom-4 right-0 w-3 h-3 rounded-full border-2 border-background ${
                                    user.status === 'online' ? 'bg-green-500 animate-pulse' : user.status === 'idle' ? 'bg-orange-500' : 'bg-gray-400'
                                }`} />
                                <span className={`mt-1 font-mono text-[10px] font-bold uppercase truncate max-w-[60px] text-center ${selectedUserId === user.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {user.name.split(' ')[0]}
                                </span>
                            </div>

                            {/* Desktop Card View */}
                            <div className="hidden md:flex flex-col w-full">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold font-mono text-sm truncate">{user.name}</span>
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${user.status === 'online' ? 'bg-green-500 animate-pulse' : user.status === 'idle' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                </div>
                                <div className="flex justify-between w-full text-[10px] text-muted-foreground uppercase font-bold">
                                    <span>{user.role}</span>
                                    <span>{user.app}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 border-t-2 border-foreground bg-muted/50 hidden md:block">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Global Efficiency</div>
                    <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div className="w-[84%] h-full bg-green-500" />
                    </div>
                </div>
            </div>

            {/* Main Content: Deep Dive */}
            <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
                
                {/* User Header */}
                <div className="h-14 border-b-2 border-foreground flex items-center justify-between px-6 bg-background">
                    <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-background border border-foreground ${
                             selectedUser.color === 'primary' ? 'bg-primary' : 
                             selectedUser.color === 'purple' ? 'bg-purple-600' : 
                             selectedUser.color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'
                         }`}>
                             {selectedUser.initials}
                        </div>
                         <div>
                            <div className="font-bold font-mono text-sm flex items-center gap-2">
                                {selectedUser.name} 
                                {selectedUser.status === 'online' && (
                                    <span className="text-green-600 text-[10px] uppercase border border-green-600 px-1 rounded animate-pulse">Live</span>
                                )}
                            </div>
                         </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedUser.timeTracked}</span>
                        {selectedUser.efficiency > 0 && (
                             <span className="flex items-center gap-1 text-primary"><Sparkles className="w-3 h-3" /> AI Active</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedUser.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Live Stream Section */}
                            <div className="mb-8">
                                <div className="flex justify-between items-end mb-2">
                                    <h4 className="font-black font-poppins uppercase text-lg flex items-center gap-2">
                                        <Video className="w-5 h-5" /> Live View
                                    </h4>
                                    {selectedUser.status === 'online' && (
                                        <span className="text-[10px] font-mono bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">REC</span>
                                    )}
                                </div>
                                <div className="relative aspect-video bg-black border-2 border-foreground rounded-lg overflow-hidden group shadow-lg">
                                    {selectedUser.status === 'online' && (
                                        <motion.div 
                                            className="absolute top-0 left-0 w-full h-1 bg-green-500/50 z-20 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                            animate={{ top: ["0%", "100%"] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        />
                                    )}
                                    
                                    <div className="absolute inset-0 p-4 font-mono text-xs text-green-500/80 leading-relaxed overflow-hidden">
                                        {selectedUser.liveContent}
                                    </div>

                                    {selectedUser.status === 'online' && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 flex justify-between items-center border-t border-white/10 backdrop-blur-sm">
                                            <div className="flex gap-4 text-white/80 text-[10px] font-mono">
                                                <span className="flex items-center gap-1"><AppWindow className="w-3 h-3" /> {selectedUser.app}</span>
                                                <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" /> Activity: High</span>
                                            </div>
                                            <div className="text-green-400 text-[10px] font-bold">Latency: 24ms</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI Daily Summary */}
                            <div className="mb-8 bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                                <h4 className="font-bold font-poppins uppercase text-sm mb-2 flex items-center gap-2 text-primary">
                                    <Sparkles className="w-4 h-4" /> AI Daily Insight
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedUser.aiSummary} <br/>
                                    {selectedUser.efficiency > 0 && (
                                        <span className="font-bold text-foreground mt-2 block">Productivity Score: {selectedUser.efficiency}/100</span>
                                    )}
                                </p>
                            </div>

                            {/* Timeline Worklog */}
                            <div>
                                <h4 className="font-black font-poppins uppercase text-lg mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Worklog Stream
                                </h4>
                                <div className="space-y-0 relative border-l-2 border-foreground/10 ml-2">
                                    {selectedUser.worklog.length > 0 ? (
                                        selectedUser.worklog.map((log, index) => (
                                            <div key={index} className="relative pl-6 pb-6">
                                                <div className={`absolute -left-[5px] top-0 w-3 h-3 rounded-full border border-background ${
                                                    log.type === 'Productive' ? 'bg-green-500' : 'bg-blue-500'
                                                }`} />
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold font-mono text-primary">{log.time}</span>
                                                    <span className={`text-[10px] font-bold uppercase px-1 rounded border ${
                                                        log.type === 'Productive' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                                    }`}>{log.type}</span>
                                                </div>
                                                <div className="bg-background border border-foreground/20 p-3 rounded shadow-sm">
                                                    <div className="font-bold text-sm mb-1">{log.title}</div>
                                                    <p className="text-xs text-muted-foreground mb-2">{log.desc}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="pl-6 text-sm text-muted-foreground italic">No logs recorded yet.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
