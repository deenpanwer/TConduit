
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  motion, AnimatePresence 
} from "framer-motion";
import { 
  Plus, Calendar, X, Check, Layers, Trash2, Sparkles, Wand2, Link as LinkIcon, Minus, AtSign, ImageIcon,
  Mic, StopCircle, Pause, Play, Volume2, MicOff, MoreHorizontal, FileText, ChevronRight, ChevronDown, ListTodo, MessageSquare, Upload
} from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useUpload } from "@/hooks/useUploadProgress";
import { Progress } from "@/components/ui/progress";
import { FilePreviewModal } from "./FilePreviewModal";
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
import { useTasks, Task, Priority, Subtask } from "@/hooks/useTasks";
import { PRIORITIES, AutoResizingTextarea } from "./BoardView";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { InlineAudioPlayer } from "./InlineAudioPlayer";
import { toast } from "sonner";
import { triggerSmallConfetti } from "@/lib/confetti";
import { useAuth } from "@/hooks/use-auth";
import { 
  CountTicker, 
  HierarchyQuickAdd, 
  DrawerHierarchicalTable, 
  DrawerHierarchyItem, 
  UnifiedHierarchyRoot 
} from "./HierarchicalUI";

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
  handleEnhanceTask: (transcript?: string) => Promise<void>;
  handleBulkParse: () => Promise<void>;
  isBulkMode: boolean;
  setIsBulkMode: (val: boolean) => void;
  bulkInput: string;
  setBulkInput: (val: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MAX_TEXTAREA_HEIGHT_TITLE = 150;
const MAX_TEXTAREA_HEIGHT_DESCRIPTION = 300;
const MAX_TEXTAREA_HEIGHT_SUBTASK = 80;
const MAX_AUDIO_DURATION_SECONDS = 300;

// --- Hierarchical Components for Drawer (Reference-Inspired) ---
interface CommentsSectionProps {
  taskId: string;
  comments: any[];
  personnel: any[];
}

function CommentsSection({ taskId, comments, personnel }: CommentsSectionProps) {
    const [newComment, setNewComment] = useState("");
    const { addComment } = useTasks();

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <MessageSquare size={12} className="text-primary" /> Comments ({(comments || []).length})
            </label>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar-thin">
                {(comments || []).length === 0 ? (
                    <div className="text-center py-8 opacity-20 italic text-xs">No comments yet.</div>
                ) : (
                    comments.map((comment: any, idx: number) => {
                        const author = personnel.find((p: any) => p.id === comment.userId);
                        return (
                            <div key={comment.id || idx} className="flex gap-3 group/comment">
                                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                                    <AvatarImage src={getUserAvatar(author)} />
                                    <AvatarFallback className="text-[8px]">{author?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-foreground/70">{author?.name || 'Unknown'}</span>
                                        <span className="text-[8px] text-muted-foreground">
                                            {comment.createdAt?.seconds ? format(new Date(comment.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/10 p-2 rounded-lg border border-border/20">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex items-start gap-3 bg-secondary/20 p-2 rounded-xl border border-border/40 focus-within:border-primary/40 transition-all">
                <AutoResizingTextarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 text-xs bg-transparent border-none p-0 focus:ring-0 placeholder:text-muted-foreground/30 min-h-[40px] max-h-[120px]"
                    maxHeight={120}
                />                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full shrink-0"
                    disabled={!newComment.trim()}
                    onClick={async () => {
                        if (taskId === 'new') {
                            toast.error("Save the task first to add comments.");
                            return;
                        }
                        await addComment(taskId, newComment);
                        setNewComment("");
                    }}
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
}

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
  setBulkInput,
  handleFileUpload
}: TypedTaskCreatorProps) {
  const [showTopFadeTitle, setShowTopFadeTitle] = useState(false);
  const [showBottomFadeTitle, setShowBottomFadeTitle] = useState(false);
  const [showTopFadeDescription, setShowTopFadeDescription] = useState(false);
  const [showBottomFadeDescription, setShowBottomFadeDescription] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const shouldSaveRecordingRef = useRef<boolean>(true);
  const onUpdateTaskRef = useRef(onUpdateTask);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep ref up to date to avoid closure issues
  useEffect(() => {
    onUpdateTaskRef.current = onUpdateTask;
  }, [onUpdateTask]);

  const { uploads, setUpload, removeUpload } = useUpload();
  const { user, userData } = useAuth();
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPremium = userData?.isPremium || userData?.orgIsPremium || false;
    const MAX_SIZE = isPremium ? 250 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
        toast.error(`File exceeds ${isPremium ? '250MB' : '10MB'} limit.`, {
            description: !isPremium ? "Upgrade to Premium for 250MB file support." : "Please select a smaller file.",
            duration: 5000,
        });
        // Clear input
        if (event.target) event.target.value = '';
        return;
    }

    handleFileUpload(event);
    // Clear input so the same file can be uploaded again if needed
    if (event.target) event.target.value = '';
  };

  // Recording Logic
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Only save/upload if the user didn't hit 'Cancel'
        if (shouldSaveRecordingRef.current && audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
            
            const uploadId = Date.now().toString();
            const orgId = userData?.orgId || userData?.ownedOrgId || 'unknown';
            const path = `organizations/${orgId}/tasks/new/voiceNotes/${uploadId}_recording.webm`;
            const storageRef = ref(storage, path);
            
            setUpload(uploadId, { id: uploadId, name: 'Voice Note', type: 'audio/webm;codecs=opus', size: audioBlob.size, progress: 0, status: 'uploading' });
            const uploadTask = uploadBytesResumable(storageRef, audioBlob);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUpload(uploadId, { progress: p });
                },
                (error) => {
                    console.error(error);
                    toast.error("Failed to save voice note");
                    setUpload(uploadId, { status: 'error' });
                    setTimeout(() => removeUpload(uploadId), 3000);
                },
                async () => {
                                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                                  const newVoiceNote: any = {
                                      id: uploadId,
                                      name: `Voice Recording`,
                                      url,
                                      type: 'audio/webm;codecs=opus',
                                      size: audioBlob.size,
                                      createdAt: new Date(),
                                      duration: finalDuration
                                  };                    
                    onUpdateTaskRef.current("new", { 
                        voiceNotes: [...(editingNewTask?.voiceNotes || []), newVoiceNote] 
                    });
                    setUpload(uploadId, { progress: 100, status: 'done' });
                    setTimeout(() => removeUpload(uploadId), 1000);
                }
            );
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ continuous: true });
      }

      recordingTimerRef.current = setInterval(() => {
        setCurrentRecordingTime(prev => {
          if (prev >= MAX_AUDIO_DURATION_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
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
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (browserSupportsSpeechRecognition) {
      SpeechRecognition.stopListening();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (browserSupportsSpeechRecognition) SpeechRecognition.stopListening();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      recordingTimerRef.current = setInterval(() => {
        setCurrentRecordingTime(prev => prev + 1);
      }, 1000);
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ continuous: true });
      }
      setIsPaused(false);
    }
  };

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
        isMobile ? "inset-0 rounded-none" : "inset-y-4 right-4 w-1/2 rounded-2xl"
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
                variant="outline"
                size="sm"
                className={cn(
                    "h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                    ((editingNewTask?.title?.length || 0) > 5 || (editingNewTask?.description?.length || 0) > 10 || (editingNewTask?.voiceNotes && editingNewTask.voiceNotes.length > 0))
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-secondary/50 text-muted-foreground border-transparent opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleEnhanceTask(transcript)}
                disabled={isEnhancing || !((editingNewTask?.title?.length || 0) > 5 || (editingNewTask?.description?.length || 0) > 10 || (editingNewTask?.voiceNotes && editingNewTask.voiceNotes.length > 0))}
              >
                {isEnhancing ? <Wand2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                {isEnhancing ? "Enhancing..." : "AI Enhance"}
              </Button>
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
                    onUpdateTask("new", { title: "", description: "", subtasks: [], resources: [], voiceNotes: [], attachments: [], images: [] });
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
                autoFocus={!editingNewTask?.title}
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
                       {personnel.map((p: any) => {
                           const isAssigned = (editingNewTask?.assignees || []).some((uid: any) => uid === p.id);
                           return (
                               <DropdownMenuItem 
                                   key={`new-task-assign-user-${p.id}`}
                                   onClick={() => {
                                       if (isAssigned) {
                                          onUpdateTask("new", { assignees: (editingNewTask?.assignees || []).filter((uid: any) => uid !== p.id) }, 'assignees_updated');
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
                  editingNewTask?.assignees?.map((uid: any) => {
                     const u = personnel.find((p: any) => p.id === uid);
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
                                    const newAssignees = (editingNewTask?.assignees || []).filter((a: any) => a !== uid);
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
                    onClick={() => handleEnhanceTask()}
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
           <UnifiedHierarchyRoot 
               task={editingNewTask}
               onUpdateTask={(upd) => onUpdateTask("new", upd)}
               canManage={canManage}
               user={userData}
               isEnhancing={isEnhancing}
               onUpload={handleFileChange}
               recordingState={{
                  isRecording,
                  isPaused,
                  currentRecordingTime,
                  stopRecording,
                  pauseRecording,
                  resumeRecording,
                  formatDuration
               }}
           />
        </div>

        {(editingNewTask as any)?.id && (editingNewTask as any)?.id !== 'new' && (
            <div className="mb-8 pt-8 border-t border-border/40">
                <CommentsSection 
                    taskId={(editingNewTask as any).id}
                    comments={editingNewTask?.comments || []}
                    personnel={personnel}
                />
            </div>
        )}

        </>
        )}
      </div>
      <div className="p-4 border-t border-border/50 bg-card shrink-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
            {isRecording ? (
                <motion.div 
                    key="recording-bar"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="flex items-center gap-4 bg-primary/5 rounded-xl px-4 py-2"
                >
                    <div className="flex items-center gap-2 text-red-500 animate-pulse">
                        <Mic size={16} />
                        <span className="text-sm font-mono font-bold tabular-nums">{formatDuration(currentRecordingTime)}</span>
                    </div>
                    
                    <div className="flex-1 h-8 flex items-center justify-center">
                        <div className="flex gap-0.5 items-center">
                            {[...Array(20)].map((_: any, i: number) => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: isPaused ? 2 : Math.random() * 20 + 2 }}
                                    transition={{ repeat: Infinity, duration: 0.2, repeatType: "reverse" }}
                                    className="w-1 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                         {isPaused ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={resumeRecording}><Play size={16} /></Button>
                         ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={pauseRecording}><Pause size={16} /></Button>
                         )}
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { stopRecording(false); resetTranscript(); }}><Trash2 size={16} /></Button>

                         <Button size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg" onClick={() => stopRecording(true)}><Check size={16} /></Button>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="standard-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onCancel} className="text-xs font-bold uppercase tracking-widest px-4">
                           Cancel
                        </Button>
                        <Button onClick={onSave} className="h-10 px-6 rounded-lg text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all" disabled={isEnhancing || (!isBulkMode && !editingNewTask?.title)}>
                           Create Task
                        </Button>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isRecording ? { 
                            scale: [1, 1.2, 1],
                            backgroundColor: ["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0.5)", "rgba(239, 68, 68, 0.2)"]
                        } : {}}
                        transition={isRecording ? { repeat: Infinity, duration: 1.5 } : {}}
                        className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                            isRecording ? "bg-red-500 text-white shadow-red-500/20" : "bg-secondary/30 hover:bg-primary hover:text-primary-foreground"
                        )}
                        onClick={isRecording ? () => stopRecording(true) : startRecording}
                    >
                        <Mic size={24} className={cn(isRecording && "animate-pulse")} />
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
