"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task, Status } from "@/hooks/useTasks";
import { TaskCard } from "./BoardView";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Timeline View Component ---
export const TimelineView = ({
  tasks,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  onQuickEdit,
  canManage,
  personnel,
}: {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>, action?: string) => void;
  onDeleteTask: (id: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
}) => {
  const [viewOffset, setViewOffset] = useState(0);
  const isMobile = useIsMobile();

  // Generate a range of dates
  const dateRange = useMemo(() => {
    const range: Date[] = [];
    const today = new Date();
    // Start 3 days ago + offset, end 10 days from now + offset
    for (let i = -3 + viewOffset; i <= 10 + viewOffset; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      range.push(d);
    }
    return range;
  }, [viewOffset]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    dateRange.forEach(date => grouped.set(format(date, 'yyyy-MM-dd'), []));

    tasks.forEach(task => {
      // Use dueDate if available, otherwise fallback to createdAt
      const dateToUse = task.dueDate || task.createdAt;
      if (dateToUse) {
        const dateObj = typeof dateToUse === 'string' ? new Date(dateToUse) : 
                        dateToUse?.toDate ? dateToUse.toDate() : new Date(dateToUse);
        
        const dateKey = format(dateObj, 'yyyy-MM-dd');
        if (grouped.has(dateKey)) {
          grouped.get(dateKey)?.push(task);
        }
      }
    });
    return grouped;
  }, [tasks, dateRange]);

  const handleDateDrop = (taskId: string, targetDate: Date) => {
    onUpdateTask(taskId, { dueDate: targetDate.toISOString() }, 'date_updated');
  };

  return (
    <div className="flex flex-col h-full gap-4 min-w-full lg:w-full lg:max-w-[1920px] mx-auto overflow-hidden">
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-full border border-border/40">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full hover:bg-background shadow-none"
            onClick={() => setViewOffset(prev => Math.max(0, prev - 1))}
            disabled={viewOffset === 0}
          >
            <ChevronLeft size={14} />
          </Button>
          <div className="px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              {viewOffset === 0 ? "Timeline" : `Offset: +${viewOffset}d`}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full hover:bg-background shadow-none"
            onClick={() => setViewOffset(prev => prev + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>

        {viewOffset !== 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] font-bold uppercase tracking-widest gap-2 text-primary"
            onClick={() => setViewOffset(0)}
          >
            <RotateCcw size={12} /> Today
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 w-full h-full">
        <div className={cn(
            "flex py-1",
            isMobile ? "flex-col gap-6 px-2 h-auto" : "h-full"
        )}>
          {dateRange.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isTodayDate = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <TimelineDayColumn
                key={dateKey}
                date={date}
                tasks={dayTasks}
                isToday={isTodayDate}
                onTaskClick={onTaskClick}
                onDateDrop={handleDateDrop}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
                onQuickEdit={onQuickEdit}
                canManage={canManage}
                personnel={personnel}
                isMobile={isMobile}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

// --- Timeline Day Column Component ---
const TimelineDayColumn = ({
  date,
  tasks,
  isToday,
  onTaskClick,
  onDateDrop,
  onDeleteTask,
  onUpdateTask,
  onQuickEdit,
  canManage,
  personnel,
  isMobile,
}: {
  date: Date;
  tasks: Task[];
  isToday: boolean;
  onTaskClick: (id: string) => void;
  onDateDrop: (taskId: string, targetDate: Date) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>, action?: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
  isMobile: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canManage) return;
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDateDrop(taskId, date);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-2 transition-all duration-300 border-2",
        isMobile ? "min-w-full h-auto min-h-[140px]" : "min-w-[200px] flex-1 h-full",
        isDragOver ? "bg-primary/5 border-primary/10 ring-1 ring-primary/20" : "bg-transparent border-transparent",
        isToday && "bg-blue-100/20 border-blue-200/50"
      )}
      onDragOver={(e) => { e.preventDefault(); if (canManage) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between shrink-0 mb-3 px-2">
        <h3 className={cn("font-bold text-sm", isToday ? "text-blue-600" : "text-foreground/80")}>
          {format(date, 'EEE, MMM d')}
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
          {tasks.length}
        </span>
      </div>
      <div className={cn("flex-1", isMobile ? "" : "overflow-hidden")}>
        <div className={cn(
            "flex flex-col gap-2 px-1",
            isMobile ? "" : "min-h-[100px]"
        )}>
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.length === 0 && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="h-20 flex items-center justify-center text-muted-foreground/20 border-2 border-dashed border-border/20 rounded-xl m-1"
              >
                 <span className="text-[10px] font-medium uppercase tracking-widest">No tasks</span>
              </motion.div>
            )}
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                onDelete={onDeleteTask}
                onQuickEdit={onQuickEdit}
                canManage={canManage}
                personnel={personnel}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

