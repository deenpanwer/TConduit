"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  motion, AnimatePresence 
} from "framer-motion";
import { 
  Plus, X, Check, Trash2, Link as LinkIcon, ImageIcon,
  MoreHorizontal, FileText, ChevronRight, ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Task } from "@/hooks/useTasks";
import { AutoResizingTextarea } from "./BoardView";
import { Skeleton } from "@/components/ui/skeleton";
import { triggerSmallConfetti } from "@/lib/confetti";

export const CountTicker = ({ count, icon: Icon, color }: { count: number, icon: any, color: string }) => {
    if (count === 0) return null;
    return (
        <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm", color)}>
            <Icon size={10} />
            <span>{count}</span>
        </div>
    );
};

export function HierarchyQuickAdd({ onAdd }: { onAdd: (type: 'subtasks' | 'notes' | 'images' | 'resources') => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 gap-2 font-bold text-[10px] uppercase">
                    <Plus size={14} /> Add Item
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Hierarchy Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAdd('subtasks')} className="gap-2">
                    <ListTodo size={14} className="text-blue-500" /> Subtask
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdd('notes')} className="gap-2">
                    <FileText size={14} className="text-emerald-500" /> Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdd('images')} className="gap-2">
                    <ImageIcon size={14} className="text-orange-500" /> Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdd('resources')} className="gap-2">
                    <LinkIcon size={14} className="text-purple-500" /> Link
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface DrawerHierarchicalTableProps {
    items: any[];
    type: 'subtasks' | 'notes' | 'resources' | 'images';
    depth: number;
    onUpdate: (updatedItems: any[]) => void;
    onDelete: (id: string) => void;
    canManage: boolean;
    user: any;
    isAIEnhancing?: boolean;
    shouldFocusQuickAdd?: boolean;
    onFocusHandled?: () => void;
    forceExpand?: boolean;
}

