'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isBefore } from 'date-fns';
import { Task, Subtask } from '@/hooks/useTasks';
import { getUserAvatar } from '@/lib/utils';
import { MonthPicker } from './MonthPicker';
import { PerformanceKPICard } from './PerformanceKPICard';

interface EmployeePerformanceStats {
  employee: any;
  rank: number;
  tasksCompleted: number;
  subtasksCompleted: number;
  totalCompletedItems: number;
  pointsEarned: number;
  overdueTasks: number;
  inProgressTasks: number;
}

interface TeamPerformanceOverviewProps {
  personnel: any[];
  tasks: Task[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onSelectEmployee: (employee: any) => void;
}

export function TeamPerformanceOverview({
  personnel,
  tasks,
  selectedMonth,
  onMonthChange,
  onSelectEmployee,
}: TeamPerformanceOverviewProps) {
  const [employeeSearch, setEmployeeSearch] = useState('');
  const monthKey = format(selectedMonth, 'yyyy-MM');

  // Helper to extract date
  const parseDate = (dateVal?: any): Date | null => {
    if (!dateVal) return null;
    try {
      const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : (dateVal.toDate ? dateVal.toDate() : new Date(dateVal));
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const isInSelectedMonth = (dateVal?: any) => {
    if (!dateVal) return false;
    try {
      const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : (dateVal.toDate ? dateVal.toDate() : new Date(dateVal));
      if (isNaN(d.getTime())) return false;
      return format(d, 'yyyy-MM') === monthKey;
    } catch {
      return false;
    }
  };

  // Compute metrics for each employee and team totals
  const {
    employeeStats,
    teamTotals,
  } = useMemo(() => {
    let totalTasksCompleted = 0;
    let totalSubtasksCompleted = 0;
    let totalPointsAwarded = 0;
    let totalOverdue = 0;
    let totalInProgress = 0;

    // Calculate per-employee stats
    const statsMap: Record<string, EmployeePerformanceStats> = {};

    personnel.forEach((p) => {
      const id = p.id || p.uid;
      if (id) {
        statsMap[id] = {
          employee: p,
          rank: 0,
          tasksCompleted: 0,
          subtasksCompleted: 0,
          totalCompletedItems: 0,
          pointsEarned: 0,
          overdueTasks: 0,
          inProgressTasks: 0,
        };
      }
    });

    tasks.forEach((task) => {
      const isTaskDone = task.flagged || task.status === 'done';
      const taskCompletedDate = parseDate(task.completedAt || (isTaskDone ? task.updatedAt : null));
      const taskDueDate = parseDate(task.dueDate);
      const taskCreatedDate = parseDate(task.createdAt);

      // Subtasks calculation
      (task.subtasks || []).forEach((sub: Subtask) => {
        if (sub.completed && isInSelectedMonth(sub.completedAt || task.completedAt || task.updatedAt)) {
          totalSubtasksCompleted++;

          // Attribute to employee
          const actorId = sub.completedBy || task.completedBy;
          if (actorId && statsMap[actorId]) {
            statsMap[actorId].subtasksCompleted++;
            statsMap[actorId].totalCompletedItems++;
            statsMap[actorId].pointsEarned += sub.pointsAwarded || Math.round((task.leaderPoints || 20) / Math.max(1, (task.subtasks || []).length));
          }
        }
      });

      // Task calculation
      if (isTaskDone) {
        if (isInSelectedMonth(taskCompletedDate)) {
          totalTasksCompleted++;
          totalPointsAwarded += Number(task.leaderPoints) || 20;

          if (task.completedBy && statsMap[task.completedBy]) {
            statsMap[task.completedBy].tasksCompleted++;
            statsMap[task.completedBy].totalCompletedItems++;
            statsMap[task.completedBy].pointsEarned += Number(task.leaderPoints) || 20;
          }
        }
      } else {
        // Pending / in-progress / overdue tasks
        if (isInSelectedMonth(taskDueDate) || isInSelectedMonth(taskCreatedDate)) {
          const isOverdue = taskDueDate && isBefore(taskDueDate, new Date());
          if (isOverdue) {
            totalOverdue++;
          } else {
            totalInProgress++;
          }

          (task.assignees || []).forEach((uid) => {
            if (statsMap[uid]) {
              if (isOverdue) {
                statsMap[uid].overdueTasks++;
              } else {
                statsMap[uid].inProgressTasks++;
              }
            }
          });
        }
      }
    });

    // Sort by performance rank
    const sortedStats = Object.values(statsMap)
      .sort((a, b) => {
        if (b.totalCompletedItems !== a.totalCompletedItems) {
          return b.totalCompletedItems - a.totalCompletedItems;
        }
        return b.pointsEarned - a.pointsEarned;
      })
      .map((stat, idx) => {
        stat.rank = idx + 1;
        return stat;
      });

    return {
      employeeStats: sortedStats,
      teamTotals: {
        totalTasksCompleted,
        totalSubtasksCompleted,
        totalPointsAwarded,
        totalOverdue,
        totalInProgress,
      },
    };
  }, [personnel, tasks, monthKey]);

  // Filtered employees for search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeeStats;
    const q = employeeSearch.toLowerCase();
    return employeeStats.filter(
      (s) =>
        s.employee?.name?.toLowerCase().includes(q) ||
        s.employee?.email?.toLowerCase().includes(q) ||
        s.employee?.role?.toLowerCase().includes(q)
    );
  }, [employeeStats, employeeSearch]);

  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="size-6 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-black text-xs shadow-sm">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="size-6 rounded-full bg-slate-300/30 text-slate-600 dark:text-slate-300 border border-slate-400/40 flex items-center justify-center font-black text-xs shadow-sm">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="size-6 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-700/40 flex items-center justify-center font-black text-xs shadow-sm">
            🥉
          </div>
        );
      default:
        return (
          <div className="size-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-black text-[10px]">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto custom-scrollbar p-1 sm:p-2 space-y-2.5 sm:space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 sm:p-4 rounded-xl shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-sm sm:text-base font-black tracking-tight text-foreground uppercase">
            Team Performance Leaderboard
          </h1>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Completed tasks, subtasks & missed tasks for {format(selectedMonth, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={12} />
            <Input
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search team..."
              className="h-8 pl-7 text-xs bg-secondary/20 border-border/40 rounded-lg"
            />
          </div>
          <MonthPicker selectedDate={selectedMonth} onChange={onMonthChange} />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <PerformanceKPICard
          title="Tasks Completed"
          value={teamTotals.totalTasksCompleted}
          theme="green"
        />
        <PerformanceKPICard
          title="Subtasks Completed"
          value={teamTotals.totalSubtasksCompleted}
          theme="blue"
        />
        <PerformanceKPICard
          title="Points Earned"
          value={teamTotals.totalPointsAwarded}
          theme="purple"
        />
        <PerformanceKPICard
          title="Missed Tasks"
          value={teamTotals.totalOverdue}
          theme={teamTotals.totalOverdue === 0 ? 'green' : 'rose'}
        />
      </div>

      {/* Main Employee Performance Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm flex flex-col">
        <div className="p-3 sm:p-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground">
            Employee Performance Table ({filteredEmployees.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/15 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                <th className="py-2.5 px-3 min-w-[200px]">Team Member</th>
                <th className="py-2.5 px-3 text-center w-24">Tasks Done</th>
                <th className="py-2.5 px-3 text-center w-24">Subtasks Done</th>
                <th className="py-2.5 px-3 text-center w-20">Points</th>
                <th className="py-2.5 px-3 text-center w-24">Missed Tasks</th>
                <th className="py-2.5 px-3 w-28 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground/50 italic text-xs">
                    No team members found for this month
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((stat) => {
                  const empKey = stat.employee?.id || stat.employee?.uid || `emp-rank-${stat.rank}`;
                  const profileUrl = `/tasks?view=performance&employeeId=${empKey}`;

                  return (
                    <tr
                      key={empKey}
                      onClick={() => onSelectEmployee(stat.employee)}
                      className="group hover:bg-secondary/[0.05] transition-colors cursor-pointer"
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex justify-center">{renderRankBadge(stat.rank)}</div>
                      </td>

                      {/* Employee Profile Link */}
                      <td className="py-2.5 px-3">
                        <Link
                          href={profileUrl}
                          onClick={(e) => {
                            // Let regular click proceed with onSelectEmployee, but keep link href for right-click / middle-click
                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                              e.preventDefault();
                              onSelectEmployee(stat.employee);
                            }
                          }}
                          className="flex items-center gap-2.5 hover:underline"
                        >
                          <Avatar className="size-7 border border-border/60">
                            <AvatarImage src={getUserAvatar(stat.employee)} />
                            <AvatarFallback className="text-[9px] font-bold">
                              {stat.employee?.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate text-xs">
                              {stat.employee?.name || 'Team Member'}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60 truncate">
                              {stat.employee?.role || stat.employee?.email || 'Member'}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Tasks Done */}
                      <td className="py-2.5 px-3 text-center font-bold text-foreground">
                        {stat.tasksCompleted}
                      </td>

                      {/* Subtasks Done */}
                      <td className="py-2.5 px-3 text-center font-bold text-blue-600">
                        {stat.subtasksCompleted}
                      </td>

                      {/* Points */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">
                        {stat.pointsEarned}
                      </td>

                      {/* Missed Tasks */}
                      <td className="py-2.5 px-3 text-center">
                        {stat.overdueTasks > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                            {stat.overdueTasks}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-[9px]">0</span>
                        )}
                      </td>

                      {/* Action Link */}
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={profileUrl}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                              e.preventDefault();
                              onSelectEmployee(stat.employee);
                            }
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-primary group-hover:bg-primary/10 rounded-md transition-all pointer-events-none"
                          >
                            View <ChevronRight size={11} className="ml-0.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
