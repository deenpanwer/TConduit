'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, X, Check, Maximize2, Minus } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Priority } from '@/hooks/useTasks';

/**
 * A pulsing skeleton loader to indicate that content is being loaded.
 */
export const SkeletonLoader = ({ className }: { className?: string }) => (
    <div className={cn("h-full w-full flex items-center px-3", className)}>
        <div className="w-full h-4 bg-secondary/50 rounded-md animate-pulse" />
    </div>
);

/**
 * A colored pill component to display and change task priority.
 */
export const PriorityPill = ({ priority, onChange, disabled }: { priority: Priority, onChange: (val: Priority) => void, disabled?: boolean }) => {
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
 */
export const GridCell = ({ 
    children, 
    className, 
    isEditable = false,
    value,
    onChange,
    type = 'text',
    placeholder = '',
    multiline = false,
    startInEditMode = false,
    onDidEndEditing,
    min,
    step,
}: { 
    children?: React.ReactNode, 
    className?: string, 
    isEditable?: boolean,
    value?: string | number,
    onChange?: (val: any) => void,
    type?: 'text' | 'number',
    placeholder?: string,
    multiline?: boolean,
    startInEditMode?: boolean,
    onDidEndEditing?: () => void,
    min?: number,
    step?: number,
}) => {
    const [isEditing, setIsEditing] = useState(startInEditMode);
    const inputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing) {
            const timer = setTimeout(() => {
                if (multiline && textAreaRef.current) {
                    textAreaRef.current.focus();
                    textAreaRef.current.select();
                } else if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isEditing, multiline]);

    const exitEditing = () => {
        setIsEditing(false);
        if (onDidEndEditing) {
            onDidEndEditing();
        }
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            exitEditing();
        }
    };

    return (
        <div 
            tabIndex={isEditable ? 0 : -1}
            data-cell="true"
            className={cn(
                'relative h-full w-full flex items-center px-3 text-sm transition-colors outline-none focus:bg-primary/5 focus:ring-1 focus:ring-primary/30',
                isEditable && 'cursor-text hover:bg-secondary/10',
                className
            )}
            onClick={() => isEditable && !isEditing && setIsEditing(true)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && isEditable && !isEditing) {
                    e.preventDefault();
                    setIsEditing(true);
                }
            }}
        >
            <div className={cn('w-full truncate', isEditing && 'invisible')}>
                {children || (value !== null && value !== undefined && value !== '') 
                    ? String(value) 
                    : (isEditable ? <span className="text-muted-foreground/30 font-normal italic">{placeholder || "Empty"}</span> : value)}
            </div>

            {/* --- Editing View (Conditional Overlay) --- */}
            {isEditable && isEditing && (
                 <div 
                    data-editing="true"
                    className={cn(
                        'absolute top-0 left-0 right-0 z-20 bg-background shadow-lg ring-2 ring-primary',
                        multiline ? 'h-auto' : 'h-full'
                    )}
                >
                    {multiline ? (
                        <textarea 
                            ref={textAreaRef}
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            onBlur={exitEditing}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    exitEditing();
                                    e.stopPropagation();
                                } else {
                                    handleEditorKeyDown(e);
                                }
                            }}
                            className='w-full p-3 text-sm bg-background outline-none font-medium resize-none overflow-y-auto min-h-[120px] max-h-[240px] whitespace-pre-wrap'
                            placeholder={placeholder}
                        />
                    ) : (
                        <input 
                            ref={inputRef}
                            type={type}
                            value={value}
                            onChange={(e) => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value)}
                            onBlur={exitEditing}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    exitEditing();
                                    e.stopPropagation();
                                } else {
                                    handleEditorKeyDown(e);
                                }
                            }}
                            className='w-full h-full px-3 text-sm bg-transparent outline-none font-medium'
                            placeholder={placeholder}
                            min={min}
                            step={step}
                        />
                    )}
                    <div className="absolute -bottom-5 right-0 text-[9px] font-bold text-primary uppercase tracking-tighter bg-background px-1 border border-primary/20 rounded shadow-sm">
                        Press Enter to finish
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * A specialized cell for duration (hours).
 */
