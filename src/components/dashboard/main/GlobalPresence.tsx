'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { useTheme } from 'next-themes';
import { Globe, MapPin, Users, X, Maximize2 } from 'lucide-react';
import { GlassCard } from './shared/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

export const GlobalPresence = ({ employees = [] }: { employees?: any[] }) => {
  const { theme } = useTheme();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const isDark = theme === 'dark';

  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      const country = emp.lastLoginLocation?.country;
      if (country) {
        counts[country] = (counts[country] || 0) + 1;
      }
    });
    return counts;
  }, [employees]);

  const activeCountriesCount = Object.keys(countryData).length;

  return (
    <GlassCard className="p-10 mb-16 relative overflow-hidden" hoverEffect={false}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 h-full min-h-[500px]">
        {/* Left Side: Text (25%) */}
        <div className="lg:col-span-1 flex flex-col justify-between z-20 relative bg-card/80 backdrop-blur-sm pr-4">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/10">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-black font-poppins text-gray-900 dark:text-white uppercase tracking-tight leading-none">Global Coverage</h3>
            </div>
            <p className="text-gray-400 text-xs font-bold font-poppins leading-relaxed italic pr-4">
              {activeCountriesCount > 1 
                ? "Your team is spread across different countries and timezones working together." 
                : "Your team is currently focused within a single country, providing concentrated regional intelligence."}
            </p>

            <div className="mt-10 space-y-6">
              <div className="group cursor-default">
                <p className="text-[9px] font-black font-poppins uppercase tracking-[0.2em] text-blue-500 mb-1">Global Scale</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform block origin-left">{activeCountriesCount}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Countries</span>
                </div>
              </div>
              <div className="group cursor-default">
                <p className="text-[9px] font-black font-poppins uppercase tracking-[0.2em] text-blue-500 mb-1">Total Staff</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform block origin-left">{employees.length}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Members</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowExpanded(true)}
            className="mt-12 w-full p-8 px-10 rounded-[2.5rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xl relative overflow-hidden group cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-blue-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Strategic Vector</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black font-poppins uppercase tracking-tight">Expand Output</span>
                <Users className="w-5 h-5" />
              </div>
            </div>
          </button>
        </div>

        {/* Right Side: Map (75%) */}
        <div className="lg:col-span-3 relative h-full flex items-center justify-center">
          {/* Fade Effect Overlay */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
          
          <div className="w-full h-full flex items-center justify-center scale-125 md:scale-150">
            <ComposableMap projectionConfig={{ scale: 190 }} className="w-full h-full">
                <Geographies geography={geoUrl}>
                {({ geographies }) =>
                    geographies
                    .filter(geo => geo.properties.name !== "Antarctica")
                    .map((geo) => {
                        const name = geo.properties.name;
                        const count = countryData[name];
                        const isActive = count > 0;
                        
                        return (
                        <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onMouseEnter={() => isActive && setHoveredCountry(name)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            style={{
                            default: {
                                fill: isActive ? (isDark ? "#ffffff" : "#000000") : (isDark ? "#18181b" : "#f1f5f9"),
                                stroke: isDark ? "#27272a" : "#e2e8f0",
                                strokeWidth: 0.5,
                                outline: "none",
                                transition: "all 0.5s"
                            },
                            hover: {
                                fill: isActive ? "#3b82f6" : (isDark ? "#27272a" : "#e2e8f0"),
                                outline: "none",
                                cursor: isActive ? "pointer" : "default"
                            },
                            pressed: { outline: "none" }
                            }}
                        />
                        );
                    })
                }
                </Geographies>
            </ComposableMap>
          </div>

          <AnimatePresence>
            {hoveredCountry && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
              >
                <div className="bg-black shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-2xl p-6 border border-white/10 flex flex-col items-center min-w-[140px]">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{hoveredCountry}</span>
                  <span className="text-4xl font-black text-white leading-none font-poppins tracking-tighter">{countryData[hoveredCountry]}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">Staff Members</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded View Modal */}
      <Dialog open={showExpanded} onOpenChange={setShowExpanded}>
        <DialogContent className="max-w-6xl h-[90vh] bg-card border-border rounded-[3rem] p-0 overflow-hidden shadow-2xl flex flex-col">
          <div className="p-8 border-b bg-card z-30 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Our Global Team</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">See where everyone is working from</p>
            </div>
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                <Users size={14} className="text-blue-500" />
                <span className="text-xs font-black">{employees.length} Members</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
            {/* Map Area */}
            <div className="relative w-full h-[500px] bg-secondary/10 rounded-[2.5rem] mt-8 overflow-hidden border border-border/50">
              <div className="w-full h-full flex items-center justify-center scale-110">
                  <ComposableMap projectionConfig={{ scale: 180 }} className="w-full h-full">
                      <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                          geographies
                          .filter(geo => geo.properties.name !== "Antarctica")
                          .map((geo) => {
                              const name = geo.properties.name;
                              const count = countryData[name];
                              const isActive = count > 0;
                              
                              return (
                              <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  style={{
                                  default: {
                                      fill: isActive ? (isDark ? "#ffffff" : "#000000") : (isDark ? "#18181b" : "#f1f5f9"),
                                      stroke: isDark ? "#27272a" : "#e2e8f0",
                                      strokeWidth: 0.5,
                                      outline: "none",
                                  },
                                  hover: {
                                      fill: isActive ? "#3b82f6" : (isDark ? "#27272a" : "#e2e8f0"),
                                      outline: "none",
                                  },
                                  pressed: { outline: "none" }
                                  }}
                              />
                              );
                          })
                      }
                      </Geographies>
                  </ComposableMap>
              </div>
            </div>

            {/* Table Area */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Team Member List</h3>
              </div>
              
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-8 py-2">Team Member</th>
                    <th className="px-8 py-2">Location</th>
                    <th className="px-8 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <motion.tr 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group"
                    >
                      <td className="px-8 py-4 bg-muted/20 border-y border-l border-border/50 rounded-l-2xl group-hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl overflow-hidden border border-border bg-background shadow-sm">
                            <img 
                              src={emp.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.email}`} 
                              className="w-full h-full object-cover" 
                              alt={emp.name} 
                            />
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 bg-muted/20 border-y border-border/50 group-hover:bg-muted/40 transition-colors">
                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-background border border-border">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                            {emp.lastLoginLocation?.country || 'Remote'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 bg-muted/20 border-y border-r border-border/50 rounded-r-2xl text-right group-hover:bg-muted/40 transition-colors">
                        <button 
                          onClick={() => window.location.href = `/dashboard/team/${emp.id}`}
                          className="p-2.5 rounded-xl bg-background border border-border hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          <Maximize2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
};

