'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Award, Activity, HardDrive, Globe, ShieldCheck } from 'lucide-react';
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

export const OwnerCockpit = ({ orgName = "TRAC STUDIO", ownerName = "Deen Panwer", ownerPhoto = "", stats = null as any }) => {
  return (
    <GlassCard elevated className="mb-12 p-12 relative overflow-hidden group" hoverEffect={false}>
      {/* Background depth effect */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row lg:items-center gap-16 relative z-10">
        {/* Hub 1: Identity */}
        <div className="flex items-center space-x-12">
          <div className="w-44 h-44 rounded-[3.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 flex items-center justify-center shadow-[0_25px_50px_-12px_rgba(59,130,246,0.4)] border-2 border-white/20 relative overflow-hidden group/logo">
            <motion.div 
              whileHover={{ y: 0 }}
              initial={{ y: "100%" }}
              className="absolute inset-0 bg-white/10 transition-transform duration-700" 
            />
            <ShieldCheck className="w-20 h-20 text-white drop-shadow-2xl relative z-10" />
          </div>
          
          <div className="h-32 w-px bg-gray-100 dark:bg-gray-800 hidden lg:block" />
          
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-2" />
              <span className="text-[10px] font-black font-poppins text-blue-600 dark:text-blue-400 uppercase tracking-widest">Global Operations Control</span>
            </div>
            
            <h1 className="text-7xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter leading-[0.85] uppercase">
              {orgName.split(' ').map((word, i) => (
                <span key={i} className={i === 0 ? "block" : "block text-blue-500"}>{word}</span>
              ))}
            </h1>
            
            <div className="mt-8 flex items-center space-x-4 group/owner cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-white/10 shadow-lg group-hover/owner:scale-110 transition-transform duration-500">
                {ownerPhoto ? <img src={ownerPhoto} className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Proprietor</span>
                <span className="text-sm font-black font-poppins text-gray-900 dark:text-white group-hover/owner:text-blue-500 transition-colors duration-300">{ownerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hub 2: High-Density Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 lg:pl-12">
          <MetricBox icon={Users} label="Total Staff" value={stats?.totalStaff || 0} />
          <MetricBox icon={Clock} label="Daily Output" value={`${stats?.totalHoursToday || 0}h`} />
          <MetricBox icon={Award} label="Efficiency" value={stats?.velocity > 100 ? "Optimal" : "Normal"} />
          <MetricBox icon={Activity} label="Active Nodes" value={stats?.activeEmployees || 0} />
          <MetricBox icon={HardDrive} label="Storage" value="Cloud" />
          <MetricBox icon={Globe} label="Locations" value={stats?.locationsCount || 0} />
        </div>
      </div>
    </GlassCard>
  );
};
