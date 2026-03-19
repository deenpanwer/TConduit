"use client";

import 'regenerator-runtime/runtime';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Mic, StopCircle, Play, Pause, Check, Save, Undo2, Plus, Calendar, Sparkles, Wand2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Priority, Task, Status, Subtask } from "@/hooks/useTasks";
import { PRIORITIES } from "./BoardView"; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Skeleton } from "@/components/ui/skeleton";

interface VoiceTaskCreatorProps {
  onSave: (audioData: { base64: string; mimeType: string; duration: number }, metadata: Partial<Task>) => void;
  onCancel: () => void;
  isLoading: boolean;
  canManage: boolean;
  initialStatus?: Status;
  initialDueDate?: Date;
  initialPriority?: Priority;
  initialAssignees?: string[];
  initialData?: Partial<Task>; // Added for persistence
  onDataChange?: (data: Partial<Task>) => void; // Added for persistence
}

const MAX_AUDIO_DURATION_SECONDS = 300; 

export function VoiceTaskCreator({ 
  onSave, 
  onCancel, 
  isLoading, 
  canManage,
  initialStatus = "todo",
  initialDueDate,
  initialPriority = "medium",
  initialAssignees = [],
  initialData,
  onDataChange
}: VoiceTaskCreatorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const [taskTitle, setTaskTitle] = useState(initialData?.title || "");
  const [taskDescription, setTaskDescription] = useState(initialData?.description || "");
  const [taskPriority, setTaskPriority] = useState<Priority>(initialData?.priority || initialPriority);
  const [taskAssignees, setTaskAssignees] = useState<string[]>(initialData?.assignees || initialAssignees);
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(initialData?.dueDate ? new Date(initialData.dueDate) : initialDueDate);
  const [taskSubtasks, setTaskSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
  const [leaderPoints, setLeaderPoints] = useState<number>(initialData?.leaderPoints || 20);
  const [deadlineHours, setDeadlineHours] = useState<number>(initialData?.deadlineHours || 4);

  // Persist changes to parent
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        assignees: taskAssignees,
        dueDate: taskDueDate?.toISOString(),
        subtasks: taskSubtasks,
        leaderPoints,
        deadlineHours
      });
    }
  }, [taskTitle, taskDescription, taskPriority, taskAssignees, taskDueDate, taskSubtasks, leaderPoints, deadlineHours]);

  const enhanceWithAI = async (textToUse?: string) => {
    const textContent = textToUse || transcript || taskTitle || taskDescription;
    if (!textContent) return;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/tasks/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textContent,
          mode: 'enhance',
          context: {
            priority: taskPriority,
            status: initialStatus,
            assignees: taskAssignees
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTaskTitle(data.title || taskTitle);
        setTaskDescription(data.description || taskDescription);
        setTaskPriority(data.priority || taskPriority);
        if (data.subtasks) setTaskSubtasks(data.subtasks);
        if (data.leaderPoints) setLeaderPoints(data.leaderPoints);
        if (data.deadlineHours) setDeadlineHours(data.deadlineHours);
        toast.success("AI has enhanced your task details.");
      }
    } catch (error) {
      console.error("AI Enhancement failed:", error);
      toast.error("Failed to enhance task with AI.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const { employees } = useTeam();
  const { userData, user } = useAuth();
  
  const personnel = React.useMemo(() => {
    const personnelMap = new Map<string, any>();
    
    employees.forEach(emp => {
      if (emp && emp.id) {
        personnelMap.set(emp.id, emp);
      }
    });

    if (userData && user?.uid) {
      personnelMap.set(user.uid, { id: user.uid, ...userData });
    }
    
    return Array.from(personnelMap.values()).filter(Boolean);
  }, [employees, userData, user]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const updatePlaybackTime = () => {
        setCurrentPlaybackTime(audio.currentTime);
        if (!audio.paused && !audio.ended) {
            animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
        } else {
            setIsPlaying(false);
        }
    };

    animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setCurrentPlaybackTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioDuration(0);
    setCurrentPlaybackTime(0);
    setIsPlaying(false);
    resetTranscript();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const newBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        const newAudioUrl = URL.createObjectURL(newBlob);
        setAudioBlob(newBlob);
        setAudioUrl(newAudioUrl);
        stream.getTracks().forEach(track => track.stop());

        const tempAudio = new Audio(newAudioUrl);
        tempAudio.onloadedmetadata = () => {
          setAudioDuration(isFinite(tempAudio.duration) ? tempAudio.duration : 0);
          tempAudio.src = "";
          tempAudio.load();
        };

        // Auto-enhance with transcript if available
        if (transcript) {
          enhanceWithAI(transcript);
        }
      };

      recorder.start();
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ continuous: true });
      }
      setIsRecording(true);
      setIsPaused(false);
      toast.info("Recording started. AI will transcribe and enhance.");

      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
          toast.warning("Recording stopped automatically (max 5 minutes reached).");
        }
      }, MAX_AUDIO_DURATION_SECONDS * 1000);

    } catch (err) {
      console.error("Failed to get audio stream:", err);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.stopListening();
      }
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.stopListening();
      }
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      if (browserSupportsSpeechRecognition) {
        SpeechRecognition.startListening({ continuous: true });
      }
      setIsPaused(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      }
      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.play().then(() => setIsPlaying(true)).catch(e => {
        console.error("Error playing audio:", e);
        setIsPlaying(false);
      });
      
      audio.onended = () => {
        setIsPlaying(false);
        audio.currentTime = 0;
        setCurrentPlaybackTime(0);
      };
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSaveAudioTask = async () => {
    if (!audioBlob) {
      toast.error("No audio recorded!");
      return;
    }

    setIsRecording(false);
    setIsPlaying(false);
    if (audioRef.current) {
        audioRef.current.pause();
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const audioData = {
        base64: base64data,
        mimeType: audioBlob.type,
        duration: audioDuration,
      };
      onSave(audioData, {
        title: taskTitle || (audioDuration > 0 ? `Voice Task (${formatDuration(audioDuration)})` : "New Voice Task"),
        description: taskDescription,
        priority: taskPriority,
        assignees: taskAssignees,
        dueDate: taskDueDate?.toISOString(),
        status: initialStatus,
        subtasks: taskSubtasks,
        leaderPoints,
        deadlineHours,
      });
    };
  };

  const resetRecording = () => {
    stopRecording();
    stopAudio();
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setCurrentPlaybackTime(0);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskAssignees([]);
    setTaskDueDate(undefined);
    setTaskSubtasks([]);
    setLeaderPoints(20);
    setDeadlineHours(4);
    resetTranscript();
  };

  const waveformProgress = (currentPlaybackTime / audioDuration) * 100 || 0;

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Wand2 className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Issue AI Task</h2>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={resetRecording} title="Clear all">
                <Trash2 className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCancel}>
                <X />
            </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Task Title */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block">Task Title</label>
          {isEnhancing ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <Input 
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={audioDuration > 0 ? `Voice Task (${formatDuration(audioDuration)})` : "Enter title or let AI suggest..."}
                className="text-lg font-semibold bg-secondary/20 border-transparent focus:bg-background transition-all"
                disabled={isRecording}
            />
          )}
        </div>

        {/* Audio Recorder */}
        <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border-2 border-border/50 relative overflow-hidden group">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center w-full"
              >
                <div className="relative w-48 h-24 flex items-center justify-center">
                  <motion.div
                    animate={!isPaused ? { scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] } : { scale: 1, opacity: 0.1 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Mic className="size-24 text-red-500" />
                  </motion.div>
                  <Mic className={cn("size-16 z-10 transition-colors", isPaused ? "text-muted-foreground" : "text-red-500")} />
                </div>
                <div className="flex flex-col items-center mt-4 w-full px-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/80 animate-pulse">
                    {isPaused ? "Paused" : "Live Transcribing..."}
                  </p>
                  <p className="text-3xl font-mono font-black mt-1 tabular-nums">
                    {formatDuration(currentPlaybackTime)}
                  </p>
                  
                  {transcript && (
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-muted-foreground mt-4 text-center line-clamp-2 italic"
                    >
                        "{transcript}"
                    </motion.p>
                  )}

                  <div className="w-full max-w-[200px] h-1 bg-secondary rounded-full mt-6 overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentPlaybackTime / MAX_AUDIO_DURATION_SECONDS) * 100}%` }}
                      transition={{ ease: "linear", duration: 1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : audioUrl ? (
              <motion.div
                key="playback"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center w-full"
              >
                <div className="relative w-48 h-24 flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="size-16 text-primary cursor-pointer hover:scale-110 transition-transform" onClick={stopAudio} />
                  ) : (
                    <Play className="size-16 text-primary cursor-pointer hover:scale-110 transition-transform" onClick={playAudio} />
                  )}
                </div>
                <div className="w-full px-8 mt-4">
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden relative">
                        <motion.div 
                            className="absolute h-full bg-primary" 
                            style={{ width: `${waveformProgress}%`, left: 0 }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <p className="text-[10px] font-mono tabular-nums">{formatDuration(currentPlaybackTime)}</p>
                        <p className="text-[10px] font-mono tabular-nums">{formatDuration(audioDuration)}</p>
                    </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mic className="size-8 text-primary" />
                </div>
                <p className="text-sm font-semibold">Ready to record</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">AI will extract subtasks & details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isRecording && !audioUrl && (
            <Button onClick={startRecording} className="h-12 px-8 rounded-xl text-sm font-bold gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              <Mic size={18} /> Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              {!isPaused ? (
                <Button onClick={pauseRecording} variant="outline" className="h-12 w-32 rounded-xl text-sm font-bold gap-2 border-2">
                  <Pause size={18} /> Pause
                </Button>
              ) : (
                <Button onClick={resumeRecording} variant="outline" className="h-12 w-32 rounded-xl text-sm font-bold gap-2 border-2">
                  <Play size={18} /> Resume
                </Button>
              )}
              <Button onClick={stopRecording} className="h-12 w-32 rounded-xl text-sm font-bold gap-2 bg-red-500 hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                <StopCircle size={18} /> Stop
              </Button>
            </>
          )}

          {!isRecording && audioUrl && (
            <div className="flex gap-2">
                <Button onClick={resetRecording} variant="outline" className="h-11 rounded-xl text-xs font-bold gap-2 border-2">
                    <Undo2 size={16} /> Re-record
                </Button>
                <Button 
                    onClick={() => enhanceWithAI()} 
                    disabled={isEnhancing}
                    variant="secondary"
                    className="h-11 rounded-xl text-xs font-bold gap-2 border-2 border-primary/20"
                >
                    <Sparkles size={16} className={cn(isEnhancing && "animate-spin")} /> 
                    {isEnhancing ? "Enhancing..." : "AI Enhance"}
                </Button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="group">
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
            Description
            {isEnhancing && <Sparkles className="size-3 text-primary animate-pulse" />}
          </label>
          {isEnhancing ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : (
            <Textarea 
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Brief summary of the task..."
                className="min-h-[100px] bg-secondary/20 border-transparent focus:bg-background transition-all resize-none text-sm leading-relaxed"
            />
          )}
        </div>

        {/* Subtasks */}
        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-3 flex items-center justify-between">
            Subtasks
            <span className="text-[9px] font-mono text-muted-foreground/60">{taskSubtasks.filter(s => s.completed).length}/{taskSubtasks.length}</span>
          </label>
          <div className="space-y-2">
            {isEnhancing ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md opacity-70" />
                    <Skeleton className="h-8 w-full rounded-md opacity-40" />
                </div>
            ) : (
                <>
                    {taskSubtasks.map((sub, idx) => (
                        <div key={sub.id} className="flex items-center gap-2 group/sub">
                            <button 
                                onClick={() => {
                                    const newSub = [...taskSubtasks];
                                    newSub[idx].completed = !newSub[idx].completed;
                                    setTaskSubtasks(newSub);
                                }}
                                className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center transition-all",
                                    sub.completed ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary bg-background"
                                )}
                            >
                                {sub.completed && <Check size={10} />}
                            </button>
                            <Input 
                                value={sub.title}
                                onChange={(e) => {
                                    const newSub = [...taskSubtasks];
                                    newSub[idx].title = e.target.value;
                                    setTaskSubtasks(newSub);
                                }}
                                className="h-8 bg-transparent border-none p-0 text-sm shadow-none focus-visible:ring-0"
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 transition-opacity" onClick={() => setTaskSubtasks(taskSubtasks.filter(s => s.id !== sub.id))}>
                                <X size={12} />
                            </Button>
                        </div>
                    ))}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary gap-2"
                        onClick={() => setTaskSubtasks([...taskSubtasks, { id: Math.random().toString(), title: "", completed: false }])}
                    >
                        <Plus size={14} /> Add Step
                    </Button>
                </>
            )}
          </div>
        </div>

        {canManage && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
            {/* Leader Points */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block">Leader Points</label>
              <Input 
                type="number"
                value={leaderPoints}
                onChange={(e) => setLeaderPoints(Number(e.target.value))}
                className="h-9 text-xs border-transparent bg-secondary/20 hover:bg-secondary/40 transition-colors"
                placeholder="20"
              />
            </div>

            {/* Deadline Hours */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block">Deadline</label>
              <Input 
                type="number"
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(Number(e.target.value))}
                className="h-9 text-xs border-transparent bg-secondary/20 hover:bg-secondary/40 transition-colors"
                placeholder="4"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block">Priority</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-transparent bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full", PRIORITIES[taskPriority || 'medium'].color)} />
                    {PRIORITIES[taskPriority || 'medium'].label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  {Object.entries(PRIORITIES).map(([key, val]) => (
                    <DropdownMenuItem key={key} onClick={() => setTaskPriority(key as Priority)} className="text-xs">
                      <div className={cn("w-2 h-2 rounded-full mr-2", val.color)} />
                      {val.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs border-transparent bg-secondary/20 hover:bg-secondary/40 transition-colors",
                      !taskDueDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    {taskDueDate ? format(taskDueDate, "MMM d, yyyy") : <span>No Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={taskDueDate}
                    onSelect={setTaskDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assignees */}
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2 block">Assignees</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 flex-wrap h-auto min-h-[36px] border-transparent bg-secondary/20 hover:bg-secondary/40 transition-colors py-1.5 px-3">
                    {taskAssignees.length > 0 ? (
                      <div className="flex -space-x-1.5">
                        {taskAssignees.map(uid => {
                            const assignee = personnel.find(p => p.id === uid);
                            return assignee ? (
                            <Avatar key={uid} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={assignee.photoUrl} />
                                <AvatarFallback className="text-[8px]">{assignee.name?.[0]}</AvatarFallback>
                            </Avatar>
                            ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Everyone</span>
                    )}
                    <Plus size={12} className="ml-auto text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Members</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {personnel.map(p => (
                    <DropdownMenuItem 
                      key={p.id} 
                      onClick={() => {
                        setTaskAssignees(prev => 
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className="text-xs"
                    >
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={p.photoUrl} />
                        <AvatarFallback className="text-[8px]">{p.name?.[0]}</AvatarFallback>
                      </Avatar>
                      {p.name}
                      {taskAssignees.includes(p.id) && <Check size={14} className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2 bg-background/60 backdrop-blur-xl">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading || isEnhancing} className="text-xs font-bold uppercase tracking-widest h-10 px-6">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveAudioTask} 
          disabled={isLoading || !audioBlob || isEnhancing}
          className="h-10 px-8 rounded-lg text-xs font-black uppercase tracking-[0.15em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {isLoading ? "Syncing..." : "Issue Task"}
        </Button>
      </div>
    </div>
  );
}
