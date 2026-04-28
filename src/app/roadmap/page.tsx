"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Rocket, ArrowRight } from "lucide-react";
import roadmapData from "@/lib/roadmap-data.json";

const statusIcons: Record<string, any> = {
  "Done": <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  "In Progress": <Clock className="w-5 h-5 text-blue-500" />,
  "Planned": <Circle className="w-5 h-5 text-slate-400" />,
};

const priorityColors: Record<string, string> = {
  "High": "bg-rose-500/10 text-rose-500 border-rose-500/20",
  "Medium": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Low": "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Rocket className="w-3 h-3" />
            Product Roadmap
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Building the Future of <span className="text-primary font-serif italic">Talent</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
            Our vision for the next 12 months. Focus on AI, automation, and seamless founder-talent connections.
          </p>
        </motion.div>

        <div className="space-y-8">
          {roadmapData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative pl-8 pb-8 border-l border-slate-200 dark:border-slate-800 last:pb-0"
            >
              <div className="absolute left-[-9px] top-0 p-1 bg-background">
                {statusIcons[item.status] || <Circle className="w-4 h-4 text-slate-300" />}
              </div>
              
              <div className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary tracking-widest uppercase">
                      {item.quarter}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded-full ${priorityColors[item.priority]}`}>
                      {item.priority} Priority
                    </span>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {item.status}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                
                <div className="mt-6 flex items-center gap-1 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
