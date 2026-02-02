'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './shared/GlassCard';
import { Target, Code, Figma, Mail, MessageSquare, Terminal, Globe as ChromeIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shimmer } from './shared/Shimmer';

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
  const [showAudit, setShowAudit] = React.useState(false);
  
  const displayApps = apps.length > 0 ? apps : [
    { name: "No Data", hours: 0, percentage: 0 }
  ];

  return (
    <>
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

        <button 
          onClick={() => setShowAudit(true)}
          className="w-full mt-10 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-[10px] font-black font-poppins uppercase tracking-[0.2em] text-gray-400 hover:text-blue-500 hover:border-blue-500/20 transition-all duration-500 active:scale-95"
        >
          Detailed Resource Audit
        </button>
      </GlassCard>

      <Dialog open={showAudit} onOpenChange={setShowAudit}>
        <DialogContent className="max-w-3xl w-[95vw] md:w-full bg-card border-border rounded-[2rem] md:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 md:p-8 border-b bg-card shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary hidden sm:block">
                    <Target size={20} />
                </div>
                <div className="text-left">
                    <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter">Application Intelligence</DialogTitle>
                    <DialogDescription className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Granular resource allocation audit</DialogDescription>
                </div>
            </div>
          </DialogHeader>

          <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[400px]">
                        <thead>
                            <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <th className="px-6 md:px-8 py-4 md:py-5">Application</th>
                                <th className="px-6 md:px-8 py-4 md:py-5">Daily Yield</th>
                                <th className="px-6 md:px-8 py-4 md:py-5 text-right">Saturation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {displayApps.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 md:px-8 py-5 md:py-6"><Shimmer className="h-4 w-32 rounded-full" /></td>
                                        <td className="px-6 md:px-8 py-5 md:py-6"><Shimmer className="h-4 w-20 rounded-full" /></td>
                                        <td className="px-6 md:px-8 py-5 md:py-6 text-right"><Shimmer className="h-4 w-12 rounded-full ml-auto" /></td>
                                    </tr>
                                ))
                            ) : (
                                displayApps.map((app, i) => (
                                    <motion.tr 
                                        key={app.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-muted/20 transition-colors group"
                                    >
                                        <td className="px-6 md:px-8 py-5 md:py-6">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="p-2 rounded-xl bg-secondary border border-border group-hover:scale-110 transition-transform shrink-0">
                                                    {React.createElement(getAppIcon(app.name), { size: 14, className: "text-primary" })}
                                                </div>
                                                <span className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">{app.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 md:py-6">
                                            <span className="text-sm font-bold font-mono">{app.hours}h</span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 md:py-6 text-right">
                                            <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black border border-primary/10">
                                                {app.percentage}%
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
