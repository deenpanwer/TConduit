'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, ShieldCheck } from 'lucide-react';

const initialEmployees = [
  { name: "Deen Panwer", email: "deenpanwer@gmail.com", role: "Dev Lead", os: "Windows_NT 10.0", date: "Jan 29, 2026", ip: "68.166.184.55", photo: "https://lh3.googleusercontent.com/a/ACg8ocLZLwJYLJDy3PkVyYfhub8bjEtWIkv8bGuIVaAlBhmNS5aOfw=s96-c" },
  { name: "Sarah Chen", email: "sarah.c@trac.ai", role: "Senior Engineer", os: "Darwin 23.2.0", date: "Jan 12, 2026", ip: "142.250.190.46", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  { name: "Alex Rivera", email: "alex.r@trac.ai", role: "UI Designer", os: "Windows_NT 11.0", date: "Jan 05, 2026", ip: "82.158.18.90", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
];

export const WorkforceRegistry = ({ employees = [] }: { employees?: any[] }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);

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
    <tr className="animate-pulse">
        <td className="px-8 py-6 rounded-l-[2.5rem] bg-muted/20 border-y border-l border-border/50">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-muted" />
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted/50 rounded" />
                </div>
            </div>
        </td>
        <td className="px-8 py-6 bg-muted/20 border-y border-border/50">
            <div className="h-4 w-20 bg-muted rounded mb-2" />
            <div className="h-3 w-16 bg-muted/50 rounded" />
        </td>
        <td className="px-8 py-6 bg-muted/20 border-y border-border/50">
            <div className="h-4 w-32 bg-muted rounded mb-2" />
            <div className="h-2 w-16 bg-muted/50 rounded" />
        </td>
        <td className="px-8 py-6 bg-muted/20 border-y border-border/50">
            <div className="h-4 w-24 bg-muted rounded" />
        </td>
        <td className="px-8 py-6 rounded-r-[2.5rem] bg-muted/20 border-y border-r border-border/50 text-right">
            <div className="h-10 w-24 bg-muted rounded-2xl ml-auto" />
        </td>
    </tr>
  );

  return (
    <div className="mt-24">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Workforce Ledger</h2>
          <p className="text-gray-400 mt-2 text-[10px] font-black font-poppins uppercase tracking-[0.25em] italic">Full activity audit for all connected personnel</p>
        </div>
        <button className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-500">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      <div className="overflow-x-auto pb-10 custom-scrollbar">
        <table className="w-full border-separate border-spacing-y-4 min-w-[600px] md:min-w-full">
          <thead>
            <tr className="text-left">
              <th className="px-4 md:px-8 py-4 text-[11px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400">Identity</th>
              <th className="hidden md:table-cell px-8 py-4 text-[11px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400">Position & System</th>
              <th className="px-4 md:px-8 py-4 text-[11px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400">Status</th>
              <th className="hidden lg:table-cell px-8 py-4 text-[11px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400">Network ID</th>
              <th className="px-4 md:px-8 py-4 text-[11px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : (
                items.map((emp, i) => (
                    <motion.tr 
                        key={`${emp.id}-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % 5) * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/5 rounded-[2rem] group cursor-default shadow-sm"
                    >
                        <td className="px-4 md:px-8 py-6 rounded-l-[2rem] md:rounded-l-[2.5rem]">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-500 bg-muted/20 shrink-0">
                                    <img src={emp.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.email}`} className="w-full h-full object-cover" alt={emp.name} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black font-poppins text-gray-900 dark:text-white tracking-tight leading-none mb-1 md:mb-1.5 truncate">{emp.name}</p>
                                    <p className="text-[10px] md:text-[11px] font-medium text-gray-400 font-poppins truncate">{emp.email}</p>
                                    {/* Mobile only role indicator */}
                                    <p className="md:hidden text-[9px] font-black text-blue-500 uppercase mt-1 tracking-tighter">{emp.role || "Staff"}</p>
                                </div>
                            </div>
                        </td>
                        <td className="hidden md:table-cell px-8 py-6">
                            <p className="text-sm font-black font-poppins text-gray-800 dark:text-gray-200 leading-none mb-1.5">{emp.role || "Staff"}</p>
                            <p className="text-[10px] text-blue-500 font-black uppercase font-poppins tracking-tighter">{emp.lastLoginOs || "Unknown OS"}</p>
                        </td>
                        <td className="px-4 md:px-8 py-6">
                            <p className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 leading-none mb-2 truncate max-w-[120px]">
                                {emp.heartbeat?.lastActiveWindow || "Idle"}
                            </p>
                            <div className="flex items-center">
                                <div className="flex space-x-0.5 items-end h-3 mr-2">
                                    {[0.4, 0.7, 0.3, 0.9, 0.5].map((h, j) => (
                                        <motion.div 
                                            key={j}
                                            animate={emp.heartbeat?.isCurrentlyRunning ? { height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] } : { height: "20%" }}
                                            transition={{ repeat: Infinity, duration: 1 + h, ease: "easeInOut" }}
                                            className={`w-0.5 rounded-full ${emp.heartbeat?.isCurrentlyRunning ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${emp.heartbeat?.isCurrentlyRunning ? "text-emerald-500" : "text-gray-400"}`}>
                                    {emp.heartbeat?.isCurrentlyRunning ? "Live" : "Offline"}
                                </p>
                            </div>
                        </td>
                        <td className="hidden lg:table-cell px-8 py-6">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${emp.heartbeat?.isCurrentlyRunning ? "bg-blue-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"}`} />
                                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 tracking-tighter">{emp.lastLoginIpAddress || "0.0.0.0"}</span>
                            </div>
                        </td>
                        <td className="px-4 md:px-8 py-6 text-right rounded-r-[2rem] md:rounded-r-[2.5rem]">
                            <button 
                                onClick={() => window.location.href = `/dashboard/team/${emp.id}`}
                                className="px-4 md:px-6 py-2 md:py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-500 active:scale-95"
                            >
                                <span className="hidden sm:inline">View Pulse</span>
                                <span className="sm:hidden">Pulse</span>
                            </button>
                        </td>
                    </motion.tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12 pb-20">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-12 py-4 rounded-[2rem] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-xl text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-500 hover:border-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Decrypting Records..." : "Load Additional Data"}
          </button>
        </div>
      )}
    </div>
  );
};
