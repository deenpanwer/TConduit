'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, ShieldCheck, Zap, Mail, Globe, Monitor, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUserAvatar } from '@/lib/utils';

export const WorkforceRegistry = ({ employees = [] }: { employees?: any[] }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const items = employees.slice(0, visibleCount);
  const hasMore = visibleCount < employees.length;

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 5);
      setLoading(false);
    }, 800);
  };

  const SkeletonRow = () => (
    <div className="w-full h-24 bg-card/50 border border-border rounded-[2rem] animate-pulse mb-4" />
  );

  return (
    <div className="mt-24 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Team Directory</h2>
          <p className="text-gray-400 mt-2 text-[10px] font-black font-poppins uppercase tracking-[0.25em] italic">Personnel registry and real-time status audit</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center px-4 py-2 rounded-2xl bg-secondary/50 border border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">Active Members:</span>
                <span className="text-sm font-black text-primary">{employees.length}</span>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {employees.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
            items.map((emp, i) => (
                <motion.div 
                    key={`${emp.id}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 5) * 0.05 }}
                    onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                    className="group relative bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/5 rounded-[2rem] p-4 md:p-6 cursor-pointer shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-500 overflow-hidden"
                >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        {/* Identity Cluster */}
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="size-12 md:size-14 rounded-2xl overflow-hidden relative z-10 border-2 border-background shadow-lg transition-transform duration-700 group-hover:scale-110 bg-muted/20">
                                    <img src={getUserAvatar(emp)} className="w-full h-full object-cover" alt={emp.name} />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card z-20 ${emp.heartbeat?.isCurrentlyRunning ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-lg tracking-tighter uppercase leading-none mb-1.5 group-hover:text-primary transition-colors whitespace-nowrap">{emp.name}</h4>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest whitespace-nowrap">{emp.role || "Staff Member"}</span>
                                    <span className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{emp.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Cluster */}
                        <div className="flex flex-1 items-center gap-8 px-2 md:px-0">
                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                    <Monitor size={10} />
                                    <span className="truncate">{emp.lastLoginOs || "Unknown System"}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-none truncate group-hover:translate-x-1 transition-transform">
                                    {emp.heartbeat?.lastActiveWindow || "Standby Mode"}
                                </p>
                            </div>

                            <div className="hidden lg:flex flex-col items-end gap-1.5 w-32">
                                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <Globe size={10} />
                                    <span>Network ID</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 tracking-tighter">{emp.lastLoginIpAddress || "0.0.0.0"}</span>
                            </div>
                        </div>

                        {/* Action Cluster */}
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-border/50">
                            <div className="flex items-center">
                                <div className="flex space-x-0.5 items-end h-4 mr-3">
                                    {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, j) => (
                                        <motion.div 
                                            key={j}
                                            animate={emp.heartbeat?.isCurrentlyRunning ? { height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] } : { height: "20%" }}
                                            transition={{ repeat: Infinity, duration: 1 + h, ease: "easeInOut" }}
                                            className={`w-0.5 rounded-full ${emp.heartbeat?.isCurrentlyRunning ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${emp.heartbeat?.isCurrentlyRunning ? "text-emerald-500" : "text-gray-400"}`}>
                                    {emp.heartbeat?.isCurrentlyRunning ? "Live" : "Offline"}
                                </p>
                            </div>
                            
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12 pb-20">
          <button 
            onClick={(e) => { e.stopPropagation(); loadMore(); }}
            disabled={loading}
            className="px-12 py-4 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-xl text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-500 hover:border-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Syncing Directory..." : "Load Additional Personnel"}
          </button>
        </div>
      )}
    </div>
  );
};