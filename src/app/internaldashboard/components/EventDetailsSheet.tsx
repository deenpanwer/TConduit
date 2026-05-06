"use client";

import { motion } from "framer-motion";
import { Globe, Shield, Cpu, Smartphone, Monitor, Laptop, Download, Layout, LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DownloadEvent } from "../types";

interface EventDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  events: DownloadEvent[];
  count: number;
  icon: LucideIcon;
  variant?: "emerald" | "primary";
}

export function EventDetailsSheet({
  open,
  onOpenChange,
  title,
  description,
  events,
  count,
  icon: Icon,
  variant = "primary"
}: EventDetailsSheetProps) {
  const isEmerald = variant === "emerald";
  const bgColor = isEmerald ? "bg-emerald-500/5" : "bg-primary/5";
  const iconBg = isEmerald ? "bg-emerald-500/10" : "bg-primary/10";
  const iconColor = isEmerald ? "text-emerald-600" : "text-primary";
  const iconBorder = isEmerald ? "border-emerald-500/20" : "border-primary/20";
  const groupHoverBorder = isEmerald ? "hover:border-emerald-500/30" : "hover:border-primary/30";
  const innerIconColor = isEmerald ? "text-emerald-500" : "text-primary";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl border-l-4 border-black dark:border-white p-0 overflow-hidden flex flex-col font-sans">
        <SheetHeader className={`p-8 border-b-2 ${bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className={`text-3xl font-black uppercase tracking-tighter leading-none ${iconColor}`}>{title}</SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {description}
              </SheetDescription>
            </div>
            <div className={`size-12 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor} border-2 ${iconBorder}`}>
              <Icon size={24} />
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-6">
            {events.length === 0 ? (
              <div className="py-20 border-4 border-dashed border-border rounded-[3rem] flex flex-col items-center justify-center text-center px-10">
                {isEmerald ? <Layout className="size-16 text-muted-foreground/20 mb-6" /> : <Download className="size-16 text-muted-foreground/20 mb-6" />}
                <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">No records found yet</p>
              </div>
            ) : (
              events.map((dl, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={dl.id} 
                  className={`bg-card border-2 border-border p-6 rounded-[2rem] space-y-4 ${groupHoverBorder} transition-all group`}
                >
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-secondary flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                        {dl.platform === "Mobile PWA" ? <Smartphone size={20} className={innerIconColor} /> : 
                         dl.platform.includes("PWA") ? <Monitor size={20} className={innerIconColor} /> : 
                         <Laptop size={20} className={innerIconColor} />}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{dl.platform}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dl.version ? `Version ${dl.version}` : 'Application Access'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time</p>
                      <p className="text-xs font-bold">
                        {formatDistanceToNow(new Date(dl.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest`}>
                        <Globe size={12} className={innerIconColor} /> Location
                      </div>
                      <p className="text-xs font-bold truncate">
                        {dl.geo.city}, {dl.geo.country}
                      </p>
                      {isEmerald && (
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                           {dl.geo.region}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest`}>
                        <Shield size={12} className={innerIconColor} /> IP Address
                      </div>
                      <p className="text-xs font-mono font-bold">{dl.ip}</p>
                    </div>
                  </div>

                  <div className="bg-secondary/30 p-4 rounded-2xl border border-border space-y-3">
                     <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${innerIconColor}`}>
                        <Cpu size={12} /> Device Information
                     </div>
                     <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <div>
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Resolution</p>
                          <p className="text-[10px] font-bold">{dl.screenResolution || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Timezone</p>
                          <p className="text-[10px] font-bold truncate">{dl.timeZone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Language</p>
                          <p className="text-[10px] font-bold">{dl.language || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Type</p>
                          <Badge variant="outline" className={`text-[8px] font-black py-0 px-2 rounded-md uppercase ${isEmerald ? "border-emerald-500/30 text-emerald-600" : ""}`}>
                             {isEmerald ? 'APP INSTALL' : (dl.isPWA ? 'App Installed' : 'Browser Access')}
                          </Badge>
                        </div>
                     </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-8 bg-black text-white dark:bg-white dark:text-black shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon size={16} className={innerIconColor} />
            <span className="text-[10px] font-black uppercase tracking-widest">{title} Logs</span>
          </div>
          <p className="text-[9px] font-black opacity-40">TOTAL: {count}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
