"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";
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
  onAddClick,
  canManage,
  personnel,
}: {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>, action?: string) => void;
  onDeleteTask: (id: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  onAddClick: (status?: Status, date?: Date) => void;
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

  // Calculate the start of the visible range
  const rangeStart = dateRange[0];

  // Group tasks by date and separate unscheduled/overdue tasks
  const { tasksByDate, unscheduledTasks } = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    const unscheduled: Task[] = [];
    
    dateRange.forEach(date => grouped.set(format(date, 'yyyy-MM-dd'), []));

    tasks.forEach(task => {
      if (!task.dueDate) {
        unscheduled.push(task);
        return;
      }

      const dateObj = new Date(task.dueDate);
      
      const dateKey = format(dateObj, 'yyyy-MM-dd');
      
      if (grouped.has(dateKey)) {
        grouped.get(dateKey)?.push(task);
      } else if (dateObj < rangeStart && task.status !== 'done') {
        // Task is overdue and before our range
        unscheduled.push(task);
      }
    });

    return { tasksByDate: grouped, unscheduledTasks: unscheduled };
  }, [tasks, dateRange, rangeStart]);

  const handleDateDrop = (taskId: string, targetDate: Date | null) => {
    onUpdateTask(taskId, { dueDate: targetDate ? targetDate.toISOString() : undefined }, 'date_updated');
  };

  return (
    <div className="flex flex-col h-full gap-4 min-w-full lg:w-full overflow-hidden">
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
          {/* Unscheduled Column */}
          <UnscheduledColumn
            tasks={unscheduledTasks}
            onTaskClick={onTaskClick}
            onDateDrop={handleDateDrop}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onQuickEdit={onQuickEdit}
            onAddClick={onAddClick}
            canManage={canManage}
            personnel={personnel}
            isMobile={isMobile}
          />

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
                onDateDrop={(taskId, date) => handleDateDrop(taskId, date)}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
                onQuickEdit={onQuickEdit}
                onAddClick={onAddClick}
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

// --- Unscheduled Column Component ---
const UnscheduledColumn = ({
  tasks,
  onTaskClick,
  onDateDrop,
  onDeleteTask,
  onUpdateTask,
  onQuickEdit,
  onAddClick,
  canManage,
  personnel,
  isMobile,
}: {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onDateDrop: (taskId: string, targetDate: Date | null) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>, action?: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  onAddClick: (status?: Status, date?: Date) => void;
  canManage: boolean;
  personnel: any[];
  isMobile: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDateDrop(taskId, null); // Clear due date
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-2 transition-all duration-300 border-2",
        isMobile ? "min-w-full h-auto min-h-[140px]" : "min-w-[200px] flex-1 h-full",
        isDragOver ? "bg-primary/5 border-primary/10 ring-1 ring-primary/20" : "bg-secondary/10 border-transparent",
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between shrink-0 mb-3 px-2">
        <h3 className="font-bold text-sm text-foreground/80 uppercase tracking-tight">
          Unscheduled
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
            {tasks.length}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-md hover:bg-background/80"
            onClick={() => onAddClick('todo')}
          >
             <Plus size={14} />
          </Button>
        </div>
      </div>
      <div className={cn("flex-1", isMobile ? "" : "overflow-hidden")}>
        <div className={cn(
            "flex flex-col gap-2 px-1",
            isMobile ? "" : "min-h-[100px]"
        )}>
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.length === 0 && (
              <div className="h-20 flex flex-col items-center justify-center text-muted-foreground/10 border-2 border-dashed border-border/10 rounded-xl m-1">
                 <span className="text-[9px] font-medium uppercase tracking-widest text-center px-4">All tasks are scheduled</span>
              </div>
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
  onAddClick,
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
  onAddClick: (status?: Status, date?: Date) => void;
  canManage: boolean;
  personnel: any[];
  isMobile: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
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
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between shrink-0 mb-3 px-2">
        <h3 className={cn("font-bold text-sm", isToday ? "text-blue-600" : "text-foreground/80")}>
          {format(date, 'EEE, MMM d')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
            {tasks.length}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-md hover:bg-background/80"
            onClick={() => onAddClick('todo', date)}
          >
             <Plus size={14} />
          </Button>
        </div>
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
                 className="h-20 flex flex-col items-center justify-center text-muted-foreground/20 border-2 border-dashed border-border/20 rounded-xl m-1 cursor-pointer hover:bg-secondary/20 hover:border-primary/30 hover:text-primary transition-all group/empty"
                 onClick={() => onAddClick('todo', date)}
              >
                 <Plus size={16} className="mb-1 opacity-50 group-hover/empty:scale-110 transition-transform" />
                 <span className="text-[10px] font-medium uppercase tracking-widest">Start here</span>
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

