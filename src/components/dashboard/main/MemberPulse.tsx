'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Activity, 
  Globe, 
  Calendar, 
  Mail, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { GlassCard } from './shared/GlassCard';
import { HoverShimmer } from './shared/Shimmer';

interface MetricProps {
  icon: any;
  label: string;
  value: string | number;
}

const MetricBox = ({ icon: Icon, label, value }: MetricProps) => (
  <div className="flex flex-col p-6 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
    <HoverShimmer />
    <div className="flex items-center space-x-3 mb-4 relative z-10">
      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400">{label}</span>
    </div>
    <div className="flex items-baseline relative z-10">
      <span className="text-3xl font-black font-poppins text-gray-900 dark:text-white leading-none tracking-tighter-custom">{value}</span>
    </div>
  </div>
);

export const MemberPulse = ({ employee }: { employee: any }) => {
  if (!employee) return null;

  const isOnline = employee.heartbeat?.isCurrentlyRunning;

  return (
    <div className="space-y-12">
      {/* HUB 1: MEMBER COCKPIT (The Hero) */}
      <GlassCard elevated className="p-12 relative overflow-hidden group" hoverEffect={false}>
        {/* Background depth effect */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-16 relative z-10">
          {/* Hub 1: Identity */}
          <div className="flex items-center space-x-12">
            <div className="relative">
              <div className={`absolute -inset-2 rounded-[4rem] blur-xl opacity-20 ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
              <div className="w-44 h-44 rounded-[3.5rem] bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-2xl border-2 border-white/20 relative overflow-hidden group/avatar">
                {employee.photoUrl ? (
                  <img src={employee.photoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" alt={employee.name} />
                ) : (
                  <Users className="w-20 h-20 text-gray-400" />
                )}
                <div className={`absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-white dark:border-[#111113] z-20 ${isOnline ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`} />
              </div>
            </div>
            
            <div className="h-32 w-px bg-gray-100 dark:bg-gray-800 hidden lg:block" />
            
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-[10px] font-black font-poppins text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {isOnline ? 'Live Signal Active' : 'Offline / Node Disconnected'}
                </span>
              </div>
              
              <h1 className="text-7xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter leading-[0.85] uppercase">
                {employee.name.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i === 0 ? "block" : "block text-blue-500"}>{word}</span>
                ))}
              </h1>
              
              <div className="mt-8 flex flex-col space-y-2">
                <div className="flex items-center space-x-3 text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest">{employee.role || 'Member'}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{employee.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Joined Jan 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hub 2: Member Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6 flex-1 lg:pl-12">
            <MetricBox icon={Zap} label="Today's Yield" value={`${employee.hoursToday || '0.0'}h`} />
            <MetricBox icon={Clock} label="Total Yield" value={`${employee.totalHours || '0.0'}h`} />
            <MetricBox icon={Globe} label="Region" value={employee.lastLoginLocation?.city || 'Remote'} />
            <MetricBox icon={Activity} label="Status" value={isOnline ? 'Peak' : 'Inactive'} />
          </div>
        </div>
      </GlassCard>
      
      {/* ... Rest of components will be added here one by one ... */}
    </div>
  );
};
