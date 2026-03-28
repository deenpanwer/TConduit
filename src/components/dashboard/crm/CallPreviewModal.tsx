"use client";

import React from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { CRMEntity } from "@/hooks/use-crm";
import { format } from "date-fns";
import { Phone, Clock, User, Calendar, Tag, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CallPreviewModalProps {
  call: CRMEntity | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallPreviewModal({ call, isOpen, onOpenChange }: CallPreviewModalProps) {
  if (!call) return null;

  const data = call.data;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-xl",
              data.type === 'Incoming' ? "bg-green-500/10 text-green-500" : "bg-purple-500/10 text-purple-500"
            )}>
              <Phone size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Call Interaction</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">Logged on {format(new Date(call.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/10 space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Tag size={8} /> Status
              </span>
              <Badge variant="secondary" className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5",
                data.status === 'completed' && "bg-green-500/10 text-green-500 border-green-500/20",
                data.status === 'busy' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                data.status === 'no-answer' && "bg-red-500/10 text-red-500 border-red-500/20",
                data.status === 'initiated' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
              )}>
                {data.status}
              </Badge>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/10 space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Clock size={8} /> Duration
              </span>
              <p className="text-sm font-bold">{data.duration} seconds</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/10">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  From
                </span>
                <p className="text-xs font-bold">{data.from || "Unknown"}</p>
              </div>
              <ArrowUpRight size={14} className="text-muted-foreground/50" />
              <div className="space-y-1 text-right">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 justify-end">
                  To
                </span>
                <p className="text-xs font-bold">{data.to || "Unknown"}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/10 border border-border/10 space-y-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Info size={10} /> Interaction Summary
              </span>
              <p className="text-sm leading-relaxed font-medium">
                {data.summary || "No summary provided for this interaction."}
              </p>
            </div>
          </div>

          {data.related_to && (
            <div className="flex items-center gap-2 px-1">
              <User size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Linked to:</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{data.related_to}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