export const HoursCell = ({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) => {
    const days = Math.floor(value / 24);
    const hours = value % 24;

    const dayOptions = [
        { label: '0d', val: 0 },
        { label: '1d', val: 1 },
        { label: '2d', val: 2 },
        { label: '3d', val: 3 },
        { label: '4d', val: 4 },
        { label: '5d', val: 5 },
        { label: '1w', val: 7 },
    ];

    const currentDayOpt = dayOptions.find(o => o.val === days) || { label: `${days}d`, val: days };

    return (
        <div className='flex items-center h-full w-full group/hours'>
            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={disabled}>
                    <div className='h-full px-2 flex items-center justify-center border-r border-border/40 text-[10px] font-black cursor-pointer hover:bg-secondary/10 transition-colors uppercase bg-orange-500/5 text-orange-600'>
                        {currentDayOpt.label}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='center' className='min-w-[80px]'>
                    {dayOptions.map(opt => (
                        <DropdownMenuItem key={opt.val} onClick={() => onChange(opt.val * 24 + hours)}>
                            {opt.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className='flex-1 h-full'>
                <GridCell 
                    isEditable={!disabled} 
                    type='number' 
                    value={hours} 
                    onChange={(v) => onChange(days * 24 + Math.max(0, v))} 
                    className='text-center font-mono font-bold text-orange-600 pr-0 pl-1'
                    placeholder='h'
                    min={0}
                />
            </div>
        </div>
    );
};

/**
 * A zoomable image modal with pan/move ability.
 */
export const ImageModal = ({ url, title, onClose }: { url: string; title: string; onClose: () => void }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md' onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className='relative max-w-[90vw] max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='absolute top-4 right-4 z-10 flex gap-2'>
                    <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className='p-2 rounded-full bg-background/50 hover:bg-background transition-colors'><Plus size={18} /></button>
                    <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className='p-2 rounded-full bg-background/50 hover:bg-background transition-colors'><Minus size={18} /></button>
                    <button onClick={onClose} className='p-2 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition-colors'><X size={18} /></button>
                </div>

                <div className='p-4 border-b border-border/40'>
                    <h3 className='font-bold text-sm'>{title}</h3>
                </div>

                <div className='relative overflow-hidden cursor-move flex items-center justify-center' style={{ width: '80vw', height: '70vh' }}>
                    <motion.img 
                        src={url} 
                        alt={title}
                        drag
                        dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                        style={{ scale, x: position.x, y: position.y }}
                        className='max-w-full max-h-full object-contain pointer-events-auto'
                    />
                </div>
                
                <div className="p-2 bg-secondary/20 flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Scroll to zoom</span>
                    <span>Drag to move</span>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * A small preview of an image that can be clicked to open the modal.
 */
export const ImagePreview = ({ url, title }: { url: string; title: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <div className='relative size-8 rounded-md overflow-hidden cursor-zoom-in group shadow-sm border border-border/40' onClick={() => setIsOpen(true)}>
                <img src={url} alt={title} className='w-full h-full object-cover transition-transform group-hover:scale-110' />
                <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity'>
                    <Maximize2 size={12} className='text-white' />
                </div>
            </div>
            {isOpen && <ImageModal url={url} title={title} onClose={() => setIsOpen(false)} />}
        </>
    );
}

/**
 * A ticker/badge for showing sub-item counts.
 */
export const CountTicker = ({ count, icon: Icon, color }: { count: number, icon: any, color: string }) => {
    if (count === 0) return null;
    return (
        <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase", color)}>
            <Icon size={10} />
            <span>{count}</span>
        </div>
    );
};

export const SyncStatusPulse = ({ isSyncing, hasPending }: { isSyncing: boolean; hasPending: boolean }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-border/40">
            <div className="flex gap-1">
                <motion.div 
                    animate={{ opacity: hasPending ? [0.4, 1, 0.4] : 0.2 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={cn("size-1.5 rounded-full shadow-sm", hasPending ? "bg-amber-500 shadow-amber-500/50" : "bg-muted-foreground/30")}
                />
                <motion.div 
                    animate={{ opacity: isSyncing ? [0.4, 1, 0.4] : 0.2 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={cn("size-1.5 rounded-full shadow-sm", isSyncing ? "bg-blue-500 shadow-blue-500/50" : "bg-muted-foreground/30")}
                />
                <div className={cn("size-1.5 rounded-full shadow-sm transition-colors", (!isSyncing && !hasPending) ? "bg-emerald-500 shadow-emerald-500/50" : "bg-muted-foreground/10")} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                {isSyncing ? "Syncing..." : hasPending ? "Local Safe" : "All Changes Saved"}
            </span>
        </div>
    );
};
