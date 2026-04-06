"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Mail, Phone, StickyNote, CheckSquare, 
  MessageSquare, Settings, User, PhoneCall,
  History, AlertCircle, Info, Clock, ArrowUpRight, ArrowDownRight,
  UserPlus, UserMinus, Edit, Trash2, PlusCircle
} from "lucide-react";
import { EntityHistory } from "@/hooks/use-crm-module";
import { cn, getUserAvatar } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeam } from "@/hooks/use-team";

interface ActivityTimelineProps {
  history: EntityHistory[];
}

const iconMap: Record<string, any> = {
  Note: StickyNote,
  Email: Mail,
  Call: PhoneCall,
  Task: CheckSquare,
  Comment: MessageSquare,
  System: Settings,
};

export function ActivityTimeline({ history }: ActivityTimelineProps) {
  const { employees } = useTeam();

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <History className="text-muted-foreground" size={24} />
        </div>
        <h3 className="font-bold">No activity yet</h3>
        <p className="text-sm text-muted-foreground max-w-[200px] mt-1">Activities and system updates will appear here.</p>
      </div>
    );
  }

  // Reverse history to show newest first
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const renderDetails = (item: EntityHistory) => {
    if (!item.details || Object.keys(item.details).length === 0) return null;

    if (item.type === 'Call') {
      return (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-2 rounded-xl bg-secondary/30 border border-border/10 flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
            <Badge variant="secondary" className={cn(
              "text-[9px] font-bold uppercase w-fit px-1.5 h-4",
              item.details.status === 'completed' && "bg-green-500/10 text-green-500 border-green-500/20",
              item.details.status === 'busy' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
              item.details.status === 'no-answer' && "bg-red-500/10 text-red-500 border-red-500/20",
              item.details.status === 'failed' && "bg-red-500/10 text-red-500 border-red-500/20",
              item.details.status === 'initiated' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
            )}>
              {item.details.status}
            </Badge>
          </div>
          <div className="p-2 rounded-xl bg-secondary/30 border border-border/10 flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Duration</span>
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <Clock size={10} className="text-muted-foreground" />
              {item.details.duration}s
            </div>
          </div>
          <div className="p-2 rounded-xl bg-secondary/30 border border-border/10 flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Direction</span>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
              {item.details.type === 'Incoming' ? <ArrowDownRight size={10} className="text-green-500" /> : <ArrowUpRight size={10} className="text-purple-500" />}
              {item.details.type}
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'System') {
        return (
            <div className="mt-2 space-y-1.5">
                {Object.entries(item.details).map(([key, value]) => {
                    if (key === 'lastInteraction') return null;
                    return (
                        <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/20 border border-border/10">
                            <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{key}</span>
                                <span className="text-[11px] font-bold text-foreground/80">{String(value)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/20 text-[10px] font-mono overflow-auto custom-scrollbar max-h-40">
            <pre>{JSON.stringify(item.details, null, 2)}</pre>
        </div>
    );
  };

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500/50 before:via-blue-500/20 before:to-transparent">
      {sortedHistory.map((item, index) => {
        const Icon = iconMap[item.type] || Info;
        const isSystem = item.type === 'System';
        const employee = employees.find(e => e.id === item.userId);

        return (
          <div key={item.id || index} className="relative pl-12 group">
            <div className={cn(
              "absolute left-3 top-1 size-4 rounded-full border-4 border-background z-10 transition-transform group-hover:scale-110",
              isSystem ? "bg-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.3)]" : "bg-blue-500 shadow-lg shadow-blue-500/20"
            )} />
            
            <div className="p-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    isSystem ? "bg-secondary text-muted-foreground" : "bg-blue-500/10 text-blue-500"
                  )}>
                    <Icon size={12} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {isSystem ? item.action.replace('_', ' ') : item.type}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </div>

              <div className="text-sm font-semibold leading-relaxed mb-3 text-foreground/90">
                {item.content}
              </div>

              {renderDetails(item)}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/10">
                <Avatar className="size-5 border border-border/40">
                  <AvatarImage src={getUserAvatar(employee)} alt={item.userName || "User"} />
                  <AvatarFallback className="text-[8px] font-black">{(item.userName || "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {item.userName || `User ${item.userId.substring(0, 5)}...`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
