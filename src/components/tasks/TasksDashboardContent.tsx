"use client";

import React, { useMemo } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Mic, 
  Keyboard, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  Activity,
  LayoutDashboard,
  Calendar,
  Flag,
  User,
  MoreHorizontal,
  ListTodo
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getUserAvatar } from "@/lib/utils";
import { 
  format, 
  isToday, 
  isWithinInterval, 
  addDays, 
  startOfDay, 
  endOfDay, 
  subDays,
  isSameDay,
  formatDistanceToNow
} from "date-fns";
import { motion } from "framer-motion";

export function TasksDashboardContent({ onTaskClick }: { onTaskClick?: (taskId: string) => void }) {
  const { tasks, loading, canManageTasks } = useTasks();
  const { user, userData } = useAuth();
  const { employees, owner } = useTeam();

  const now = new Date();

  // Combine employees and owner for a complete personnel list
  const personnel = useMemo(() => {
    const list = [...employees];
    if (owner && !list.find(p => p.id === owner.id)) {
      list.push(owner);
    }
    return list;
  }, [employees, owner]);

  // Helper to format history actions with specific details
  const getActionDescription = (event: any) => {
    const action = event.action;
    const details = event.details || {};

    switch (action) {
      case 'created':
        return 'created this task';
      case 'comment_added':
        return 'added a comment';
      case 'manual_save':
        return 'updated task details';
      case 'deleted':
        return 'deleted this task';
      case 'task_completed':
        return details.flagged ? 'marked as complete' : 'marked as incomplete';
      case 'subtask_toggled':
        return details.completed ? 'completed a subtask' : 'reopened a subtask';
      case 'assignees_updated':
        return 'updated assignees';
      case 'due_date_updated':
        return `set deadline to ${details.dueDate ? format(new Date(details.dueDate), "MMM d") : 'none'}`;
      case 'cover_image_updated':
        return 'updated cover image';
      case 'updated':
        if (details.status) return `moved to ${details.status.replace("_", " ")}`;
        if (details.priority) return `changed priority to ${details.priority}`;
        return 'made updates';
      default:
        return action.replace("_", " ");
    }
  };

  // --- Calculations ---

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status !== 'done' && !t.flagged);
    const dueToday = tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'done');
    const totalPoints = tasks.reduce((acc, t) => acc + (t.leaderPoints || 0), 0);
    
    // Average velocity (tasks completed per day in last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    const completedRecently = tasks.filter(t => {
      if (t.status !== 'done') return false;
      const historyReversed = [...(t.history || [])].reverse();
      const doneAction = historyReversed.find(h =>
        (h.action === 'updated' && h.details?.status === 'done') ||
        (h.action === 'created' && h.details?.status === 'done')
      );
      if (!doneAction) return false;
      const doneDate = doneAction.createdAt?.toDate ? doneAction.createdAt.toDate() : new Date(doneAction.createdAt);
      return doneDate >= sevenDaysAgo;
    });
    const avgVelocity = (completedRecently.length / 7).toFixed(1);

    return {
      activeCount: activeTasks.length,
      dueTodayCount: dueToday.length,
      totalPoints,
      avgVelocity
    };
  }, [tasks, now]);

  const priorityStack = useMemo(() => {
    if (!user) return [];
    return tasks
      .filter(t => {
        const isAssigned = (t.assignees || []).includes(user.uid);
        const isPending = t.status !== 'done' && !t.flagged;
        const isUrgent = t.priority === 'high' || t.priority === 'critical';
        const isSoon = t.dueDate && isWithinInterval(new Date(t.dueDate), { 
          start: startOfDay(now), 
          end: endOfDay(addDays(now, 2)) 
        });
        return isAssigned && isPending && (isUrgent || isSoon);
      })
      .sort((a, b) => {
        // Sort by priority then by date
        const pMap = { critical: 0, high: 1, medium: 2, low: 3 };
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return 0;
      })
      .slice(0, 5);
  }, [tasks, user, now]);

  const teamPulse = useMemo(() => {
    return tasks
      .flatMap(t => (t.history || []).map(h => ({ ...h, taskTitle: t.title, taskId: t.id })))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 15);
  }, [tasks]);

  const heatmapData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dayTasks = tasks.filter(t => {
        if (t.status !== 'done') return false;
        const historyReversed = [...(t.history || [])].reverse();
        const doneAction = historyReversed.find(h =>
            (h.action === 'updated' && h.details?.status === 'done') ||
            (h.action === 'created' && h.details?.status === 'done')
        );
        if (!doneAction) return false;
        const doneDate = doneAction.createdAt?.toDate ? doneAction.createdAt.toDate() : new Date(doneAction.createdAt);
        return isSameDay(doneDate, date);
      });
      return {
        label: format(date, "EEE"),
        count: dayTasks.length,
        percentage: Math.min(100, (dayTasks.length / 5) * 100) // 5 tasks as 100% benchmark
      };
    });
  }, [tasks, now]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter(t => t.dueDate && new Date(t.dueDate) > now && t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 4);
  }, [tasks, now]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-t-2 border-primary rounded-full animate-spin" />
          <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Syncing Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
      
      {/* 1. KPI Pulse Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Tasks", value: stats.activeCount, icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", trend: `${tasks.length} Total` },
          { label: "Due Today", value: stats.dueTodayCount, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", trend: "Immediate Action" },
          { label: "Leader Points", value: stats.totalPoints.toLocaleString(), icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Org Total" },
          { label: "Avg Velocity", value: `${stats.avgVelocity}/d`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Last 7 Days" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 bg-card/40 backdrop-blur-md shadow-sm group hover:shadow-md transition-all rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-2xl", stat.bg, stat.color)}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter opacity-50 border-none px-0">
                  {stat.trend}
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter">{stat.value}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              </div>
              <div className="mt-5 h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className={cn("h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]", stat.color.replace("text", "bg"))}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. My Priority Stack */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Flag size={14} className="text-primary" /> My Priority Stack
            </h2>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">View Full List</Button>
          </div>
          
          <div className="space-y-3">
            {priorityStack.length === 0 ? (
              <div className="p-12 rounded-[2.5rem] bg-secondary/20 border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-primary/20" />
                </div>
                <h4 className="font-bold text-sm">Clear Horizons</h4>
                <p className="text-xs text-muted-foreground mt-1">No immediate priority tasks assigned to you.</p>
              </div>
            ) : (
              priorityStack.map((task) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-[2rem] bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/60 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border/20",
                      task.priority === 'critical' ? "bg-red-500/10 text-red-500" :
                      task.priority === 'high' ? "bg-orange-500/10 text-orange-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {task.priority === 'critical' ? <Zap size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black truncate pr-4">{task.title}</h4>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <Clock size={12} className="text-orange-500/70" />
                          {task.dueDate ? format(new Date(task.dueDate), "MMM d, h:mm a") : "No deadline"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <User size={12} className="text-blue-500/70" />
                          {task.assignees.length} Assigned
                        </div>
                        {task.subtasks.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                            <ListTodo size={12} className="text-primary/70" />
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} Subs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button 
                      onClick={() => onTaskClick?.(task.id)}
                      size="sm" 
                      variant="secondary" 
                      className="rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-widest gap-2 bg-background border shadow-sm hover:shadow-md transition-all"
                    >
                      Focus <ChevronRight size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* 3. Team Pulse */}
        <div className="space-y-4">
          <div className="px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" /> Team Pulse
            </h2>
          </div>
          
          <Card className="border-0 bg-card/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-sm">
            <ScrollArea className="h-[480px]">
              <div className="p-6 space-y-6">
                {teamPulse.map((event, i) => {
                  const actor = personnel.find(p => p.id === event.userId);
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 relative group/item"
                    >
                      {i !== teamPulse.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-border/30 group-hover/item:bg-primary/20 transition-colors" />}
                      <Avatar className="size-8 border-2 border-background ring-1 ring-border shrink-0 z-10 shadow-sm">
                        <AvatarImage src={getUserAvatar(actor)} />
                        <AvatarFallback className="text-[10px] font-black">{actor?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-black uppercase tracking-tight text-foreground/90">{actor?.name || "System"}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/60">{formatDistanceToNow(event.createdAt?.toDate ? event.createdAt.toDate() : new Date(event.createdAt), { addSuffix: true })}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getActionDescription(event)} <span className="text-foreground font-bold group-hover/item:text-primary transition-colors cursor-pointer" onClick={() => onTaskClick?.(event.taskId)}>"{event.taskTitle}"</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 4. Productivity Heatmap */}
        <div className="space-y-4">
          <div className="px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> Velocity Heatmap
            </h2>
          </div>
          <Card className="border-0 bg-card/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-end justify-between gap-3 h-48">
              {heatmapData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                  <div className="w-full relative bg-secondary/30 rounded-2xl overflow-hidden flex-1 border border-border/20">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${day.percentage}%` }}
                      className={cn(
                        "absolute bottom-0 left-0 right-0 rounded-2xl transition-all duration-500",
                        day.percentage > 80 ? "bg-primary shadow-[0_0_20px_rgba(var(--primary),0.4)]" : 
                        day.percentage > 40 ? "bg-primary/70" : "bg-primary/40"
                      )}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/20 backdrop-blur-[2px]">
                      <span className="text-[10px] font-black text-foreground drop-shadow-md">{day.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{day.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 5. Upcoming Deadlines */}
        <div className="space-y-4">
          <div className="px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Calendar size={14} className="text-orange-500" /> Critical Deadlines
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingDeadlines.length === 0 ? (
               <div className="col-span-2 h-48 rounded-[2.5rem] bg-secondary/10 border border-dashed border-border flex items-center justify-center">
                  <p className="text-xs text-muted-foreground font-bold italic uppercase tracking-widest">No upcoming deadlines</p>
               </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <Card 
                  key={task.id} 
                  onClick={() => onTaskClick?.(task.id)}
                  className="border-0 bg-card/40 backdrop-blur-md rounded-[2.2rem] overflow-hidden group hover:bg-primary/5 transition-all cursor-pointer shadow-sm border border-border/20"
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full min-h-[160px]">
                    <div className="flex items-start justify-between">
                      <div className="size-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center border border-orange-500/20 shadow-inner">
                        <Clock size={20} />
                      </div>
                      <Badge className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border-none text-[9px] font-black uppercase tracking-wider px-2.5">
                        {format(new Date(task.dueDate!), "MMM d")}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-xs font-black truncate uppercase tracking-tight group-hover:text-primary transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((uid, i) => (
                            <Avatar key={i} className="size-6 border-2 border-background shadow-sm ring-1 ring-border/20">
                              <AvatarImage src={getUserAvatar(personnel.find(e => e.id === uid))} />
                              <AvatarFallback className="text-[8px] font-black">U</AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="size-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-black z-10">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{task.assignees.length} Involved</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
