"use client";

import { 
  Building2, ShieldCheck, Trash2, Zap, PlusCircle, 
  Users, Mail, Globe, Clock, TrendingUp, Info, 
  ShieldAlert, Loader2, Check 
} from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn, isEmployeeOnline } from "@/lib/utils";
import { OrgDetails, StaffMember } from "../types";
import { useState } from "react";

interface OrgDetailsSheetProps {
  selectedOrgId: string | null;
  onClose: () => void;
  orgDetails: OrgDetails | null;
  fetchingDetails: boolean;
  extendingTrial: boolean;
  onExtendTrial: (days: number) => void;
  updatingField: string | null;
  onUpdateStaff: (staffId: string, updates: Partial<StaffMember>) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onDeleteOrg: (orgId: string, orgName: string) => void;
}

export function OrgDetailsSheet({
  selectedOrgId,
  onClose,
  orgDetails,
  fetchingDetails,
  extendingTrial,
  onExtendTrial,
  updatingField,
  onUpdateStaff,
  onDeleteUser,
  onDeleteOrg
}: OrgDetailsSheetProps) {
  const [customScreenshot, setCustomScreenshot] = useState<Record<string, string>>({});
  const [customShift, setCustomShift] = useState<Record<string, string>>({});
  return (
    <Sheet open={!!selectedOrgId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl border-l-4 border-black dark:border-white p-0 overflow-hidden flex flex-col font-sans">
        <SheetHeader className="p-8 border-b-2 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none">User Overview</SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Organization Activity and Settings
              </SheetDescription>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
              <ShieldCheck size={24} />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          {fetchingDetails ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading organization data...</p>
            </div>
          ) : orgDetails ? (
            <>
              {/* 1. Organization Information */}
              <section className="bg-card border-2 border-border p-6 rounded-[2rem] space-y-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-secondary flex items-center justify-center border-2 border-border shadow-inner">
                    <Building2 size={28} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1">
                      {orgDetails.org.name}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     Unique ID: {orgDetails.org.id}
                    </p>
                  </div>
                </div>

                {/* Destructive Action Section */}
                <div className="absolute top-6 right-6">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => orgDetails && onDeleteOrg(orgDetails.org.id, orgDetails.org.name)}
                    className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                    title="Purge Entire Organization"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Account Created</p>
                    <p className="text-xs font-bold truncate">
                      {orgDetails.org.createdAt ? format(new Date(orgDetails.org.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Invite Code</p>
                    <p className="text-xs font-mono font-black tracking-widest">
                      {orgDetails.org.inviteCode || '------'}
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Access Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Access Settings</h4>
                </div>
                
                <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Status</p>
                      <Badge className={cn(
                        "uppercase text-[10px] font-black px-3 py-1 rounded-lg",
                        isAfter(new Date(orgDetails.org.subscriptionExpiry), new Date()) ? "bg-emerald-500" : "bg-destructive"
                      )}>
                        {isAfter(new Date(orgDetails.org.subscriptionExpiry), new Date()) ? "Active Access" : "Access Expired"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valid Until</p>
                      <p className="text-sm font-black truncate">
                        {orgDetails.org.subscriptionExpiry ? format(new Date(orgDetails.org.subscriptionExpiry), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      disabled={extendingTrial}
                      onClick={() => onExtendTrial(7)}
                      variant="outline" 
                      className="h-12 rounded-xl border-2 border-black dark:border-white font-black uppercase text-[9px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px]"
                    >
                      {extendingTrial ? <Loader2 className="animate-spin size-3 mr-2" /> : <PlusCircle size={14} className="mr-2" />}
                      Add +7 Days
                    </Button>
                    <Button 
                      disabled={extendingTrial}
                      onClick={() => onExtendTrial(30)}
                      className="h-12 rounded-xl border-4 border-black dark:border-white font-black uppercase text-[9px] tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px]"
                    >
                      {extendingTrial ? <Loader2 className="animate-spin size-3 mr-2" /> : <Zap size={14} className="mr-2" />}
                      Unlock +30 Days
                    </Button>
                  </div>
                </div>
              </section>

              {/* 3. Team Information */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Team Members</h4>
                  </div>
                  <Badge variant="secondary" className="font-black text-[10px] rounded-full">
                    {orgDetails.staff.length} People
                  </Badge>
                </div>

                <div className="space-y-4">
                  {orgDetails.staff.map((member) => {
                    const isOwner = member.role?.toLowerCase() === "owner" || member.role?.toLowerCase() === "founder";
                    
                    return (
                      <div key={member.id} className="bg-secondary/30 rounded-[2rem] border border-border overflow-hidden">
                        <div className="p-6 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <Avatar className="size-14 border-2 border-border group-hover:scale-105 transition-transform">
                              <AvatarImage src={member.photoUrl} />
                              <AvatarFallback className="bg-secondary font-bold text-xs">
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-base font-black tracking-tight leading-none mb-1.5 truncate max-w-[150px]">
                                {member.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className="text-[8px] font-black py-0 px-2 uppercase rounded-md">
                                  {member.role || 'Staff'}
                                </Badge>
                                {isEmployeeOnline(member) && (
                                  <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Last Seen</p>
                            <p className="text-xs font-bold leading-none mb-1">
                              {member.heartbeat?.lastActive ? formatDistanceToNow(new Date(member.heartbeat.lastActive), { addSuffix: true }) : (member.lastActivity ? formatDistanceToNow(new Date(member.lastActivity), { addSuffix: true }) : 'Never')}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-medium uppercase">
                              {member.heartbeat?.lastActive ? format(new Date(member.heartbeat.lastActive), 'MMM dd, yyyy') : (member.lastActivity ? format(new Date(member.lastActivity), 'MMM dd, yyyy') : 'No Date')}
                            </p>
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-0 border-t border-border/50 grid grid-cols-2 gap-4 mt-4">
                          <div>
                              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Member Since</p>
                              <p className="text-[10px] font-bold">
                                {member.createdAt ? `${format(new Date(member.createdAt), 'MMM dd, yyyy')}` : 'N/A'}
                              </p>
                              <p className="text-[8px] text-muted-foreground font-medium uppercase">
                                {member.createdAt ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true }) : ''}
                              </p>
                          </div>
                          <div>
                              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Usage Summary</p>
                              <p className="text-[10px] font-bold">
                                {member.totalVisits || 0} Total Visits
                              </p>
                              <p className="text-[8px] text-muted-foreground font-medium uppercase">
                                Last updated {member.updatedAt ? formatDistanceToNow(new Date(member.updatedAt), { addSuffix: true }) : 'N/A'}
                              </p>
                          </div>
                        </div>

                        {/* Management Center - ONLY for Employees */}
                        {!isOwner && (
                          <div className="bg-secondary/20 p-6 border-t border-border/50 space-y-6">
                            <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Management Center</h5>
                                {updatingField?.startsWith(member.id) && <Loader2 className="size-3 animate-spin text-primary" />}
                            </div>

                            {/* Direct Contact */}
                            <div className="space-y-2">
                                <a 
                                  href={`mailto:${member.email}`}
                                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/50 transition-all group"
                                >
                                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Mail size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase">Email Address</p>
                                    <p className="text-[10px] font-bold truncate">{member.email}</p>
                                  </div>
                                </a>
                                
                                {member.whatsAppNumber && (
                                  <a 
                                    href={`https://wa.me/${member.whatsAppNumber.replace(/\+/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/50 transition-all group"
                                  >
                                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                      <Globe size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[8px] font-black text-muted-foreground uppercase">WhatsApp Number</p>
                                      <p className="text-[10px] font-bold truncate">{member.whatsAppNumber}</p>
                                    </div>
                                  </a>
                                )}
                            </div>

                                <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-tight leading-none text-red-500">Permanent Removal</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Delete from Auth & Firestore</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        disabled={updatingField === `${member.id}-delete`}
                                        onClick={() => onDeleteUser(member.id, member.name)}
                                        className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all active:scale-95 shadow-none"
                                    >
                                        {updatingField === `${member.id}-delete` ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider">Block Trac Diary</Label>
                                        <p className="text-[8px] text-muted-foreground font-medium uppercase">Prevent user from accessing the desktop app</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {updatingField === `${member.id}-accessLocked` && <Loader2 className="size-3 animate-spin text-primary" />}
                                      <Switch 
                                          disabled={updatingField === `${member.id}-accessLocked`}
                                          checked={member.accessLocked} 
                                          onCheckedChange={(checked) => onUpdateStaff(member.id, { accessLocked: checked })}
                                      />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider">Blur Screenshots</Label>
                                        <p className="text-[8px] text-muted-foreground font-medium uppercase">Enable privacy filter for work photos</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {updatingField === `${member.id}-blurScreenshots` && <Loader2 className="size-3 animate-spin text-primary" />}
                                      <Switch 
                                          disabled={updatingField === `${member.id}-blurScreenshots`}
                                          checked={member.blurScreenshots} 
                                          onCheckedChange={(checked) => onUpdateStaff(member.id, { blurScreenshots: checked })}
                                      />
                                    </div>
                                </div>

                                {/* Preset Buttons for Screenshot Interval */}
                                <div className="space-y-3 p-3 bg-card border border-border rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] font-black uppercase tracking-wider">Screenshot Frequency</Label>
                                            <p className="text-[8px] text-muted-foreground font-medium uppercase">Minutes between automated photos</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {updatingField === `${member.id}-screenshotInterval` && <Loader2 className="size-3 animate-spin text-primary" />}
                                          <Badge variant="secondary" className="text-[10px] font-black">{member.screenshotInterval}m</Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-5 gap-1.5">
                                        {[1, 5, 10, 15, 30].map((val) => (
                                          <Button
                                            key={val}
                                            variant={member.screenshotInterval === val ? "default" : "outline"}
                                            size="sm"
                                            disabled={updatingField === `${member.id}-screenshotInterval`}
                                            onClick={() => onUpdateStaff(member.id, { screenshotInterval: val })}
                                            className="h-8 text-[10px] font-bold rounded-lg border-2"
                                          >
                                            {val}m
                                          </Button>
                                        ))}
                                      </div>
                                      <div className="flex gap-2">
                                        <Input 
                                          type="number" 
                                          placeholder="Custom..."
                                          className="h-8 text-[10px] font-bold rounded-lg border-2 w-full"
                                          value={customScreenshot[member.id] || ""}
                                          onChange={(e) => setCustomScreenshot(prev => ({ ...prev, [member.id]: e.target.value }))}
                                        />
                                        <Button
                                          size="sm"
                                          className="h-8 px-3 rounded-lg font-black uppercase text-[8px] tracking-widest"
                                          disabled={!customScreenshot[member.id] || updatingField === `${member.id}-screenshotInterval`}
                                          onClick={() => {
                                            const val = parseInt(customScreenshot[member.id]);
                                            if (!isNaN(val) && val > 0) {
                                              onUpdateStaff(member.id, { screenshotInterval: val });
                                              setCustomScreenshot(prev => ({ ...prev, [member.id]: "" }));
                                            }
                                          }}
                                        >
                                          Set
                                        </Button>
                                      </div>
                                    </div>
                                </div>

                                {/* Preset Buttons for Shift Sync Interval */}
                                <div className="space-y-3 p-3 bg-card border border-border rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] font-black uppercase tracking-wider">Shift Interval</Label>
                                            <p className="text-[8px] text-muted-foreground font-medium uppercase">Minutes between data updates</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {updatingField === `${member.id}-shiftSyncInterval` && <Loader2 className="size-3 animate-spin text-primary" />}
                                          <Badge variant="secondary" className="text-[10px] font-black">{member.shiftSyncInterval}m</Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {[10, 30, 60, 120].map((val) => (
                                          <Button
                                            key={val}
                                            variant={member.shiftSyncInterval === val ? "default" : "outline"}
                                            size="sm"
                                            disabled={updatingField === `${member.id}-shiftSyncInterval`}
                                            onClick={() => onUpdateStaff(member.id, { shiftSyncInterval: val })}
                                            className="h-8 text-[10px] font-bold rounded-lg border-2"
                                          >
                                            {val}m
                                          </Button>
                                        ))}
                                      </div>
                                      <div className="flex gap-2">
                                        <Input 
                                          type="number" 
                                          placeholder="Custom..."
                                          className="h-8 text-[10px] font-bold rounded-lg border-2 w-full"
                                          value={customShift[member.id] || ""}
                                          onChange={(e) => setCustomShift(prev => ({ ...prev, [member.id]: e.target.value }))}
                                        />
                                        <Button
                                          size="sm"
                                          className="h-8 px-3 rounded-lg font-black uppercase text-[8px] tracking-widest"
                                          disabled={!customShift[member.id] || updatingField === `${member.id}-shiftSyncInterval`}
                                          onClick={() => {
                                            const val = parseInt(customShift[member.id]);
                                            if (!isNaN(val) && val > 0) {
                                              onUpdateStaff(member.id, { shiftSyncInterval: val });
                                              setCustomShift(prev => ({ ...prev, [member.id]: "" }));
                                            }
                                          }}
                                        >
                                          Set
                                        </Button>
                                      </div>
                                    </div>
                                </div>
                            </div>
                          
                        )}

                        {/* Diagnostics - Support information */}
                        {!isOwner && (
                          <div className="p-6 border-t border-border/50 bg-primary/5">
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-4">Diagnostics & Location</p>
                              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                  <div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">City / Region</p>
                                    <p className="text-[10px] font-bold truncate">
                                      {member.lastLoginLocation?.city || 'Unknown City'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">App Version</p>
                                    <p className="text-[10px] font-bold">
                                      {member.currentVersion || member.lastLoginAppVersion || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">System Type</p>
                                    <p className="text-[10px] font-bold truncate">
                                      {member.lastLoginOs || 'Unknown'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Network IP</p>
                                    <p className="text-[10px] font-bold font-mono">
                                      {member.lastLoginIpAddress || 'Hidden'}
                                    </p>
                                  </div>
                              </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 4. Activity History */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Recent Activity Log</h4>
                  </div>
                  <Badge variant="outline" className="font-black text-[10px] rounded-full">
                    Last 5 Sessions
                  </Badge>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const owner = orgDetails?.staff.find(s => s.role?.toLowerCase() === "owner" || s.role?.toLowerCase() === "founder") || orgDetails?.staff[0];
                    const sessions = owner?.recentSessions || [];

                    if (sessions.length === 0) {
                      return (
                        <div className="py-8 bg-secondary/20 border-2 border-dashed border-border rounded-2xl text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">No session data recorded yet</p>
                        </div>
                      );
                    }

                    return sessions.map(session => {
                      const duration = session.durationSeconds || 0;
                      const mins = Math.floor(duration / 60);
                      const secs = duration % 60;
                      const visitDate = new Date(session.startTime);
                      const loadTimeSeconds = (session.initialLoadTimeMs || 0) / 1000;
                      
                      const pageViews = Object.entries(session.pageViews || {}).sort((a: [string, any], b: [string, any]) => b[1] - a[1]);
                      const totalViews = pageViews.reduce((sum, [, count]) => sum + (count as number), 0);

                      return (
                        <div key={session.id} className="bg-card border-2 border-border p-6 rounded-2xl space-y-5 transition-all hover:border-primary/20 hover:shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                                <Clock size={16} className="text-primary" />
                              </div>
                              <p className="text-xs font-black uppercase leading-none">
                                {visitDate && !isNaN(visitDate.getTime()) ? format(visitDate, 'MMM dd, yyyy @ hh:mm a') : 'Session Start'}
                              </p>
                            </div>
                            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Duration</p>
                                  <p className="text-lg font-black tracking-tighter">{mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</p>
                              </div>
                              <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Page Load</p>
                                  <p className={cn("text-lg font-black tracking-tighter", loadTimeSeconds > 3 ? "text-amber-500" : "text-emerald-600")}>
                                    {loadTimeSeconds.toFixed(2)}s
                                  </p>
                              </div>
                              <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                                  <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Pages Viewed</p>
                                  <p className="text-lg font-black tracking-tighter">{totalViews}</p>
                              </div>
                          </div>

                          {pageViews.length > 0 && (
                            <div className="pt-4 border-t border-border">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-3">Activity Breakdown</p>
                              <div className="space-y-4">
                                {pageViews.map(([path, count]) => (
                                  <div key={path}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground truncate max-w-[200px]">
                                        {path.replace(/_/g, '/').replace(/^root$/, '/')}
                                      </span>
                                      <span className="text-[9px] font-black text-foreground">
                                        {count as number} {count === 1 ? 'view' : 'views'}
                                      </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2 border border-border">
                                      <div 
                                        className="bg-primary h-full rounded-full" 
                                        style={{ width: `${((count as number) / totalViews) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </section>

              {/* 5. Payments (Placeholder) */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Payment History</h4>
                </div>
                
                <div className="py-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center px-8">
                  <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Info size={20} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                    No payment records found. Account is currently on a trial.
                  </p>
                </div>
              </section>
            </>
          ) : null}
        </div>

        <div className="p-8 bg-black text-white dark:bg-white dark:text-black shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Professional Oversight</span>
          </div>
          <p className="text-[9px] font-black opacity-40">System Version 2.4.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper icons needed but not imported directly from lucide
function CreditCard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}
