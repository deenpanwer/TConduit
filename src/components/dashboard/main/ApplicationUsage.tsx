'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './shared/GlassCard';
import { Target, Code, Figma, Mail, MessageSquare, Terminal, Globe as ChromeIcon } from 'lucide-react';

const getAppIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('vscode') || n.includes('code')) return Code;
  if (n.includes('figma')) return Figma;
  if (n.includes('slack') || n.includes('message')) return MessageSquare;
  if (n.includes('terminal') || n.includes('iterm')) return Terminal;
  if (n.includes('chrome') || n.includes('browser')) return ChromeIcon;
  return Target;
};

export const ApplicationUsage = ({ apps = [] }: { apps?: any[] }) => {
  const displayApps = apps.length > 0 ? apps : [
    { name: "No Data", hours: 0, percentage: 0 }
  ];

  return (
    <GlassCard className="p-10 flex flex-col h-full" hoverEffect={false}>
      <div className="flex items-center space-x-3 mb-10">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/10">
          <Code className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black font-poppins text-gray-900 dark:text-white uppercase tracking-tight">Resource Composition</h3>
      </div>

      <div className="space-y-8 flex-1">
        {displayApps.map((app, i) => {
          const Icon = getAppIcon(app.name);
          return (
            <div key={app.name} className="group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black font-poppins text-gray-900 dark:text-white uppercase tracking-tighter truncate max-w-[120px] block">{app.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{app.hours} Hours Today</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-blue-500 font-poppins uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {app.percentage}%
                </span>
              </div>
              
              <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${app.percentage}%` }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                  className="h-full rounded-full bg-blue-500 relative z-10"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-10 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-[10px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400 hover:text-blue-500 hover:border-blue-500/20 transition-all duration-500 active:scale-95">
        Detailed Resource Audit
      </button>
    </GlassCard>
  );
};
