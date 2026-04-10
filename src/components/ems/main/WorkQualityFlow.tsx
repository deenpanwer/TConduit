'use client';

import React, { useMemo, useState, useRef } from 'react';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { ShieldCheck, User, AppWindow, RefreshCcw, Activity } from 'lucide-react';
import { GlassCard } from './shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

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
  source: any;
  target: any;
  value: number;
  width?: number;
}

interface WorkQualityFlowProps {
  data: { nodes: SankeyNode[]; links: SankeyLink[] };
  isLoading?: boolean;
}

export const WorkQualityFlow = ({ data, isLoading = false }: WorkQualityFlowProps) => {
  const [hoveredItem, setHoveredItem] = useState<{ name: string; value: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout calculation (Purely visual, no data fetching)
  const sankeyData = useMemo(() => {
    if (!data.nodes.length || !data.links.length) return { nodes: [], links: [] };
    try {
      const s = sankey<SankeyNode, SankeyLink>()
        .nodeWidth(12)
        .nodePadding(30)
        .extent([[0, 10], [1000, 440]]);
      
      // We must clone the data because d3-sankey mutates the objects
      const nodes = data.nodes.map(n => ({ ...n }));
      const links = data.links.map(l => ({ ...l }));

      return s({ nodes, links } as any);
    } catch (e) {
      console.error("Sankey Layout Error:", e);
      return { nodes: [], links: [] };
    }
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent, name: string, value: number) => {
    const xOffset = e.clientX > window.innerWidth / 2 ? -220 : 20;
    setHoveredItem({ name, value, x: e.clientX + xOffset, y: e.clientY - 20 });
  };

  if (isLoading) {
    return (
      <GlassCard className="p-10" hoverEffect={false}>
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Time Utilization</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">
              Mapping Organization Workflows...
            </p>
          </div>
          <RefreshCcw className="animate-spin text-primary" size={24} />
        </div>
        <div className="h-[450px] w-full bg-muted/10 rounded-[3rem] border border-dashed border-border/50 flex flex-col items-center justify-center relative overflow-hidden">
            <Activity className="size-16 text-muted-foreground/20 mb-4" />
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Processing global telemetry</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-10" hoverEffect={false}>
        <div className="flex justify-between items-center mb-12">
          <div>
            <h3 className="text-2xl font-black font-poppins text-gray-900 dark:text-white uppercase tracking-tighter">Time Utilization</h3>
            <p className="text-gray-400 mt-1 text-[10px] font-black font-poppins uppercase tracking-widest italic">Breakdown of the today's logged hours across team members and applications</p>
          </div>
          <div className="hidden lg:flex gap-6">
              <LegendItem color="bg-blue-500" label="Source" />
              <LegendItem color="bg-purple-500" label="Team" />
              <LegendItem color="bg-emerald-500" label="Apps" />
          </div>
        </div>

        <div className="w-full relative h-[450px]" ref={containerRef}>
          <svg width="100%" height="450" viewBox="0 0 1000 450" className="overflow-visible">
            <g fill="none" strokeOpacity="0.4">
              {sankeyData.links.map((link: any, i: number) => (
                <motion.path
                  key={i}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ duration: 1.5, delay: i * 0.01 }}
                  d={sankeyLinkHorizontal()(link as any) || undefined}
                  stroke={link.source.color || '#3b82f6'}
                  strokeWidth={Math.max(2, link.width || 0)}
                  onMouseMove={(e) => handleMouseMove(e, `${link.source.name} → ${link.target.name}`, link.value)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="hover:stroke-opacity-80 transition-all duration-500 cursor-pointer"
                />
              ))}
            </g>
            <g>
              {sankeyData.nodes.map((node: any, i: number) => (
                <g key={i} className="group/node">
                  <rect 
                    x={node.x0 || 0} y={node.y0 || 0} 
                    width={(node.x1 || 0) - (node.x0 || 0)} 
                    height={(node.y1 || 0) - (node.y0 || 0)} 
                    fill={node.color} 
                    rx={4} 
                    onMouseMove={(e) => handleMouseMove(e, node.name, node.value || 0)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group-hover/node:brightness-125 transition-all duration-300 cursor-pointer"
                  />
                  <foreignObject
                    x={(node.x0 || 0) < 300 ? (node.x1 || 0) + 12 : (node.x0 || 0) - 160}
                    y={((node.y1 || 0) + (node.y0 || 0)) / 2 - 12}
                    width="150"
                    height="24"
                    className="overflow-visible pointer-events-none"
                  >
                    <div className={`flex items-center space-x-2 ${(node.x0 || 0) < 300 ? 'justify-start' : 'justify-end'} h-full`}>
                      <span className="text-[10px] font-black font-poppins text-gray-900 dark:text-white uppercase tracking-tighter truncate opacity-60">
                        {node.name}
                      </span>
                      <span className="text-[8px] font-bold text-blue-500/50 uppercase">
                          {(node.value as number).toFixed(1)}h
                      </span>
                    </div>
                  </foreignObject>
                </g>
              ))}
            </g>
          </svg>

          <AnimatePresence>
            {hoveredItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ 
                  position: 'fixed', 
                  left: hoveredItem.x, 
                  top: hoveredItem.y,
                  zIndex: 100
                }}
                className="pointer-events-none"
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center min-w-[160px]">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 text-center">{hoveredItem.name}</span>
                  <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white tracking-tighter">{(hoveredItem.value).toFixed(1)}</span>
                      <span className="text-xs font-bold text-gray-500 uppercase">Hours</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
};

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}