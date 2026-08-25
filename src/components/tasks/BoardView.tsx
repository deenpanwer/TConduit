"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  motion, AnimatePresence, LayoutGroup 
} from "framer-motion";
import { 
  Plus, Calendar, Flag, X, Check, Search, 
  Trash2, CheckSquare, Clock, ArrowUpRight, 
  Sun, Moon, MoreHorizontal, LayoutGrid, List as ListIcon, 
  ChevronRight, Image as ImageIcon,
  User as UserIcon, AtSign, Undo2, Link as LinkIcon, Bold, Italic,
  History, MessageSquare,
  ChevronDown,
  Sparkles,
  Edit2,
  ArrowLeft,
  ArrowRight
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
import { useTasks, Task, Status, Priority, Subtask, Comment, HistoryEntry, BoardColumn, DEFAULT_COLUMNS } from "@/hooks/useTasks";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { InlineAudioPlayer } from "./InlineAudioPlayer";
import { triggerBigConfetti } from "@/lib/confetti";

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
  personnel,
  onDragStartManual
}: { 
  task: Task; 
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
  onDragStartManual?: (e: React.PointerEvent, task: Task) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const MAX_TITLE_LENGTH = 60;
  
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const dateInfo = task.dueDate ? formatDateSmart(task.dueDate) : null;

  useEffect(() => {
    if (!task.deadlineHours || !task.createdAt || task.flagged) {
        setTimeLeft(null);
        return;
    }
    
    const updateTime = () => {
        const start = task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        const deadline = new Date(start.getTime() + (task.deadlineHours || 0) * 60 * 60 * 1000);
        const diff = deadline.getTime() - Date.now();
        
        if (diff <= 0) {
            setTimeLeft("Expired");
        } else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${h}h ${m}m`);
        }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [task.deadlineHours, task.createdAt, task.flagged]);

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
      draggable={!onDragStartManual}
      onDragStart={(e: React.DragEvent) => {
        if (onDragStartManual) return;
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
        const el = e.currentTarget as HTMLElement;
        setTimeout(() => el.style.opacity = "0.5", 0);
      }}
      onDragEnd={(e: React.DragEvent) => {
        if (onDragStartManual) return;
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onPointerDown={(e) => {
        if (onDragStartManual && !isEditing) {
          onDragStartManual(e, task);
        }
      }}
      className="touch-none"
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

        {(task.voiceNotes && task.voiceNotes.length > 0) && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <InlineAudioPlayer 
              url={task.voiceNotes[0].url}
              audioDuration={task.voiceNotes[0].duration || 0}
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

          {task.leaderPoints ? (
            <div className="flex items-center gap-1 text-[10px] text-primary font-bold" title={`${task.leaderPoints} points`}>
              <Sparkles size={10} />
              <span>{task.leaderPoints}</span>
            </div>
          ) : null}

          {timeLeft ? (
            <div className={cn("flex items-center gap-1 text-[10px] font-bold", timeLeft === 'Expired' ? "text-destructive" : "text-orange-500")} title="Time remaining">
              <Clock size={10} />
              <span>{timeLeft}</span>
            </div>
          ) : (task.deadlineHours ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium" title={`${task.deadlineHours} hours effort`}>
              <Clock size={10} />
              <span>{task.deadlineHours}h</span>
            </div>
          ) : null)}

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
                        <AvatarFallback className="text-[8px]">{u.name?.[0]}</AvatarFallback>
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

        {totalSubtasks > 0 && (
          <div className="mt-3 space-y-1.5">
             <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-0.5">
                <span>Progress</span>
                <span>{progressPercent}%</span>
             </div>
             <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className={cn("h-full rounded-full transition-colors duration-500", 
                       progressPercent === 100 ? "bg-[#1DB954]" : "bg-primary/40"
                    )}
                />
             </div>
          </div>
        )}

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

// --- Add Column Card ---

const AddColumnCard = ({ onAddColumn }: { onAddColumn: (title: string) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    if (title.trim()) {
      onAddColumn(title.trim());
      setTitle("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <div className="h-full flex items-start pt-1 shrink-0">
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 h-10 w-44 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-secondary/30 text-muted-foreground hover:text-foreground text-xs font-semibold tracking-wide transition-all px-3 group cursor-pointer"
        >
          <Plus size={14} className="group-hover:scale-110 transition-transform" />
          <span>Add Column</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex items-start pt-1 shrink-0">
      <div className="flex flex-col gap-2 w-52 p-3 rounded-2xl bg-background border border-border/60 shadow-sm">
        <Input
          ref={inputRef}
          placeholder="Column name..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') {
              setIsAdding(false);
              setTitle("");
            }
          }}
          className="h-8 text-xs bg-secondary/30"
        />
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => {
              setIsAdding(false);
              setTitle("");
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs px-3 font-medium"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            Add
          </Button>
        </div>
      </div>
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
  onAddClick,
  onQuickEdit,
  canManage,
  personnel,
  onDragStartManual,
  draggedTaskId,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
  canMoveLeft,
  canMoveRight,
}: { 
  column: BoardColumn; 
  tasks: Task[]; 
  onTaskClick: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDropTask: (taskId: string, status: Status) => void; 
  onQuickAdd: (status: Status, title: string) => void;
  onAddClick: (status?: Status) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
  onDragStartManual?: (e: React.PointerEvent, task: Task) => void;
  draggedTaskId: string | null;
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onMoveColumn?: (columnId: string, direction: 'left' | 'right') => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRenameValue(column.title);
  }, [column.title]);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const handleSaveRename = () => {
    if (renameValue.trim() && renameValue.trim() !== column.title && onRenameColumn) {
      onRenameColumn(column.id, renameValue.trim());
    } else {
      setRenameValue(column.title);
    }
    setIsRenaming(false);
  };

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
      data-column-id={column.id}
      className={cn(
        "flex flex-col h-full min-h-0 min-w-0 flex-1 rounded-2xl transition-all duration-300 border-2",
        isDragOver ? "bg-primary/5 border-primary/10 ring-1 ring-primary/20" : "bg-secondary/5 border-transparent"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="px-4 py-3 flex items-center justify-between shrink-0 group">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
           {isRenaming ? (
             <Input
               ref={renameInputRef}
               value={renameValue}
               onChange={(e) => setRenameValue(e.target.value)}
               onBlur={handleSaveRename}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleSaveRename();
                 if (e.key === 'Escape') {
                   setRenameValue(column.title);
                   setIsRenaming(false);
                 }
               }}
               className="h-6 text-xs font-bold px-1.5 py-0 bg-background border-primary/50 w-full"
             />
           ) : (
             <h2 
               className="font-bold text-sm text-foreground/80 tracking-tight truncate cursor-pointer hover:text-foreground"
               onClick={() => setIsRenaming(true)}
               title="Click to rename"
             >
               {column.title}
             </h2>
           )}
           <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md min-w-[20px] text-center shrink-0">
             {tasks.length}
           </span>
           {highPriorityCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" title={`${highPriorityCount} High Priority items`} />
           )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md text-muted-foreground hover:text-foreground">
                <MoreHorizontal size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setIsRenaming(true)} className="text-xs gap-2">
                <Edit2 size={12} />
                Rename Column
              </DropdownMenuItem>
              {canMoveLeft && onMoveColumn && (
                <DropdownMenuItem onClick={() => onMoveColumn(column.id, 'left')} className="text-xs gap-2">
                  <ArrowLeft size={12} />
                  Move Left
                </DropdownMenuItem>
              )}
              {canMoveRight && onMoveColumn && (
                <DropdownMenuItem onClick={() => onMoveColumn(column.id, 'right')} className="text-xs gap-2">
                  <ArrowRight size={12} />
                  Move Right
                </DropdownMenuItem>
              )}
              {onDeleteColumn && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-xs gap-2 text-destructive focus:text-destructive">
                    <Trash2 size={12} />
                    Delete Column
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-6 w-6 transition-opacity rounded-md" onClick={() => onAddClick(column.id)}>
             <Plus size={14} />
          </Button>
        </div>
      </div>
      
      <div className="px-4 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary/20" style={{ width: `${Math.min(100, (tasks.length / 10) * 100)}%` }} />
         </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
        <div className="flex flex-col min-h-[150px] gap-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.length === 0 && (
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-32 flex flex-col items-center justify-center text-muted-foreground/20 border-2 border-dashed border-border/20 rounded-xl m-1 cursor-pointer hover:bg-secondary/20 hover:border-primary/30 hover:text-primary transition-all group/empty"
                  onClick={() => onAddClick(column.id)}
               >
                  <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center mb-2 group-hover/empty:scale-110 transition-transform">
                     <Plus size={14} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-widest">Start here</span>
               </motion.div>
            )}

            {tasks.map((task) => (
              <div 
                key={task.id} 
                style={{ opacity: draggedTaskId === task.id ? 0.3 : 1 }}
              >
                <TaskCard 
                  task={task} 
                  onClick={onTaskClick} 
                  onDelete={onDeleteTask}
                  onQuickEdit={onQuickEdit}
                  canManage={canManage}
                  personnel={personnel}
                  onDragStartManual={onDragStartManual}
                />
              </div>
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

// --- Mobile Board View (Vertical Stack) ---

const MobileBoardView = ({
  tasks,
  columns,
  onTaskClick,
  onDeleteTask,
  onQuickAdd,
  onAddClick,
  onQuickEdit,
  canManage,
  personnel,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
}: {
  tasks: Task[];
  columns: BoardColumn[];
  onTaskClick: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onQuickAdd: (status: Status, title: string) => void;
  onAddClick: (status?: Status) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
  onAddColumn?: (title: string) => void;
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onMoveColumn?: (columnId: string, direction: 'left' | 'right') => void;
}) => {
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({
    todo: true,
    in_progress: true,
  });
  
  const [quickAddValues, setQuickAddValues] = useState<Record<string, string>>({});
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColMobile, setIsAddingColMobile] = useState(false);

  const toggleColumn = (id: string) => {
    setExpandedColumns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAddChange = (id: string, value: string) => {
    setQuickAddValues(prev => ({ ...prev, [id]: value }));
  };

  const submitQuickAdd = (status: Status) => {
    const val = quickAddValues[status];
    if (val?.trim()) {
      onQuickAdd(status, val.trim());
      setQuickAddValues(prev => ({ ...prev, [status]: "" }));
    }
  };

  const handleAddColMobile = () => {
    if (newColumnTitle.trim() && onAddColumn) {
      onAddColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColMobile(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {columns.map((column, idx) => {
        const isDone = column.isDoneColumn || column.id === 'done';
        const columnTasks = tasks.filter(t => 
          isDone 
            ? (t.status === column.id || t.status === 'done' || t.flagged)
            : (t.status === column.id && !t.flagged)
        );
        const isOpen = expandedColumns[column.id] ?? false;
        const highPriorityCount = columnTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;

        return (
          <div key={column.id} className="flex flex-col bg-background/50 rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            {/* Header */}
            <div 
              onClick={() => toggleColumn(column.id)}
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-secondary/30",
                isOpen && "bg-secondary/20 border-b border-border/40"
              )}
            >
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                <h2 className="font-bold text-sm tracking-tight">{column.title}</h2>
                <Badge variant="secondary" className="text-[10px] font-bold px-1.5 h-5 min-w-[20px] justify-center">
                  {columnTasks.length}
                </Badge>
                {highPriorityCount > 0 && !isOpen && (
                  <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onRenameColumn && (
                      <DropdownMenuItem onClick={() => {
                        const newName = prompt("Enter new column name:", column.title);
                        if (newName && newName.trim()) onRenameColumn(column.id, newName.trim());
                      }}>
                        <Edit2 size={12} className="mr-2" /> Rename
                      </DropdownMenuItem>
                    )}
                    {idx > 0 && onMoveColumn && (
                      <DropdownMenuItem onClick={() => onMoveColumn(column.id, 'left')}>
                        <ArrowLeft size={12} className="mr-2" /> Move Up
                      </DropdownMenuItem>
                    )}
                    {idx < columns.length - 1 && onMoveColumn && (
                      <DropdownMenuItem onClick={() => onMoveColumn(column.id, 'right')}>
                        <ArrowRight size={12} className="mr-2" /> Move Down
                      </DropdownMenuItem>
                    )}
                    {onDeleteColumn && (
                      <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-destructive">
                        <Trash2 size={12} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-background shadow-none"
                  onClick={() => onAddClick(column.id)}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 space-y-3 bg-secondary/5">
                    {columnTasks.length === 0 && (
                      <div 
                        className="py-8 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-border/30 rounded-xl cursor-pointer hover:bg-secondary/20 hover:border-primary/30 hover:text-primary transition-all group/empty"
                        onClick={() => onAddClick(column.id)}
                      >
                         <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-3 group-hover/empty:scale-110 transition-transform">
                            <Plus size={20} />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest">Start here</span>
                      </div>
                    )}
                    
                    {columnTasks.map(task => (
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

                    <div className="relative">
                       <div className="absolute left-3 top-3 text-muted-foreground">
                          <Plus size={14} />
                       </div>
                       <Input 
                          placeholder="Add a task..."
                          value={quickAddValues[column.id] || ""}
                          onChange={(e) => handleQuickAddChange(column.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              submitQuickAdd(column.id);
                            }
                          }}
                          className="pl-9 bg-background border-border/50 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
                       />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Add Column Button on Mobile */}
      {isAddingColMobile ? (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-secondary/20 border border-border/50">
          <Input 
            placeholder="New column name..."
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddColMobile();
              if (e.key === 'Escape') setIsAddingColMobile(false);
            }}
            className="bg-background"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsAddingColMobile(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddColMobile} disabled={!newColumnTitle.trim()}>Add Column</Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          className="w-full h-11 rounded-2xl border-dashed border-border/60 hover:bg-secondary/30 gap-2 text-xs font-semibold"
          onClick={() => setIsAddingColMobile(true)}
        >
          <Plus size={14} />
          Add Column
        </Button>
      )}
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
  onAddClick,
  onQuickEdit,
  canManage,
  personnel
}: {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDropTask: (taskId: string, status: Status) => void;
  onQuickAdd: (status: Status, title: string) => void;
  onAddClick: (status?: Status) => void;
  onQuickEdit: (id: string, title: string) => void;
  canManage: boolean;
  personnel: any[];
}) {
  const isMobile = useIsMobile();
  const { columns, addBoardColumn, renameBoardColumn, reorderBoardColumns, deleteBoardColumn } = useTasks();

  const boardColumns = useMemo(() => {
    return columns && columns.length > 0 ? columns : DEFAULT_COLUMNS;
  }, [columns]);

  const handleMoveColumn = useCallback((columnId: string, direction: 'left' | 'right') => {
    const idx = boardColumns.findIndex(c => c.id === columnId);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= boardColumns.length) return;

    const newCols = [...boardColumns];
    const [moved] = newCols.splice(idx, 1);
    newCols.splice(targetIdx, 0, moved);
    reorderBoardColumns(newCols);
  }, [boardColumns, reorderBoardColumns]);

  if (isMobile) {
    return (
      <MobileBoardView 
        tasks={tasks}
        columns={boardColumns}
        onTaskClick={onTaskClick}
        onDeleteTask={onDeleteTask}
        onQuickAdd={onQuickAdd}
        onAddClick={onAddClick}
        onQuickEdit={onQuickEdit}
        canManage={canManage}
        personnel={personnel}
        onAddColumn={addBoardColumn}
        onRenameColumn={renameBoardColumn}
        onDeleteColumn={deleteBoardColumn}
        onMoveColumn={handleMoveColumn}
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-x-auto pb-2 custom-scrollbar">
      <div 
        className="flex h-full min-h-0 w-max min-w-full gap-4 sm:gap-6 pr-6"
      >
        <LayoutGroup>
          {boardColumns.map((column, idx) => {
            const isDone = column.isDoneColumn || column.id === 'done';
            return (
              <div key={column.id} className="h-full min-h-0 w-72 sm:w-80 flex-shrink-0 flex flex-col">
                <Column 
                  column={column}
                  tasks={tasks.filter(t => 
                    isDone 
                      ? (t.status === column.id || t.status === 'done' || t.flagged)
                      : (t.status === column.id && !t.flagged)
                  )}
                  onTaskClick={onTaskClick}
                  onDeleteTask={onDeleteTask}
                  onDropTask={onDropTask}
                  onQuickAdd={onQuickAdd}
                  onAddClick={onAddClick}
                  onQuickEdit={onQuickEdit}
                  canManage={canManage}
                  personnel={personnel}
                  draggedTaskId={null}
                  onRenameColumn={renameBoardColumn}
                  onDeleteColumn={deleteBoardColumn}
                  onMoveColumn={handleMoveColumn}
                  canMoveLeft={idx > 0}
                  canMoveRight={idx < boardColumns.length - 1}
                />
              </div>
            );
          })}
          <AddColumnCard onAddColumn={addBoardColumn} />
        </LayoutGroup>
      </div>
    </div>
  );
}