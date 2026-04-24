'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
  Plus, ChevronRight, 
  ChevronDown, 
  MoreHorizontal, Link as LinkIcon, Sparkles,
  CheckCircle2, Circle, MessageSquare, ExternalLink,
  UserPlus, X,
  Check,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Type,
  Maximize2,
  ListTodo,
  Minus,
  FileText,
  Mic,
  FileVideo,
  Download
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
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn, getUserAvatar } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { useTasks, Task, Priority, Subtask, Resource } from '@/hooks/useTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { triggerBigConfetti, triggerSmallConfetti } from '@/lib/confetti';
import { FilePreviewModal } from './FilePreviewModal';
import { useUpload, ActiveUpload } from '../../hooks/useUploadProgress';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StopCircle, Pause, Play } from 'lucide-react';
import { InlineAudioPlayer } from './InlineAudioPlayer';

// --- Types & Interfaces ---

export interface ListViewHandle {
  focus: () => void;
}

interface ListViewProps {
  tasks: Task[]; // Array of tasks from the database.
  onTaskClick: (taskId: string) => void; // Function to handle opening the task details drawer.
  personnel: any[]; // Array of personnel/users for assignment.
  onUpdateTask?: (id: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => void;
  onDeleteTask?: (id: string) => void;
  onUploadFile?: (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => void;
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
 * A specialized cell for duration (hours).
 * Provides a dropdown for days and a numeric input for remaining hours.
 */
const HoursCell = ({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) => {
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
 * A generic, editable cell for the grid.
 * Toggles between a display view and an input field on click.
 * It maintains a stable `relative` positioned container to prevent layout jumps.
 */
const GridCell = ({ 
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

    // Focus and select the input text when entering edit mode.
    useEffect(() => {
        if (isEditing) {
            // Use a timeout to ensure the element is visible and focusable after the state update.
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
            className={cn(
                'relative h-full w-full flex items-center px-3 text-sm transition-colors',
                isEditable && 'cursor-text hover:bg-secondary/10',
                className
            )}
            onClick={() => isEditable && !isEditing && setIsEditing(true)}
        >
            {/* --- Display View (conditionally invisible) --- */}
            <div className={cn('w-full truncate', isEditing && 'invisible')}>
                {children || (value !== null && value !== undefined && value !== '') 
                    ? String(value) 
                    : (isEditable ? <span className="text-muted-foreground/30 font-normal italic">{placeholder || "Empty"}</span> : value)}
            </div>

            {/* --- Editing View (Conditional Overlay) --- */}
            {isEditable && isEditing && (
                 <div className={cn(
                    'absolute top-0 left-0 right-0 z-20 bg-background shadow-lg ring-2 ring-primary',
                    multiline ? 'h-auto' : 'h-full'
                )}>
                    {multiline ? (
                        <textarea 
                            ref={textAreaRef}
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            onBlur={exitEditing}
                            onKeyDown={handleEditorKeyDown}
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
                            onKeyDown={handleEditorKeyDown}
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
 * A zoomable image modal with pan/move ability.
 */
const ImageModal = ({ url, title, onClose }: { url: string; title: string; onClose: () => void }) => {
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
const ImagePreview = ({ url, title }: { url: string; title: string }) => {
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
const CountTicker = ({ count, icon: Icon, color }: { count: number, icon: any, color: string }) => {
    if (count === 0) return null;
    return (
        <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase", color)}>
            <Icon size={10} />
            <span>{count}</span>
        </div>
    );
};

interface HierarchicalTableProps {
    items: any[];
    type: 'subtasks' | 'resources' | 'descriptions' | 'images' | 'attachments' | 'voiceNotes';
    depth: number;
    taskId: string;
    onUpdate: (updatedItems: any[]) => void;
    onDelete: (id: string) => void;
    isParentExpanded: boolean;
    itemToAutoEdit?: string | null;
    onItemEditDone?: () => void;
    shouldFocusQuickAdd?: boolean;
    onFocusHandled?: () => void;
    onAISuggest?: () => Promise<void>;
    isLoading?: boolean;
    onUploadFile?: (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => void;
    personnel: any[];
}

const HierarchicalTable = ({ 
    items, type, depth, taskId, onUpdate, onDelete, isParentExpanded, 
    itemToAutoEdit, onItemEditDone, shouldFocusQuickAdd, onFocusHandled, 
    onAISuggest, isLoading, onUploadFile, personnel
}: HierarchicalTableProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [quickAddValue, setQuickAddValue] = useState("");
    const [isSuggestingAI, setIsSuggestingAI] = useState(false);
    const [previewFile, setPreviewFile] = useState<any>(null);
    const quickAddInputRef = useRef<HTMLInputElement>(null);
    const hiddenFileInputRef = useRef<HTMLInputElement>(null);
    const { uploads } = useUpload();

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingStartTimeRef = useRef<number>(0);
    const shouldSaveRecordingRef = useRef<boolean>(true); // Ref to track if we should save on stop
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        resetTranscript();
        setIsRecording(true);
        setIsPaused(false);
        setCurrentRecordingTime(0);
        recordingStartTimeRef.current = Date.now();
        audioChunksRef.current = [];
        shouldSaveRecordingRef.current = true; // Default to saving

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                // Only save/upload if the user didn't hit 'Cancel'
                if (shouldSaveRecordingRef.current && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                    const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                    
                    const file = new File([audioBlob], `VoiceNote_${format(new Date(), 'HHmm')}.webm`, { type: 'audio/webm' });
                    // Attach duration metadata so handleFileUpload can persist it
                    (file as any).duration = finalDuration;
                    
                    const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    onUploadFile?.(mockEvent, taskId);
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            if (browserSupportsSpeechRecognition) SpeechRecognition.startListening({ continuous: true });

            recordingTimerRef.current = setInterval(() => {
                setCurrentRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Failed to start recording", err);
            toast.error("Could not access microphone");
            setIsRecording(false);
        }
    };

    const stopRecording = (shouldSave: boolean = true) => {
        shouldSaveRecordingRef.current = shouldSave;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (browserSupportsSpeechRecognition) SpeechRecognition.stopListening();
        setIsRecording(false);
        setIsPaused(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation Handshake
        const MAX_SIZE = 10 * 1024 * 1024; // Simple check for List View before parent handles it
        if (file.size > MAX_SIZE) {
            toast.error("File exceeds 10MB limit.");
            return;
        }

        onUploadFile?.(e, taskId);
    };

    const handleSuggestAI = async () => {
        if (!onAISuggest) return;
        setIsSuggestingAI(true);
        try {
            await onAISuggest();
        } finally {
            setIsSuggestingAI(false);
        }
    };

    // When the parent container expands, focus the quick add input for low-latency entry.
    useEffect(() => {
        if (shouldFocusQuickAdd || isLoading) {
            setIsCollapsed(false);
            if (shouldFocusQuickAdd) {
                // Timeout allows animation to finish before focusing.
                const timer = setTimeout(() => {
                    quickAddInputRef.current?.focus();
                }, 200);
                return () => clearTimeout(timer);
            }
        }
    }, [shouldFocusQuickAdd, isLoading]);

    // If this table has the item that needs to be auto-edited, make sure this table is expanded.
    useEffect(() => {
        if (itemToAutoEdit && items.some(item => item.id === itemToAutoEdit)) {
            setIsCollapsed(false);
        }
    }, [itemToAutoEdit, items]);

    const config = {
        subtasks: { label: 'Subtasks', icon: ListTodo, color: 'blue', bg: 'bg-blue-500/5', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-500/20' },
        resources: { label: 'Resources', icon: LinkIcon, color: 'purple', bg: 'bg-purple-500/5', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-500/20' },
        descriptions: { label: 'Notes', icon: Type, color: 'emerald', bg: 'bg-emerald-500/5', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-500/20' },
        images: { label: 'Images', icon: ImageIcon, color: 'orange', bg: 'bg-orange-500/5', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-500/20' },
        attachments: { label: 'Files', icon: FileText, color: 'rose', bg: 'bg-rose-500/5', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-500/20' },
        voiceNotes: { label: 'Voice Notes', icon: Mic, color: 'amber', bg: 'bg-amber-500/5', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-500/20' },
    }[type as 'subtasks' | 'resources' | 'descriptions' | 'images' | 'attachments' | 'voiceNotes'];

    // Lighter background based on depth
    const backgroundStyle = { 
        backgroundColor: `hsla(${
            type === 'subtasks' ? 221 : 
            type === 'resources' ? 281 : 
            type === 'descriptions' ? 142 : 
            type === 'images' ? 24 :
            type === 'attachments' ? 350 : 40 // voiceNotes hue
        }, 80%, ${95 - (depth * 2)}%, ${0.05 + (depth * 0.02)})` 
    };

    const handleUpdateItem = (id: string, updates: any) => {
        if (type === 'subtasks' && updates.completed === true) {
            triggerSmallConfetti();
        }
        onUpdate(items.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [itemActiveTypeToFocus, setItemActiveTypeToFocus] = useState<Record<string, string | null>>({});

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleItemQuickAdd = (itemId: string, subType: string) => {
        setExpandedIds(prev => ({ ...prev, [itemId]: true }));
        setItemActiveTypeToFocus(prev => ({ ...prev, [itemId]: subType }));
    };

    return (
        <div className={cn('border-l-2 ml-10', config.border)} style={backgroundStyle}>
            {/* Header */}
            <div 
                className={cn('flex h-8 text-xs font-bold items-center gap-2 px-4 uppercase tracking-widest', config.text, 'cursor-pointer')}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <config.icon size={14} />
                <span>{config.label}</span>
                {(items.length > 0 || isLoading) && <ChevronRight size={14} className={cn('transition-transform text-muted-foreground/50', !isCollapsed && 'rotate-90')} />}
                <span className='ml-auto bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full text-[10px]'>{items.length}</span>
            </div>

            {/* Items */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden'>
                        <div className='flex flex-col'>
                            {items.map((item, idx) => (
                                <div key={item.id} className='flex flex-col border-b border-border/40 group/item'>
                                    <div className='flex min-h-[40px] py-1 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                                        {/* Actions/Expand */}
                                        <div className='w-10 shrink-0 flex items-center justify-center'>
                                            {(item.subtasks?.length > 0 || item.resources?.length > 0 || item.images?.length > 0 || item.descriptions?.length > 0) && (
                                                <button onClick={() => toggleExpand(item.id)} className='p-1 rounded-full hover:bg-black/10'>
                                                    <ChevronRight size={14} className={cn('transition-transform', expandedIds[item.id] && 'rotate-90')} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Main Content Cell */}
                                        <div className='flex-1 flex items-center px-3 gap-3'>
                                            {type === 'subtasks' && (
                                                <button onClick={() => handleUpdateItem(item.id, { completed: !item.completed })}>
                                                    {item.completed ? <CheckCircle2 size={16} className='text-blue-500' /> : <Circle size={16} className='text-muted-foreground/30' />}
                                                </button>
                                            )}
                                            
                                            {type === 'images' && <ImagePreview url={item.url} title={item.title} />}
                                            {type === 'attachments' && (
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 cursor-pointer hover:bg-black/5 rounded p-1" onClick={() => setPreviewFile(item)}>
                                                        <FileText size={14} className="text-rose-500" />
                                                        <span className="text-xs font-bold truncate">{item.name}</span>
                                                        <span className="text-[10px] opacity-40 uppercase">{(item.size / 1024).toFixed(0)} KB</span>
                                                        <a href={item.url} download target="_blank" className="p-1 hover:bg-black/10 rounded-sm" onClick={(e) => e.stopPropagation()}>
                                                            <Download size={12} />
                                                        </a>
                                                    </div>
                                                    {item.createdAt && (
                                                        <div className="px-1 opacity-40 group-hover/item:opacity-70 transition-opacity">
                                                            <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                                                                {format(item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt), "MMM d, h:mm a")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {type === 'voiceNotes' && (
                                                <div className="flex-1 max-w-sm flex flex-col gap-0.5">
                                                    <InlineAudioPlayer 
                                                        url={item.url} 
                                                        audioDuration={item.duration || 0} 
                                                        className="h-8 bg-transparent border-none p-0"
                                                    />
                                                    {item.createdAt && (
                                                        <div className="opacity-40 group-hover/item:opacity-70 transition-opacity">
                                                            <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                                                                {format(item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt), "MMM d, h:mm a")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className='flex-1 flex flex-col justify-center'>
                                                {type === 'descriptions' ? (
                                                    <>
                                                        <GridCell 
                                                            isEditable 
                                                            multiline
                                                            value={item.text} 
                                                            onChange={(v) => handleUpdateItem(item.id, { text: v })} 
                                                            placeholder='Add description...'
                                                            startInEditMode={item.id === itemToAutoEdit}
                                                            onDidEndEditing={onItemEditDone}
                                                        />
                                                        {item.createdAt && (
                                                            <div className="opacity-40 group-hover/item:opacity-70 transition-opacity">
                                                                <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                                                                    {format(item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt), "MMM d, h:mm a")}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (type === 'attachments' || type === 'voiceNotes') ? null : (
                                                    <>
                                                        <GridCell 
                                                            isEditable 
                                                            value={item.title} 
                                                            onChange={(v) => handleUpdateItem(item.id, { title: v })} 
                                                            placeholder='Title'
                                                            className={cn('font-bold', type === 'subtasks' && item.completed && 'line-through text-muted-foreground')}
                                                            startInEditMode={item.id === itemToAutoEdit}
                                                            onDidEndEditing={onItemEditDone}
                                                        />
                                                        {item.createdAt && (
                                                            <div className="opacity-40 group-hover/item:opacity-70 transition-opacity">
                                                                <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                                                                    {format(item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt), "MMM d, h:mm a")}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {type === 'resources' && (
                                                <div className='flex-[1.5] min-w-0'>
                                                    <GridCell 
                                                        isEditable 
                                                        value={item.url} 
                                                        onChange={(v) => handleUpdateItem(item.id, { url: v })} 
                                                        placeholder='URL'
                                                        className='text-xs text-blue-500 hover:underline truncate'
                                                    />
                                                </div>
                                            )}
                                            
                                            {type === 'images' && (
                                                <div className='flex-[1.5] min-w-0'>
                                                    <GridCell 
                                                        isEditable 
                                                        value={item.url} 
                                                        onChange={(v) => handleUpdateItem(item.id, { url: v })} 
                                                        placeholder='Image URL'
                                                        className='text-xs text-muted-foreground/50 truncate'
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Ticklers & Actions */}
                                        <div className='flex items-center gap-2 px-4'>
                                            <CountTicker count={(item.subtasks || []).length} icon={ListTodo} color="bg-blue-500/10 text-blue-600" />
                                            <CountTicker count={(item.resources || []).length} icon={LinkIcon} color="bg-purple-500/10 text-purple-600" />
                                            <CountTicker count={(item.descriptions || []).length} icon={Type} color="bg-emerald-500/10 text-emerald-600" />
                                            <CountTicker count={(item.images || []).length} icon={ImageIcon} color="bg-orange-500/10 text-orange-600" />

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className='p-1 rounded-md opacity-100 hover:bg-black/10'><MoreHorizontal size={14} /></button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align='end' className='w-48' onCloseAutoFocus={(e) => e.preventDefault()}>
                                                    <DropdownMenuLabel>Manage Item</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleItemQuickAdd(item.id, 'descriptions')}>
                                                        <Plus size={14} className='mr-2 text-emerald-500' /> Add Description
                                                    </DropdownMenuItem>
                                                    {(type === 'subtasks' || type === 'resources') && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleItemQuickAdd(item.id, 'resources')}>
                                                                <LinkIcon size={14} className='mr-2 text-purple-500' /> Add Resource
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleItemQuickAdd(item.id, 'images')}>
                                                                <ImageIcon size={14} className='mr-2 text-orange-500' /> Add Image
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleItemQuickAdd(item.id, 'subtasks')}>
                                                                <Plus size={14} className='mr-2 text-blue-500' /> Add Subtask
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onDelete(item.id)} className='text-destructive focus:text-destructive'>
                                                        <Trash2 size={14} className='mr-2' /> Delete Item
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Nested Sub-tables */}
                                    <AnimatePresence>
                                        {expandedIds[item.id] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden bg-black/[0.01] dark:bg-white/[0.01]'>
                                                <div className='pb-2'>
                                                    {((item.descriptions || []).length > 0 || itemActiveTypeToFocus[item.id] === 'descriptions') && (
                                                        <HierarchicalTable 
                                                            items={item.descriptions || []} 
                                                            type='descriptions' 
                                                            depth={depth + 1} 
                                                            taskId={item.id}
                                                            onUpdate={(newItems) => handleUpdateItem(item.id, { descriptions: newItems })}
                                                            onDelete={(subId) => handleUpdateItem(item.id, { descriptions: item.descriptions.filter((s: any) => s.id !== subId) })}
                                                            isParentExpanded={expandedIds[item.id]}
                                                            itemToAutoEdit={itemToAutoEdit}
                                                            onItemEditDone={onItemEditDone}
                                                            shouldFocusQuickAdd={itemActiveTypeToFocus[item.id] === 'descriptions'}
                                                            onFocusHandled={() => setItemActiveTypeToFocus(prev => ({ ...prev, [item.id]: null }))}
                                                            personnel={personnel}
                                                        />
                                                    )}
                                                    {((item.images || []).length > 0 || itemActiveTypeToFocus[item.id] === 'images') && (
                                                        <HierarchicalTable 
                                                            items={item.images || []} 
                                                            type='images' 
                                                            depth={depth + 1} 
                                                            taskId={item.id}
                                                            onUpdate={(newItems) => handleUpdateItem(item.id, { images: newItems })}
                                                            onDelete={(subId) => handleUpdateItem(item.id, { images: item.images.filter((s: any) => s.id !== subId) })}
                                                            isParentExpanded={expandedIds[item.id]}
                                                            itemToAutoEdit={itemToAutoEdit}
                                                            onItemEditDone={onItemEditDone}
                                                            shouldFocusQuickAdd={itemActiveTypeToFocus[item.id] === 'images'}
                                                            onFocusHandled={() => setItemActiveTypeToFocus(prev => ({ ...prev, [item.id]: null }))}
                                                            personnel={personnel}
                                                        />
                                                    )}
                                                    {((item.resources || []).length > 0 || itemActiveTypeToFocus[item.id] === 'resources') && (
                                                        <HierarchicalTable 
                                                            items={item.resources || []} 
                                                            type='resources' 
                                                            depth={depth + 1} 
                                                            taskId={item.id}
                                                            onUpdate={(newItems) => handleUpdateItem(item.id, { resources: newItems })}
                                                            onDelete={(subId) => handleUpdateItem(item.id, { resources: item.resources.filter((s: any) => s.id !== subId) })}
                                                            isParentExpanded={expandedIds[item.id]}
                                                            itemToAutoEdit={itemToAutoEdit}
                                                            onItemEditDone={onItemEditDone}
                                                            shouldFocusQuickAdd={itemActiveTypeToFocus[item.id] === 'resources'}
                                                            onFocusHandled={() => setItemActiveTypeToFocus(prev => ({ ...prev, [item.id]: null }))}
                                                            personnel={personnel}
                                                        />
                                                    )}
                                                    {((item.subtasks || []).length > 0 || itemActiveTypeToFocus[item.id] === 'subtasks') && (
                                                        <HierarchicalTable 
                                                            items={item.subtasks || []} 
                                                            type='subtasks' 
                                                            depth={depth + 1} 
                                                            taskId={item.id}
                                                            onUpdate={(newItems) => handleUpdateItem(item.id, { subtasks: newItems })}
                                                            onDelete={(subId) => handleUpdateItem(item.id, { subtasks: item.subtasks.filter((s: any) => s.id !== subId) })}
                                                            isParentExpanded={expandedIds[item.id]}
                                                            itemToAutoEdit={itemToAutoEdit}
                                                            onItemEditDone={onItemEditDone}
                                                            shouldFocusQuickAdd={itemActiveTypeToFocus[item.id] === 'subtasks'}
                                                            onFocusHandled={() => setItemActiveTypeToFocus(prev => ({ ...prev, [item.id]: null }))}
                                                            personnel={personnel}
                                                        />
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex flex-col opacity-50">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex flex-col border-b border-border/20">
                                            <div className="flex h-10 items-center">
                                                <div className="w-10 shrink-0 flex items-center justify-center">
                                                    <ChevronRight size={14} className="rotate-90 opacity-20" />
                                                </div>
                                                <div className="flex-1 px-3">
                                                    <SkeletonLoader className="h-4" />
                                                </div>
                                            </div>
                                            {/* Skeleton Note Sub-table under the skeleton subtask */}
                                            {type === 'subtasks' && (
                                                <div className="border-l-2 ml-10 border-emerald-500/20 bg-emerald-500/5 pb-2">
                                                     <div className="flex h-8 items-center gap-2 px-4 uppercase tracking-widest text-[10px] font-bold text-emerald-800/40">
                                                        <Type size={14} />
                                                        <span>Notes</span>
                                                     </div>
                                                     <div className="flex h-10 items-center">
                                                        <div className="w-10 shrink-0" />
                                                        <div className="flex-1 px-3">
                                                            <SkeletonLoader className="h-3 w-1/2" />
                                                        </div>
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 
                                Quick Add / Upload / Recording Row 
                                This row dynamically changes based on the 'type' (files, voice, subtasks) 
                                and current activity (recording, uploading).
                            */}
                            <div className='flex h-12 items-center border-b border-border/40 hover:bg-black/5 transition-colors'>
                                <div className='w-10 shrink-0 flex items-center justify-center'>
                                    {type === 'subtasks' && onAISuggest && (
                                        <button onClick={handleSuggestAI} disabled={isSuggestingAI} className="p-1.5 rounded-md text-primary/40 hover:text-primary hover:bg-primary/5 transition-colors">
                                            <Sparkles size={14} className={isSuggestingAI ? "animate-pulse" : ""} />
                                        </button>
                                    )}
                                </div>
                                <div className='flex-1 flex flex-col justify-center px-3 overflow-hidden'>
                                    <div className="flex items-center gap-3 w-full">
                                        {/* State 1: Active Uploading (Replaces buttons to prevent multiple uploads) */}
                                        {Object.values(uploads).some(u => 
                                            u.taskId === taskId && u.status === 'uploading' && (
                                                (type === 'attachments' && !u.type.startsWith('audio/')) || 
                                                (type === 'voiceNotes' && u.type.startsWith('audio/')) ||
                                                (type === 'images' && u.type.startsWith('image/'))
                                            )
                                        ) ? (
                                            <div className="flex items-center gap-3 w-full animate-pulse px-2">
                                                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 truncate">
                                                    {type === 'voiceNotes' ? 'Processing Audio...' : 'Uploading File...'}
                                                </span>
                                            </div>
                                        ) : (
                                            /* State 2: Active Voice Recording (Horizontal UI) */
                                            type === 'voiceNotes' && isRecording ? (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center w-full gap-3 bg-red-500/5 rounded-lg px-2 py-1"
                                                >
                                                    <div className="flex items-center gap-2 text-red-500 shrink-0">
                                                        <Mic size={14} className="animate-pulse" />
                                                        <span className="text-[10px] font-mono font-bold w-10">{formatDuration(currentRecordingTime)}</span>
                                                    </div>
                                                    
                                                    {/* Animated Visualizer */}
                                                    <div className="flex-1 flex gap-0.5 items-center justify-center h-4 overflow-hidden">
                                                        {[...Array(12)].map((_, i) => (
                                                            <motion.div 
                                                                key={i}
                                                                animate={{ height: isPaused ? 2 : Math.random() * 12 + 2 }}
                                                                transition={{ repeat: Infinity, duration: 0.2, repeatType: "reverse" }}
                                                                className="w-0.5 bg-red-500/30 rounded-full"
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button 
                                                            size="icon" variant="ghost" className="h-7 w-7 rounded-full text-red-500 hover:bg-red-500/10" 
                                                            onClick={() => stopRecording(true)} title="Done Recording"
                                                        >
                                                            <Check size={14} />
                                                        </Button>
                                                        {/* CANCEL BUTTON - Discards buffer */}
                                                        <Button 
                                                            size="icon" variant="ghost" className="h-7 w-7 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10" 
                                                            onClick={() => { stopRecording(false); resetTranscript(); }} title="Cancel (Discard)"
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                /* State 3: Normal Action Buttons / Input */
                                                <div className="flex items-center gap-3 w-full">
                                                    <Plus size={14} className='text-muted-foreground/30 shrink-0' />
                                                    
                                                    {type === 'attachments' ? (
                                                        <>
                                                            <input 
                                                                type="file" ref={hiddenFileInputRef} 
                                                                onChange={handleFileUpload} className="hidden" 
                                                            />
                                                            <button 
                                                                onClick={() => hiddenFileInputRef.current?.click()}
                                                                className="text-xs font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-colors"
                                                            >
                                                                + Upload File
                                                                <span className="ml-1 opacity-40 font-bold lowercase tracking-normal">
                                                                    (Max {personnel.find(p => p.id === 'me')?.isPremium ? '250MB' : '10MB'})
                                                                </span>
                                                            </button>
                                                        </>
                                                    ) : type === 'voiceNotes' ? (
                                                        <button 
                                                            onClick={startRecording}
                                                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            <Mic size={12} /> Record Voice Note
                                                        </button>
                                                    ) : (
                                                        <input 
                                                            ref={quickAddInputRef}
                                                            placeholder={`+ Add ${config.label.slice(0, -1)}`} 
                                                            value={quickAddValue}
                                                            onBlur={() => onFocusHandled?.()}
                                                            onChange={(e) => setQuickAddValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && quickAddValue.trim()) {
                                                                    const title = quickAddValue.trim();
                                                                    let newItem: any = { 
                                                                        id: Math.random().toString(),
                                                                        createdAt: new Date()
                                                                    };

                                                                    if (type === 'descriptions') newItem.text = title;
                                                                    else if (type === 'subtasks') {
                                                                        newItem.title = title;
                                                                        newItem.description = '';
                                                                        newItem.completed = false;
                                                                    } else {
                                                                        newItem.title = title;
                                                                        newItem.url = '';
                                                                        newItem.type = 'text/plain';
                                                                    }

                                                                    onUpdate([...items, newItem]);
                                                                    setQuickAddValue('');
                                                                }
                                                            }}
                                                            className='bg-transparent w-full text-xs font-medium outline-none placeholder:text-muted-foreground/30 placeholder:italic'
                                                        />
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                    
                                    {/* 
                                        Floating Progress Indicators 
                                        Visible even when the quick-add row is in "Normal" state
                                    */}
                                    <AnimatePresence>
                                        {Object.values(uploads).filter(u => 
                                            u.taskId === taskId && (
                                                (type === 'attachments' && !u.type.startsWith('audio/')) || 
                                                (type === 'voiceNotes' && u.type.startsWith('audio/'))
                                            )
                                        ).map(u => (
                                            <motion.div 
                                                key={u.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex flex-col gap-1 mt-1 bg-primary/5 rounded px-2 py-1"
                                            >
                                                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-tighter text-primary/60">
                                                    <span className="truncate max-w-[150px]">{u.name}</span>
                                                    <span>{Math.round(u.progress)}%</span>
                                                </div>
                                                <Progress value={u.progress} className="h-0.5" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <FilePreviewModal 
                file={previewFile} 
                isOpen={!!previewFile} 
                onClose={() => setPreviewFile(null)} 
            />
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
    isEnhancing,
    onUploadFile
}: { 
    task: Task, // The original task data.
    localTask: Task, // The task data including local-first synced changes.
    onUpdate: (updates: Partial<Task>) => void, // Callback to update the task in local state and sync.
    onDelete: (id: string) => void, // Callback to delete the task.
    onTaskClick: (taskId: string) => void, // Passes the full task ID.
    personnel: any[], // List of all users.
    handleEnhanceTask: (id: string) => void, // Callback to trigger AI enhancement.
    isEnhancing: boolean, // Flag indicating if this specific task is being enhanced.
    onUploadFile?: (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
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
        if (isEnhancing) {
            setIsExpanded(true);
        }
    }, [isEnhancing]);

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
                description: data.description,
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
        <div className='flex flex-col'>
            {/* Main Task Row */}
            <div className='flex h-10 border-b border-border/60 group hover:bg-secondary/[0.02] transition-colors'>
                {/* Checkbox */}
                <div className={cn('sticky left-0 z-10 w-10 shrink-0 flex items-center justify-center border-r border-border/60', localTask.flagged ? 'bg-green-500/10' : 'bg-background')}>
                    <div className='cursor-pointer' onClick={() => {
                        if (!localTask.flagged) triggerBigConfetti();
                        onUpdate({ flagged: !localTask.flagged });
                    }}>
                        {localTask.flagged ? <CheckCircle2 size={16} className='text-green-500' /> : <Circle size={16} className='text-muted-foreground/30 hover:text-primary transition-colors' />}
                    </div>
                </div>

                {/* Branching Toggle */}
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

                {/* Title Cell with integrated AI Icon */}
                <div className='sticky left-20 z-10 flex flex-[1.5] min-w-[250px] border-r border-border/60 bg-background'>
                    <div className="flex-grow h-full min-w-0">
                        <GridCell isEditable value={localTask.title} onChange={(v) => onUpdate({ title: v })} className={cn('font-bold pr-0', localTask.flagged && 'line-through text-muted-foreground decoration-border')} placeholder='Task Title' />
                    </div>
                    <div className='w-12 flex-shrink-0 h-full flex items-center justify-center border-l border-transparent group-hover:border-border/40 transition-colors'>
                        <button onClick={() => canEnhance && handleEnhanceTask(task.id)} disabled={!canEnhance} className='p-1 rounded-md transition-colors disabled:text-muted-foreground/20 disabled:cursor-not-allowed text-primary/70 hover:text-primary enabled:hover:bg-primary/10' title={canEnhance ? 'Enhance with AI' : 'Write a longer title or description to enable AI'} >
                            <Sparkles size={18} className={cn(isEnhancing && "animate-pulse")} />
                        </button>
                    </div>
                </div>


                {/* Description Cell */}
                <div className='flex-[2] min-w-[400px] border-r border-border/60 relative group-hover:bg-secondary/[0.05] transition-colors'>
                    {isEnhancing ? <SkeletonLoader/> : <GridCell isEditable multiline value={localTask.description} onChange={(v) => onUpdate({ description: v })} className='text-xs text-muted-foreground font-medium leading-relaxed' placeholder='Add brief description...' />}
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
                <div className='w-24 shrink-0 border-r border-border/60'>{isEnhancing ? <SkeletonLoader/> : <GridCell isEditable type='number' value={localTask.leaderPoints || 0} onChange={(v) => onUpdate({ leaderPoints: Math.max(0, v) })} className='text-center font-mono font-bold text-blue-600' min={0} step={10}/>}</div>
                <div className='w-24 shrink-0 border-r border-border/60'>{isEnhancing ? <SkeletonLoader/> : <HoursCell value={localTask.deadlineHours || 0} onChange={(v) => onUpdate({ deadlineHours: v })} disabled={isEnhancing} />}</div>
                
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
                            <DropdownMenuItem onClick={() => onDelete(task.id)} className='text-destructive focus:text-destructive'><Trash2 size={14} className='mr-2'/> Delete Task</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* --- Hierarchical Sub-tables --- */}
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

// --- Task Row (Mobile Checklist - Keep Inspired) ---

/**
 * Recursive list for mobile view hierarchy.
 */
const MobileHierarchicalList = ({ items, type, onUpdate, onDelete, depth = 0, shouldFocusQuickAdd, onFocusHandled, onAISuggest, isLoading, itemToAutoEdit, onItemEditDone }: { 
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

    // ... (rest of the component)

    const handleSuggestAI = async () => {
        if (!onAISuggest) return;
        setIsSuggestingAI(true);
        try {
            await onAISuggest();
        } finally {
            setIsSuggestingAI(false);
        }
    };

    // When the parent container expands, focus the quick add input for low-latency entry.
    useEffect(() => {
        if (shouldFocusQuickAdd || isLoading) {
            setIsCollapsed(false);
            if (shouldFocusQuickAdd) {
                // Timeout allows animation to finish before focusing.
                const timer = setTimeout(() => {
                    quickAddInputRef.current?.focus();
                }, 200);
                return () => clearTimeout(timer);
            }
        }
    }, [shouldFocusQuickAdd, isLoading]);

    // If this table has the item that needs to be auto-edited, make sure this table is expanded.
    useEffect(() => {
        if (itemToAutoEdit && items.some(item => item.id === itemToAutoEdit)) {
            setIsCollapsed(false);
        }
    }, [itemToAutoEdit, items]);

    const config = {
        subtasks: { icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-500/5', label: 'Subtasks' },
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

                                    {/* Nested Items Mobile */}
                                    <AnimatePresence>
                                        {expandedIds[item.id] && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-3 pb-3">
                                                {(item.descriptions || []).length > 0 && <MobileHierarchicalList items={item.descriptions} type="descriptions" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { descriptions: val })} onDelete={(id) => handleUpdateItem(item.id, { descriptions: item.descriptions.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
                                                {(item.images || []).length > 0 && <MobileHierarchicalList items={item.images} type="images" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { images: val })} onDelete={(id) => handleUpdateItem(item.id, { images: item.images.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
                                                {(item.resources || []).length > 0 && <MobileHierarchicalList items={item.resources} type="resources" depth={depth + 1} onUpdate={(val) => handleUpdateItem(item.id, { resources: val })} onDelete={(id) => handleUpdateItem(id, { resources: item.resources.filter((i: any) => i.id !== id) })} itemToAutoEdit={itemToAutoEdit} onItemEditDone={onItemEditDone} />}
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

                            {/* Quick Add Row Mobile */}
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
        resources: false,
        nestedDescriptions: false,
        images: false,
        attachments: false,
        voiceNotes: false
    });
    const [activeTypeToFocus, setActiveTypeToFocus] = useState<'subtasks' | 'resources' | 'nestedDescriptions' | 'images' | 'attachments' | 'voiceNotes' | null>(null);
    const [itemToAutoEdit, setItemToAutoEdit] = useState<string | null>(null);
    
    // Create drag controls to link the handle to the drag gesture
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

                {/* Branch Toggle Button (Mobile) */}
                <button 
                    onClick={() => {
                        if (isAnyBranchExpanded) {
                            setExpandedBranches({ subtasks: false, resources: false, nestedDescriptions: false, images: false, attachments: false, voiceNotes: false });
                            setActiveTypeToFocus(null);
                        } else {
                            // Open subtasks by default, and others only if they have data
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

            {/* Sub-branching Mobile */}
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

const SyncStatusPulse = ({ isSyncing, hasPending }: { isSyncing: boolean; hasPending: boolean }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-border/40">
            <div className="flex gap-1">
                {/* Local Save Indicator (Yellow) */}
                <motion.div 
                    animate={{ opacity: hasPending ? [0.4, 1, 0.4] : 0.2 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={cn("size-1.5 rounded-full shadow-sm", hasPending ? "bg-amber-500 shadow-amber-500/50" : "bg-muted-foreground/30")}
                />
                {/* Cloud Sync Indicator (Blue) */}
                <motion.div 
                    animate={{ opacity: isSyncing ? [0.4, 1, 0.4] : 0.2 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={cn("size-1.5 rounded-full shadow-sm", isSyncing ? "bg-blue-500 shadow-blue-500/50" : "bg-muted-foreground/30")}
                />
                {/* All Safe Indicator (Green) */}
                <motion.div 
                    className={cn("size-1.5 rounded-full shadow-sm transition-colors", (!isSyncing && !hasPending) ? "bg-emerald-500 shadow-emerald-500/50" : "bg-muted-foreground/10")}
                />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                {isSyncing ? "Syncing..." : hasPending ? "Local Safe" : "All Changes Saved"}
            </span>
        </div>
    );
};

/**
 * The main component for the List View.
 * It orchestrates the entire grid, including headers, toolbar, and task rows.
 */
const ListViewInner: React.ForwardRefRenderFunction<ListViewHandle, ListViewProps> = (
  { tasks, onTaskClick, personnel, onUpdateTask, onDeleteTask, onUploadFile }, 
  ref
) => {
  const isMobile = useIsMobile();
  const { addTask, deleteTask, isSyncing, hasPending, drafts, updateDraft, finalizeDraft } = useTasks();

  // State for task ordering (Drag & Drop)
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);

  useEffect(() => {
      // Sync ordered tasks when remote tasks change, preserving local sort if possible
      setOrderedTasks(tasks);
  }, [tasks]);

  // State for the "Add new task" input field.
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Refs for the input fields
  const desktopAddTaskInputRef = useRef<HTMLInputElement>(null);
  const mobileAddTaskInputRef = useRef<HTMLInputElement>(null);

  // Effect to focus the input on mount
  useEffect(() => {
      if (isMobile) {
          mobileAddTaskInputRef.current?.focus();
      } else {
          desktopAddTaskInputRef.current?.focus();
      }
  }, [isMobile]); // Re-run if isMobile changes

  // State to track which task is currently being enhanced by AI.
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);

  // Focus the scrollable container on mount for keyboard navigation
  const internalRef = useRef<HTMLDivElement>(null);
  
  // Expose the internal ref to the parent via the forwarded ref
  React.useImperativeHandle(ref, () => ({
    focus: () => {
        internalRef.current?.focus();
    }
  }));

  useEffect(() => {
    if (!isMobile) {
      internalRef.current?.focus();
    }
  }, [isMobile]);

  // Global keyboard navigation listener
  useEffect(() => {
    if (isMobile) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't scroll if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      if (isTyping) return;

      const container = internalRef.current;
      if (!container) return;

      const scrollStep = 100;
      
      switch (e.key) {
        case 'ArrowRight':
          container.scrollBy({ left: scrollStep, behavior: 'auto' });
          break;
        case 'ArrowLeft':
          container.scrollBy({ left: -scrollStep, behavior: 'auto' });
          break;
        case 'ArrowDown':
          // Optional: handle vertical scroll if default is intercepted
          container.scrollBy({ top: scrollStep, behavior: 'auto' });
          break;
        case 'ArrowUp':
          container.scrollBy({ top: -scrollStep, behavior: 'auto' });
          break;
        default:
          return;
      }

      // Prevent default browser behavior (like scrolling the whole page) 
      // if we've handled the scroll inside the table
      e.preventDefault();
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMobile]);

  /**
   * Triggers the AI enhancement process for a specific task.
   * It sends the task title and description to the backend and updates the task with the response.
   */
  const handleEnhanceWithAI = async (taskId: string) => {
      const taskToEnhance = tasks.find(t => t.id === taskId);
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
          const enhancedSubtasks = (data.subtasks || []).map((s: any) => ({
              ...s,
              id: s.id || Math.random().toString(),
              descriptions: s.description ? [{ id: Math.random().toString(), text: s.description, createdAt: new Date() }] : []
          }));

          onUpdateTask?.(taskId, {
              title: data.title || taskToEnhance.title,
              description: data.description || taskToEnhance.description,
              priority: data.priority || taskToEnhance.priority,
              subtasks: enhancedSubtasks,
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

  const activeTasks = useMemo(() => tasks.filter(t => !t.flagged), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.flagged), [tasks]);

  const handleAddNewTask = async (title: string) => {
      if (!title.trim()) return;
      const cleanTitle = title.trim();
      setNewTaskTitle(''); // Clear immediately
      try {
          await addTask(cleanTitle, 'todo');
          toast.success('Task created');
      } catch (error) {
          console.error("Failed to add task:", error);
          toast.error("Failed to create task");
      }
  };

  if (isMobile) {
      return (
          <div className='flex flex-col h-full bg-background'>
              <div className="h-14 px-6 flex items-center justify-between border-b border-border/40 shrink-0">
                  <div className='flex flex-col'>
                    <h2 className='text-[10px] font-black uppercase tracking-widest text-primary/80'>Tasks Mobile</h2>
                    <p className='text-[8px] font-bold text-muted-foreground uppercase'>{tasks.length} Items</p>
                  </div>
                  <SyncStatusPulse isSyncing={isSyncing} hasPending={hasPending} />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <Reorder.Group axis="y" values={orderedTasks} onReorder={setOrderedTasks} className="space-y-3">
                      {activeTasks.map(task => (
                          <TaskRowMobile 
                              key={task.id} 
                              task={orderedTasks.find(t => t.id === task.id)!}
                              localTask={task}
                              onUpdate={(updates) => onUpdateTask?.(task.id, updates)}
                              onDelete={onDeleteTask || deleteTask}
                              onTaskClick={onTaskClick}
                              handleEnhanceTask={handleEnhanceWithAI}
                              isEnhancing={isEnhancing === task.id}
                              personnel={personnel}
                          />
                      ))}
                      
                      {/* Mobile Ghost Drafts */}
                      {drafts.filter(d => !d.parentId && (d.type === 'task' || !d.type)).map(draft => (
                          <motion.div 
                              key={draft.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 p-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl"
                          >
                               <div className="size-5 rounded-full border-2 border-dashed border-primary/30" />
                               <input 
                                    autoFocus
                                    className='flex-1 bg-transparent border-none p-0 text-sm font-bold focus:outline-none'
                                    value={draft.title}
                                    onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') finalizeDraft(draft.id);
                                    }}
                               />
                          </motion.div>
                      ))}
                  </Reorder.Group>

                  <div className="flex flex-col gap-2 p-4 bg-secondary/10 border-2 border-dashed border-border/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Plus size={20} className="text-muted-foreground/40" />
                        <input 
                            ref={mobileAddTaskInputRef} 
                            className='flex-1 bg-transparent border-none p-0 text-sm font-bold focus:outline-none placeholder:text-muted-foreground/30'
                            placeholder='Quick add task...'
                            value={newTaskTitle}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.length === 1) {
                                    const draftId = 'draft_' + Date.now();
                                    updateDraft(draftId, { title: val, type: 'task' });
                                    setNewTaskTitle('');
                                } else {
                                    setNewTaskTitle(val);
                                }
                            }}
                        />
                      </div>
                      <AnimatePresence>
                          {newTaskTitle.length > 0 && (
                              <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-[9px] text-primary/60 font-black uppercase tracking-widest pl-8"
                              >
                                  Press Enter to add
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>

                  {completedTasks.length > 0 && (
                      <div className="mt-8 space-y-3">
                          <div className="flex items-center gap-2 px-1">
                              <CheckCircle2 size={14} className="text-green-500" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-green-700">Completed</h3>
                              <span className="text-[10px] font-bold text-green-600/50 ml-auto">{completedTasks.length} Items</span>
                          </div>
                          <div className="opacity-60 grayscale-[0.5] space-y-3">
                              {completedTasks.map(task => (
                                  <TaskRowMobile 
                                      key={task.id} 
                                      task={orderedTasks.find(t => t.id === task.id)!}
                                      localTask={task}
                                      onUpdate={(updates) => onUpdateTask?.(task.id, updates)}
                                      onDelete={onDeleteTask || deleteTask}
                                      onTaskClick={onTaskClick}
                                      handleEnhanceTask={handleEnhanceWithAI}
                                      isEnhancing={isEnhancing === task.id}
                                      personnel={personnel}
                                  />
                              ))}
                          </div>
                      </div>
                  )}
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
                <h2 className='text-[11px] font-black uppercase tracking-[0.2em] text-primary/80'>Tasks Table</h2>
                <p className='text-[10px] font-bold text-muted-foreground uppercase'>{tasks.length} Active Items</p>
              </div>
          </div>
          <SyncStatusPulse isSyncing={isSyncing} hasPending={hasPending} />
      </div>

      {/* Main scrollable grid container */}
      <div 
        ref={internalRef}
        className="flex-1 overflow-auto custom-scrollbar-thick outline-none focus:ring-0"
        tabIndex={0}
      >
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
                  {activeTasks.map(task => (
                      <TaskRowDesktop 
                          key={task.id} 
                          task={orderedTasks.find(t => t.id === task.id)!}
                          localTask={task}
                          onUpdate={(updates) => onUpdateTask?.(task.id, updates)}
                          onDelete={onDeleteTask || deleteTask}
                          onTaskClick={onTaskClick}
                          personnel={personnel}
                          handleEnhanceTask={handleEnhanceWithAI}
                          isEnhancing={isEnhancing === task.id}
                          onUploadFile={onUploadFile}
                      />
                  ))}

                  {/* Render Ghost Drafts */}
                  {drafts.filter(d => !d.parentId && (d.type === 'task' || !d.type)).map(draft => (
                      <div key={draft.id} className='flex h-12 border-b border-border/60 bg-primary/5 animate-pulse-subtle'>
                          <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-background/50'>
                              <div className="size-5 rounded-full border-2 border-dashed border-primary/20" />
                          </div>
                          <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 bg-background/50' />
                          <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 bg-background/50 flex flex-col justify-center py-1'>
                              <input 
                                  autoFocus
                                  className='w-full h-full px-4 text-sm font-bold focus:outline-none bg-transparent'
                                  value={draft.title}
                                  onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          finalizeDraft(draft.id);
                                          // Next draft will be created by the "Add task" row logic below
                                      }
                                  }}
                              />
                          </div>
                          <div className="flex-1 bg-background/20" />
                      </div>
                  ))}

                  {/* Sticky Add Task Row */}
                  <div className='flex h-12 border-b border-border/60'>
                      <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-background'>
                          <Plus size={16} className='text-muted-foreground/30' />
                      </div>
                      <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 bg-background' />
                      <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 bg-background flex flex-col justify-center py-1'>
                                                <input 
                                                    ref={desktopAddTaskInputRef} 
                                                    className='w-full h-full px-4 text-sm font-medium focus:outline-none bg-transparent placeholder:text-muted-foreground/30 placeholder:italic'
                                                    placeholder='+ Add task'
                                                    value={newTaskTitle}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val.length === 1) {
                                                            const draftId = 'draft_' + Date.now();
                                                            updateDraft(draftId, { title: val, type: 'task' });
                                                            setNewTaskTitle('');
                                                        } else {
                                                            setNewTaskTitle(val);
                                                        }
                                                    }}
                                                />
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

              {completedTasks.length > 0 && (
                <div className="mt-12 flex flex-col h-full border-t border-border/40 bg-secondary/[0.02]">
                    <div className='sticky top-0 z-20 flex h-10 bg-green-500/5 border-b border-border/40 shrink-0 group/completed-header'>
                        <div className='sticky left-0 z-20 w-10 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center justify-center'>
                            <Check size={12} className='text-green-600' />
                        </div>
                        <div className='sticky left-10 z-20 w-10 shrink-0 border-r border-border/60 bg-green-500/10' />
                        <div className='sticky left-20 z-20 flex-[1.5] min-w-[250px] border-r border-border/60 bg-green-500/10 flex items-center px-4'>
                            <span className='text-[10px] font-black uppercase tracking-[0.2em] text-green-700/80'>Completed Items</span>
                            <span className='ml-3 text-[10px] font-bold text-green-600/60 bg-green-500/10 px-2 py-0.5 rounded-full'>{completedTasks.length} Done</span>
                        </div>
                        {/* Headers for Completed Section */}
                        <div className='flex-[2] min-w-[400px] border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Description</div>
                        <div className='w-32 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Assignees</div>
                        <div className='w-24 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Priority</div>
                        <div className='w-24 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Due Date</div>
                        <div className='w-32 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Subtasks</div>
                        <div className='w-32 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Resources</div>
                        <div className='w-16 shrink-0 border-r border-border/60 bg-green-500/10 flex items-center px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40'>Status</div>
                        <div className='w-10 shrink-0 bg-green-500/10' />
                    </div>

                    <div className='flex flex-col opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 transition-all'>
                        {completedTasks.map(task => (
                            <TaskRowDesktop 
                                key={task.id} 
                                task={orderedTasks.find(t => t.id === task.id)!}
                                localTask={task}
                                onUpdate={(updates) => onUpdateTask?.(task.id, updates)}
                                onDelete={deleteTask}
                                onTaskClick={onTaskClick}
                                personnel={personnel}
                                handleEnhanceTask={handleEnhanceWithAI}
                                isEnhancing={isEnhancing === task.id}
                            />
                        ))}
                    </div>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};

export const ListView = React.forwardRef(ListViewInner);