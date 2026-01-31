"use client";

import { format } from "date-fns";
import { Folder, Clock, Hash, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkHistoryProps {
  timeEntries: any[];
}

export function WorkHistory({ timeEntries }: WorkHistoryProps) {
  // Sort entries by startTime descending
  const sorted = [...timeEntries].sort((a, b) => 
    (b.startTime?.toDate?.()?.getTime() || 0) - (a.startTime?.toDate?.()?.getTime() || 0)
  );

  if (timeEntries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-full mb-10" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-secondary/20 rounded-[2rem] border border-transparent" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Engagement Log</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chronological activity clusters</p>
        </div>
        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
            <Hash size={20} />
        </div>
      </div>

      <div className="space-y-4">
        {sorted.length === 0 ? (
            <div className="py-20 text-center space-y-4">
                <div className="size-16 bg-secondary rounded-3xl mx-auto flex items-center justify-center border border-dashed border-border">
                    <Clock className="text-muted-foreground" size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No sessions tracked today</p>
            </div>
        ) : (
            sorted.map((entry, idx) => (
                <div key={idx} className="group flex items-center gap-6 p-5 rounded-[2rem] bg-secondary/20 border border-transparent hover:border-primary/20 hover:bg-secondary/40 transition-all">
                    {/* Time Column */}
                    <div className="flex flex-col items-center justify-center size-16 rounded-2xl bg-background border border-border shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-primary uppercase">
                            {entry.startTime?.toDate ? format(entry.startTime.toDate(), 'HH:mm') : '--:--'}
                        </span>
                        <div className="w-0.5 h-3 bg-muted-foreground/20 my-1" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase">
                            {entry.endTime?.toDate ? format(entry.endTime.toDate(), 'HH:mm') : '--:--'}
                        </span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/5 text-primary border border-primary/10 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                {entry.projectName || "General"}
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                <Clock size={10} /> {Math.floor(entry.duration / 60)}m {entry.duration % 60}s
                            </span>
                        </div>
                        <h4 className="text-sm font-bold truncate uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                            {entry.description || "Activity focused on environment."}
                        </h4>
                    </div>

                    {/* Action Column */}
                    <button className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0">
                        <ChevronRight size={18} />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
