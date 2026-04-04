'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, ChevronRight, 
  ChevronDown, Save, Undo2, 
  MoreHorizontal, Link as LinkIcon, Sparkles,
  CheckCircle2, Circle, MessageSquare, ExternalLink,
  UserPlus, X,
  Check,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn, getUserAvatar } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { useTasks, Task, Priority, Subtask, Resource } from '@/hooks/useTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

// --- Types & Interfaces ---

interface ListViewProps {
  tasks: Task[]; // Array of tasks from the database.
  onTaskClick: (taskId: string) => void; // Function to handle opening the task details drawer.
  personnel: any[]; // Array of personnel/users for assignment.
}

// --- Helper Components ---

/**
 * A pulsing skeleton loader to indicate that content is being loaded.
 * Used for AI enhancement visual feedback.
 */
const SkeletonLoader = ({ className }: { className?: string }) => (
    <div className={cn("h-full w-full flex items-center px-3", className)}>
        <div className="w-full h-4 bg-secondary/50 rounded-md animate-pulse" />
    </div>
);

/**
 * A colored pill component to display and change task priority.
 * Mimics the UI style of Monday.com.
 */
const PriorityPill = ({ priority, onChange, disabled }: { priority: Priority, onChange: (val: Priority) => void, disabled?: boolean }) => {
    const priorityConfig: Record<Priority, { label: string; bg: string; text: string }> = {
        low: { label: 'Low', bg: 'bg-slate-200', text: 'text-slate-800' },
        medium: { label: 'Medium', bg: 'bg-blue-200', text: 'text-blue-800' },
        high: { label: 'High', bg: 'bg-orange-200', text: 'text-orange-800' },
        critical: { label: 'Critical', bg: 'bg-red-200', text: 'text-red-800' }
    };
    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <div className={cn(
                    'w-full h-full flex items-center justify-center text-[11px] font-bold uppercase cursor-pointer transition-all hover:brightness-95',
                    config.bg, config.text
                )}>
                    {config.label}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='center' className='min-w-[140px] p-1'>
                {Object.entries(priorityConfig).map(([key, val]) => (
                    <DropdownMenuItem key={key} onClick={() => onChange(key as Priority)} className='gap-2 h-8 text-[11px] font-bold uppercase'>
                        <div className={cn('size-3 rounded-sm', val.bg)} />
                        {val.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/**
 * A generic, editable cell for the grid.
 * Toggles between a display view and an input field on click.
 */
const GridCell = ({ 
    children, 
    className, 
    isEditable = false,
    value,
    onChange,
    type = 'text',
    placeholder = ''
}: { 
    children?: React.ReactNode, 
    className?: string, 
    isEditable?: boolean,
    value?: string | number,
    onChange?: (val: any) => void,
    type?: 'text' | 'number',
    placeholder?: string
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus and select the input text when entering edit mode.
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Render an input field if in edit mode.
    if (isEditable && isEditing) {
        return (
            <div className={cn('h-full w-full border-2 border-primary z-10 bg-background', className)}>
                <input 
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={(e) => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                    className='w-full h-full px-3 text-sm bg-transparent outline-none font-medium'
                    placeholder={placeholder}
                />
            </div>
        );
    }

    // Render the display view.
    return (
        <div 
            className={cn(
                'h-full w-full flex items-center px-3 text-sm transition-colors', 
                isEditable && 'cursor-text hover:bg-secondary/10',
                'truncate'
            )}
            onClick={() => isEditable && setIsEditing(true)}
        >
            {children || (value !== null && value !== undefined && value !== '') 
                ? <div className="truncate">{String(value)}</div> 
                : (isEditable ? <span className="text-muted-foreground/30 font-normal italic">{placeholder || "Empty"}</span> : value)}
        </div>
    );
};


/**
 * Represents a single row in the task grid, including its sub-branching UI.
 */
const TaskRowDesktop = ({ 
    task, 
    localTask, 
    onUpdate, 
    onDelete,
    onTaskClick, 
    personnel,
    handleEnhanceTask,
    isEnhancing
}: { 
    task: Task, // The original task data.
    localTask: Task, // The task data including local, unsaved changes.
    onUpdate: (updates: Partial<Task>) => void, // Callback to update the task in local state.
    onDelete: (id: string) => void, // Callback to delete the task.
    onTaskClick: (taskId: string) => void, // Passes the full task ID.
    personnel: any[], // List of all users.
    handleEnhanceTask: (id: string) => void, // Callback to trigger AI enhancement.
    isEnhancing: boolean // Flag indicating if this specific task is being enhanced.
}) => {
    // State now tracks each branch's expanded state independently.
    const [expandedBranches, setExpandedBranches] = useState({ 
        subtasks: false, 
        resources: false 
    });
    
    // State for the new resource input fields.
    const [newResourceTitle, setNewResourceTitle] = useState("");
    const [newResourceUrl, setNewResourceUrl] = useState("");

    // Determines if the AI enhance feature can be used (based on text length).
    const canEnhance = (localTask.title?.length || 0) > 20 || (localTask.description?.length || 0) > 20;

    // Automatically expand the sub-task view when AI enhancement starts.
    useEffect(() => {
        if (isEnhancing) {
            setExpandedBranches(prev => ({ ...prev, subtasks: true }));
        }
    }, [isEnhancing]);

    /**
     * Toggles the specified branch open or closed.
     */
    const handleBranchToggle = (branch: 'subtasks' | 'resources') => {
        setExpandedBranches(prev => ({ ...prev, [branch]: !prev[branch] }));
    };

    /**
     * Adds a new resource to the task's local state.
     */
    const handleAddResource = () => {
        if (!newResourceTitle.trim()) return;
        const newRes: Resource = {
            id: Math.random().toString(),
            title: newResourceTitle.trim(),
            url: newResourceUrl.trim(),
            type: 'link',
            createdAt: new Date()
        };
        onUpdate({ resources: [...(localTask.resources || []), newRes] });
        setNewResourceTitle('');
        setNewResourceUrl('');
    }

    const isAnyBranchExpanded = expandedBranches.subtasks || expandedBranches.resources;

    return (
        <div className='flex flex-col'>
            {/* Main Task Row */}
            <div className='flex h-10 border-b border-border/60 group hover:bg-secondary/[0.02] transition-colors'>
                {/* Checkbox */}
                <div className={cn('sticky left-0 z-10 w-10 shrink-0 flex items-center justify-center border-r border-border/60', localTask.flagged ? 'bg-green-500/10' : 'bg-background')}>
                    <div className='cursor-pointer' onClick={() => onUpdate({ flagged: !localTask.flagged })}>
                        {localTask.flagged ? <CheckCircle2 size={16} className='text-green-500' /> : <Circle size={16} className='text-muted-foreground/30 hover:text-primary transition-colors' />}
                    </div>
                </div>

                {/* Branching Toggle Dropdown */}
                <div className='sticky left-10 z-10 w-10 shrink-0 flex items-center justify-center border-r border-border/60 bg-background'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className='p-1 rounded-sm transition-colors hover:bg-secondary/20'>
                                <ChevronRight size={14} className={cn('transition-transform', isAnyBranchExpanded && 'rotate-90')} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start' className='w-48'>
                            <DropdownMenuItem onClick={() => handleBranchToggle('subtasks')} className='gap-2'>
                                {expandedBranches.subtasks ? <ChevronDown size={14}/> : <Plus size={14} />}
                                <span>Subtasks</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBranchToggle('resources')} className='gap-2'>
                                {expandedBranches.resources ? <ChevronDown size={14}/> : <LinkIcon size={14} />}\
                                <span>Resources</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Title Cell with integrated AI Icon */}
                <div className='sticky left-20 z-10 flex flex-[1.5] min-w-[250px] border-r border-border/60 bg-background'>
                    {/* The main editable part of the cell. min-w-0 is crucial for flexbox truncation. */}
                    <div className="flex-grow h-full min-w-0">
                        {isEnhancing ? (
                            <SkeletonLoader /> 
                        ) : (
                            <GridCell 
                                isEditable 
                                value={localTask.title} 
                                onChange={(v) => onUpdate({ title: v })}
                                className={cn('font-bold pr-0', localTask.flagged && 'line-through text-muted-foreground decoration-border')}
                            />
                        )}
                    </div>

                    {/* Dedicated, permanent space for the AI icon */}
                    <div className='w-12 flex-shrink-0 h-full flex items-center justify-center border-l border-transparent group-hover:border-border/40 transition-colors'>
                        {isEnhancing ? (
                            <Sparkles size={18} className="text-primary animate-pulse" />
                        ) : !canEnhance ? (
                             <div title='Write a longer title or description to enable AI'>
                                <Sparkles size={18} className="text-muted-foreground/20" />
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleEnhanceTask(task.id)}
                                className='p-1 rounded-md text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors'
                                title='Enhance with AI'
                            >
                                <Sparkles size={18} />
                            </button>
                        )}
                    </div>
                </div>


                {/* Description Cell */}
                <div className='flex-[2] min-w-[400px] border-r border-border/60 relative'>
                    {isEnhancing ? <SkeletonLoader/> : <GridCell isEditable value={localTask.description} onChange={(v) => onUpdate({ description: v })} className='text-xs text-muted-foreground font-medium' placeholder='Add description...' />}
                </div>

                {/* Collaborators Cell */}
                <div className='w-32 shrink-0 border-r border-border/60 flex items-center px-3'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className='flex -space-x-1.5 cursor-pointer hover:bg-secondary/10 p-1 rounded-md transition-all'>
                                {(localTask.assignees || []).map(uid => {
                                    const u = personnel.find(p => p.id === uid);
                                    return (
                                        <Avatar key={uid} className='size-6 border-2 border-background shadow-sm'>
                                            <AvatarImage src={getUserAvatar(u)} />
                                            <AvatarFallback className='text-[8px] font-bold'>{u?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                                {(localTask.assignees || []).length === 0 && <UserPlus size={14} className='text-muted-foreground/30 mx-1' />}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='center' className='w-56'>
                            <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {personnel.map(p => {
                                const isAssigned = (localTask.assignees || []).includes(p.id);
                                return (
                                    <DropdownMenuItem key={p.id} onClick={() => {
                                        const newAssignees = isAssigned 
                                            ? localTask.assignees.filter(id => id !== p.id)
                                            : [...(localTask.assignees || []), p.id];
                                        onUpdate({ assignees: newAssignees });
                                    }} className='gap-2'>
                                        <Avatar className='size-5'><AvatarImage src={getUserAvatar(p)} /><AvatarFallback>{p.name?.[0]}</AvatarFallback></Avatar>
                                        <span className='flex-1'>{p.name}</span>
                                        {isAssigned && <Check size={14} className='text-primary' />}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                {/* Points & Hours Cells */}
                <div className='w-24 shrink-0 border-r border-border/60'>{isEnhancing ? <SkeletonLoader/> : <GridCell isEditable type='number' value={localTask.leaderPoints || 0} onChange={(v) => onUpdate({ leaderPoints: v })} className='text-center font-mono font-bold text-blue-600'/>}</div>
                <div className='w-24 shrink-0 border-r border-border/60'>{isEnhancing ? <SkeletonLoader/> : <GridCell isEditable type='number' value={localTask.deadlineHours || 0} onChange={(v) => onUpdate({ deadlineHours: v })} className='text-center font-mono font-bold text-orange-600' placeholder='Hours'/>}</div>
                
                {/* Due Date Cell */}
                <div className='w-32 shrink-0 border-r border-border/60'>
                     <Popover>
                        <PopoverTrigger asChild>
                            <div className='h-full w-full flex items-center justify-center text-[10px] font-bold uppercase cursor-pointer hover:bg-secondary/10 transition-colors'>
                                {localTask.dueDate ? format(new Date(localTask.dueDate), 'MMM d, yyyy') : <span className='text-muted-foreground/30'>Set Date</span>}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='center'><CalendarComponent mode='single' selected={localTask.dueDate ? new Date(localTask.dueDate) : undefined} onSelect={(d) => onUpdate({ dueDate: d?.toISOString() })} initialFocus/></PopoverContent>
                    </Popover>
                </div>

                {/* Priority Cell */}
                <div className='w-32 shrink-0 border-r border-border/60'>
                    {isEnhancing ? (
                        <div className="h-full w-full flex items-center justify-center p-2">
                            <div className="w-full h-full bg-secondary/50 rounded-md animate-pulse" />
                        </div>
                    ) : <PriorityPill priority={localTask.priority} onChange={(p) => onUpdate({ priority: p })} />}
                </div>

                {/* Comments & Actions Cells */}
                <div className='w-16 shrink-0 border-r border-border/60 flex items-center justify-center'>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn('p-1.5 rounded-md hover:bg-secondary/20 transition-all relative', (localTask.comments || []).length > 0 && 'text-primary')}>
                                <MessageSquare size={16} />
                                {(localTask.comments || []).length > 0 && <span className='absolute -top-0.5 -right-0.5 size-3.5 bg-primary text-[8px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-background'>{(localTask.comments || []).length}</span>}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-64 p-3'>
                            <DropdownMenuLabel>Comments</DropdownMenuLabel>
                            <div className='max-h-[200px] overflow-y-auto'>
                                {(localTask.comments || []).length === 0 ? <p className='text-xs text-muted-foreground italic p-4 text-center'>No comments</p> : localTask.comments.map(c => <div key={c.id} className='text-xs p-2'>{c.text}</div>)}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className='w-10 shrink-0 flex items-center justify-center'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className='p-1 rounded-md hover:bg-secondary/20'><MoreHorizontal size={16} /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => onTaskClick(task.id)}><ExternalLink size={14} className='mr-2'/> Open Drawer</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => onDelete(task.id)} className='text-destructive focus:text-destructive'><Trash2 size={14} className='mr-2'/> Delete Task</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* --- Sub-branching UI (Rendered independently) --- */}
            <AnimatePresence>
                {expandedBranches.subtasks && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden'>
                        <div className='border-t-2 border-blue-500/20'>
                            {/* Subtasks Header */}
                            <div className='flex h-8 text-xs font-bold bg-blue-500/5 text-blue-800 dark:text-blue-200'>
                                <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-blue-500/5'>
                                    <button onClick={() => handleBranchToggle('subtasks')} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                                <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 px-4 flex items-center gap-2 uppercase tracking-wider bg-blue-500/5'>Subtasks</div>
                                {/* Filler divs for alignment */}
                                <div className='flex-[2] min-w-[400px] border-r border-border/60 bg-blue-500/5' />
                                <div className='w-32 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='w-24 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='w-24 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='w-32 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='w-32 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='w-16 shrink-0 border-r border-border/60 bg-blue-500/5' />
                                <div className='w-10 shrink-0 bg-blue-500/5' />
                            </div>

                            {/* Subtasks Content */}
                            {isEnhancing ? ( 
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex h-9 border-b border-border/40 text-sm">
                                        <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-background" />
                                        <div className="sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 pl-4 bg-background flex items-center"><div className="w-0.5 h-full bg-border/30"></div></div>
                                        <div className="sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 flex items-center gap-3 px-3 bg-background">
                                            <div className="size-4 rounded-full bg-secondary/50 animate-pulse" />
                                            <div className="h-4 w-4/5 bg-secondary/50 rounded-md animate-pulse" />
                                        </div>
                                        <div className='flex-[2] min-w-[400px] border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-24 shrink-0 border-r border-border/60' /><div className='w-24 shrink-0 border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-16 shrink-0 border-r border-border/60' /><div className='w-10 shrink-0' />
                                    </div>
                                ))
                            ) : (
                                <>
                                    {(localTask.subtasks || []).map((sub, idx) => (
                                        <div key={sub.id} className="flex h-9 border-b border-border/40 group/sub text-sm">
                                            <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-background" />
                                            <div className="sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 pl-4 bg-background flex items-center"><div className="w-0.5 h-full bg-border/30"></div></div>
                                            <div className="sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 flex items-center gap-3 px-3 bg-background">
                                                <button onClick={() => { const newSubs = [...(localTask.subtasks || [])]; newSubs[idx].completed = !newSubs[idx].completed; onUpdate({ subtasks: newSubs }); }}>
                                                    {sub.completed ? <CheckCircle2 size={14} className='text-blue-500' /> : <Circle size={14} className='text-muted-foreground/30' />}
                                                </button>
                                                <input value={sub.title} onChange={(e) => { const newSubs = [...(localTask.subtasks || [])]; newSubs[idx].title = e.target.value; onUpdate({ subtasks: newSubs });}} className={cn('bg-transparent w-full focus:outline-none', sub.completed && 'line-through text-muted-foreground')} />
                                            </div>
                                            <div className='flex-[2] min-w-[400px] border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-24 shrink-0 border-r border-border/60' /><div className='w-24 shrink-0 border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-16 shrink-0 border-r border-border/60' /><div className='w-10 shrink-0' />
                                        </div>
                                    ))}
                                    <div className="flex h-9 border-b border-border/40 text-sm">
                                        <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-background" />
                                        <div className="sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 pl-4 bg-background flex items-center" />
                                        <div className="sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 flex items-center gap-3 px-3 bg-background">
                                            <Plus size={14} className='text-muted-foreground/50' />
                                            <input placeholder="+ Add subitem" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { const newSub = { id: Math.random().toString(), title: e.currentTarget.value.trim(), completed: false }; onUpdate({ subtasks: [...(localTask.subtasks || []), newSub] }); e.currentTarget.value = ''; }}} className='bg-transparent w-full focus:outline-none placeholder:text-muted-foreground/50 italic' />
                                        </div>
                                        <div className='flex-[2] min-w-[400px] border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-24 shrink-0 border-r border-border/60' /><div className='w-24 shrink-0 border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-32 shrink-0 border-r border-border/60' /><div className='w-16 shrink-0 border-r border-border/60' /><div className='w-10 shrink-0' />
                                    </div>
                                </> 
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {expandedBranches.resources && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden'>
                        <div className='border-t-2 border-purple-500/20'>
                             {/* Resources Header */}
                            <div className='flex h-8 text-xs font-bold bg-purple-500/5 text-purple-800 dark:text-purple-200'>
                                <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-purple-500/5'>
                                    <button onClick={() => handleBranchToggle('resources')} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                                <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 px-4 flex items-center gap-2 uppercase tracking-wider bg-purple-500/5'>Resources</div>
                                <div className='flex-[2] min-w-[400px] border-r border-border/60 bg-purple-500/5' />
                                <div className='w-32 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='w-24 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='w-24 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='w-32 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='w-32 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='w-16 shrink-0 border-r border-border/60 bg-purple-500/5' />
                                <div className='w-10 shrink-0 bg-purple-500/5' />
                            </div>

                             {/* Resources Content */}
                            {(localTask.resources || []).map((res, idx) => (
                                <div key={res.id} className="flex h-9 border-b border-border/40 group/res text-sm">
                                    <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-background" />
                                    <div className="sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 pl-4 bg-background flex items-center"><div className="w-0.5 h-full bg-border/30"></div></div>
                                    <div className="sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 flex items-center gap-3 px-3 bg-background">
                                        <LinkIcon size={14} className="text-purple-500/50" />
                                        <input value={res.title} onChange={(e) => { const newRes = [...(localTask.resources || [])]; newRes[idx] = {...newRes[idx], title: e.target.value}; onUpdate({ resources: newRes });}} className='bg-transparent w-full focus:outline-none font-medium' placeholder="Resource name"/>
                                    </div>
                                    <div className='flex-[2] min-w-[400px] border-r border-border/60 flex items-center px-3'>
                                        <input value={res.url} onChange={(e) => { const newRes = [...(localTask.resources || [])]; newRes[idx] = {...newRes[idx], url: e.target.value}; onUpdate({ resources: newRes });}} className='bg-transparent w-full focus:outline-none text-xs text-blue-500 hover:underline' placeholder="https://example.com"/>
                                    </div>
                                    <div className='w-32 shrink-0 border-r border-border/60' />
                                    <div className='w-24 shrink-0 border-r border-border/60' />
                                    <div className='w-24 shrink-0 border-r border-border/60' />
                                    <div className='w-32 shrink-0 border-r border-border/60' />
                                    <div className='w-32 shrink-0 border-r border-border/60' />
                                    <div className='w-16 shrink-0 border-r border-border/60 flex items-center justify-center'><button onClick={() => onUpdate({ resources: localTask.resources?.filter(r => r.id !== res.id) })} className="p-1 rounded-full hover:bg-destructive/10 text-destructive opacity-0 group-hover/res:opacity-100"><X size={14} /></button></div>
                                    <div className='w-10 shrink-0' />
                                </div>
                            ))}
                            <div className="flex h-9 border-b border-border/40 text-sm">
                                <div className="sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 bg-background" />
                                <div className="sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 pl-4 bg-background flex items-center" />
                                <div className="sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 flex items-center gap-3 px-3 bg-background">
                                    <Plus size={14} className='text-muted-foreground/50' />
                                    <input placeholder="+ Add resource" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddResource() }} className='bg-transparent w-full focus:outline-none placeholder:text-muted-foreground/50 italic' />
                                </div>
                                <div className='flex-[2] min-w-[400px] border-r border-border/60 px-3'>
                                    <input placeholder="https://example.com" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddResource() }} className='bg-transparent w-full focus:outline-none text-xs placeholder:text-muted-foreground/50'/>
                                </div>
                                <div className='w-32 shrink-0 border-r border-border/60' />
                                <div className='w-24 shrink-0 border-r border-border/60' />
                                <div className='w-24 shrink-0 border-r border-border/60' />
                                <div className='w-32 shrink-0 border-r border-border/60' />
                                <div className='w-32 shrink-0 border-r border-border/60' />
                                <div className='w-16 shrink-0 border-r border-border/60' />
                                <div className='w-10 shrink-0' />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Task Row (Mobile Checklist - Keep Inspired) ---

const TaskRowMobile = ({ 
    task, 
    localTask, 
    onUpdate, 
    onDelete,
    onTaskClick,
    handleEnhanceTask,
    isEnhancing,
    personnel
}: { 
    task: Task, 
    localTask: Task, 
    onUpdate: (updates: Partial<Task>) => void,
    onDelete: (id: string) => void,
    onTaskClick: (taskId: string) => void,
    handleEnhanceTask: (id: string) => void,
    isEnhancing: boolean,
    personnel: any[]
}) => {
    const [expandedBranches, setExpandedBranches] = useState({ 
        subtasks: false, 
        resources: false 
    });

    const isAnyBranchExpanded = expandedBranches.subtasks || expandedBranches.resources;

    return (
        <Reorder.Item 
            value={task} 
            className="group flex flex-col bg-background/50 border border-border/40 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all"
        >
            <div className="flex items-center p-4 gap-3 relative">
                {/* 6-dot handle */}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground/30">
                    <GripVertical size={20} />
                </div>

                {/* Checkbox */}
                <button 
                    onClick={() => onUpdate({ flagged: !localTask.flagged })}
                    className={cn(
                        "size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        localTask.flagged ? "bg-green-500 border-green-500 text-white" : "border-border"
                    )}
                >
                    {localTask.flagged && <Check size={14} />}
                </button>

                {/* Branch Toggle Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-secondary/20 transition-colors">
                            <ChevronRight size={16} className={cn("text-muted-foreground/40 transition-transform", isAnyBranchExpanded && "rotate-90")} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuItem onClick={() => setExpandedBranches(prev => ({ ...prev, subtasks: !prev.subtasks }))} className="gap-2">
                            <Plus size={14} /> Subtasks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setExpandedBranches(prev => ({ ...prev, resources: !prev.resources }))} className="gap-2">
                            <LinkIcon size={14} /> Resources
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Editable Title */}
                <div className="flex-1 min-w-0">
                    {isEnhancing ? (
                        <div className="h-5 w-full bg-secondary/30 animate-pulse rounded" />
                    ) : (
                        <input 
                            value={localTask.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            className={cn(
                                "w-full bg-transparent border-none p-0 text-sm font-bold focus:outline-none transition-all",
                                localTask.flagged && "text-muted-foreground/50 line-through decoration-border"
                            )}
                            placeholder="Task title"
                        />
                    )}
                </div>

                {/* AI Sparkle */}
                <button 
                    onClick={() => handleEnhanceTask(task.id)}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        isEnhancing ? "text-primary animate-pulse" : "text-muted-foreground/30 hover:text-primary hover:bg-primary/5"
                    )}
                >
                    <Sparkles size={16} />
                </button>

                {/* Right Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-secondary/20 text-muted-foreground/40">
                            <MoreHorizontal size={18} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTaskClick(task.id)} className="gap-2">
                            <ExternalLink size={14} /> Open Drawer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(task.id)} className="gap-2 text-destructive">
                            <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Sub-branching Mobile */}
            <AnimatePresence>
                {isAnyBranchExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-border/20 bg-secondary/[0.02]"
                    >
                        {expandedBranches.subtasks && (
                            <div className="mt-3 space-y-2">
                                <div 
                                    className="flex items-center justify-between mb-2 cursor-pointer active:opacity-60 transition-opacity"
                                    onClick={() => setExpandedBranches(prev => ({ ...prev, subtasks: false }))}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={12} className="text-blue-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Subtasks</span>
                                    </div>
                                    <ChevronDown size={14} className="text-muted-foreground/40 rotate-180" />
                                </div>
                                {isEnhancing ? (
                                    <div className="space-y-2">
                                        {[...Array(2)].map((_, i) => (
                                            <div key={i} className="h-8 w-full bg-secondary/20 animate-pulse rounded-md" />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {(localTask.subtasks || []).map((sub, idx) => (
                                            <div key={sub.id} className="flex items-center gap-2 py-1">
                                                <button onClick={() => {
                                                    const newSubs = [...(localTask.subtasks || [])];
                                                    newSubs[idx].completed = !newSubs[idx].completed;
                                                    onUpdate({ subtasks: newSubs });
                                                }}>
                                                    {sub.completed ? <CheckCircle2 size={14} className='text-blue-500' /> : <Circle size={14} className='text-muted-foreground/30' />}
                                                </button>
                                                <input 
                                                    value={sub.title}
                                                    onChange={(e) => {
                                                        const newSubs = [...(localTask.subtasks || [])];
                                                        newSubs[idx].title = e.target.value;
                                                        onUpdate({ subtasks: newSubs });
                                                    }}
                                                    className={cn("flex-1 bg-transparent border-none p-0 text-xs focus:outline-none", sub.completed && "line-through text-muted-foreground")}
                                                />
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 py-1">
                                            <Plus size={14} className="text-muted-foreground/30" />
                                            <input 
                                                className="flex-1 bg-transparent border-none p-0 text-xs italic focus:outline-none placeholder:text-muted-foreground/30"
                                                placeholder="+ Add subtask"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newSub = { id: Math.random().toString(), title: e.currentTarget.value.trim(), completed: false };
                                                        onUpdate({ subtasks: [...(localTask.subtasks || []), newSub] });
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {expandedBranches.resources && (
                            <div className="mt-4 space-y-2">
                                <div 
                                    className="flex items-center justify-between mb-2 cursor-pointer active:opacity-60 transition-opacity"
                                    onClick={() => setExpandedBranches(prev => ({ ...prev, resources: false }))}
                                >
                                    <div className="flex items-center gap-2">
                                        <LinkIcon size={12} className="text-purple-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Resources</span>
                                    </div>
                                    <ChevronDown size={14} className="text-muted-foreground/40 rotate-180" />
                                </div>
                                {(localTask.resources || []).map((res, idx) => (
                                    <div key={res.id} className="flex flex-col gap-1 p-2 bg-background rounded-lg border border-border/40">
                                        <input 
                                            value={res.title}
                                            onChange={(e) => {
                                                const newRes = [...(localTask.resources || [])];
                                                newRes[idx].title = e.target.value;
                                                onUpdate({ resources: newRes });
                                            }}
                                            className="bg-transparent border-none p-0 text-xs font-bold focus:outline-none"
                                            placeholder="Resource name"
                                        />
                                        <input 
                                            value={res.url}
                                            onChange={(e) => {
                                                const newRes = [...(localTask.resources || [])];
                                                newRes[idx].url = e.target.value;
                                                onUpdate({ resources: newRes });
                                            }}
                                            className="bg-transparent border-none p-0 text-[10px] text-blue-500 focus:outline-none truncate"
                                            placeholder="URL Link"
                                        />
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 p-2 border border-dashed border-border/60 rounded-lg">
                                    <Plus size={14} className="text-muted-foreground/30" />
                                    <input 
                                        className="flex-1 bg-transparent border-none p-0 text-xs italic focus:outline-none"
                                        placeholder="+ Add resource"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                const newRes: Resource = { id: Math.random().toString(), title: e.currentTarget.value.trim(), url: "", type: "link", createdAt: new Date() };
                                                onUpdate({ resources: [...(localTask.resources || []), newRes] });
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
};

/**
 * The main component for the List View.
 * It orchestrates the entire grid, including headers, toolbar, and task rows.
 */
export function ListView({ tasks, onTaskClick, personnel }: ListViewProps) {
  const isMobile = useIsMobile();
  const { bulkUpdateTasks, addTask, deleteTask } = useTasks();

  // State to hold local, unsaved changes. The key is the task ID.
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<Task>>>({});
  
  // State for task ordering (Drag & Drop)
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);

  useEffect(() => {
      // Sync ordered tasks when remote tasks change, preserving local sort if possible
      setOrderedTasks(tasks);
  }, [tasks]);

  // State for the "Add new task" input field.
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // State to track the saving process for bulk updates.
  const [isSaving, setIsSaving] = useState(false);
  
  // State to track which task is currently being enhanced by AI.
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);

  const hasUnsavedChanges = Object.keys(localChanges).length > 0;

  /**
   * Updates a task in the `localChanges` state.
   * This allows users to make multiple changes that can be saved in a single batch.
   */
  const handleUpdateLocal = (taskId: string, updates: Partial<Task>) => {
      setLocalChanges(prev => ({
          ...prev,
          [taskId]: { ...(prev[taskId] || {}), ...updates }
      }));
  };

  /**
   * Saves all the batched changes from `localChanges` to the database.
   */
  const handleSaveBulk = async () => {
      if (!hasUnsavedChanges) return;
      setIsSaving(true);
      try {
          await bulkUpdateTasks(localChanges);
          setLocalChanges({});
          toast.success("Changes saved!")
      } catch (error) {
          console.error('Bulk save failed:', error);
          toast.error("Failed to save changes.")
      } finally {
          setIsSaving(false);
      }
  };

  /**
   * Discards all unsaved local changes after user confirmation.
   */
  const handleDiscardChanges = () => {
      if (confirm('Discard all unsaved changes?')) {
          setLocalChanges({});
      }
  };

  /**
   * Triggers the AI enhancement process for a specific task.
   * It sends the task title and description to the backend and updates the task with the response.
   */
  const handleEnhanceWithAI = async (taskId: string) => {
      const taskToEnhance = displayTasks.find(t => t.id === taskId);
      if (!taskToEnhance) return;

      setIsEnhancing(taskId);
      try {
          const response = await fetch('/api/tasks/enhance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  text: taskToEnhance.description || taskToEnhance.title,
                  mode: 'enhance',
                  context: { title: taskToEnhance.title }
              }),
          });

          if (!response.ok) throw new Error('API Error');
          
          const data = await response.json();
          handleUpdateLocal(taskId, {
              title: data.title || taskToEnhance.title,
              description: data.description || taskToEnhance.description,
              priority: data.priority || taskToEnhance.priority,
              subtasks: data.subtasks || taskToEnhance.subtasks,
              leaderPoints: data.leaderPoints || taskToEnhance.leaderPoints,
              deadlineHours: data.deadlineHours || taskToEnhance.deadlineHours
          });
          toast.success('Task enhanced with AI');

      } catch (error) {
          console.error('AI Enhance error:', error);
          toast.error('Failed to enhance task');
      } finally {
          setIsEnhancing(null);
      }
  };

  /**
   * Memoized array of tasks that merges the original tasks with any local, unsaved changes.
   * This ensures the UI always reflects the current state being edited.
   */
  const displayTasks = useMemo(() => {
      return orderedTasks.map(task => ({
          ...task,
          ...(localChanges[task.id] || {})
      }));
  }, [orderedTasks, localChanges]);

  // Render a simplified mobile view if screen is small.
  if (isMobile) {
      return (
          <div className='flex flex-col h-full bg-background'>
              {/* Sticky Save Bar */}
              <AnimatePresence>
                  {hasUnsavedChanges && (
                      <motion.div 
                        initial={{ y: -50, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: -50, opacity: 0 }} 
                        className="sticky top-0 z-30 px-4 py-3 bg-primary/10 backdrop-blur-md border-b border-primary/20 flex items-center justify-between"
                      >
                          <div className="flex items-center gap-2">
                              <Sparkles size={14} className="text-primary animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Local Edits</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={handleDiscardChanges} className="h-7 text-[10px] font-bold uppercase">Discard</Button>
                              <Button size="sm" onClick={handleSaveBulk} disabled={isSaving} className="h-7 px-4 rounded-full text-[10px] font-bold uppercase shadow-sm">
                                  {isSaving ? "Saving..." : "Save Now"}
                              </Button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <Reorder.Group axis="y" values={orderedTasks} onReorder={setOrderedTasks} className="space-y-3">
                      {displayTasks.map(task => (
                          <TaskRowMobile 
                              key={task.id} 
                              task={orderedTasks.find(t => t.id === task.id)!}
                              localTask={task}
                              onUpdate={(updates) => handleUpdateLocal(task.id, updates)}
                              onDelete={deleteTask}
                              onTaskClick={onTaskClick}
                              handleEnhanceTask={handleEnhanceWithAI}
                              isEnhancing={isEnhancing === task.id}
                              personnel={personnel}
                          />
                      ))}
                  </Reorder.Group>

                  {/* Add Task Row Mobile */}
                  <div className="flex items-center gap-3 p-4 bg-secondary/10 border-2 border-dashed border-border/40 rounded-2xl">
                      <Plus size={20} className="text-muted-foreground/40" />
                      <input 
                          className="flex-1 bg-transparent border-none p-0 text-sm font-bold focus:outline-none placeholder:text-muted-foreground/30"
                          placeholder="Quick add task..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={async (e) => {
                              if (e.key === 'Enter' && newTaskTitle.trim()) {
                                  const title = newTaskTitle.trim();
                                  setNewTaskTitle('');
                                  await addTask(title, 'todo');
                                  toast.success('Task created');
                              }
                          }}
                      />
                  </div>
              </div>
          </div>
      );
  }

  // Main Desktop View.
  return (
    <div className='flex flex-col h-full bg-background border border-border/60 overflow-hidden shadow-xl'>
      {/* Top Toolbar */}
      <div className='h-14 px-6 flex items-center justify-between bg-secondary/[0.03] border-b border-border/60 shrink-0'>
          <div className='flex items-center gap-4'>
              <div>
                <h2 className='text-[11px] font-black uppercase tracking-[0.2em] text-primary/80'>Workspace Grid</h2>
                <p className='text-[10px] font-bold text-muted-foreground uppercase'>{tasks.length} Active Items</p>
              </div>
          </div>
          
          <div className='flex items-center gap-3'>
              <AnimatePresence>
                  {hasUnsavedChanges && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className='flex items-center gap-3'>
                          <Button variant='ghost' size='sm' onClick={handleDiscardChanges} className='h-9 text-[10px] font-bold uppercase tracking-widest gap-2'>
                              <Undo2 size={14} /> Discard All
                          </Button>
                          <Button size='sm' onClick={handleSaveBulk} disabled={isSaving} className='h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all'>
                              <Save size={14} /> {isSaving ? 'Syncing...' : 'Save Changes'}
                          </Button>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      </div>

      {/* Main scrollable grid container */}
      <div className="flex-1 overflow-auto custom-scrollbar-thick">
          <div style={{ minWidth: 1400 }}>
              {/* Sticky Grid Header */}
              <div className='sticky top-0 z-20 flex h-10 bg-secondary/20 dark:bg-card border-b-2 border-border/80 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 select-none'>
                  <div className='sticky left-0 z-30 w-10 shrink-0 border-r border-border/60 bg-secondary/20 dark:bg-card' />
                  <div className='sticky left-10 z-30 w-10 shrink-0 border-r border-border/60 bg-secondary/20 dark:bg-card' />
                  <div className='sticky left-20 z-30 flex-[1.5] min-w-[250px] border-r border-border/60 px-4 flex items-center bg-secondary/20 dark:bg-card'>Task Name</div>
                  <div className='flex-[2] min-w-[400px] border-r border-border/60 px-4 flex items-center'>Description & Brief</div>
                  <div className='w-32 shrink-0 border-r border-border/60 px-4 flex items-center'>Collaborators</div>
                  <div className='w-24 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Points</div>
                  <div className='w-24 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Est. Hrs</div>
                  <div className='w-32 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Timeline</div>
                  <div className='w-32 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Priority</div>
                  <div className='w-16 shrink-0 border-r border-border/60 flex items-center justify-center'><MessageSquare size={12} /></div>
                  <div className='w-10 shrink-0' />
              </div>

              {/* Task Rows Body */}
              <div className='flex flex-col'>
                  {displayTasks.map(task => (
                      <TaskRowDesktop 
                          key={task.id} 
                          task={orderedTasks.find(t => t.id === task.id)!}
                          localTask={task}
                          onUpdate={(updates) => handleUpdateLocal(task.id, updates)}
                          onDelete={deleteTask}
                          onTaskClick={onTaskClick}
                          personnel={personnel}
                          handleEnhanceTask={handleEnhanceWithAI}
                          isEnhancing={isEnhancing === task.id}
                      />
                  ))}

                  {/* Sticky Add Task Row */}
                  <div className='flex h-12 border-b border-border/60'>
                      <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-background'>
                          <Plus size={16} className='text-muted-foreground/30' />
                      </div>
                      <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 bg-background' />
                      <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 bg-background flex flex-col justify-center py-1'>
                          <input 
                              className='w-full h-full px-4 text-sm font-medium focus:outline-none bg-transparent placeholder:text-muted-foreground/30 placeholder:italic'
                              placeholder='+ Add task'
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && newTaskTitle.trim()) {
                                      const title = newTaskTitle.trim();
                                      setNewTaskTitle(''); // Clear input immediately
                                      await addTask(title, 'todo');
                                      toast.success('New task created');
                                  }
                              }}
                          />
                          <AnimatePresence>
                              {newTaskTitle.length > 2 && (
                                  <motion.div 
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -5 }}
                                      className="px-4 text-[10px] text-muted-foreground/80 font-medium"
                                  >
                                      Press Enter to save
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                      {/* Filler divs for alignment */}
                      <div className='flex-[2] min-w-[400px] border-r border-border/60' />
                      <div className='w-32 shrink-0 border-r border-border/60' />
                      <div className='w-24 shrink-0 border-r border-border/60' />
                      <div className='w-24 shrink-0 border-r border-border/60' />
                      <div className='w-32 shrink-0 border-r border-border/60' />
                      <div className='w-32 shrink-0 border-r border-border/60' />
                      <div className='w-16 shrink-0 border-r border-border/60' />
                      <div className='w-10 shrink-0' />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}