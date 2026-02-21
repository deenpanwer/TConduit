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
import { Textarea } from "@/components/ui/textarea";
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
  const inputRef = useRef<HTMLInputElement>(null);
  
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
          "group relative bg-card p-3.5 rounded-xl shadow-sm border border-border/40 mb-2.5 select-none transition-shadow",
          isEditing ? "ring-2 ring-primary/20 cursor-text" : "cursor-grab active:cursor-grabbing hover:border-border/80"
        )}
      >
      <div className={cn("absolute left-3.5 top-4 w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-offset-card", PRIORITIES[task.priority].color)} />

      <div className="pl-5">
        <div className="flex justify-between items-start mb-1.5 min-h-[20px]">
          {isEditing ? (
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
          ) : (
            <h3 
              className="font-semibold text-sm text-foreground leading-snug pr-6 break-words"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {task.title}
            </h3>
          )}
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex gap-1">
             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
                <Trash2 size={12} />
             </Button>
          </div>
        </div>
        
        {/* Metadata Row */}
        <div className="flex items-center gap-3 mt-2 min-h-[16px]">
          {dateInfo && (
            <div className={cn("text-[10px] font-medium flex items-center gap-1", dateInfo.color)}>
              <Clock size={10} />
              {dateInfo.text}
            </div>
          )}

          {task.subtasks.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title={`${completedSubtasks} of ${task.subtasks.length} completed`}>
              <CheckSquare size={10} />
              <span>{completedSubtasks}/{task.subtasks.length}</span>
            </div>
          )}
          
          <div className="ml-auto flex -space-x-1.5">
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
  onDropTask: (taskId: string, status: Status) => void; // Reverted signature
  onQuickAdd: (status: Status, title: string) => void;
  onQuickEdit: (id: string, title: string) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

      <ScrollArea className="flex-1 px-2.5 pb-2">
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
             <Input
                ref={inputRef}
                placeholder="+ Add task"
                className="h-9 bg-transparent border-none shadow-none text-sm text-muted-foreground hover:bg-secondary/30 focus:bg-background focus:ring-1 focus:ring-ring/20 transition-all rounded-lg placeholder:text-muted-foreground/40"
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitQuickAdd();
                  }
                }}
             />
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
};

// --- 4. Main Page Component ---

export default function Test15Page() {
  const [tasks, dispatch] = useReducer(taskReducer, INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<{ task: Task, index: number } | null>(null);

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

  const selectedTask = useMemo(() => 
    tasks.find(t => t.id === selectedTaskId) || null
  , [tasks, selectedTaskId]);

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

  const handleQuickAdd = useCallback((status: Status, title: string) => {
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
    };
    dispatch({ type: "ADD_TASK", task: newTask });
  }, []);

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: "UPDATE_TASK", taskId: id, updates });
  }, []);

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
        </div>
      </header>

      {/* 4.2. Board Canvas (Responsive Flex) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background">
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
                      onClick={() => setSelectedTaskId(null)}
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
                 <Textarea 
                    value={selectedTask.title}
                    onChange={(e) => handleUpdateTask(selectedTask.id, { title: e.target.value })}
                    className="text-3xl font-bold bg-transparent border-none p-0 shadow-none resize-none focus-visible:ring-0 leading-tight min-h-[48px] mb-6 placeholder:text-muted-foreground/30"
                    placeholder="Task Title"
                 />

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
                    <Textarea 
                       value={selectedTask.description}
                       onChange={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
                       className="min-h-[120px] text-sm bg-secondary/20 border-transparent focus:bg-background focus:border-border/50 resize-none rounded-xl leading-relaxed"
                       placeholder="Add details about this task..."
                    />
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
                             <Input 
                                value={sub.title}
                                onChange={(e) => {
                                   const newSub = [...selectedTask.subtasks];
                                   newSub[idx].title = e.target.value;
                                   handleUpdateTask(selectedTask.id, { subtasks: newSub });
                                }}
                                className={cn(
                                   "h-8 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 text-sm flex-1",
                                   sub.completed && "text-muted-foreground line-through decoration-border"
                                )}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
