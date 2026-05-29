"use client";

import React, { useState, useMemo, useRef, useEffect, useReducer, useCallback } from "react";
import { 
  motion, AnimatePresence, LayoutGroup 
} from "framer-motion";
import { 
  Plus, Calendar, Flag, X, Check, Search, 
  Trash2, CheckSquare, Clock, ArrowUpRight, 
  Sun, Moon, MoreHorizontal, LayoutGrid, List as ListIcon, 
  ChevronRight, GripVertical, Image as ImageIcon,
  User as UserIcon, AtSign, Undo2, Link as LinkIcon, Bold, Italic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import { Toaster, toast } from "sonner"; // Using sonner for cleaner toasts
import { Textarea } from "@/components/ui/textarea";

const MAX_TEXTAREA_HEIGHT_QUICK_ADD = 180;
const MAX_TEXTAREA_HEIGHT_TITLE = 150;

interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setShowTopFade?: (show: boolean) => void;
  setShowBottomFade?: (show: boolean) => void;
  maxHeight: number; // Prop to specify max height
}

const AutoResizingTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizingTextareaProps>(
  ({ className, setShowTopFade, setShowBottomFade, maxHeight, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = () => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        if (setShowTopFade && setShowBottomFade) { // Only call handleScroll if fade props are provided
            handleScroll();
        }
      }
    };

    const handleScroll = React.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && setShowTopFade && setShowBottomFade) {
        const { scrollTop, scrollHeight, clientHeight } = textarea;
        setShowTopFade(scrollTop > 0);
        setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1);
      }
    }, [setShowTopFade, setShowBottomFade]);

    React.useEffect(() => {
        handleInput();
    }, [props.value]);

    React.useEffect(() => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleInput);
        return () => {
            if (textarea) {
              textarea.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('resize', handleInput);
        }
      }
    }, [handleScroll]);

    return (
      <div className="relative w-full">
        <textarea
          ref={internalRef}
          rows={1}
          onInput={handleInput}
          className={cn(
            "w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-4 text-base",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
AutoResizingTextarea.displayName = 'AutoResizingTextarea';

// --- 1. Types & Constants ---

type Priority = "low" | "medium" | "high" | "critical";
type Status = "todo" | "in_progress" | "review" | "done";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: { name: string; avatar?: string };
}

interface Comment {
  id: string;
  user: { name: string; avatar: string };
  text: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignees: User[]; 
  dueDate?: string;
  coverImage?: string;
  tags: string[];
  subtasks: Subtask[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

const COLUMNS: { id: Status; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const PRIORITIES: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "bg-slate-500", bg: "bg-slate-100 text-slate-700" },
  medium: { label: "Medium", color: "bg-blue-500", bg: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-500", bg: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-500", bg: "bg-red-100 text-red-700" },
};

const MOCK_USERS: User[] = [
  { id: "u1", name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah", role: "Designer" },
  { id: "u2", name: "Mike Ross", avatar: "https://i.pravatar.cc/150?u=mike", role: "Developer" },
  { id: "u3", name: "Alex Kim", avatar: "https://i.pravatar.cc/150?u=alex", role: "Manager" },
  { id: "me", name: "Me", avatar: "https://github.com/shadcn.png", role: "Owner" },
];

const CURRENT_USER = MOCK_USERS[3]; 

// --- 2. State Management ---

type Action = 
  | { type: "MOVE_TASK"; taskId: string; toStatus: Status }
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; taskId: string; updates: Partial<Task> }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "SET_TASKS"; tasks: Task[] };

const taskReducer = (state: Task[], action: Action): Task[] => {
  switch (action.type) {
    case "MOVE_TASK":
      return state.map(t => 
        t.id === action.taskId 
          ? { ...t, status: action.toStatus, updatedAt: new Date().toISOString() } 
          : t
      );
    case "ADD_TASK":
      return [...state, action.task];
    case "UPDATE_TASK":
      return state.map(t => 
        t.id === action.taskId 
          ? { ...t, ...action.updates, updatedAt: new Date().toISOString() } 
          : t
      );
    case "DELETE_TASK":
      return state.filter(t => t.id !== action.taskId);
    case "SET_TASKS":
      return action.tasks;
    default:
      return state;
  }
};

const INITIAL_TASKS: Task[] = [
  {
    id: "t-1",
    title: "Design System Audit",
    description: "Review component library for accessibility compliance.",
    status: "in_progress",
    priority: "high",
    assignees: [MOCK_USERS[0]],
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    tags: ["Design"],
    subtasks: [
      { id: "st-1", title: "Contrast check", completed: true, completedBy: MOCK_USERS[0] },
      { id: "st-2", title: "Focus states", completed: false },
    ],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t-2",
    title: "Q3 Marketing Assets",
    description: "Prepare assets for the upcoming campaign.",
    status: "todo",
    priority: "medium",
    assignees: [], // Assigned to everyone
    tags: ["Marketing"],
    subtasks: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// --- 3. Utilities & Components ---

function formatDateSmart(dateString: string) {
  const date = new Date(dateString);
  if (isToday(date)) return { text: "Today", color: "text-green-600 dark:text-green-400" };
  if (isTomorrow(date)) return { text: "Tomorrow", color: "text-blue-600 dark:text-blue-400" };
  if (isYesterday(date)) return { text: "Yesterday", color: "text-red-600 dark:text-red-400" };
  if (date < new Date()) return { text: format(date, "MMM d"), color: "text-red-600 dark:text-red-400" };
  return { text: format(date, "MMM d"), color: "text-muted-foreground" };
}

// 3.1. Task Card
const TaskCard = ({ 
  task, 
  onClick,
  onDelete,
  onQuickEdit
}: { 
  task: Task; 
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickEdit: (id: string, title: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showFullDescription, setShowFullDescription] = useState(false); // New state for description
  const [showFullTitle, setShowFullTitle] = useState(false); // New state for title
  const inputRef = useRef<HTMLInputElement>(null);
  
  const MAX_TITLE_LENGTH = 60;
  
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const dateInfo = task.dueDate ? formatDateSmart(task.dueDate) : null;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onQuickEdit(task.id, editTitle);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      draggable="true"
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
        // Subtle ghost image handling
        const el = e.currentTarget as HTMLElement;
        setTimeout(() => el.style.opacity = "0.5", 0);
      }}
      onDragEnd={(e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
    >
      <motion.div
        layoutId={task.id}
        layout="position"
        onClick={() => !isEditing && onClick(task.id)}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02, zIndex: 10, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.12)" }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "group relative bg-card rounded-xl shadow-sm border border-border/40 mb-3 mx-0.5 select-none transition-shadow", // Changed mb-2.5 to mb-3
          isEditing ? "ring-2 ring-primary/20 cursor-text" : "cursor-grab active:cursor-grabbing hover:border-border/80"
        )}
      >
      {task.coverImage && (
         <div className="relative w-full h-24 rounded-t-xl overflow-hidden mb-3">
            <img src={task.coverImage} alt="Task Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
         </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2"> {/* Adjusted for vertical alignment */}
          {isEditing ? (
            <div className="flex items-center flex-1"> {/* Flex container for dot and input */}
              <div className={cn("w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-offset-card mr-2 shrink-0", PRIORITIES[task.priority].color)} /> {/* Dot next to input */}
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => {
                   onQuickEdit(task.id, editTitle);
                   setIsEditing(false);
                }}
                onKeyDown={handleKeyDown}
                className="h-6 py-0 px-1 text-sm font-semibold border-none shadow-none focus-visible:ring-0 -ml-1.5 w-full bg-secondary/30 rounded"
              />
            </div>
          ) : (
            <div className="flex items-center flex-1"> {/* Flex container for dot and h3 */}
              <div className={cn("w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-offset-card mr-2 shrink-0", PRIORITIES[task.priority].color)} /> {/* Dot next to title */}
              <h3 
                className="font-semibold text-sm text-foreground leading-snug pr-6 break-words"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                {showFullTitle || task.title.length <= MAX_TITLE_LENGTH
                  ? task.title
                  : `${task.title.substring(0, MAX_TITLE_LENGTH)}...`}
                {task.title.length > MAX_TITLE_LENGTH && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs font-medium ml-1"
                    onClick={(e) => { e.stopPropagation(); setShowFullTitle(!showFullTitle); }}
                  >
                    {showFullTitle ? "Show less" : "Read more"}
                  </Button>
                )}
              </h3>
            </div>
          )}
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex gap-1">
             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
                <Trash2 size={12} />
             </Button>
          </div>
        </div>
        
        {/* Metadata Row */}
        <div className="flex items-center gap-4 mt-2 min-h-[16px]">
          {dateInfo ? ( // Changed to ternary
            <div className={cn("text-[10px] font-medium flex items-center gap-1", dateInfo.color)}>
              <Clock size={10} />
              {dateInfo.text}
            </div>
          ) : null} {/* Explicitly return null */}

          {task.subtasks.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title={`${completedSubtasks} of ${task.subtasks.length} completed`}>
              <CheckSquare size={10} />
              <span>{completedSubtasks}/{task.subtasks.length}</span>
            </div>
          )}
          
          <div className="ml-auto flex -space-x-2">
            {task.assignees.length > 0 ? (
              task.assignees.slice(0, 3).map((u, i) => (
                <TooltipProvider key={u.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-4 w-4 ring-1 ring-background z-[1]" style={{ zIndex: 3 - i }}>
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-[6px]">{u.name[0]}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] py-1 px-2">
                      {u.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            ) : (
               <div className="flex items-center justify-center h-4 w-4 rounded-full bg-secondary text-[8px] font-bold text-muted-foreground ring-1 ring-background" title="Assigned to everyone">
                 <AtSign size={8} />
               </div>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="text-xs text-muted-foreground leading-snug mt-2 mb-3">
            {showFullDescription || task.description.length <= 120
              ? task.description
              : `${task.description.substring(0, 120)}...`}
            {task.description.length > 120 && (
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-xs font-medium ml-1"
                onClick={(e) => { e.stopPropagation(); setShowFullDescription(!showFullDescription); }}
              >
                {showFullDescription ? "Show less" : "Read more"}
              </Button>
            )}
          </div>
        )}


      </div>
      </motion.div>
    </div>
  );
};

// 3.2. Column
const Column = ({ 
  column, 
  tasks, 
  onTaskClick, 
  onDeleteTask,
  onDropTask,
  onQuickAdd,
  onQuickEdit
}: { 
  column: typeof COLUMNS[0]; 
  tasks: Task[]; 
  onTaskClick: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDropTask: (taskId: string, status: Status) => void; 
  onQuickAdd: (status: Status, title: string, coverImage?: string) => void;
  onQuickEdit: (id: string, title: string) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  };

  const submitQuickAdd = () => {
    if (quickAddValue.trim()) {
      onQuickAdd(column.id, quickAddValue.trim());
      setQuickAddValue("");
    }
  };

  // Analytics
  const highPriorityCount = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;

  return (
    <div 
      className={cn(
        "flex flex-col h-full min-w-[280px] flex-1 rounded-2xl transition-all duration-300 border-2",
        isDragOver ? "bg-primary/5 border-primary/10 ring-1 ring-primary/20" : "bg-transparent border-transparent"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="px-4 py-3 flex items-center justify-between shrink-0 group">
        <div className="flex items-center gap-2">
           <h2 className="font-bold text-sm text-foreground/80 tracking-tight">{column.title}</h2>
           <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
             {tasks.length}
           </span>
           {highPriorityCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title={`${highPriorityCount} High Priority items`} />
           )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" onClick={() => inputRef.current?.focus()}>
           <Plus size={14} />
        </Button>
      </div>
      
      {/* Progress Bar (Subtle) */}
      <div className="px-4 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary/20" style={{ width: `${Math.min(100, (tasks.length / 10) * 100)}%` }} />
         </div>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="flex flex-col min-h-[150px] gap-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.length === 0 && (
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-32 flex flex-col items-center justify-center text-muted-foreground/20 border-2 border-dashed border-border/20 rounded-xl m-1"
               >
                  <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center mb-2">
                     <Plus size={14} />
                  </div>
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
              />
            ))}
          </AnimatePresence>
          
          <motion.div layout className="mt-1 px-1">
             <div className={cn("relative w-full",
                 {"fade-top": showTopFade, "fade-bottom": showBottomFade}
             )}>
                 <AutoResizingTextarea
                    ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                    placeholder="+ Add task"
                    className="bg-transparent border-none shadow-none text-sm text-muted-foreground hover:bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all rounded-lg placeholder:text-muted-foreground/40 min-h-[36px] p-2 scrollbar-hide"
                    value={quickAddValue}
                    onChange={(e) => setQuickAddValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitQuickAdd();
                      }
                    }}
                    rows={1}
                    setShowTopFade={setShowTopFade}
                    setShowBottomFade={setShowBottomFade}
                    maxHeight={MAX_TEXTAREA_HEIGHT_QUICK_ADD}
                 />
             </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
};

// 3.3. Timeline View
const TimelineView = ({
  tasks,
  onTaskClick,
  onDropTask, // Still passing this for now, will adapt or replace
  onUpdateTask,
  onDeleteTask,
}: {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onDropTask: (taskId: string, status: Status) => void; // This needs to be adapted for dueDate
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}) => {
  // Generate a range of dates
  const today = new Date();
  const startDate = new Date(today.setDate(today.getDate() - 3)); // 3 days before today
  const endDate = new Date(today.setDate(today.getDate() + 10)); // 10 days after today (from original today)

  const dateRange: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    dateRange.forEach(date => grouped.set(format(date, 'yyyy-MM-dd'), [])); // Initialize all dates

    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (grouped.has(dueDateKey)) {
          grouped.get(dueDateKey)?.push(task);
        } else {
          // If a task has a due date outside our current range, add it to an "overflow" category or simply ignore
          // For now, let's just add it if the date wasn't initialized
          grouped.set(dueDateKey, [...(grouped.get(dueDateKey) || []), task]);
        }
      }
    });
    return grouped;
  }, [tasks, dateRange]);

  const handleDateDrop = (taskId: string, targetDate: Date) => {
    onUpdateTask(taskId, { dueDate: targetDate.toISOString() });
  };

  return (
    <div className="flex h-full gap-4 sm:gap-6 min-w-full lg:w-full lg:max-w-[1920px] mx-auto">
      <ScrollArea className="flex-1 w-full h-full">
        <div className="flex h-full py-1">
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
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const TimelineDayColumn = ({
  date,
  tasks,
  isToday,
  onTaskClick,
  onDateDrop,
  onDeleteTask,
  onUpdateTask
}: {
  date: Date;
  tasks: Task[];
  isToday: boolean;
  onTaskClick: (id: string) => void;
  onDateDrop: (taskId: string, targetDate: Date) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dateKey = format(date, 'yyyy-MM-dd');

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
        "flex flex-col h-full min-w-[200px] flex-1 rounded-2xl p-2 transition-all duration-300 border-2",
        isDragOver ? "bg-primary/5 border-primary/10 ring-1 ring-primary/20" : "bg-transparent border-transparent",
        isToday && "bg-blue-100/20 border-blue-200/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between shrink-0 mb-3">
        <h3 className={cn("font-bold text-sm", isToday ? "text-blue-600" : "text-foreground/80")}>
          {format(date, 'EEE, MMM d')}
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
          {tasks.length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-[100px] gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.length === 0 && (
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="h-24 flex items-center justify-center text-muted-foreground/20 border-2 border-dashed border-border/20 rounded-xl m-1"
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
                onQuickEdit={(id, title) => onUpdateTask(id, { title })}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

// --- 4. Main Page Component ---

export default function Test15Page() {
  const [tasks, dispatch] = useReducer(taskReducer, INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingNewTask, setEditingNewTask] = useState<Task | null>(null); // New state for task being created
  const [activeView, setActiveView] = useState<"board" | "timeline">("board"); // New state for active view
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<{ task: Task, index: number } | null>(null);
  const [showTopFadeTitle, setShowTopFadeTitle] = useState(false);
  const [showBottomFadeTitle, setShowBottomFadeTitle] = useState(false);
  const [showTopFadeDescription, setShowTopFadeDescription] = useState(false);
  const [showBottomFadeDescription, setShowBottomFadeDescription] = useState(false);

const MAX_TEXTAREA_HEIGHT_DESCRIPTION = 300;
const MAX_TEXTAREA_HEIGHT_SUBTASK = 80;

  const handleAddNewTaskClick = useCallback(() => {
    const newTask: Task = {
      id: "new", // Temporary ID for a new task
      title: "",
      description: "",
      status: "todo", // Default status
      priority: "medium", // Default priority
      assignees: [],
      subtasks: [],
      comments: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date().toISOString(), // Default to today's date
    };
    setEditingNewTask(newTask);
    setSelectedTaskId("new"); // Set selectedId to a special value for new task
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Keyboard Shortcuts
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
         if (lastDeleted) {
            e.preventDefault();
            dispatch({ type: "ADD_TASK", task: lastDeleted.task }); // Simplified undo
            setLastDeleted(null);
            // Re-enable toast for undo success
            // toast("Undid delete action");
         }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [lastDeleted]);

  const selectedTask = useMemo(() => {
    if (selectedTaskId === "new") {
      return editingNewTask;
    }
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId, editingNewTask]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQuery = searchQuery.toLowerCase();
    
    if (lowerQuery.includes("high") || lowerQuery.includes("critical")) {
       return tasks.filter(t => t.priority === "high" || t.priority === "critical");
    }
    
    return tasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [tasks, searchQuery]);

  // --- Handlers ---

  const handleDropTask = useCallback((taskId: string, status: Status) => {
    dispatch({ type: "MOVE_TASK", taskId, toStatus: status });
    // toast.success(`Moved to ${COLUMNS.find(c => c.id === status)?.title}`);
  }, []);

  const handleQuickAdd = useCallback((status: Status, title: string, coverImage?: string) => {
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title,
      description: "",
      status,
      priority: "medium",
      assignees: [], // Default: Everyone
      subtasks: [],
      comments: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(coverImage && { coverImage }), // Conditionally add coverImage
    };
    dispatch({ type: "ADD_TASK", task: newTask });
  }, []);

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (id === "new" && editingNewTask) {
      setEditingNewTask(prev => prev ? { ...prev, ...updates } : null);
    } else {
      dispatch({ type: "UPDATE_TASK", taskId: id, updates });
    }
  }, [editingNewTask]);

  const handleSaveNewTask = useCallback(() => {
    if (editingNewTask && selectedTaskId === "new") {
      const finalTask = { ...editingNewTask, id: `t-${Date.now()}` }; // Assign real ID
      dispatch({ type: "ADD_TASK", task: finalTask });
      setEditingNewTask(null);
      setSelectedTaskId(null); // Close the detail sheet
    }
  }, [editingNewTask, selectedTaskId]);

  const handleDeleteTask = useCallback((id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
       setLastDeleted({ task: taskToDelete, index: 0 }); // Index tracking simplified
       dispatch({ type: "DELETE_TASK", taskId: id });
       if (selectedTaskId === id) setSelectedTaskId(null);
       // toast("Task deleted", {
       //    description: "Press Cmd+Z to undo",
       //    action: {
       //       label: "Undo",
       //       onClick: () => dispatch({ type: "ADD_TASK", task: taskToDelete })
       //    }
       // });
    }
  }, [tasks, selectedTaskId]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">
      {/* Removed sonner Toaster */}
      
      {/* 4.1. Refined Navigation */}
      <header className="h-14 px-6 flex items-center justify-between shrink-0 bg-background/60 backdrop-blur-xl z-10 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm">
                <LayoutGrid size={18} />
             </div>
             <span className="font-bold text-sm tracking-tight">Stratos</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={14} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="h-9 w-48 bg-secondary/30 border-transparent focus:bg-secondary/50 focus:w-64 focus:border-transparent focus:ring-0 transition-all rounded-lg pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border/40 pl-3">
            <Button 
              variant={activeView === "board" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 text-xs px-3"
              onClick={() => setActiveView("board")}
            >
              <LayoutGrid size={14} className="mr-2" /> Board
            </Button>
            <Button 
              variant={activeView === "timeline" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 text-xs px-3"
              onClick={() => setActiveView("timeline")}
            >
              <ListIcon size={14} className="mr-2" /> Timeline
            </Button>
          </div>

                    <div className="flex items-center gap-3">
                      <Button
                          className="font-semibold text-xs h-8 px-3 rounded-md"
                          onClick={handleAddNewTaskClick} // New handler
                      >
                          <Plus size={14} className="mr-2" /> Add Task
                      </Button>
                      <div className="flex items-center border-l border-border/40 pl-3 gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-secondary"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                        </Button>
                        <Avatar className="h-8 w-8 border border-border/50">
                            <AvatarImage src={CURRENT_USER.avatar} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>        </div>
      </header>

      {/* 4.2. Board Canvas (Responsive Flex) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background">
        {activeView === "board" && (
          <div className="flex h-full gap-4 sm:gap-6 min-w-full lg:w-full lg:max-w-[1920px] mx-auto">
            <LayoutGroup>
              {COLUMNS.map(column => (
                <Column 
                  key={column.id}
                  column={column}
                  tasks={filteredTasks.filter(t => t.status === column.id)}
                  onTaskClick={setSelectedTaskId}
                  onDeleteTask={handleDeleteTask}
                  onDropTask={handleDropTask}
                  onQuickAdd={handleQuickAdd}
                  onQuickEdit={(id, title) => handleUpdateTask(id, { title })}
                />
              ))}
            </LayoutGroup>
          </div>
        )}

        {activeView === "timeline" && (
          <TimelineView // This will be our new component
            tasks={filteredTasks}
            onTaskClick={setSelectedTaskId}
            onDropTask={handleDropTask} // Re-using, will need modification
            onUpdateTask={handleUpdateTask} // For dragging between dates
            onDeleteTask={handleDeleteTask}
          />
        )}
      </main>

      {/* 4.3. Functional Detail Sheet */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-4 right-4 z-50 w-full max-w-lg bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col outline-none"
            >
              {/* Cover Image */}
              <div className="h-40 shrink-0 relative bg-secondary/30 group">
                {selectedTask.coverImage ? (
                  <img src={selectedTask.coverImage} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-muted-foreground/10 bg-gradient-to-br from-secondary/50 to-background">
                      <ImageIcon size={48} />
                   </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm">
                            <ImageIcon size={14} />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3">
                         <div className="space-y-2">
                            <h4 className="font-medium leading-none text-xs">Set Cover Image</h4>
                            <Input 
                               placeholder="Image URL..." 
                               className="h-8 text-xs"
                               onKeyDown={(e) => {
                                  if(e.key === 'Enter') {
                                     handleUpdateTask(selectedTask.id, { coverImage: e.currentTarget.value });
                                  }
                               }}
                            />
                         </div>
                      </PopoverContent>
                   </Popover>

                   <Button 
                      size="icon" variant="secondary" 
                      className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm"
                      onClick={() => {
                        if (selectedTaskId === "new") {
                          handleSaveNewTask();
                        } else {
                          setSelectedTaskId(null);
                        }
                      }}
                   >
                      <ArrowUpRight size={14} />
                   </Button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 -mt-6 relative bg-card rounded-t-3xl border-t border-border/50">
                 {/* Metadata */}
                 <div className="flex items-center gap-3 mb-6">
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider gap-2 border-border/50">
                             <div className={cn("w-2 h-2 rounded-full", PRIORITIES[selectedTask.priority].color)} />
                             {selectedTask.priority} Priority
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="start">
                          {Object.entries(PRIORITIES).map(([key, val]) => (
                             <DropdownMenuItem key={key} onClick={() => handleUpdateTask(selectedTask.id, { priority: key as Priority })}>
                                <div className={cn("w-2 h-2 rounded-full mr-2", val.color)} />
                                {val.label}
                             </DropdownMenuItem>
                          ))}
                       </DropdownMenuContent>
                    </DropdownMenu>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Calendar size={12} className="mr-2" />
                            {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), "MMM d") : "Set Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined}
                          onSelect={(date) => handleUpdateTask(selectedTask.id, { dueDate: date?.toISOString() })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                 </div>

                 {/* Title */}
                 <div className={cn("relative w-full",
                    {"fade-top": showTopFadeTitle, "fade-bottom": showBottomFadeTitle}
                 )}>
                    <AutoResizingTextarea
                       value={selectedTask.title}
                       onChange={(e) => handleUpdateTask(selectedTask.id, { title: e.target.value })}
                       className="text-3xl font-bold bg-transparent border-none p-0 shadow-none focus-visible:ring-0 leading-tight mb-6 placeholder:text-muted-foreground/30 min-h-[48px] scrollbar-hide focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-xl"
                       placeholder="Task Title"
                       setShowTopFade={setShowTopFadeTitle}
                       setShowBottomFade={setShowBottomFadeTitle}
                       maxHeight={MAX_TEXTAREA_HEIGHT_TITLE}
                    />
                 </div>

                 {/* Assignees */}
                 <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Assigned To</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {selectedTask.assignees.length > 0 ? (
                          selectedTask.assignees.map(u => (
                             <Badge key={u.id} variant="secondary" className="pl-1 pr-2 py-1 gap-2 hover:bg-secondary/80">
                                <Avatar className="h-5 w-5">
                                   <AvatarImage src={u.avatar} />
                                   <AvatarFallback>{u.name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{u.name}</span>
                                <X 
                                   size={12} 
                                   className="cursor-pointer text-muted-foreground hover:text-destructive"
                                   onClick={() => {
                                      const newAssignees = selectedTask.assignees.filter(a => a.id !== u.id);
                                      handleUpdateTask(selectedTask.id, { assignees: newAssignees });
                                   }}
                                />
                             </Badge>
                          ))
                       ) : (
                          <div className="text-xs text-muted-foreground flex items-center gap-2 px-2 py-1 bg-secondary/30 rounded-md border border-dashed border-border">
                             <AtSign size={12} /> Everyone
                          </div>
                       )}
                       
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 border border-dashed border-border hover:border-primary">
                                <Plus size={14} />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                             <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             {MOCK_USERS.map(user => {
                                const isAssigned = selectedTask.assignees.some(a => a.id === user.id);
                                return (
                                   <DropdownMenuItem 
                                      key={user.id}
                                      onClick={() => {
                                         if (isAssigned) return;
                                         handleUpdateTask(selectedTask.id, { assignees: [...selectedTask.assignees, user] });
                                      }}
                                      disabled={isAssigned}
                                   >
                                      <Avatar className="h-5 w-5 mr-2">
                                         <AvatarImage src={user.avatar} />
                                         <AvatarFallback>{user.name[0]}</AvatarFallback>
                                      </Avatar>
                                      {user.name}
                                   </DropdownMenuItem>
                                )
                             })}
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                 </div>

                 {/* Description */}
                 <div className="mb-8 group">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest mb-2 group-focus-within:text-primary transition-colors">
                       Description
                    </label>
                    <div className={cn("relative w-full rounded-xl",
                        {"fade-top": showTopFadeDescription, "fade-bottom": showBottomFadeDescription}
                    )}>
                       <AutoResizingTextarea
                          value={selectedTask.description}
                          onChange={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
                          className="min-h-[120px] text-sm bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none rounded-xl leading-relaxed scrollbar-hide p-2"
                          placeholder="Add details about this task..."
                          setShowTopFade={setShowTopFadeDescription}
                          setShowBottomFade={setShowBottomFadeDescription}
                          maxHeight={MAX_TEXTAREA_HEIGHT_DESCRIPTION}
                       />
                    </div>
                 </div>

                 {/* Subtasks */}
                 <div>
                    <div className="flex items-center justify-between mb-3">
                       <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest">
                          Subtasks
                       </label>
                       <span className="text-[10px] font-mono text-muted-foreground/50">
                          {selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length}
                       </span>
                    </div>

                    <div className="space-y-1">
                       {selectedTask.subtasks.map((sub, idx) => (
                          <div key={sub.id} className="flex items-center gap-2 group/sub">
                             <button 
                                onClick={() => {
                                   const newSub = [...selectedTask.subtasks];
                                   newSub[idx].completed = !newSub[idx].completed;
                                   newSub[idx].completedBy = newSub[idx].completed ? CURRENT_USER : undefined;
                                   handleUpdateTask(selectedTask.id, { subtasks: newSub });
                                }}
                                className={cn(
                                   "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                   sub.completed ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"
                                )}
                             >
                                {sub.completed && <Check size={12} />}
                             </button>
                             <AutoResizingTextarea
                                   value={sub.title}
                                   onChange={(e) => {
                                      const newSub = [...selectedTask.subtasks];
                                      newSub[idx].title = e.target.value;
                                      handleUpdateTask(selectedTask.id, { subtasks: newSub });
                                   }}
                                   className={cn(
                                      "relative w-full flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-md scrollbar-hide",
                                      sub.completed && "text-muted-foreground line-through decoration-border"
                                   )}
                                   maxHeight={MAX_TEXTAREA_HEIGHT_SUBTASK}
                                />
                             
                             {/* Completed By Badge */}
                             {sub.completed && sub.completedBy && (
                                <div className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground whitespace-nowrap">
                                   <Check size={8} /> {sub.completedBy.name.split(' ')[0]}
                                </div>
                             )}

                             <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                   const newSub = selectedTask.subtasks.filter(s => s.id !== sub.id);
                                   handleUpdateTask(selectedTask.id, { subtasks: newSub });
                                }}
                             >
                                <X size={12} />
                             </Button>
                          </div>
                       ))}
                       <Button 
                          variant="ghost" size="sm" 
                          className="h-8 text-xs text-muted-foreground hover:text-primary justify-start pl-1 mt-2"
                          onClick={() => handleUpdateTask(selectedTask.id, { subtasks: [...selectedTask.subtasks, { id: Math.random().toString(), title: "", completed: false }] })}
                       >
                          <Plus size={14} className="mr-2" /> Add Item
                       </Button>
                    </div>
                 </div>
              </div>

              {/* Detail Sheet Footer with Save/Cancel */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50 bg-card shrink-0">
                 <Button variant="outline" onClick={() => {
                    if (selectedTaskId === "new") {
                       setEditingNewTask(null); // Discard new task
                    }
                    setSelectedTaskId(null); // Close without saving for existing or after discard
                 }}>
                    Cancel
                 </Button>
                 <Button onClick={() => {
                    if (selectedTaskId === "new") {
                       handleSaveNewTask();
                    } else {
                       setSelectedTaskId(null); // Close for existing, changes are already saved
                       toast.success("Task updated!"); // Explicit feedback for existing tasks
                    }
                 }}>
                    Save
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
