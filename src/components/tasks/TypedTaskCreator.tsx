"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  motion, AnimatePresence 
} from "framer-motion";
import { 
  Plus, Calendar, X, Check, Layers, Trash2, Sparkles, Wand2, Link as LinkIcon, Minus, AtSign, ImageIcon
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, getUserAvatar } from "@/lib/utils";
import { format } from "date-fns";
import { Task, Priority } from "@/hooks/useTasks";
import { PRIORITIES, AutoResizingTextarea } from "./BoardView";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TypedTaskCreatorProps {
  editingNewTask: Partial<Task> | null;
  onUpdateTask: (id: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  personnel: any[];
  isMobile: boolean;
  canManage: boolean;
  isEnhancing: boolean;
  setIsEnhancing: (val: boolean) => void;
  handleEnhanceTask: () => Promise<void>;
  handleBulkParse: () => Promise<void>;
  isBulkMode: boolean;
  setIsBulkMode: (val: boolean) => void;
  bulkInput: string;
  setBulkInput: (val: string) => void;
}

const MAX_TEXTAREA_HEIGHT_TITLE = 150;
const MAX_TEXTAREA_HEIGHT_DESCRIPTION = 300;
const MAX_TEXTAREA_HEIGHT_SUBTASK = 80;

export function TypedTaskCreator({
  editingNewTask,
  onUpdateTask,
  onSave,
  onCancel,
  personnel,
  isMobile,
  canManage,
  isEnhancing,
  handleEnhanceTask,
  handleBulkParse,
  isBulkMode,
  setIsBulkMode,
  bulkInput,
  setBulkInput
}: TypedTaskCreatorProps) {
  const [showTopFadeTitle, setShowTopFadeTitle] = useState(false);
  const [showBottomFadeTitle, setShowBottomFadeTitle] = useState(false);
  const [showTopFadeDescription, setShowTopFadeDescription] = useState(false);
  const [showBottomFadeDescription, setShowBottomFadeDescription] = useState(false);

  const { deadlineValue, deadlineUnit, noDeadline } = useMemo(() => {
    const hours = editingNewTask?.deadlineHours;
    if (hours === undefined || hours === null) {
        return { noDeadline: true, deadlineValue: undefined, deadlineUnit: 'hours' as const };
    }

    if (hours > 0 && hours % (30 * 24) === 0) {
        return { noDeadline: false, deadlineValue: hours / (30 * 24), deadlineUnit: 'months' as const };
    }
    if (hours > 0 && hours % 24 === 0) {
        return { noDeadline: false, deadlineValue: hours / 24, deadlineUnit: 'days' as const };
    }
    return { noDeadline: false, deadlineValue: hours, deadlineUnit: 'hours' as const };
  }, [editingNewTask?.deadlineHours]);

  const handleDeadlineChange = (value: number | undefined, unit: 'hours'|'days'|'months', noDl: boolean) => {
      if (noDl) {
          onUpdateTask("new", { deadlineHours: undefined });
          return;
      }
      const val = value !== undefined ? Math.max(0, value) : 0;
      let newHours;
      switch(unit) {
          case 'days': newHours = val * 24; break;
          case 'months': newHours = val * 30 * 24; break;
          default: newHours = val;
      }
      onUpdateTask("new", { deadlineHours: newHours });
  };


  return (
    <motion.div
      key="new-task-modal"
      initial={isMobile ? { x: "100%" } : { opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={isMobile ? { x: "100%" } : { opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed z-50 bg-card border border-border/50 shadow-2xl overflow-hidden flex flex-col outline-none",
        isMobile ? "inset-0 rounded-none" : "inset-y-4 right-4 w-full max-w-lg rounded-2xl"
      )}
    >
      <div className="h-40 shrink-0 relative bg-secondary/30 group">
        {editingNewTask?.coverImage ? (
          <img alt="Cover" src={editingNewTask.coverImage} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/10 bg-gradient-to-br from-secondary/50 to-background">
            <ImageIcon size={48} />
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 px-3 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-tight">Add Image</span>
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
                      onUpdateTask("new", { coverImage: e.currentTarget.value }, 'cover_image_updated');
                    }
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            size="icon" variant="secondary" 
            className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm"
            onClick={onCancel}
          >
            <X size={14} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 -mt-6 relative bg-card rounded-t-3xl border-t border-border/50 custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider gap-2 border-border/50">
                  <div className={cn("w-2 h-2 rounded-full", PRIORITIES[editingNewTask?.priority || 'medium'].color)} />
                  {editingNewTask?.priority || 'Medium'} Priority
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {Object.entries(PRIORITIES).map(([key, val]) => (
                  <DropdownMenuItem key={key} onClick={() => onUpdateTask("new", { priority: key as Priority })}>
                    <div className={cn("w-2 h-2 rounded-full mr-2", val.color)} />
                    {val.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Calendar size={12} className="mr-2 h-4 w-4" />
                  {editingNewTask?.dueDate ? format(new Date(editingNewTask.dueDate), "MMM d") : "Set Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={editingNewTask?.dueDate ? new Date(editingNewTask.dueDate) : undefined}
                  onSelect={(date) => onUpdateTask("new", { dueDate: date ? date.toISOString() : undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className={cn("h-8 px-3 rounded-md text-xs flex items-center gap-2 transition-colors", isBulkMode ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                onClick={() => setIsBulkMode(!isBulkMode)}
                title="Bulk Add"
              >
                <Layers size={14} />
                Bulk Add
              </Button>
              <Button 
                variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => {
                    onUpdateTask("new", { title: "", description: "", subtasks: [], resources: [] });
                    setBulkInput("");
                }}
                title="Clear"
              >
                <Trash2 size={14} />
              </Button>
          </div>
        </div>

        {isBulkMode ? (
            <div className="space-y-4 mb-8">
                <label className="text-[10px] font-bold uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                    <Sparkles size={12} /> Bulk Task Parser
                </label>
                <Textarea 
                    value={bulkInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
                    placeholder="Paste your messy notes here... AI will structure them into a task with subtasks."
                    className="min-h-[250px] bg-secondary/10 border-dashed border-2 border-border/50 rounded-2xl p-4 focus:bg-background transition-all resize-none text-sm leading-relaxed"
                />
                <Button 
                    onClick={handleBulkParse} 
                    disabled={isEnhancing || !bulkInput.trim()}
                    className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                    {isEnhancing ? <Wand2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                    {isEnhancing ? "Parsing with AI..." : "Magic Parse"}
                </Button>
            </div>
        ) : (
            <>
        <div className={cn("relative w-full",
          {"fade-top": showTopFadeTitle, "fade-bottom": showBottomFadeTitle}
        )}>
          {isEnhancing ? (
              <Skeleton className="h-12 w-full mb-6 rounded-xl" />
          ) : (
            <AutoResizingTextarea
                value={editingNewTask?.title || ""}
                onChange={(e) => onUpdateTask("new", { title: e.target.value }, 'updated', true)}
                className="text-3xl font-bold bg-transparent border-none p-0 shadow-none focus-visible:ring-0 leading-tight mb-6 placeholder:text-muted-foreground/30 min-h-[48px] scrollbar-hide focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-xl"
                placeholder="Task Title"
                setShowTopFade={setShowTopFadeTitle}
                setShowBottomFade={setShowBottomFadeTitle}
                maxHeight={MAX_TEXTAREA_HEIGHT_TITLE}
            />
          )}
        </div>
        <div className="mb-8">
           <label className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Assigned To</span>
               <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                           <Plus size={12} className="mr-1" /> Assign
                       </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent>
                       <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       {personnel.map(p => {
                           const isAssigned = (editingNewTask?.assignees || []).some(uid => uid === p.id);
                           return (
                               <DropdownMenuItem 
                                   key={`new-task-assign-user-${p.id}`}
                                   onClick={() => {
                                       if (isAssigned) {
                                          onUpdateTask("new", { assignees: (editingNewTask?.assignees || []).filter(uid => uid !== p.id) }, 'assignees_updated');
                                       } else {
                                          onUpdateTask("new", { assignees: [...(editingNewTask?.assignees || []), p.id] }, 'assignees_updated');
                                       }
                                   }}
                                   className="flex items-center"
                               >
                                   <Avatar className="h-5 w-5 mr-2">
                                       <AvatarImage src={getUserAvatar(p)} />
                                       <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                                   </Avatar>
                                   {p.name}
                                   {isAssigned && <Check size={16} className="ml-auto" />}
                               </DropdownMenuItem>
                           )
                       })}
                   </DropdownMenuContent>
               </DropdownMenu>
           </label>
            <div className="flex flex-wrap gap-2">
               {(editingNewTask?.assignees || []).length > 0 ? (
                  editingNewTask?.assignees?.map(uid => {
                     const u = personnel.find(p => p.id === uid);
                     if (!u) return null;
                     return (
                        <Badge key={`new-task-assignee-${uid}`} variant="secondary" className="pl-1 pr-2 py-1 gap-2 hover:bg-secondary/80">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={getUserAvatar(u)} />
                                <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{u.name}</span>
                            <X 
                              size={12} 
                              className="cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                    const newAssignees = (editingNewTask?.assignees || []).filter(a => a !== uid);
                                    onUpdateTask("new", { assignees: newAssignees }, 'assignees_updated');
                              }}
                            />
                        </Badge>
                     )
                  })
               ) : (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 px-2 py-1 bg-secondary/30 rounded-md border border-dashed border-border">
                     <AtSign size={12} /> Everyone
                  </div>
               )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                 <Sparkles size={10} className="text-primary" /> Leader Points
              </label>
              <div className="flex items-center gap-1 bg-secondary/20 p-1 rounded-lg border border-border/50">
                 <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => onUpdateTask("new", { leaderPoints: Math.max(0, (editingNewTask?.leaderPoints || 0) - 10) })}><Minus className="h-4 w-4" /></Button>
                 <Input 
                    type="number"
                    min="0"
                    step="10"
                    className="h-8 bg-transparent border-none focus-visible:ring-0 text-center font-bold text-sm flex-1 w-full"
                    value={editingNewTask?.leaderPoints || 0}
                    onChange={(e) => onUpdateTask("new", { leaderPoints: Math.max(0, Number(e.target.value)) })}
                 />
                 <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => onUpdateTask("new", { leaderPoints: (editingNewTask?.leaderPoints || 0) + 10 })}><Plus className="h-4 w-4" /></Button>
              </div>
           </div>

           <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Deadline</label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={noDeadline}
                            onCheckedChange={(checked) => handleDeadlineChange(deadlineValue, deadlineUnit, checked)}
                        />
                        <span className="text-[10px] font-medium">No deadline</span>
                    </div>
                </div>
                <AnimatePresence>
                {!noDeadline && (
                    <motion.div 
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        className="flex items-center gap-1 bg-secondary/20 p-1 rounded-lg border border-border/50 overflow-hidden"
                    >
                        <Input
                            type="number"
                            min="0"
                            value={deadlineValue || 0}
                            onChange={(e) => handleDeadlineChange(Number(e.target.value), deadlineUnit, false)}
                            className="h-8 bg-transparent border-none focus-visible:ring-0 text-center font-bold text-sm flex-1 w-full"
                        />
                        <Select value={deadlineUnit} onValueChange={(u: 'hours' | 'days' | 'months') => handleDeadlineChange(deadlineValue, u, false)}>
                            <SelectTrigger className="w-[120px] h-8 border-none bg-transparent focus:ring-0">
                                <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                            </SelectContent>
                        </Select>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>

        <div className="mb-8 group">
           <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest group-focus-within:text-primary transition-colors">
                Description
            </label>
            {(editingNewTask?.description?.length || 0) > 20 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEnhanceTask}
                    disabled={isEnhancing}
                    className="h-7 text-[9px] uppercase font-bold tracking-widest text-primary gap-1.5 hover:bg-primary/5"
                >
                    <Sparkles size={10} /> Enhance Task
                </Button>
            )}
           </div>
           <div className={cn("relative w-full rounded-xl",
               {"fade-top": showTopFadeDescription, "fade-bottom": showBottomFadeDescription}
           )}>
              {isEnhancing ? (
                  <Skeleton className="h-32 w-full rounded-xl" />
              ) : (
                <AutoResizingTextarea
                    value={editingNewTask?.description || ""}
                    onChange={(e) => onUpdateTask("new", { description: e.target.value }, 'updated', true)}
                    className="min-h-[120px] text-sm bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none rounded-xl leading-relaxed scrollbar-hide p-2"
                    placeholder="Add details about this task..."
                    setShowTopFade={setShowTopFadeDescription}
                    setShowBottomFade={setShowBottomFadeDescription}
                    maxHeight={MAX_TEXTAREA_HEIGHT_DESCRIPTION}
                />
              )}
           </div>
        </div>
        <div className="mb-8">
           <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest">
                 Subtasks
              </label>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                 {(editingNewTask?.subtasks || []).filter(s => s.completed).length}/{(editingNewTask?.subtasks || []).length}
              </span>
           </div>
           <div className="space-y-1">
              {isEnhancing ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md opacity-60" />
                  </div>
              ) : (
                <>
                {(editingNewTask?.subtasks || []).map((sub, idx) => (
                    <div key={sub.id} className="flex items-center gap-2 group/sub">
                        <button 
                        onClick={() => {
                            const newSub = [...(editingNewTask?.subtasks || [])];
                            newSub[idx].completed = !newSub[idx].completed;
                            onUpdateTask("new", { subtasks: newSub });
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
                                const newSub = [...(editingNewTask?.subtasks || [])];
                                newSub[idx].title = e.target.value;
                                onUpdateTask("new", { subtasks: newSub }, 'updated', true);
                            }}
                            className={cn(
                                "relative w-full flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-md scrollbar-hide",
                                sub.completed && "text-muted-foreground line-through decoration-border"
                            )}
                            maxHeight={MAX_TEXTAREA_HEIGHT_SUBTASK}
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                            const newSub = (editingNewTask?.subtasks || []).filter(s => s.id !== sub.id);
                            onUpdateTask("new", { subtasks: newSub });
                            }}
                        >
                            <X size={12} />
                        </Button>
                    </div>
                ))}
                    <Button 
                        variant="ghost" size="sm" 
                        className="h-8 text-xs text-muted-foreground hover:text-primary justify-start pl-1 mt-2"
                        onClick={() => onUpdateTask("new", { subtasks: [...(editingNewTask?.subtasks || []), { id: Math.random().toString(), title: "", completed: false }] })}
                    >
                        <Plus size={14} className="mr-2" /> Add Item
                    </Button>
                </>
              )}
           </div>
        </div>

        <div className="mb-8">
            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-3 block">
                Resources
            </label>
            <div className="space-y-2">
                {(editingNewTask?.resources || []).map((res, idx) => (
                    <div key={res.id} className="flex items-center gap-2 group/res bg-secondary/10 p-2 rounded-lg border border-border/40">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <LinkIcon size={12} className="text-primary shrink-0" />
                           <Input 
                              value={res.title}
                              onChange={(e) => {
                                  const newRes = [...(editingNewTask?.resources || [])];
                                  newRes[idx].title = e.target.value;
                                  onUpdateTask("new", { resources: newRes }, 'updated', true);
                              }}
                              placeholder="Resource Title"
                              className="h-6 bg-transparent border-none p-0 text-xs font-bold focus-visible:ring-0"
                           />
                        </div>
                        <Input 
                            value={res.url}
                            onChange={(e) => {
                                const newRes = [...(editingNewTask?.resources || [])];
                                newRes[idx].url = e.target.value;
                                onUpdateTask("new", { resources: newRes }, 'updated', true);
                            }}
                            placeholder="URL (docs, pdfs, images...)"
                            className="h-5 bg-transparent border-none p-0 text-[10px] text-muted-foreground focus-visible:ring-0"
                        />
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/res:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            const newRes = (editingNewTask?.resources || []).filter(r => r.id !== res.id);
                            onUpdateTask("new", { resources: newRes });
                        }}
                    >
                        <X size={12} />
                    </Button>
                    </div>
                ))}
                <Button 
                    variant="ghost" size="sm" 
                    className="h-8 text-xs text-muted-foreground hover:text-primary justify-start pl-1 mt-2"
                    onClick={() => onUpdateTask("new", { resources: [...(editingNewTask?.resources || []), { id: Math.random().toString(), title: "", url: "", type: "link", createdAt: new Date() }] })}
                >
                    <Plus size={14} className="mr-2" /> Add Resource
                </Button>
            </div>
        </div>
        </>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50 bg-card shrink-0">
        <Button variant="outline" onClick={onCancel}>
           Cancel
        </Button>
        <Button onClick={onSave}  disabled={isEnhancing || (!isBulkMode && !editingNewTask?.title)}>
           Create Task
        </Button>
      </div>
    </motion.div>
  );
}
