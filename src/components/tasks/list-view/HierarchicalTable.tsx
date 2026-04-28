'use client';

import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ChevronRight, 
  MoreHorizontal, Link as LinkIcon, Sparkles,
  CheckCircle2, Circle,
  Check,
  Trash2,
  Image as ImageIcon,
  Type,
  ListTodo,
  FileText,
  Mic,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { triggerSmallConfetti } from '@/lib/confetti';
import { FilePreviewModal } from '@/components/tasks/FilePreviewModal';
import { useUpload } from '@/hooks/useUploadProgress';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Progress } from '@/components/ui/progress';
import { InlineAudioPlayer } from '@/components/tasks/InlineAudioPlayer';
import { 
    GridCell, 
    SkeletonLoader, 
    ImagePreview, 
    CountTicker 
} from './ListViewPrimitives';

export interface HierarchicalTableProps {
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

export const HierarchicalTable = ({ 
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
    const shouldSaveRecordingRef = useRef<boolean>(true);
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
        shouldSaveRecordingRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (shouldSaveRecordingRef.current && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                    const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                    
                    const file = new File([audioBlob], `VoiceNote_${format(new Date(), 'HHmm')}.webm`, { type: 'audio/webm' });
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

        const MAX_SIZE = 10 * 1024 * 1024;
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
        subtasks: { label: depth > 0 ? 'Granular Subtasks' : 'Subtasks', icon: ListTodo, color: 'blue', bg: 'bg-blue-500/5', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-500/20' },
        resources: { label: 'Resources', icon: LinkIcon, color: 'purple', bg: 'bg-purple-500/5', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-500/20' },
        descriptions: { label: 'Notes', icon: Type, color: 'emerald', bg: 'bg-emerald-500/5', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-500/20' },
        images: { label: 'Images', icon: ImageIcon, color: 'orange', bg: 'bg-orange-500/5', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-500/20' },
        attachments: { label: 'Files', icon: FileText, color: 'rose', bg: 'bg-rose-500/5', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-500/20' },
        voiceNotes: { label: 'Voice Notes', icon: Mic, color: 'amber', bg: 'bg-amber-500/5', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-500/20' },
    }[type as 'subtasks' | 'resources' | 'descriptions' | 'images' | 'attachments' | 'voiceNotes'];

    const backgroundStyle = { 
        backgroundColor: `hsla(${
            type === 'subtasks' ? 221 : 
            type === 'resources' ? 281 : 
            type === 'descriptions' ? 142 : 
            type === 'images' ? 24 :
            type === 'attachments' ? 350 : 40 
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

    const safeFormatDate = (dateVal: any) => {
        if (!dateVal) return null;
        try {
            const date = dateVal.seconds 
                ? new Date(dateVal.seconds * 1000) 
                : (dateVal.toDate ? dateVal.toDate() : new Date(dateVal));
            
            if (isNaN(date.getTime())) return null;
            return format(date, "MMM d, h:mm a");
        } catch (e) {
            return null;
        }
    };

    const handleItemQuickAdd = (itemId: string, subType: string) => {
        setExpandedIds(prev => ({ ...prev, [itemId]: true }));
        setItemActiveTypeToFocus(prev => ({ ...prev, [itemId]: subType }));
    };

    return (
        <div className={cn('border-l-2 ml-10', config.border)} style={backgroundStyle}>
            <div 
                className={cn('flex h-8 text-xs font-bold items-center gap-2 px-4 uppercase tracking-widest', config.text, 'cursor-pointer')}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <config.icon size={14} />
                <span>{config.label}</span>
                {(items.length > 0 || isLoading) && <ChevronRight size={14} className={cn('transition-transform text-muted-foreground/50', !isCollapsed && 'rotate-90')} />}
                <span className='ml-auto bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full text-[10px]'>{items.length}</span>
            </div>

            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden'>
                        <div className='flex flex-col'>
                            {items.map((item, idx) => (
                                <div key={item.id} className='flex flex-col border-b border-border/40 group/item'>
                                    <div className='flex min-h-[40px] py-1 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors'>
                                        <div className='w-10 shrink-0 flex items-center justify-center'>
                                            {(item.subtasks?.length > 0 || item.resources?.length > 0 || item.images?.length > 0 || item.descriptions?.length > 0) && (
                                                <button onClick={() => toggleExpand(item.id)} className='p-1 rounded-full hover:bg-black/10'>
                                                    <ChevronRight size={14} className={cn('transition-transform', expandedIds[item.id] && 'rotate-90')} />
                                                </button>
                                            )}
                                        </div>

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
                                                                {safeFormatDate(item.createdAt)}
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
                                                                {safeFormatDate(item.createdAt)}
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
                                                                    {safeFormatDate(item.createdAt)}
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
                                                                    {safeFormatDate(item.createdAt)}
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
                                                        <Button 
                                                            size="icon" variant="ghost" className="h-7 w-7 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10" 
                                                            onClick={() => { stopRecording(false); resetTranscript(); }} title="Cancel (Discard)"
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ) : (
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
