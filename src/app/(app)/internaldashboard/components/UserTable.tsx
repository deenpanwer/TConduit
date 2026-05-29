"use client";

import { useMemo, useState } from "react";
import { 
  Search, Filter, Users, Mail, Building2, Activity, 
  Ban, CheckCircle2, Timer, Clock, Globe, ChevronRight, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, differenceInDays, format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { InternalUser } from "../types";
import { toast } from "sonner";

interface UserTableProps {
  users: InternalUser[];
  onViewDetails: (orgId: string) => void;
  loading: boolean;
}

export function UserTable({ users, onViewDetails, loading }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("activity");

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.orgName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case "expiry": {
          const aExpiry = a.orgData?.subscriptionExpiry;
          const bExpiry = b.orgData?.subscriptionExpiry;
          if (!aExpiry && !bExpiry) return 0;
          if (!aExpiry) return 1;
          if (!bExpiry) return -1;
          return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
        }
        case "activity": {
          const aActivity = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const bActivity = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return bActivity - aActivity;
        }
        case "newest": {
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreated - aCreated;
        }
        case "visits": {
          return (b.totalVisits || 0) - (a.totalVisits || 0);
        }
        case "name": {
          return a.name.localeCompare(b.name);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [users, searchQuery, sortBy]);

  return (
    <div className="space-y-10">
      {/* Search & Filter Bar */}
      <section className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search by name, email, or organization..." 
            className="h-16 pl-16 rounded-[2rem] border-4 border-black dark:border-white bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] focus-visible:ring-0 focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] focus-visible:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:focus-visible:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] transition-all font-bold text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-16 rounded-[2rem] border-4 border-black dark:border-white bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] focus:ring-0 font-black uppercase tracking-widest text-xs px-8">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-black dark:border-white font-bold">
              <SelectItem value="activity" className="focus:bg-primary focus:text-white rounded-xl">Recent Activity</SelectItem>
              <SelectItem value="expiry" className="focus:bg-primary focus:text-white rounded-xl">Expiring Soon</SelectItem>
              <SelectItem value="newest" className="focus:bg-primary focus:text-white rounded-xl">Newest Accounts</SelectItem>
              <SelectItem value="visits" className="focus:bg-primary focus:text-white rounded-xl">Most Active</SelectItem>
              <SelectItem value="name" className="focus:bg-primary focus:text-white rounded-xl">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Data Table / Cards */}
      <section className="space-y-4">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          <div className="col-span-4">Owner & Organization</div>
          <div className="col-span-3">Access Status</div>
          <div className="col-span-3">Recent Activity</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedUsers.map((user) => {
              const expiry = user.orgData?.subscriptionExpiry;
              const daysRemaining = expiry ? differenceInDays(new Date(expiry), new Date()) : null;
              const isExpired = daysRemaining !== null && daysRemaining < 0;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  key={user.id}
                  className="bg-card border-2 border-border p-6 md:p-8 rounded-[2.5rem] hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all group"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Identity Column */}
                    <div className="lg:col-span-4 flex items-center gap-6">
                      <div className="size-16 rounded-2xl bg-secondary border-2 border-border overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        <img 
                          src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.email}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1.5 truncate">
                          {user.name}
                        </h4>
                        <p className="text-xs font-bold text-muted-foreground truncate flex items-center gap-2">
                          <Mail size={12} /> {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-3 bg-primary/5 border border-primary/10 px-3 py-1 rounded-full w-fit">
                          <Building2 size={12} className="text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary truncate max-w-[150px]">
                            {user.orgName || "No Organization"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 bg-secondary px-3 py-1 rounded-full w-fit">
                          <Activity size={10} className="text-muted-foreground" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            {user.totalVisits || 0} Total Visits
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trial Status Column */}
                    <div className="lg:col-span-3 space-y-2">
                      {expiry ? (
                        <>
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit",
                            isExpired ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                          )}>
                            {isExpired ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {isExpired ? "Access Expired" : "Active Access"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <Timer size={14} className="text-muted-foreground" />
                            <span className={cn(
                              isExpired ? "text-destructive" : daysRemaining !== null && daysRemaining < 3 ? "text-amber-500" : "text-foreground"
                            )}>
                              {daysRemaining === 0 ? "Expires Today" : daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining || 0)} days past due`}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Ends {format(new Date(expiry), 'MMMM dd, yyyy')}
                          </p>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20 w-fit">
                           <AlertCircle size={14} />
                           <span className="text-[10px] font-black uppercase tracking-widest">No Access Settings</span>
                        </div>
                      )}
                    </div>

                    {/* Activity Column */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-foreground">Recent Activity</span>
                        {user.lastActivity && differenceInDays(new Date(), new Date(user.lastActivity)) < 1 && (
                          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Active today" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                          {user.lastActivity ? (
                            <>
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })}
                            </>
                          ) : (
                            "No activity yet"
                          )}
                        </p>
                        {user.lastActivity && (
                          <p className="text-[10px] text-muted-foreground/60 font-medium uppercase">
                             Last seen: {format(new Date(user.lastActivity), 'MMM dd, yyyy @ hh:mm a')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Column */}
                    <div className="lg:col-span-2 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-12 rounded-2xl border-2 hover:bg-secondary transition-all"
                        title="Open Website"
                        onClick={() => {
                           if (user.ownedOrgId) {
                             toast.info(`Organization ID: ${user.ownedOrgId}`);
                           }
                        }}
                      >
                        <Globe size={18} />
                      </Button>
                      <Button 
                        onClick={() => user.ownedOrgId && onViewDetails(user.ownedOrgId)}
                        className="h-12 px-6 rounded-2xl border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all font-black uppercase tracking-widest text-[10px]"
                      >
                        View Details <ChevronRight size={14} className="ml-2" />
                      </Button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredAndSortedUsers.length === 0 && !loading && (
            <div className="py-32 bg-secondary/20 border-4 border-dashed border-border rounded-[4rem] text-center">
               <Users className="size-16 mx-auto mb-6 text-muted-foreground/20" />
               <p className="text-lg font-black uppercase tracking-[0.3em] text-muted-foreground">No accounts found</p>
               <Button variant="link" onClick={() => setSearchQuery("")} className="mt-4 font-bold uppercase text-xs tracking-widest">Clear Search</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
