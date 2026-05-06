"use client";

import { motion } from "framer-motion";
import { 
  Users, CheckCircle2, Clock, Activity, 
  ExternalLink, MousePointer2, Calendar, Phone 
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { InternalUser } from "../types";

interface SignupListProps {
  owners: InternalUser[];
  onToggleTalked: (userId: string, currentStatus: boolean) => void;
  updatingField: string | null;
}

export function SignupList({ owners, onToggleTalked, updatingField }: SignupListProps) {
  // Sort owners by createdAt descending (newest signups first)
  const sortedOwners = [...owners].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const isLive = (session: any) => {
    if (!session) return false;
    const lastActive = session.lastSeen || session.startTime;
    if (!lastActive) return false;
    const diff = (Date.now() - new Date(lastActive).getTime()) / 1000;
    return diff < 60; // Active in last 60 seconds
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight leading-none">New Signups</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Recently registered organization owners</p>
          </div>
        </div>
        <Badge variant="outline" className="font-black text-[10px] rounded-full px-4 py-1">
          {owners.length} Total Owners
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedOwners.map((owner, i) => {
          const lastSession = owner.recentSessions && owner.recentSessions.length > 0 ? owner.recentSessions[0] : null;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={owner.id}
              className={cn(
                "bg-card border-2 p-6 rounded-[2.5rem] transition-all relative group overflow-hidden",
                owner.talked ? "border-emerald-500/20 opacity-75" : "border-border hover:border-primary/30"
              )}
            >
              {owner.talked && (
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                   <CheckCircle2 size={60} className="text-emerald-500" />
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-lg font-black uppercase tracking-tighter leading-tight truncate">
                    {owner.name}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-muted-foreground truncate">{owner.email}</p>
                    {owner.whatsAppNumber && (
                      <a 
                        href={`https://wa.me/${owner.whatsAppNumber.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-emerald-500 flex items-center gap-1.5 hover:underline"
                      >
                        <Phone size={10} /> {owner.whatsAppNumber}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-xl border border-border">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Talked</span>
                    <Checkbox 
                      checked={!!owner.talked} 
                      disabled={updatingField === `${owner.id}-talked`}
                      onCheckedChange={() => onToggleTalked(owner.id, !!owner.talked)}
                      className="size-4 border-2"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Joined</p>
                    <p className="text-[10px] font-bold">
                      {owner.createdAt ? format(new Date(owner.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Organization</p>
                    <p className="text-[10px] font-bold truncate">
                      {owner.orgName || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={12} className={cn("transition-colors", isLive(lastSession) ? "text-emerald-500" : "text-primary")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", isLive(lastSession) ? "text-emerald-500" : "text-primary")}>
                        {isLive(lastSession) ? "Real-time Monitoring" : "Usage & Latest Session"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[8px] font-black px-1.5 rounded-md uppercase">
                         {owner.totalVisits || 0} Visits
                      </Badge>
                      {isLive(lastSession) && (
                         <Badge className="bg-emerald-500 text-[8px] font-black h-4 px-1.5 uppercase rounded-md animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]">LIVE</Badge>
                      )}
                    </div>
                  </div>
                  
                  {lastSession ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[11px] font-bold flex items-center gap-1.5">
                          <Clock size={10} className="text-muted-foreground" />
                          {isLive(lastSession) ? "Started " : ""}{formatDistanceToNow(new Date(lastSession.startTime), { addSuffix: true })}
                        </p>
                        <p className={cn("text-[9px] font-black uppercase transition-colors", isLive(lastSession) ? "text-emerald-500" : "text-muted-foreground")}>
                           {lastSession.durationSeconds ? `${Math.floor(lastSession.durationSeconds / 60)}m ${lastSession.durationSeconds % 60}s` : 'Just Started'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MousePointer2 size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-[9px] font-mono text-muted-foreground truncate bg-card px-2 py-0.5 rounded border border-border">
                           {lastSession.pathname || '/'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold text-muted-foreground uppercase italic py-1">No sessions recorded yet</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Calendar size={12} className="text-muted-foreground" />
                   <span className="text-[8px] font-black uppercase text-muted-foreground">Updated {owner.updatedAt ? formatDistanceToNow(new Date(owner.updatedAt)) : 'N/A'} ago</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[9px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all rounded-xl"
                  onClick={() => {
                    // This would ideally open the detail sheet
                    if (owner.ownedOrgId) {
                       window.dispatchEvent(new CustomEvent('open-org-details', { detail: owner.ownedOrgId }));
                    }
                  }}
                >
                  Details <ExternalLink size={10} className="ml-1.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {owners.length === 0 && (
        <div className="py-20 border-4 border-dashed border-border rounded-[3rem] text-center">
           <Users className="size-16 mx-auto mb-6 text-muted-foreground/20" />
           <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">No new signups found</p>
        </div>
      )}
    </section>
  );
}