export const DrawerHierarchicalTable = ({ 
    items, 
    type, 
    depth, 
    onUpdate, 
    onDelete, 
    canManage, 
    user, 
    isAIEnhancing,
    shouldFocusQuickAdd,
    onFocusHandled,
    forceExpand
}: DrawerHierarchicalTableProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [quickAddValue, setQuickAddValue] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const quickAddInputRef = useRef<HTMLInputElement>(null);

    const config = {
        subtasks: { label: 'Subtasks', icon: ListTodo, color: 'text-blue-600', hue: 221, bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
        notes: { label: 'Notes', icon: FileText, color: 'text-emerald-600', hue: 142, bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
        resources: { label: 'Resources', icon: LinkIcon, color: 'text-purple-600', hue: 281, bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
        images: { label: 'Images', icon: ImageIcon, color: 'text-orange-600', hue: 24, bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
    }[type];

    // Priority 1: Handle focus and expansion for Quick Add
    useEffect(() => {
        if (shouldFocusQuickAdd) {
            setIsCollapsed(false);
            setIsAdding(true);
            const timer = setTimeout(() => {
                quickAddInputRef.current?.focus();
            }, 250); // Slightly more delay to ensure animation/layout stability
            return () => clearTimeout(timer);
        }
    }, [shouldFocusQuickAdd]);

    // Priority 2: Global Force Expand
    useEffect(() => {
        if (forceExpand !== undefined) {
            setIsCollapsed(!forceExpand);
        }
    }, [forceExpand]);

    // Priority 3: Auto-expand if items are added elsewhere (e.g., AI)
    useEffect(() => {
        if (items.length > 0 && isCollapsed && !forceExpand && forceExpand !== false) {
            setIsCollapsed(false);
        }
    }, [items.length]);

    // A table is visible if it has items, is being AI enhanced, or is in "adding mode"
    const shouldBeVisible = items.length > 0 || isAIEnhancing || shouldFocusQuickAdd || isAdding;
    if (!shouldBeVisible) return null;

    const backgroundStyle = { 
        backgroundColor: `hsla(${config.hue}, 80%, ${98 - (depth * 2)}%, ${0.03 + (depth * 0.02)})` 
    };

    const handleQuickAdd = () => {
        const val = quickAddValue.trim();
        if (!val) return;

        const timestamp = Date.now();
        const newItem = type === 'notes' ? { id: `note-${timestamp}`, text: val, createdAt: new Date() } :
                       type === 'subtasks' ? { id: `st-${timestamp}`, title: val, completed: false } :
                       { id: `${type === 'images' ? 'img' : 'res'}-${timestamp}`, title: val, url: '', createdAt: new Date() };
        
        onUpdate([...items, newItem]);
        setQuickAddValue("");
        // Maintain adding state and focus for rapid-fire entry
        setTimeout(() => quickAddInputRef.current?.focus(), 10);
    };

    return (
        <div className={cn(
            "mt-2 border-l-2 ml-4 rounded-r-xl overflow-hidden transition-all duration-300",
            config.border,
            isAdding && "ring-1 ring-primary/20 shadow-sm"
        )} style={backgroundStyle}>
            <div 
                className={cn("flex items-center gap-2 px-3 py-2 cursor-pointer hover:brightness-95 transition-all group/table-header", config.color)}
                onClick={() => {
                    if (isAdding) {
                        setIsAdding(false);
                        onFocusHandled?.();
                    } else {
                        setIsCollapsed(!isCollapsed);
                    }
                }}
            >
                <ChevronRight size={12} className={cn("transition-transform opacity-40 group-hover/table-header:opacity-100", (!isCollapsed || isAdding) && "rotate-90")} />
                <config.icon size={12} className="opacity-70" />
                <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                <span className="text-[9px] font-bold opacity-30 bg-black/5 px-1.5 rounded-full ml-1">{items.length}</span>
                {isAdding && (
                    <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-primary/40 animate-pulse">Adding Mode</span>
                )}
            </div>

            <AnimatePresence mode="popLayout">
                {(!isCollapsed || isAdding) && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col">
                            {items.map((item: any, idx: number) => (
                                <DrawerHierarchyItem 
                                    key={item.id || idx}
                                    item={item}
                                    type={type}
                                    depth={depth}
                                    canManage={canManage}
                                    user={user}
                                    isAIEnhancing={isAIEnhancing}
                                    forceExpand={forceExpand}
                                    onUpdate={(upd: any) => {
                                        const newItems = [...items];
                                        newItems[idx] = { ...newItems[idx], ...upd };
                                        onUpdate(newItems);
                                    }}
                                    onDelete={() => onDelete(item.id)}
                                />
                            ))}

                            {isAIEnhancing && items.length === 0 && (
                                <div className="py-3 px-4">
                                    <Skeleton className="h-8 w-full rounded-lg opacity-20" />
                                </div>
                            )}
                            
                            {/* Quick Add Row */}
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 border-t border-border/5 transition-colors group/quick-add",
                                isAdding ? "bg-primary/5" : "bg-background/20"
                            )}>
                                <Plus size={12} className={cn("transition-colors", config.color, (isAdding || quickAddValue) ? "opacity-100" : "opacity-20")} />
                                <input 
                                    ref={quickAddInputRef}
                                    className="bg-transparent border-none p-0 text-[11px] font-bold outline-none flex-1 placeholder:italic placeholder:text-muted-foreground/20"
                                    placeholder={`+ Add ${config.label.slice(0, -1)}...`}
                                    value={quickAddValue}
                                    onFocus={() => setIsAdding(true)}
                                    onChange={(e) => setQuickAddValue(e.target.value)}
                                    onBlur={() => {
                                        // Delay to allow clicking other elements or the save button
                                        setTimeout(() => {
                                            if (!quickAddValue.trim()) {
                                                setIsAdding(false);
                                                onFocusHandled?.();
                                            }
                                        }, 200);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleQuickAdd();
                                        }
                                        if (e.key === 'Escape') {
                                            setQuickAddValue("");
                                            setIsAdding(false);
                                            onFocusHandled?.();
                                            quickAddInputRef.current?.blur();
                                        }
                                    }}
                                />
                                {(isAdding || quickAddValue) && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[8px] font-black uppercase tracking-tighter opacity-20"
                                    >
                                        Enter to Save / Esc to Cancel
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface DrawerHierarchyItemProps {
    item: any;
    type: 'subtasks' | 'notes' | 'resources' | 'images';
    onUpdate: (updates: any) => void;
    onDelete: () => void;
    depth: number;
    canManage: boolean;
    user: any;
    isAIEnhancing?: boolean;
}

export function DrawerHierarchyItem({ item, type, onUpdate, onDelete, depth, canManage, user, isAIEnhancing, forceExpand }: DrawerHierarchyItemProps & { forceExpand?: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFocusType, setActiveFocusType] = useState<'subtasks' | 'notes' | 'resources' | 'images' | null>(null);
    
    const subItemCounts = {
        subtasks: (item.subtasks || []).length,
        notes: (item.descriptions || []).length,
        resources: (item.resources || []).length,
        images: (item.images || []).length,
    };

    const hasAnySubItems = Object.values(subItemCounts).some(c => c > 0);

    // AI Enhancement or global expansion should force open items that have content
    useEffect(() => {
        if (isAIEnhancing || activeFocusType) {
            setIsExpanded(true);
        } else if (forceExpand !== undefined) {
            // If globally expanding, only expand items that have content to avoid mess
            if (forceExpand === true) {
                if (hasAnySubItems) setIsExpanded(true);
            } else {
                setIsExpanded(false);
            }
        }
    }, [forceExpand, isAIEnhancing, hasAnySubItems, activeFocusType]);

    // Live URL Preview Logic
    const isValidUrl = (url: string) => {
        try { return !!new URL(url); } catch { return false; }
    };

    const config = {
        subtasks: { icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-500/5', label: 'Subtask', border: 'border-blue-500/20' },
        notes: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-500/5', label: 'Note', border: 'border-emerald-500/20' },
        resources: { icon: LinkIcon, color: 'text-purple-600', bg: 'bg-purple-500/5', label: 'Resource', border: 'border-purple-500/20' },
        images: { icon: ImageIcon, color: 'text-orange-600', bg: 'bg-orange-500/5', label: 'Image', border: 'border-orange-500/20' },
    }[type];

    return (
        <div className="group/item flex flex-col w-full border-b border-border/5 last:border-none transition-all duration-200">
            <div className={cn(
                "flex items-start gap-1 py-2 px-2 hover:bg-black/5 dark:hover:bg-white/5 transition-all group/row relative",
                isExpanded && "bg-black/[0.02] dark:bg-white/[0.02]"
            )}>
                {/* Left Side: Expand Chevron */}
                <div className="w-4 h-6 flex items-center justify-center shrink-0">
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
                        className={cn(
                            "p-0.5 rounded-sm hover:bg-black/10 transition-colors",
                            !(hasAnySubItems || isAIEnhancing) && "opacity-20"
                        )}
                    >
                        <ChevronRight size={10} className={cn("text-muted-foreground/40 transition-transform", isExpanded && "rotate-90")} />
                    </button>
                </div>

                {/* Subtask Checkbox */}
                {type === 'subtasks' && (
                    <div className="pt-1 shrink-0 px-1">
                        <button 
                            type="button"
                            onClick={() => {
                                const isCompleting = !item.completed;
                                onUpdate({ completed: isCompleting, completedBy: isCompleting ? user?.uid : null });
                                if (isCompleting) triggerSmallConfetti();
                            }}
                            className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center transition-all",
                                item.completed ? "bg-primary border-primary text-primary-foreground" : "border-border/60 hover:border-primary bg-background"
                            )}
                        >
                            {item.completed && <Check size={10} />}
                        </button>
                    </div>
                )}

                {/* Content Cell */}
                <div className="flex-1 min-w-0 pt-0.5">
                    {type === 'notes' ? (
                        <AutoResizingTextarea 
                            value={item.text}
                            onChange={(e) => onUpdate({ text: e.target.value })}
                            className="text-[12px] bg-transparent border-none p-0 focus:ring-0 placeholder:text-muted-foreground/30 w-full min-h-[1.5rem] leading-relaxed scrollbar-hide font-medium"
                            placeholder="Type note details..."
                            maxHeight={1000} 
                        />
                    ) : (
                        <div className="space-y-1">
                            <AutoResizingTextarea 
                                value={item.title || ""}
                                onChange={(e) => onUpdate({ title: e.target.value })}
                                className={cn(
                                    "bg-transparent border-none p-0 text-[12px] font-bold focus:ring-0 w-full placeholder:text-muted-foreground/20 leading-tight scrollbar-hide",
                                    item.completed && "line-through text-muted-foreground/60 decoration-border"
                                )}
                                placeholder={`Type ${config.label.toLowerCase()} title...`}
                                maxHeight={500}
                            />
                            {(type === 'resources' || type === 'images') && (
                                <div className="group/url-input flex items-center gap-1.5">
                                    <LinkIcon size={8} className="text-muted-foreground/40" />
                                    <input 
                                        value={item.url || ""}
                                        onChange={(e) => onUpdate({ url: e.target.value })}
                                        className="bg-transparent border-none p-0 text-[10px] text-blue-500 hover:text-blue-600 transition-colors focus:outline-none w-full font-mono truncate placeholder:italic placeholder:text-muted-foreground/20"
                                        placeholder="Paste URL..."
                                    />
                                </div>
                            )}
                            {type === 'images' && item.url && isValidUrl(item.url) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-2 rounded-lg overflow-hidden border border-border/40 shadow-sm max-w-[200px] p-0.5 bg-background/50 group-hover/row:max-w-xs transition-all duration-500"
                                >
                                    <img 
                                        src={item.url} 
                                        alt="" 
                                        className="w-full object-contain max-h-48 rounded-md bg-black/5"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* Item Summary Indicators (only when collapsed) */}
                {!isExpanded && hasAnySubItems && (
                    <div className="flex items-center gap-1 px-2 pt-1 animate-in fade-in slide-in-from-right-2 duration-300">
                        <CountTicker count={subItemCounts.subtasks} icon={ListTodo} color="bg-blue-500/10 text-blue-600" />
                        <CountTicker count={subItemCounts.notes} icon={FileText} color="bg-emerald-500/10 text-emerald-600" />
                        <CountTicker count={subItemCounts.resources} icon={LinkIcon} color="bg-purple-500/10 text-purple-600" />
                        <CountTicker count={subItemCounts.images} icon={ImageIcon} color="bg-orange-500/10 text-orange-600" />
                    </div>
                )}

                {/* Actions / Add Menu */}
                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity pt-0.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground/50 hover:text-foreground">
                                <MoreHorizontal size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-40">Quick Add Nested</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setIsExpanded(true); setActiveFocusType('subtasks'); }}>
                                <ListTodo size={14} className="mr-2 text-blue-500" /> Subtask
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIsExpanded(true); setActiveFocusType('notes'); }}>
                                <FileText size={14} className="mr-2 text-emerald-500" /> Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIsExpanded(true); setActiveFocusType('resources'); }}>
                                <LinkIcon size={14} className="mr-2 text-purple-500" /> Resource
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setIsExpanded(true); setActiveFocusType('images'); }}>
                                <ImageIcon size={14} className="mr-2 text-orange-500" /> Image
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                <Trash2 size={14} className="mr-2" /> Delete Row
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Nested Sub-tables */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/[0.01] dark:bg-white/[0.01]">
                        <div className="pb-2 space-y-1">
                            <DrawerHierarchicalTable 
                                items={item.descriptions || []} type="notes" depth={depth + 1} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdate({ descriptions: val })}
                                onDelete={(id) => onUpdate({ descriptions: item.descriptions.filter((s: any) => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'notes'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isAIEnhancing}
                                forceExpand={forceExpand}
                            />

                            <DrawerHierarchicalTable 
                                items={item.images || []} type="images" depth={depth + 1} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdate({ images: val })}
                                onDelete={(id) => onUpdate({ images: item.images.filter((s: any) => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'images'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isAIEnhancing}
                                forceExpand={forceExpand}
                            />

                            <DrawerHierarchicalTable 
                                items={item.resources || []} type="resources" depth={depth + 1} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdate({ resources: val })}
                                onDelete={(id) => onUpdate({ resources: item.resources.filter((s: any) => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'resources'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isAIEnhancing}
                                forceExpand={forceExpand}
                            />

                            <DrawerHierarchicalTable 
                                items={item.subtasks || []} type="subtasks" depth={depth + 1} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdate({ subtasks: val })}
                                onDelete={(id) => onUpdate({ subtasks: item.subtasks.filter((s: any) => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'subtasks'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isAIEnhancing}
                                forceExpand={forceExpand}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function UnifiedHierarchyRoot({ 
    task, 
    onUpdateTask, 
    canManage, 
    user,
    isEnhancing 
}: { 
    task: Partial<Task> | null, 
    onUpdateTask: (updates: Partial<Task>) => void,
    canManage: boolean,
    user: any,
    isEnhancing?: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [globalForceExpand, setGlobalForceExpand] = useState<boolean | undefined>(undefined);
    const [activeFocusType, setActiveFocusType] = useState<'subtasks' | 'notes' | 'resources' | 'images' | null>(null);

    const subItemCounts = useMemo(() => {
        return {
            subtasks: (task?.subtasks || []).length,
            notes: (task?.nestedDescriptions || []).length,
            resources: (task?.resources || []).length,
            images: (task?.images || []).length,
        };
    }, [task]);

    const hasContent = Object.values(subItemCounts).some(count => count > 0);

    const handleAddRoot = (type: 'subtasks' | 'notes' | 'resources' | 'images') => {
        setIsExpanded(true);
        setActiveFocusType(type);
        setGlobalForceExpand(true); // Override any previous collapse
    };

    const toggleExpansion = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextState = !isExpanded;
        
        if (nextState) {
            // Trigger recursive expansion of created things
            setGlobalForceExpand(true);
            // If empty, start with subtasks
            if (!hasContent) {
                setActiveFocusType('subtasks');
            }
        } else {
            // Collapsing everything - reset focus too
            setActiveFocusType(null);
            setGlobalForceExpand(false);
        }
        
        setIsExpanded(nextState);
    };

    // Auto-expand if AI is enhancing
    useEffect(() => {
        if (isEnhancing) {
            setIsExpanded(true);
            setGlobalForceExpand(true);
        }
    }, [isEnhancing]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 group">
                <div className="cursor-pointer flex items-center gap-3" onClick={toggleExpansion}>
                    <ChevronRight className={cn("transition-transform", isExpanded && "rotate-90")} size={20} />
                    <label className="text-[11px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] cursor-pointer">Task Breakdown</label>
                </div>
                
                {!isExpanded && hasContent && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <CountTicker count={subItemCounts.subtasks} icon={ListTodo} color="bg-blue-500/10 text-blue-600" />
                        <CountTicker count={subItemCounts.notes} icon={FileText} color="bg-emerald-500/10 text-emerald-600" />
                        <CountTicker count={subItemCounts.images} icon={ImageIcon} color="bg-orange-500/10 text-orange-600" />
                        <CountTicker count={subItemCounts.resources} icon={LinkIcon} color="bg-purple-500/10 text-purple-600" />
                    </div>
                )}

                <div className="ml-auto">
                    <HierarchyQuickAdd onAdd={handleAddRoot} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="overflow-hidden"
                    >
                        <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/30 pb-6 space-y-2">
                            <DrawerHierarchicalTable 
                                items={task?.nestedDescriptions || []} type="notes" depth={0} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdateTask({ nestedDescriptions: val })}
                                onDelete={(id) => onUpdateTask({ nestedDescriptions: (task?.nestedDescriptions || []).filter(s => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'notes'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isEnhancing}
                                forceExpand={globalForceExpand}
                            />

                            <DrawerHierarchicalTable 
                                items={task?.images || []} type="images" depth={0} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdateTask({ images: val })}
                                onDelete={(id) => onUpdateTask({ images: (task?.images || []).filter(s => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'images'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isEnhancing}
                                forceExpand={globalForceExpand}
                            />

                            <DrawerHierarchicalTable 
                                items={task?.resources || []} type="resources" depth={0} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdateTask({ resources: val })}
                                onDelete={(id) => onUpdateTask({ resources: (task?.resources || []).filter(s => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'resources'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isEnhancing}
                                forceExpand={globalForceExpand}
                            />

                            <DrawerHierarchicalTable 
                                items={task?.subtasks || []} type="subtasks" depth={0} canManage={canManage} user={user}
                                onUpdate={(val) => onUpdateTask({ subtasks: val })}
                                onDelete={(id) => onUpdateTask({ subtasks: (task?.subtasks || []).filter(s => s.id !== id) })}
                                shouldFocusQuickAdd={activeFocusType === 'subtasks'}
                                onFocusHandled={() => setActiveFocusType(null)}
                                isAIEnhancing={isEnhancing}
                                forceExpand={globalForceExpand}
                            />

                            {!hasContent && !isEnhancing && (
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-20">
                                    <Plus className="size-8 opacity-20" />
                                    <p className="text-xs font-medium uppercase tracking-widest">No Items Added</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
