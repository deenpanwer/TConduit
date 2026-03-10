"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  motion, AnimatePresence, LayoutGroup 
} from "framer-motion";
import { 
  Plus, Calendar, Flag, X, Check, Search, 
  Trash2, CheckSquare, Clock, ArrowUpRight, 
  Sun, Moon, MoreHorizontal, LayoutGrid, List as ListIcon, 
  ChevronRight, GripVertical, Image as ImageIcon,
  User as UserIcon, AtSign, Undo2, Link as LinkIcon, Bold, Italic,
  History, MessageSquare
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
import { useTasks, Task, Status, Priority, Subtask, Comment, HistoryEntry } from "@/hooks/useTasks";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { InlineAudioPlayer } from "./InlineAudioPlayer";

// --- Utility Components ---

const MAX_TEXTAREA_HEIGHT_QUICK_ADD = 180;

interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setShowTopFade?: (show: boolean) => void;
  setShowBottomFade?: (show: boolean) => void;
  maxHeight: number;
}

export const AutoResizingTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizingTextareaProps>(
  ({ className, setShowTopFade, setShowBottomFade, maxHeight, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = () => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        if (setShowTopFade && setShowBottomFade) {
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

export const COLUMNS: { id: Status; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

export const PRIORITIES: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "bg-slate-500", bg: "bg-slate-100 text-slate-700" },
  medium: { label: "Medium", color: "bg-blue-500", bg: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-500", bg: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-500", bg: "bg-red-100 text-red-700" },
};

export function formatDateSmart(dateString: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isToday(date)) return { text: "Today", color: "text-green-600 dark:text-green-400" };
  if (isTomorrow(date)) return { text: "Tomorrow", color: "text-blue-600 dark:text-blue-400" };
  if (isYesterday(date)) return { text: "Yesterday", color: "text-red-600 dark:text-red-400" };
  if (date < new Date()) return { text: format(date, "MMM d"), color: "text-red-600 dark:text-red-400" };
  return { text: format(date, "MMM d"), color: "text-muted-foreground" };
}

// --- Task Card ---

export const TaskCard = ({ 
  task, 
  onClick,
  onDelete,
  onQuickEdit,
  canManage,
  personnel
}: { 
  task: Task; 
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const MAX_TITLE_LENGTH = 60;
  
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const dateInfo = task.dueDate ? formatDateSmart(task.dueDate) : null;

  const assignees = useMemo(() => {
    return (task.assignees || []).map(id => personnel.find(p => p.id === id)).filter(Boolean);
  }, [task.assignees, personnel]);

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
      draggable={true}
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
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
          "group relative bg-card rounded-xl shadow-sm border border-border/40 mb-3 mx-0.5 select-none transition-shadow",
          isEditing ? "ring-2 ring-primary/20 cursor-text" : "cursor-grab active:cursor-grabbing hover:border-border/80",
          task.flagged && "border-[#1DB954]/30 bg-[#1DB954]/5"
        )}
      >
      {task.flagged && (
         <div className="absolute -top-1 -right-1 z-20">
            <div className="bg-[#1DB954] rounded-full p-1 shadow-lg animate-in zoom-in">
               <Check size={8} strokeWidth={4} className="text-white" />
            </div>
         </div>
      )}

      {task.coverImage && (
         <div className="relative w-full h-24 rounded-t-xl overflow-hidden mb-3">
            <img src={task.coverImage} alt="Task Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
         </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          {isEditing ? (
            <div className="flex items-center flex-1">
              <div className={cn("w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-offset-card mr-2 shrink-0", PRIORITIES[task.priority || 'medium'].color)} />
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
            <div className="flex items-center flex-1">
              <div className={cn("w-1.5 h-1.5 rounded-full ring-2 ring-offset-1 ring-offset-card mr-2 shrink-0", PRIORITIES[task.priority || 'medium'].color)} />
              <h3 
                className="font-semibold text-sm text-foreground leading-snug pr-6 break-words"
                onDoubleClick={(e) => {
                  if (!canManage) return;
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
          
            {canManage && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
                    <Trash2 size={12} />
                </Button>
              </div>
            )}
        </div>

        {task.audioBase64 && task.audioMimeType && task.audioDuration !== undefined && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <InlineAudioPlayer 
              audioBase64={task.audioBase64}
              audioMimeType={task.audioMimeType}
              audioDuration={task.audioDuration}
              className="scale-90 origin-left"
            />
          </div>
        )}
        
        <div className="flex items-center gap-4 mt-2 min-h-[16px]">
          {dateInfo ? (
            <div className={cn("text-[10px] font-medium flex items-center gap-1", dateInfo.color)}>
              <Clock size={10} />
              {dateInfo.text}
            </div>
          ) : null}

          {task.subtasks?.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title={`${completedSubtasks} of ${task.subtasks.length} completed`}>
              <CheckSquare size={10} />
              <span>{completedSubtasks}/{task.subtasks.length}</span>
            </div>
          )}

          {task.comments?.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title={`${task.comments.length} comments`}>
              <MessageSquare size={10} />
              <span>{task.comments.length}</span>
            </div>
          )}
          
          <div className="ml-auto flex -space-x-2">
            {assignees.length > 0 ? (
              assignees.slice(0, 3).map((u, i) => (
                <TooltipProvider key={u.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-4 w-4 ring-1 ring-background z-[1]" style={{ zIndex: 3 - i }}>
                        <AvatarImage src={u.photoUrl} />
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

// --- Column Component ---

const Column = ({ 
  column, 
  tasks, 
  onTaskClick, 
  onDeleteTask,
  onDropTask,
  onQuickAdd,
  onQuickEdit,
  canManage,
  personnel
}: { 
  column: typeof COLUMNS[0]; 
  tasks: Task[]; 
  onTaskClick: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDropTask: (taskId: string, status: Status) => void; 
  onQuickAdd: (status: Status, title: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
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

  const highPriorityCount = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;

  return (
    <div 
      className={cn(
        "flex flex-col h-full min-w-0 flex-1 rounded-2xl transition-all duration-300 border-2",
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
                canManage={canManage}
                personnel={personnel}
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

// --- Main Board View ---

export function BoardView({
  tasks,
  onTaskClick,
  onDeleteTask,
  onDropTask,
  onQuickAdd,
  onQuickEdit,
  canManage,
  personnel
}: {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDropTask: (taskId: string, status: Status) => void;
  onQuickAdd: (status: Status, title: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
}) {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <div 
        ref={scrollRef}
        onScroll={isMobile ? handleScroll : undefined}
        className={cn(
          "flex h-full mx-auto w-full",
          isMobile ? "overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide" : "lg:max-w-[1920px] gap-4 sm:gap-6"
        )}
      >
        <LayoutGroup>
          {COLUMNS.map(column => (
            <div key={column.id} className={cn(
              "h-full",
              isMobile ? "min-w-[calc(100vw-3rem)] shrink-0 snap-center" : "flex-1 min-w-0"
            )}>
              <Column 
                column={column}
                tasks={tasks.filter(t => t.status === column.id)}
                onTaskClick={onTaskClick}
                onDeleteTask={onDeleteTask}
                onDropTask={onDropTask}
                onQuickAdd={onQuickAdd}
                onQuickEdit={onQuickEdit}
                canManage={canManage}
                personnel={personnel}
              />
            </div>
          ))}
        </LayoutGroup>
      </div>

      {isMobile && (
        <div className="flex justify-center items-center gap-3 mt-4 pb-2">
          {COLUMNS.map((_, idx) => (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                width: activeIndex === idx ? 24 : 8,
                backgroundColor: activeIndex === idx ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                opacity: activeIndex === idx ? 1 : 0.5,
              }}
              className={cn(
                "h-2 rounded-full transition-colors duration-300 shadow-sm",
                activeIndex === idx ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}