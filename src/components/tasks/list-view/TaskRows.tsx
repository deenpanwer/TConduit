'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
  Plus, ChevronRight, 
  ChevronDown, 
  MoreHorizontal, Link as LinkIcon, Sparkles,
  CheckCircle2, Circle, MessageSquare, ExternalLink,
  UserPlus,
  Check,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Type,
  ListTodo,
  FileText,
  Mic,
  FolderInput,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { 
    Tooltip, 
    TooltipContent, 
    TooltipTrigger 
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn, getUserAvatar } from '@/lib/utils';
import { format } from 'date-fns';
import { Task, useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { triggerBigConfetti, triggerSmallConfetti } from '@/lib/confetti';
import { 
    GridCell, 
    SkeletonLoader, 
    PriorityPill, 
    HoursCell, 
    CountTicker 
} from './ListViewPrimitives';
import { HierarchicalTable } from './HierarchicalTable';

// --- Mobile Hierarchical List Helper ---

export const MobileHierarchicalList = ({ items, type, onUpdate, onDelete, depth = 0, shouldFocusQuickAdd, onFocusHandled, onAISuggest, isLoading, itemToAutoEdit, onItemEditDone }: { 
    items: any[], 
    type: 'subtasks' | 'resources' | 'descriptions' | 'images',
    onUpdate: (updated: any[]) => void,
    onDelete: (id: string) => void,
    depth?: number,
    shouldFocusQuickAdd?: boolean,
    onFocusHandled?: () => void,
    onAISuggest?: () => Promise<void>,
    isLoading?: boolean,
    itemToAutoEdit?: string | null,
    onItemEditDone?: () => void
}) => {
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSuggestingAI, setIsSuggestingAI] = useState(false);
    const [quickAddValue, setQuickAddValue] = useState("");
    const quickAddInputRef = useRef<HTMLInputElement>(null);

    const handleSuggestAI = async () => {
        if (!onAISuggest) return;
        setIsSuggestingAI(true);
        try {
            await onAISuggest();
        } finally {
            setIsSuggestingAI(false);
        }
    };

    useEffect(() => {
        if (shouldFocusQuickAdd || isLoading) {
            setIsCollapsed(false);
            if (shouldFocusQuickAdd) {
                const timer = setTimeout(() => {
                    quickAddInputRef.current?.focus();
                }, 200);
                return () => clearTimeout(timer);
            }
        }
    }, [shouldFocusQuickAdd, isLoading]);

    useEffect(() => {
        if (itemToAutoEdit && items.some(item => item.id === itemToAutoEdit)) {
            setIsCollapsed(false);
        }
    }, [itemToAutoEdit, items]);

    const config = {
        subtasks: { icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-500/5', label: depth > 0 ? 'Granular Subtasks' : 'Subtasks' },
        resources: { icon: LinkIcon, color: 'text-purple-500', bg: 'bg-purple-500/5', label: 'Resources' },
        descriptions: { icon: Type, color: 'text-emerald-500', bg: 'bg-emerald-500/5', label: 'Notes' },
        images: { icon: ImageIcon, color: 'text-orange-500', bg: 'bg-orange-500/5', label: 'Images' },
    }[type];

    const handleUpdateItem = (id: string, updates: any) => {
        if (type === 'subtasks' && updates.completed === true) {
            triggerSmallConfetti();
        }
        onUpdate(items.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    return (
        <div className={cn("mt-2 space-y-2 border-l border-border/40", depth > 0 && "ml-4")}>
            <div 
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <config.icon size={12} className={config.color} />
                <span className={cn("text-[9px] font-black uppercase tracking-widest", config.color)}>{config.label}</span>
                {(items.length > 0 || isLoading) && <ChevronRight size={12} className={cn('ml-1 transition-transform text-muted-foreground/50', !isCollapsed && 'rotate-90')} />}
                <span className="ml-auto text-[9px] font-bold opacity-30 bg-black/5 dark:bg-white/5 px-1.5 rounded-full">{items.length}</span>
            </div>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-2">
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className={cn("flex flex-col bg-background/40 rounded-xl border border-border/20 overflow-hidden", config.bg)}>
                                    <div className="flex items-center p-3 gap-3">
                                        {type === 'subtasks' && (
                                            <button onClick={() => handleUpdateItem(item.id, { completed: !item.completed })}>
                                                {item.completed ? <CheckCircle2 size={16} className='text-blue-500' /> : <Circle size={16} className='text-muted-foreground/30' />}
                                            </button>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {type === 'descriptions' ? (
                                                <textarea 
                                                    value={item.text}
                                                    onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                                                    className="w-full bg-transparent border-none p-0 text-xs focus:outline-none resize-none leading-relaxed"
                                                    placeholder="Note text..."
                                                    rows={1}
                                                    onInput={(e) => {
                                                        const target = e.target as HTMLTextAreaElement;
                                                        target.style.height = 'auto';
                                                        target.style.height = target.scrollHeight + 'px';
                                                    }}
                                                />
                                            ) : (
                                                <input 
                                                    value={item.title}
                                                    onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                                                    className={cn("w-full bg-transparent border-none p-0 text-xs font-bold focus:outline-none", item.completed && "line-through text-muted-foreground/50")}
                                                    placeholder="Title"
                                                />
                                            )}
                                            {(type === 'resources' || type === 'images') && (
                                                <input 
                                                    value={item.url}
                                                    onChange={(e) => handleUpdateItem(item.id, { url: e.target.value })}
                                                    className="w-full bg-transparent border-none p-0 text-[10px] text-blue-500 focus:outline-none truncate"
                                                    placeholder="URL"
                                                />
                                            )}
                                        </div>

                                        <button onClick={() => setExpandedIds(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className="p-1">
                                            <ChevronDown size={14} className={cn("text-muted-foreground/40 transition-transform", expandedIds[item.id] && "rotate-180")} />
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1"><MoreHorizontal size={14} className="text-muted-foreground/40" /></button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    const newDesc = { id: Math.random().toString(), text: '', createdAt: new Date() };
                                                    handleUpdateItem(item.id, { descriptions: [...(item.descriptions || []), newDesc] });
                                                    setExpandedIds(prev => ({ ...prev, [item.id]: true }));
                                                }}>
                                                    <Plus size={14} className="mr-2" /> Add Note
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    const newRes = { id: Math.random().toString(), title: '', url: '', type: 'link', createdAt: new Date() };
                                                    handleUpdateItem(item.id, { resources: [...(item.resources || []), newRes] });
                                                    setExpandedIds(prev => ({ ...prev, [item.id]: true }));
                                                }}>
                                                    <LinkIcon size={14} className="mr-2" /> Add Resource
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    const newImg = { id: Math.random().toString(), title: '', url: '', createdAt: new Date() };
                                                    handleUpdateItem(item.id, { images: [...(item.images || []), newImg] });
                                                    setExpandedIds(prev => ({ ...prev, [item.id]: true }));
                                                }}>
                                                    <ImageIcon size={14} className="mr-2" /> Add Image
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    const newSub = { id: Math.random().toString(), title: '', completed: false };
                                                    handleUpdateItem(item.id, { subtasks: [...(item.subtasks || []), newSub] });
                                                    setExpandedIds(prev => ({ ...prev, [item.id]: true }));
                                                }}>
                                                    <Plus size={14} className="mr-2 text-blue-500" /> Add Subtask
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                                                    <Trash2 size={14} className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <AnimatePresence>
                                        {expandedIds[item.id] && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-3 pb-3">
                                                {(item.descriptions || []).length > 0 && <MobileHierarchicalList items={item.descriptions} type="descriptions" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { descriptions: val })} onDelete={(id) => handleUpdateItem(item.id, { descriptions: item.descriptions.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
                                                {(item.images || []).length > 0 && <MobileHierarchicalList items={item.images} type="images" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { images: val })} onDelete={(id) => handleUpdateItem(item.id, { images: item.images.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
                                                {(item.resources || []).length > 0 && <MobileHierarchicalList items={item.resources} type="resources" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { resources: val })} onDelete={(id) => handleUpdateItem(item.id, { resources: item.resources.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
                                                {(item.subtasks || []).length > 0 && <MobileHierarchicalList items={item.subtasks} type="subtasks" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { subtasks: val })} onDelete={(id) => handleUpdateItem(item.id, { subtasks: item.subtasks.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="space-y-2 opacity-50">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex flex-col bg-background/40 rounded-xl border border-border/20 overflow-hidden">
                                            <div className="p-4">
                                                <SkeletonLoader className="h-4 w-3/4" />
                                            </div>
                                            {type === 'subtasks' && (
                                                <div className="px-4 pb-4">
                                                    <div className="mt-2 space-y-2 border-l border-border/40 ml-4">
                                                        <div className="flex items-center gap-2 px-2 py-1">
                                                            <Type size={12} className="text-emerald-500/40" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/40">Notes</span>
                                                        </div>
                                                        <div className="pl-2">
                                                            <div className="bg-background/40 rounded-xl border border-border/20 p-3">
                                                                <SkeletonLoader className="h-3 w-1/2" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col bg-background/20 rounded-xl border border-dashed border-border/40 overflow-hidden">
                                <div className="flex items-center gap-3 p-3">
                                    {type === 'subtasks' && onAISuggest && (
                                        <button onClick={handleSuggestAI} disabled={isSuggestingAI} className="p-1 rounded-md text-primary/40">
                                            <Sparkles size={14} className={isSuggestingAI ? "animate-pulse" : ""} />
                                        </button>
                                    )}
                                    <Plus size={14} className="text-muted-foreground/30" />
                                    <input 
                                        ref={quickAddInputRef}
                                        className="flex-1 bg-transparent border-none p-0 text-xs italic focus:outline-none"
                                        placeholder={`+ Add ${type.slice(0, -1)}`}
                                        value={quickAddValue}
                                        onChange={(e) => setQuickAddValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && quickAddValue.trim()) {
                                                const title = quickAddValue.trim();
                                                const newItem = type === 'descriptions' 
                                                    ? { id: Math.random().toString(), text: title, createdAt: new Date() }
                                                    : type === 'subtasks'
                                                    ? { id: Math.random().toString(), title, description: '', completed: false }
                                                    : { id: Math.random().toString(), title, completed: false, url: '', createdAt: new Date() };
                                                onUpdate([...items, newItem]);
                                                setQuickAddValue('');
                                            }
                                        }}
                                    />
                                </div>
                                <AnimatePresence>
                                    {quickAddValue.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="px-10 pb-2 text-[8px] text-primary/60 font-black uppercase tracking-widest pointer-events-none"
                                        >
                                            Press Enter to add
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Task Row Desktop ---

export const TaskRowDesktop = ({ 
    task, 
    localTask, 
    onUpdate, 
    onDelete,
    onTaskClick, 
    personnel,
    handleEnhanceTask,
    isEnhancing,
    onUploadFile,
    autoFocusDescription = false
}: { 
    task: Task,
    localTask: Task,
    onUpdate: (updates: Partial<Task>) => void,
    onDelete: (id: string) => void,
    onTaskClick: (taskId: string) => void,
    personnel: any[],
    handleEnhanceTask: (id: string) => void,
    isEnhancing: boolean,
    onUploadFile?: (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => void,
    autoFocusDescription?: boolean
}) => {
    const { groups } = useTasks();
    const [isExpanded, setIsExpanded] = useState(autoFocusDescription);
    const [itemToAutoEdit, setItemToAutoEdit] = useState<string | null>(null);
    const [activeTypeToFocus, setActiveTypeToFocus] = useState<'nestedDescriptions' | 'images' | 'resources' | 'subtasks' | 'attachments' | 'voiceNotes' | null>(null);

    const canEnhance = (localTask.title?.length || 0) > 20 || (localTask.description?.length || 0) > 20;

    const subItemCounts = useMemo(() => {
        return {
            subtasks: (localTask.subtasks || []).length,
            resources: (localTask.resources || []).length,
            notes: (localTask.nestedDescriptions || []).length,
            images: (localTask.images || []).length,
            attachments: (localTask.attachments || []).length,
            voiceNotes: (localTask.voiceNotes || []).length,
        };
    }, [localTask]);

    const hasAnySubItems = useMemo(() => {
        return Object.values(subItemCounts).some(count => count > 0);
    }, [subItemCounts]);

    useEffect(() => {
        if (isEnhancing || autoFocusDescription) {
            setIsExpanded(true);
        }
    }, [isEnhancing, autoFocusDescription]);

    const handleItemAdd = (type: 'nestedDescriptions' | 'images' | 'resources' | 'subtasks' | 'attachments' | 'voiceNotes') => {
        setIsExpanded(true);
        setActiveTypeToFocus(type);
    }

    const toggleExpansion = () => {
        if (!isExpanded) {
            setActiveTypeToFocus('subtasks');
        }
        setIsExpanded(!isExpanded);
    }

    const handleSuggestSubtask = async () => {
        try {
            const response = await fetch('/api/tasks/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: localTask.title,
                    mode: 'suggest_subtask',
                    context: { 
                        title: localTask.title,
                        description: localTask.description,
                        subtasks: localTask.subtasks || []
                    }
                }),
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            const newSubtask = {
                id: Math.random().toString(),
                title: data.title,
                descriptions: data.description ? [{ id: Math.random().toString(), text: data.description, createdAt: new Date() }] : [],
                completed: false,
                createdAt: new Date()
            };
            
            onUpdate({ subtasks: [...(localTask.subtasks || []), newSubtask] });
            toast.success('Subtask suggested by AI');
        } catch (error) {
            console.error('AI suggest error:', error);
            toast.error('Failed to suggest subtask');
        }
    };

    return (
        <div className='flex flex-col'>
            <div className='flex h-10 border-b border-border/60 group hover:bg-secondary/[0.02] transition-colors'>
                <div className={cn('sticky left-0 z-10 w-10 shrink-0 flex items-center justify-center border-r border-border/60', localTask.flagged ? 'bg-green-500/10' : 'bg-background')}>
                    <div className='cursor-pointer' onClick={() => {
                        if (!localTask.flagged) triggerBigConfetti();
                        onUpdate({ flagged: !localTask.flagged });
                    }}>
                        {localTask.flagged ? <CheckCircle2 size={16} className='text-green-500' /> : <Circle size={16} className='text-muted-foreground/30 hover:text-primary transition-colors' />}
                    </div>
                </div>

                <div className='sticky left-10 z-10 w-10 shrink-0 flex items-center justify-center border-r border-border/60 bg-background'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={toggleExpansion}
                                className='p-1 rounded-sm transition-colors hover:bg-secondary/20 relative'
                            >
                                <ChevronRight size={14} className={cn('transition-transform', hasAnySubItems ? 'text-primary' : 'text-muted-foreground/30', isExpanded && 'rotate-90')} />
                                {isExpanded && <div className="absolute inset-0 border border-primary/20 rounded-sm animate-pulse" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex flex-col gap-1 p-2">
                            {hasAnySubItems ? (
                                <>
                                    <p className="text-[10px] font-black uppercase tracking-widest border-b border-border/40 pb-1 mb-1">Hierarchy Contents</p>
                                    {subItemCounts.subtasks > 0 && <div className="flex items-center gap-2 text-[10px] font-bold"><ListTodo size={10} className="text-blue-500"/> {subItemCounts.subtasks} Subtasks</div>}
                                    {subItemCounts.resources > 0 && <div className="flex items-center gap-2 text-[10px] font-bold"><LinkIcon size={10} className="text-purple-500"/> {subItemCounts.resources} Resources</div>}
                                    {subItemCounts.notes > 0 && <div className="flex items-center gap-2 text-[10px] font-bold"><Type size={10} className="text-emerald-500"/> {subItemCounts.notes} Notes</div>}
                                    {subItemCounts.images > 0 && <div className="flex items-center gap-2 text-[10px] font-bold"><ImageIcon size={10} className="text-orange-500"/> {subItemCounts.images} Images</div>}
                                </>
                            ) : (
                                <p className="text-[10px] font-bold">No sub-items. Click to add subtasks.</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className='sticky left-20 z-10 flex flex-[1.5] min-w-[250px] border-r border-border/60 bg-background'>
                    <div className="flex-grow h-full min-w-0 flex flex-col justify-center pt-1">
                        <GridCell isEditable value={localTask.title} onChange={(v) => onUpdate({ title: v })} className={cn('font-bold pr-0 h-auto', localTask.flagged && 'line-through text-muted-foreground decoration-border')} placeholder='Task Title' />
                        {localTask.createdAt && (
                            <div className="px-3 -mt-1.5 pb-1 opacity-30">
                                <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                                    Created {format(localTask.createdAt.seconds ? new Date(localTask.createdAt.seconds * 1000) : new Date(localTask.createdAt), "MMM d, h:mm a")}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className='w-12 flex-shrink-0 h-full flex items-center justify-center border-l border-transparent group-hover:border-border/40 transition-colors'>
                        <button onClick={() => canEnhance && handleEnhanceTask(task.id)} disabled={!canEnhance} className='p-1 rounded-md transition-colors disabled:text-muted-foreground/20 disabled:cursor-not-allowed text-primary/70 hover:text-primary enabled:hover:bg-primary/10' title={canEnhance ? 'Enhance with AI' : 'Write a longer title or description to enable AI'} >
                            <Sparkles size={18} className={cn(isEnhancing && "animate-pulse")} />
                        </button>
                    </div>
                </div>

                <div className='flex-[2] min-w-[400px] border-r border-border/60 relative group-hover:bg-secondary/[0.05] transition-colors'>
                    {isEnhancing ? <SkeletonLoader/> : <GridCell isEditable multiline value={localTask.description} onChange={(v) => onUpdate({ description: v })} className='text-xs text-muted-foreground font-medium leading-relaxed' placeholder='Add brief description...' />}
                </div>

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
                
                <div className='w-24 shrink-0 border-r border-border/60'>{isEnhancing ? <SkeletonLoader/> : <GridCell isEditable type='number' value={localTask.leaderPoints || 0} onChange={(v) => onUpdate({ leaderPoints: Math.max(0, v) })} className='text-center font-mono font-bold text-blue-600' min={0} step={10}/>}</div>
                <div className='w-24 shrink-0 border-r border-border/60'>{isEnhancing ? <SkeletonLoader/> : <HoursCell value={localTask.deadlineHours || 0} onChange={(v) => onUpdate({ deadlineHours: v })} disabled={isEnhancing} />}</div>
                
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

                <div className='w-32 shrink-0 border-r border-border/60'>
                    {isEnhancing ? (
                        <div className="h-full w-full flex items-center justify-center p-2">
                            <div className="w-full h-full bg-secondary/50 rounded-md animate-pulse" />
                        </div>
                    ) : <PriorityPill priority={localTask.priority} onChange={(p) => onUpdate({ priority: p })} />}
                </div>

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
                        <DropdownMenuContent align='end' className='w-56' onCloseAutoFocus={(e) => e.preventDefault()}>
                            <DropdownMenuItem onClick={() => onTaskClick(task.id)}><ExternalLink size={14} className='mr-2'/> Open Drawer</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuLabel className='text-[10px] uppercase tracking-widest text-muted-foreground'>Quick Add</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleItemAdd('nestedDescriptions')} className='gap-2'>
                                <Plus size={14} className='text-emerald-500' />
                                <span className="flex-1">Add Note</span>
                                <CountTicker count={(localTask.nestedDescriptions || []).length} icon={Type} color="bg-emerald-500/10 text-emerald-600" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleItemAdd('images')} className='gap-2'>
                                <Plus size={14} className='text-orange-500' />
                                <span className="flex-1">Add Image</span>
                                <CountTicker count={(localTask.images || []).length} icon={ImageIcon} color="bg-orange-500/10 text-orange-600" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleItemAdd('attachments')} className='gap-2'>
                                <Plus size={14} className='text-rose-500' />
                                <span className="flex-1">Add File</span>
                                <CountTicker count={(localTask.attachments || []).length} icon={FileText} color="bg-rose-500/10 text-rose-600" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleItemAdd('voiceNotes')} className='gap-2'>
                                <Plus size={14} className='text-amber-500' />
                                <span className="flex-1">Add Voice</span>
                                <CountTicker count={(localTask.voiceNotes || []).length} icon={Mic} color="bg-amber-500/10 text-amber-600" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleItemAdd('resources')} className='gap-2'>
                                <Plus size={14} className='text-purple-500' />
                                <span className="flex-1">Add Resource</span>
                                <CountTicker count={(localTask.resources || []).length} icon={LinkIcon} color="bg-purple-500/10 text-purple-600" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleItemAdd('subtasks')} className='gap-2'>
                                <Plus size={14} className='text-blue-500' />
                                <span className="flex-1">Add Subtask</span>
                                <CountTicker count={(localTask.subtasks || []).length} icon={ListTodo} color="bg-blue-500/10 text-blue-600" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className='gap-2'>
                                    <FolderInput size={14} className='text-muted-foreground' />
                                    <span>Move to Bucket</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className='w-48'>
                                        <DropdownMenuItem onClick={() => onUpdate({ groupId: undefined })} className='gap-2'>
                                            <span>Main Tasks</span>
                                            {!localTask.groupId && <Check size={12} className='ml-auto text-primary' />}
                                        </DropdownMenuItem>
                                        {groups.map(group => (
                                            <DropdownMenuItem key={group.id} onClick={() => onUpdate({ groupId: group.id })} className='gap-2'>
                                                <span className='truncate'>{group.name}</span>
                                                {localTask.groupId === group.id && <Check size={12} className='ml-auto text-primary' />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => onDelete(task.id)} className='text-destructive focus:text-destructive'><Trash2 size={14} className='mr-2'/> Delete Task</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (hasAnySubItems || activeTypeToFocus || isEnhancing) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-x-auto custom-scrollbar-thin'>
                        <div className='pb-4' style={{ minWidth: 'max-content' }}>
                            {((localTask.nestedDescriptions?.length || 0) > 0 || activeTypeToFocus === 'nestedDescriptions') && (
                                <HierarchicalTable 
                                    items={localTask.nestedDescriptions || []} 
                                    type='descriptions' 
                                    depth={0} 
                                    taskId={task.id}
                                    onUpdate={(newItems) => onUpdate({ nestedDescriptions: newItems })}
                                    onDelete={(id) => onUpdate({ nestedDescriptions: localTask.nestedDescriptions?.filter(i => i.id !== id) })}
                                    isParentExpanded={isExpanded}
                                    itemToAutoEdit={itemToAutoEdit}
                                    onItemEditDone={() => setItemToAutoEdit(null)}
                                    shouldFocusQuickAdd={activeTypeToFocus === 'nestedDescriptions'}
                                    onFocusHandled={() => setActiveTypeToFocus(null)}
                                    personnel={personnel}
                                />
                            )}
                            {((localTask.attachments?.length || 0) > 0 || activeTypeToFocus === 'attachments') && (
                                <HierarchicalTable 
                                    items={localTask.attachments || []} 
                                    type='attachments' 
                                    depth={0} 
                                    taskId={task.id}
                                    onUpdate={(newItems) => onUpdate({ attachments: newItems })}
                                    onDelete={(id) => onUpdate({ attachments: localTask.attachments?.filter(i => i.id !== id) })}
                                    isParentExpanded={isExpanded}
                                    itemToAutoEdit={itemToAutoEdit}
                                    onItemEditDone={() => setItemToAutoEdit(null)}
                                    shouldFocusQuickAdd={activeTypeToFocus === 'attachments'}
                                    onFocusHandled={() => setActiveTypeToFocus(null)}
                                    onUploadFile={onUploadFile}
                                    personnel={personnel}
                                />
                            )}
                            {((localTask.voiceNotes?.length || 0) > 0 || activeTypeToFocus === 'voiceNotes') && (
                                <HierarchicalTable 
                                    items={localTask.voiceNotes || []} 
                                    type='voiceNotes' 
                                    depth={0} 
                                    taskId={task.id}
                                    onUpdate={(newItems) => onUpdate({ voiceNotes: newItems })}
                                    onDelete={(id) => onUpdate({ voiceNotes: localTask.voiceNotes?.filter(i => i.id !== id) })}
                                    isParentExpanded={isExpanded}
                                    itemToAutoEdit={itemToAutoEdit}
                                    onItemEditDone={() => setItemToAutoEdit(null)}
                                    shouldFocusQuickAdd={activeTypeToFocus === 'voiceNotes'}
                                    onFocusHandled={() => setActiveTypeToFocus(null)}
                                    onUploadFile={onUploadFile}
                                    personnel={personnel}
                                />
                            )}
                            {((localTask.images?.length || 0) > 0 || activeTypeToFocus === 'images') && (
                                <HierarchicalTable 
                                    items={localTask.images || []} 
                                    type='images' 
                                    depth={0} 
                                    taskId={task.id}
                                    onUpdate={(newItems) => onUpdate({ images: newItems })}
                                    onDelete={(id) => onUpdate({ images: localTask.images?.filter(i => i.id !== id) })}
                                    isParentExpanded={isExpanded}
                                    itemToAutoEdit={itemToAutoEdit}
                                    onItemEditDone={() => setItemToAutoEdit(null)}
                                    shouldFocusQuickAdd={activeTypeToFocus === 'images'}
                                    onFocusHandled={() => setActiveTypeToFocus(null)}
                                    personnel={personnel}
                                />
                            )}
                            {((localTask.resources?.length || 0) > 0 || activeTypeToFocus === 'resources') && (
                                <HierarchicalTable 
                                    items={localTask.resources || []} 
                                    type='resources' 
                                    depth={0} 
                                    taskId={task.id}
                                    onUpdate={(newItems) => onUpdate({ resources: newItems })}
                                    onDelete={(id) => onUpdate({ resources: localTask.resources?.filter(i => i.id !== id) })}
                                    isParentExpanded={isExpanded}
                                    itemToAutoEdit={itemToAutoEdit}
                                    onItemEditDone={() => setItemToAutoEdit(null)}
                                    shouldFocusQuickAdd={activeTypeToFocus === 'resources'}
                                    onFocusHandled={() => setActiveTypeToFocus(null)}
                                    personnel={personnel}
                                />
                            )}
                            {((localTask.subtasks?.length || 0) > 0 || activeTypeToFocus === 'subtasks' || isEnhancing) && (
                                <HierarchicalTable 
                                    items={localTask.subtasks || []} 
                                    type='subtasks' 
                                    depth={0} 
                                    taskId={task.id}
                                    onUpdate={(newItems) => onUpdate({ subtasks: newItems })}
                                    onDelete={(id) => onUpdate({ subtasks: localTask.subtasks?.filter(i => i.id !== id) })}
                                    isParentExpanded={isExpanded}
                                    itemToAutoEdit={itemToAutoEdit}
                                    onItemEditDone={() => setItemToAutoEdit(null)}
                                    shouldFocusQuickAdd={activeTypeToFocus === 'subtasks'}
                                    onFocusHandled={() => setActiveTypeToFocus(null)}
                                    onAISuggest={handleSuggestSubtask}
                                    isLoading={isEnhancing}
                                    personnel={personnel}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Task Row Mobile ---

export const TaskRowMobile = ({ 
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
        resources: false,
        nestedDescriptions: false,
        images: false,
        attachments: false,
        voiceNotes: false
    });
    const [activeTypeToFocus, setActiveTypeToFocus] = useState<'subtasks' | 'resources' | 'nestedDescriptions' | 'images' | 'attachments' | 'voiceNotes' | null>(null);
    const [itemToAutoEdit, setItemToAutoEdit] = useState<string | null>(null);
    
    const dragControls = useDragControls();

    const isAnyBranchExpanded = useMemo(() => {
        return Object.values(expandedBranches).some(v => v) || !!activeTypeToFocus;
    }, [expandedBranches, activeTypeToFocus]);

    useEffect(() => {
        if (isEnhancing) {
            setExpandedBranches({ subtasks: true, resources: false, nestedDescriptions: false, images: false, attachments: false, voiceNotes: false });
            setActiveTypeToFocus('subtasks');
        }
    }, [isEnhancing]);

    const handleQuickAdd = (type: keyof typeof expandedBranches) => {
        setExpandedBranches(prev => ({ ...prev, [type]: true }));
        setActiveTypeToFocus(type);
    }

    const handleSuggestSubtask = async () => {
        try {
            const response = await fetch('/api/tasks/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: localTask.title,
                    mode: 'suggest_subtask',
                    context: { 
                        title: localTask.title,
                        description: localTask.description,
                        subtasks: localTask.subtasks || []
                    }
                }),
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            const newSubtask = {
                id: Math.random().toString(),
                title: data.title,
                descriptions: data.description ? [{ id: Math.random().toString(), text: data.description, createdAt: new Date() }] : [],
                completed: false
            };
            
            onUpdate({ subtasks: [...(localTask.subtasks || []), newSubtask] });
            toast.success('Subtask suggested by AI');
        } catch (error) {
            console.error('AI suggest error:', error);
            toast.error('Failed to suggest subtask');
        }
    };

    return (
        <Reorder.Item 
            value={task}
            dragListener={false} 
            dragControls={dragControls} 
            layoutId={task.id} 
            whileDrag={{ scale: 0.98, boxShadow: "0px 10px 30px rgba(0,0,0,0.2)", cursor: 'grabbing' }}
            className="group flex flex-col bg-background/50 border border-border/40 rounded-2xl overflow-hidden shadow-sm transition-shadow"
        >
            <div className="flex items-center p-4 gap-3 relative">
                <div onPointerDown={(e) => dragControls.start(e)} className="cursor-grab touch-none p-2 -ml-2 text-muted-foreground/30 hover:text-muted-foreground transition-colors"><GripVertical size={20} /></div>

                <button 
                    onClick={() => {
                        if (!localTask.flagged) triggerBigConfetti();
                        onUpdate({ flagged: !localTask.flagged });
                    }}
                    className={cn("size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0", localTask.flagged ? "bg-green-500 border-green-500 text-white" : "border-border")}
                >
                    {localTask.flagged && <Check size={14} />}
                </button>

                <button 
                    onClick={() => {
                        if (isAnyBranchExpanded) {
                            setExpandedBranches({ subtasks: false, resources: false, nestedDescriptions: false, images: false, attachments: false, voiceNotes: false });
                            setActiveTypeToFocus(null);
                        } else {
                            setExpandedBranches({ 
                                subtasks: true, 
                                resources: (localTask.resources || []).length > 0, 
                                nestedDescriptions: (localTask.nestedDescriptions || []).length > 0, 
                                images: (localTask.images || []).length > 0,
                                attachments: (localTask.attachments || []).length > 0,
                                voiceNotes: (localTask.voiceNotes || []).length > 0
                            });
                            setActiveTypeToFocus('subtasks');
                        }
                    }}
                    className="p-1 rounded-md hover:bg-secondary/20 transition-colors"
                >
                    <ChevronRight size={16} className={cn("text-muted-foreground/40 transition-transform", isAnyBranchExpanded && "rotate-90", Object.values(localTask).some(v => Array.isArray(v) && v.length > 0) ? "text-primary" : "opacity-30")} />
                </button>

                <div className="flex-1 min-w-0">
                    {isEnhancing ? <div className="h-5 w-full bg-secondary/30 animate-pulse rounded" /> : (
                        <input 
                            value={localTask.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            className={cn("w-full bg-transparent border-none p-0 text-sm font-bold focus:outline-none transition-all", localTask.flagged && "text-muted-foreground/50 line-through decoration-border")}
                            placeholder="Task title"
                        />
                    )}
                </div>

                <button onClick={() => handleEnhanceTask(task.id)} className={cn("p-1.5 rounded-md transition-all", isEnhancing ? "text-primary animate-pulse" : "text-muted-foreground/30 hover:text-primary hover:bg-primary/5")}><Sparkles size={16} /></button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="p-1 rounded-md hover:bg-secondary/20 text-muted-foreground/40"><MoreHorizontal size={18} /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => onTaskClick(task.id)} className="gap-2"><ExternalLink size={14} /> Open Drawer</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Quick Add</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleQuickAdd('nestedDescriptions')} className="gap-2">
                            <Plus size={14} className="text-emerald-500" /> Add Note
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAdd('images')} className="gap-2">
                            <Plus size={14} className="text-orange-500" /> Add Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAdd('resources')} className="gap-2">
                            <Plus size={14} className="text-purple-500" /> Add Resource
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuickAdd('subtasks')} className="gap-2">
                            <Plus size={14} className="text-blue-500" /> Add Subtask
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(task.id)} className="gap-2 text-destructive"><Trash2 size={14} /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AnimatePresence>
                {isAnyBranchExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4 border-t border-border/20 bg-secondary/[0.02]">
                        {(expandedBranches.nestedDescriptions || activeTypeToFocus === 'nestedDescriptions') && (
                            <MobileHierarchicalList 
                                items={localTask.nestedDescriptions || []} 
                                type="descriptions" 
                                onUpdate={(val) => onUpdate({ nestedDescriptions: val })} 
                                onDelete={(id) => onUpdate({ nestedDescriptions: localTask.nestedDescriptions?.filter(i => i.id !== id) })} 
                                shouldFocusQuickAdd={activeTypeToFocus === 'nestedDescriptions'}
                                onFocusHandled={() => setActiveTypeToFocus(null)}
                            />
                        )}
                        {(expandedBranches.images || activeTypeToFocus === 'images') && (
                            <MobileHierarchicalList 
                                items={localTask.images || []} 
                                type="images" 
                                onUpdate={(val) => onUpdate({ images: val })} 
                                onDelete={(id) => onUpdate({ images: localTask.images?.filter(i => i.id !== id) })} 
                                shouldFocusQuickAdd={activeTypeToFocus === 'images'}
                                onFocusHandled={() => setActiveTypeToFocus(null)}
                            />
                        )}
                        {(expandedBranches.resources || activeTypeToFocus === 'resources') && (
                            <MobileHierarchicalList 
                                items={localTask.resources || []} 
                                type="resources" 
                                onUpdate={(val) => onUpdate({ resources: val })} 
                                onDelete={(id) => onUpdate({ resources: localTask.resources?.filter(i => i.id !== id) })} 
                                shouldFocusQuickAdd={activeTypeToFocus === 'resources'}
                                onFocusHandled={() => setActiveTypeToFocus(null)}
                            />
                        )}
                        {(expandedBranches.subtasks || activeTypeToFocus === 'subtasks' || isEnhancing) && (
                            <MobileHierarchicalList 
                                items={localTask.subtasks || []} 
                                type="subtasks" 
                                onUpdate={(val) => onUpdate({ subtasks: val })} 
                                onDelete={(id) => onUpdate({ subtasks: localTask.subtasks?.filter(i => i.id !== id) })} 
                                shouldFocusQuickAdd={activeTypeToFocus === 'subtasks'}
                                onFocusHandled={() => setActiveTypeToFocus(null)}
                                onAISuggest={handleSuggestSubtask}
                                isLoading={isEnhancing}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
};
