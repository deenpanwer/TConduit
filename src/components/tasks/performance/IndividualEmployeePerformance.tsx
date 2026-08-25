'use client';

import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from 'date-fns';
import { Task, Subtask } from '@/hooks/useTasks';
import { getUserAvatar } from '@/lib/utils';
import { MonthPicker } from './MonthPicker';
import { 
  ActivityTrendChart, 
  PriorityBreakdownChart, 
  ValueTierDistributionChart,
  TrendDataPoint,
  PriorityBreakdownPoint,
  ValueTierPoint
} from './PerformanceCharts';
import { PerformanceLedgerTable, LedgerItem } from './PerformanceLedgerTable';

interface IndividualEmployeePerformanceProps {
  employee: any;
  tasks: Task[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onBack: () => void;
  onTaskClick?: (taskId: string) => void;
}

export function IndividualEmployeePerformance({
  employee,
  tasks,
  selectedMonth,
  onMonthChange,
  onBack,
  onTaskClick,
}: IndividualEmployeePerformanceProps) {
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Helper to check if a date string falls in the selected month
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

  // Aggregate metrics for this employee
  const {
    trendData,
    priorityBreakdownData,
    valueTierData,
    ledgerItems,
  } = useMemo(() => {
    const items: LedgerItem[] = [];

    // Map of days in month for trend chart
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailyStats: Record<string, { tasks: number; subtasks: number; points: number }> = {};
    daysInMonth.forEach((d) => {
      dailyStats[format(d, 'yyyy-MM-dd')] = { tasks: 0, subtasks: 0, points: 0 };
    });

    // Priority breakdown
    const priorityStats: Record<string, { points: number; completed: number }> = {
      Critical: { points: 0, completed: 0 },
      High: { points: 0, completed: 0 },
      Medium: { points: 0, completed: 0 },
      Low: { points: 0, completed: 0 },
    };

    // Value Tier breakdown (< 10 pts, 10 - 20 pts, 20 - 50 pts, > 50 pts)
    const tierStats: Record<string, { total: number; completed: number }> = {
      '< 10 Pts': { total: 0, completed: 0 },
      '10 - 20 Pts': { total: 0, completed: 0 },
      '20 - 50 Pts': { total: 0, completed: 0 },
      '> 50 Pts': { total: 0, completed: 0 },
    };

    const getTierKey = (pts: number) => {
      if (pts < 10) return '< 10 Pts';
      if (pts <= 20) return '10 - 20 Pts';
      if (pts <= 50) return '20 - 50 Pts';
      return '> 50 Pts';
    };

    tasks.forEach((task) => {
      const isCompletedByEmployee = task.completedBy === employee.id;
      const isAssignedToEmployee = (task.assignees || []).includes(employee.id);
      const taskPoints = Number(task.leaderPoints) || 20;
      const tierKey = getTierKey(taskPoints);
      const taskPriorityKey = task.priority === 'critical' ? 'Critical' : task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium';

      // Check subtasks completed by employee
      (task.subtasks || []).forEach((sub: Subtask) => {
        if (sub.completed && (sub.completedBy === employee.id || (!sub.completedBy && isCompletedByEmployee))) {
          if (isInSelectedMonth(sub.completedAt || task.completedAt || task.updatedAt)) {
            const subCompletedDate = parseDate(sub.completedAt || task.completedAt || task.updatedAt);
            const subPoints = sub.pointsAwarded || Math.round((task.leaderPoints || 20) / Math.max(1, (task.subtasks || []).length));

            if (subCompletedDate) {
              const dayKey = format(subCompletedDate, 'yyyy-MM-dd');
              if (dailyStats[dayKey]) {
                dailyStats[dayKey].subtasks++;
                dailyStats[dayKey].points += subPoints;
              }
            }

            priorityStats[taskPriorityKey].completed++;
            priorityStats[taskPriorityKey].points += subPoints;

            items.push({
              id: `${task.id}-sub-${sub.id}`,
              title: sub.title,
              type: 'subtask',
              parentTitle: task.title,
              category: (task as any).groupTitle || (task as any).status || 'General',
              points: subPoints,
              dueDate: task.dueDate,
              completedAt: sub.completedAt ? new Date(sub.completedAt).toISOString() : null,
              slaStatus: 'on-time',
              completedByName: sub.completedByName || employee.name,
              priority: task.priority,
            });
          }
        }
      });

      // Check task level activity
      if (isCompletedByEmployee || isAssignedToEmployee) {
        const isTaskDone = task.flagged || task.status === 'done';
        const taskCompletedDate = parseDate(task.completedAt || (isTaskDone ? task.updatedAt : null));
        const taskDueDate = parseDate(task.dueDate);
        const taskCreatedDate = parseDate(task.createdAt);

        if (isInSelectedMonth(taskDueDate) || isInSelectedMonth(taskCreatedDate) || isInSelectedMonth(taskCompletedDate)) {
          tierStats[tierKey].total++;
        }

        if (isTaskDone && isCompletedByEmployee) {
          if (isInSelectedMonth(taskCompletedDate)) {
            let slaStatus: LedgerItem['slaStatus'] = 'on-time';
            if (taskDueDate && taskCompletedDate && taskCompletedDate > taskDueDate) {
              slaStatus = 'late';
            }

            priorityStats[taskPriorityKey].completed++;
            priorityStats[taskPriorityKey].points += taskPoints;
            tierStats[tierKey].completed++;

            if (taskCompletedDate) {
              const dayKey = format(taskCompletedDate, 'yyyy-MM-dd');
              if (dailyStats[dayKey]) {
                dailyStats[dayKey].tasks++;
                dailyStats[dayKey].points += taskPoints;
              }
            }

            items.push({
              id: task.id,
              title: task.title,
              type: 'task',
              category: (task as any).groupTitle || (task as any).status || 'General',
              points: taskPoints,
              dueDate: task.dueDate,
              completedAt: taskCompletedDate ? taskCompletedDate.toISOString() : null,
              slaStatus,
              completedByName: task.completedByName || employee.name,
              priority: task.priority,
            });
          }
        } else if (!isTaskDone && isAssignedToEmployee) {
          // Check if active in this month
          if (isInSelectedMonth(taskDueDate) || isInSelectedMonth(taskCreatedDate)) {
            const isOverdue = taskDueDate && isBefore(taskDueDate, new Date());

            items.push({
              id: task.id,
              title: task.title,
              type: 'task',
              category: (task as any).groupTitle || (task as any).status || 'General',
              points: taskPoints,
              dueDate: task.dueDate,
              completedAt: null,
              slaStatus: isOverdue ? 'overdue' : 'in-progress',
              completedByName: null,
              priority: task.priority,
            });
          }
        }
      }
    });

    // Trend chart formatting
    const formattedTrend: TrendDataPoint[] = daysInMonth.map((d) => {
      const dayKey = format(d, 'yyyy-MM-dd');
      const stat = dailyStats[dayKey] || { tasks: 0, subtasks: 0, points: 0 };
      return {
        date: dayKey,
        label: format(d, 'd MMM'),
        tasksCompleted: stat.tasks,
        subtasksCompleted: stat.subtasks,
        totalPoints: stat.points,
      };
    });

    const formattedPriority: PriorityBreakdownPoint[] = Object.entries(priorityStats).map(([category, stat]) => ({
      category,
      points: stat.points,
      completed: stat.completed,
    }));

    const formattedTiers: ValueTierPoint[] = Object.entries(tierStats).map(([tier, stat]) => ({
      tier,
      total: stat.total,
      completed: stat.completed,
    }));

    return {
      trendData: formattedTrend,
      priorityBreakdownData: formattedPriority,
      valueTierData: formattedTiers,
      ledgerItems: items,
    };
  }, [tasks, employee, monthKey, monthStart, monthEnd]);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto custom-scrollbar p-1 sm:p-2 space-y-2.5 sm:space-y-3 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/60 p-3 sm:p-3.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2.5 gap-1.5 font-bold uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground rounded-lg"
          >
            <ArrowLeft size={13} /> Back to Team
          </Button>

          <div className="h-5 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 border border-primary/20 shadow-sm">
              <AvatarImage src={getUserAvatar(employee)} />
              <AvatarFallback className="font-black text-[10px]">{employee?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight text-foreground uppercase">
                  {employee?.name || 'Team Member'}
                </h2>
                {employee?.role && (
                  <Badge variant="outline" className="text-[8px] font-black tracking-widest uppercase py-0 px-1.5 bg-secondary/50 border-border/60">
                    {employee.role}
                  </Badge>
                )}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                {employee?.email || 'Active Member'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <MonthPicker selectedDate={selectedMonth} onChange={onMonthChange} />
        </div>
      </div>

      {/* 1. Top Full-Width Smooth Curved Area Chart */}
      <ActivityTrendChart
        data={trendData}
        title={`${employee?.name?.toUpperCase() || 'EMPLOYEE'}'S COMPLETION & VELOCITY TREND`}
      />

      {/* 2. Bottom Two Side-by-Side Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
        <PriorityBreakdownChart
          data={priorityBreakdownData}
          title="TASK OUTPUT & POINTS BY PRIORITY"
        />
        <ValueTierDistributionChart
          data={valueTierData}
          title="TASK POINT SIZE DISTRIBUTION"
        />
      </div>

      {/* 3. Task & Subtask Record History Table */}
      <PerformanceLedgerTable
        items={ledgerItems}
        title={`${employee?.name?.split(' ')[0] || 'Employee'}'s Task & Subtask Record`}
        onItemClick={onTaskClick}
      />
    </div>
  );
}
