'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Activity, Globe, Target, Calendar } from 'lucide-react';
import { GlassCard } from './shared/GlassCard';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface MetricProps {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
}

const MetricBox = ({ icon: Icon, label, value, subValue }: MetricProps) => (
  <div className="flex flex-col p-4 md:p-6 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden h-full min-w-0">
    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/cockpit:opacity-100 transition-opacity duration-1000">
        <motion.div
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            animate={ { x: ['-100%', '100%'] } }
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-12"
        />
    </div>
    
    <div className="flex items-center space-x-3 mb-3 relative z-10">
      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">{label}</span>
    </div>
    <div className="flex flex-col relative z-10 mt-auto min-w-0">
      <span className="text-lg md:text-xl xl:text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter truncate">{value}</span>
      {subValue && <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 break-words leading-relaxed line-clamp-1">{subValue}</span>}
    </div>
  </div>
);

export const OwnerCockpit = ({ orgName = "TRAC STUDIO", ownerData = null as any, stats = null as any, logoUrl = null as string | null }) => {
  const isOrgActive = (stats?.activeEmployees || 0) > 0;
  const router = useRouter();
  
  const getDate = (ts: any) => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const memberSince = format(getDate(ownerData?.createdAt), 'MMMM dd, yyyy');
  const primaryApp = stats?.topApps?.[0]?.name || "Analytics";

  return (
    <GlassCard elevated className="mb-12 p-6 md:p-12 relative overflow-hidden group/cockpit" hoverEffect={false}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-8 md:gap-10 2xl:gap-16 relative z-10">
        {/* Hub 1: Identity */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 shrink-0">
          <div 
            onClick={() => router.push('/dashboard/settings')}
            className="relative group/avatar cursor-pointer"
          >
            <div className={`absolute -inset-2 rounded-[4rem] blur-xl opacity-20 ${isOrgActive ? 'bg-emerald-500' : 'bg-blue-500'} group-hover/cockpit:opacity-40 transition-opacity duration-700`} />
            <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="w-28 h-28 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 flex items-center justify-center shadow-2xl border-2 border-white/20 relative overflow-hidden"
            >
                {logoUrl || ownerData?.photoUrl ? (
                  <img src={logoUrl || ownerData?.photoUrl} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt={orgName} />
                ) : (
                  <div className="w-full h-full bg-black/20 animate-pulse" />
                )}
            </motion.div>
            <div className={`absolute -bottom-1 -right-1 size-5 rounded-full border-4 border-card z-20 ${isOrgActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`} />
          </div>
          <div className="h-20 w-px bg-gray-100 dark:bg-gray-800 hidden md:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isOrgActive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                        {isOrgActive ? `Live: ${stats.activeEmployees} Personnel Active` : 'Organization Standby'}
                    </span>
                </div>
            </div> 
            <h1 className="text-3xl md:text-6xl 2xl:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.85] uppercase break-words max-w-[300px] md:max-w-none">
              {orgName.split(' ').map((word, i) => (
                <span key={i} className={i === 0 ? "block" : "block text-blue-500"}>{word}</span>
              ))}
            </h1>
            <div className="mt-6 flex items-center space-x-4 group/owner">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Account Authority</span>
                <span className="text-xs md:text-sm font-black text-gray-900 dark:text-white transition-colors duration-300">
                    {ownerData?.role || "Founder"}: {ownerData?.name || "System Admin"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hub 2: High-Density Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-5 flex-1 w-full">
          <MetricBox 
            icon={Users} 
            label="Workforce Total" 
            value={stats?.totalStaff || 0} 
            subValue="Registered Staff"
          />
          <MetricBox 
            icon={Clock} 
            label="Daily Output" 
            value={`${stats?.totalHoursToday || 0}h`} 
            subValue={`${stats?.totalOrgHours || 0}h Organization Total`}
          />
          <MetricBox 
            icon={Activity} 
            label="Live Operations" 
            value={stats?.activeEmployees || 0} 
            subValue="On-Shift Now"
          />
          <MetricBox 
            icon={Target} 
            label="Daily Top App" 
            value={primaryApp} 
            subValue="Most Used Today"
          />
          <MetricBox 
            icon={Globe} 
            label="Principal Region" 
            value={ownerData?.lastLoginLocation?.city || "Remote"} 
            subValue={ownerData?.lastLoginLocation?.country || "Global"}
          />
          <MetricBox 
            icon={Calendar} 
            label="Member Since" 
            value={memberSince} 
            subValue="Original Commission"
          />
        </div>
      </div>
    </GlassCard>
  );
};