'use client';

import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, AlertCircle, Clock, ListTodo, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface LedgerItem {
  id: string;
  title: string;
  type: 'task' | 'subtask';
  parentTitle?: string;
  category?: string;
  points?: number;
  dueDate?: string | null;
  completedAt?: string | null;
  slaStatus: 'on-time' | 'late' | 'overdue' | 'in-progress';
  completedByName?: string | null;
  priority?: string;
}

interface PerformanceLedgerTableProps {
  items: LedgerItem[];
  title?: string;
  className?: string;
  onItemClick?: (id: string) => void;
}

export function PerformanceLedgerTable({
  items,
  title = 'TASK RECORD & HISTORY',
  className,
  onItemClick,
}: PerformanceLedgerTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'task' | 'subtask' | 'overdue'>('all');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter === 'task' && item.type !== 'task') return false;
      if (typeFilter === 'subtask' && item.type !== 'subtask') return false;
      if (typeFilter === 'overdue' && item.slaStatus !== 'overdue') return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        (item.parentTitle && item.parentTitle.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.completedByName && item.completedByName.toLowerCase().includes(query))
      );
    });
  }, [items, searchQuery, typeFilter]);

  const renderSLABadge = (status: LedgerItem['slaStatus']) => {
    switch (status) {
      case 'on-time':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Check size={10} className="stroke-[3]" /> ON-TIME
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock size={10} /> COMPLETED LATE
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-pulse">
            <AlertCircle size={10} /> OVERDUE / MISSED
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Clock size={10} /> IN PROGRESS
          </span>
        );
    }
  };

  const safeFormatDate = (dateVal?: string | null) => {
    if (!dateVal) return <span className="text-muted-foreground/30">—</span>;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return <span className="text-muted-foreground/30">—</span>;
      return format(d, 'MMM d, yyyy');
    } catch {
      return <span className="text-muted-foreground/30">—</span>;
    }
  };

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm flex flex-col min-h-[420px]', className)}>
      {/* Header with Search & Filter */}
      <div className="p-4 sm:p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">
            {title} ({filteredItems.length})
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
            Detailed chronological record of tasks, subtasks & SLA performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-secondary/40 p-0.5 rounded-xl border border-border/40">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all',
                typeFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('task')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all',
                typeFilter === 'task' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tasks
            </button>
            <button
              onClick={() => setTypeFilter('subtask')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all',
                typeFilter === 'subtask' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Subtasks
            </button>
            <button
              onClick={() => setTypeFilter('overdue')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all',
                typeFilter === 'overdue' ? 'bg-rose-500/10 text-rose-600 font-bold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Overdue
            </button>
          </div>

          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={13} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="h-8 pl-8 text-xs bg-secondary/20 border-border/40 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/15 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              <th className="py-3 px-4 min-w-[240px]">Task / Subtask Name</th>
              <th className="py-3 px-3 w-28">Type</th>
              <th className="py-3 px-3 w-32">Bucket / Group</th>
              <th className="py-3 px-3 w-20 text-center">Points</th>
              <th className="py-3 px-3 w-32">Deadline</th>
              <th className="py-3 px-3 w-32">Completed At</th>
              <th className="py-3 px-4 w-36 text-right">SLA Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground/50 italic text-xs">
                  No task records found for this period
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    'group hover:bg-secondary/[0.04] transition-colors',
                    onItemClick && 'cursor-pointer'
                  )}
                >
                  {/* Task Name */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      {item.parentTitle && (
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                          Parent: <strong className="text-foreground/70">{item.parentTitle}</strong>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3">
                    {item.type === 'task' ? (
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 border-primary/30 bg-primary/5 text-primary">
                        Task
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 border-blue-500/30 bg-blue-500/5 text-blue-500">
                        Subtask
                      </Badge>
                    )}
                  </td>

                  {/* Bucket */}
                  <td className="py-3 px-3 text-[11px] font-semibold text-muted-foreground truncate max-w-[130px]">
                    {item.category || 'Default'}
                  </td>

                  {/* Points */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-[11px] text-blue-600">
                    {item.points ? item.points : '—'}
                  </td>

                  {/* Deadline */}
                  <td className="py-3 px-3 text-[10px] font-semibold text-muted-foreground">
                    {safeFormatDate(item.dueDate)}
                  </td>

                  {/* Completed At */}
                  <td className="py-3 px-3 text-[10px] font-semibold text-muted-foreground">
                    {safeFormatDate(item.completedAt)}
                  </td>

                  {/* SLA Status */}
                  <td className="py-3 px-4 text-right">
                    {renderSLABadge(item.slaStatus)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
