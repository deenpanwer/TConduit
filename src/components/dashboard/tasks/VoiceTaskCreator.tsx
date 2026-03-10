"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Mic, StopCircle, Play, Pause, Check, Save, Undo2, User, Flag, Plus, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Priority, Status, Task } from "@/hooks/useTasks";
import { PRIORITIES } from "./BoardView"; // Assuming PRIORITIES is exported
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceTaskCreatorProps {
  onSave: (audioData: { base64: string; mimeType: string; duration: number }, metadata: Partial<Task>) => void;
  onCancel: () => void;
  isLoading: boolean;
  canManage: boolean;
}

const MAX_AUDIO_DURATION_SECONDS = 300; // 5 minutes for testing with Firestore 1MB limit

export function VoiceTaskCreator({ onSave, onCancel, isLoading, canManage }: VoiceTaskCreatorProps) {
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

  const formatDuration = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const { employees } = useTeam();
  const { userData, user } = useAuth();
  const personnel = React.useMemo(() => {
    const list = [...employees];
    if (userData && !list.find(p => p.id === user?.uid)) {
      list.push({ id: user?.uid, ...userData } as any); // Add current user to personnel if not already there
    }
    return list.filter(Boolean);
  }, [employees, userData, user]);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(undefined);

  const currentUserId = user?.uid; // Assuming current user can assign themselves

  useEffect(() => {
    // Cleanup on unmount
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
  }, []);

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

  const startRecording = async () => {
    // ... same as before but ensure state is reset
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioDuration(0);
    setCurrentPlaybackTime(0);
    setIsPlaying(false);
    // ... rest of startRecording

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

        // Get duration
        const tempAudio = new Audio(newAudioUrl);
        tempAudio.onloadedmetadata = () => {
          setAudioDuration(isFinite(tempAudio.duration) ? tempAudio.duration : 0);
          tempAudio.src = "";
          tempAudio.load();
        };
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      toast.info("Recording started. Max 5 minutes.");

      // Enforce max duration
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          toast.warning("Recording stopped automatically (max 5 minutes reached).");
        }
      }, MAX_AUDIO_DURATION_SECONDS * 1000);

    } catch (err) {
      console.error("Failed to get audio stream:", err);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
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
        priority: taskPriority,
        assignees: taskAssignees,
        dueDate: taskDueDate?.toISOString(),
        status: "todo", // Default status for new tasks
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
    setTaskPriority("medium");
    setTaskAssignees([]);
    setTaskDueDate(undefined);
  };

  const waveformProgress = (currentPlaybackTime / audioDuration) * 100 || 0;
  const recordingProgress = (currentPlaybackTime / MAX_AUDIO_DURATION_SECONDS) * 100 || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Issue Voice Task</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X />
        </Button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Task Title */}
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">Task Title</label>
          <Input 
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder={audioDuration > 0 ? `Voice Task (${formatDuration(audioDuration)})` : "Enter title (optional, or AI will suggest)"}
            className="text-lg font-semibold"
            disabled={isRecording}
          />
        </div>

        {/* Audio Recorder */}
        <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-48 h-24 flex items-center justify-center">
                  {/* Pulsing Mic */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Mic className="size-24 text-red-500 opacity-70" />
                  </motion.div>
                  <Mic className="size-16 text-red-500 z-10" />
                </div>
                <p className="text-sm font-medium mt-4">Recording...</p>
                <p className="text-xl font-mono mt-1">{formatDuration(audioDuration > 0 ? audioDuration : currentPlaybackTime)}</p>
              </motion.div>
            ) : audioUrl ? (
              <motion.div
                key="playback"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-48 h-24 flex items-center justify-center">
                  <motion.div 
                    className="absolute h-2 bg-primary/50 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${waveformProgress}%` }}
                    transition={{ ease: "linear", duration: audioDuration }}
                    style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  {isPlaying ? (
                    <Pause className="size-16 text-primary" onClick={stopAudio} />
                  ) : (
                    <Play className="size-16 text-primary" onClick={playAudio} />
                  )}
                </div>
                <p className="text-xl font-mono mt-4">{formatDuration(currentPlaybackTime)} / {formatDuration(audioDuration)}</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <Mic className="size-16 text-muted-foreground/50" />
                <p className="text-sm font-medium mt-4 text-muted-foreground/70">Tap to start recording</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isRecording && !audioUrl && (
            <Button onClick={startRecording} className="h-12 w-32 rounded-xl text-lg gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Mic size={20} /> Record
            </Button>
          )}

          {isRecording && (
            <>
              {!isPaused ? (
                <Button onClick={pauseRecording} variant="outline" className="h-12 w-32 rounded-xl text-lg gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Pause size={20} /> Pause
                </Button>
              ) : (
                <Button onClick={resumeRecording} variant="outline" className="h-12 w-32 rounded-xl text-lg gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Play size={20} /> Resume
                </Button>
              )}
              <Button onClick={stopRecording} className="h-12 w-32 rounded-xl text-lg gap-2 bg-red-500 hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <StopCircle size={20} /> Stop
              </Button>
            </>
          )}

          {!isRecording && audioUrl && (
            <Button onClick={resetRecording} variant="outline" className="h-12 w-32 rounded-xl text-lg gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Undo2 size={20} /> Re-record
            </Button>
          )}
        </div>

        {canManage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">Priority</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <div className={cn("w-2 h-2 rounded-full", PRIORITIES[taskPriority || 'medium'].color)} />
                    {PRIORITIES[taskPriority || 'medium'].label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {Object.entries(PRIORITIES).map(([key, val]) => (
                    <DropdownMenuItem key={key} onClick={() => setTaskPriority(key as Priority)}>
                      <div className={cn("w-2 h-2 rounded-full mr-2", val.color)} />
                      {val.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !taskDueDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {taskDueDate ? format(taskDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">Assignees</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 flex-wrap h-auto min-h-10">
                    {taskAssignees.length > 0 ? (
                      taskAssignees.map(uid => {
                        const assignee = personnel.find(p => p.id === uid);
                        return assignee ? (
                          <Avatar key={uid} className="h-6 w-6 border-2 border-primary">
                            <AvatarImage src={assignee.photoUrl} />
                            <AvatarFallback>{assignee.name?.[0]}</AvatarFallback>
                          </Avatar>
                        ) : null;
                      })
                    ) : (
                      "Select Assignees"
                    )}
                    <Plus size={16} className="ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {personnel.map(p => (
                    <DropdownMenuItem 
                      key={p.id} 
                      onClick={() => {
                        setTaskAssignees(prev => 
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        );
                      }}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={p.photoUrl} />
                        <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                      </Avatar>
                      {p.name}
                      {taskAssignees.includes(p.id) && <Check size={16} className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveAudioTask} 
          disabled={isLoading || !audioBlob}
          className="shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {isLoading ? "Issuing..." : <><Save size={16} className="mr-2" /> Issue Task</>}
        </Button>
      </div>
    </div>
  );
}
