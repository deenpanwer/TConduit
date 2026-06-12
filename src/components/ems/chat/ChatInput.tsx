"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Plus, Mic, Trash2, Check, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadModal } from "./UploadModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getUserAvatar } from "@/lib/utils";

interface ChatInputProps {
  inputText: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  isDisabled: boolean;
  isPremium: boolean;
  employees: any[]; // Team roster for @mentions autocomplete
  isGroupChat: boolean;
  onUploadFile: (file: File, onProgress: (progress: number) => void) => Promise<string>;
  onUploadSuccess: (url: string, file: File) => void;
  onSendVoiceNote: (blob: Blob) => Promise<void>;
}

export function ChatInput({ 
  inputText, 
  onInputChange, 
  onSendMessage, 
  isDisabled,
  isPremium,
  employees,
  isGroupChat,
  onUploadFile,
  onUploadSuccess,
  onSendVoiceNote
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimeRef = useRef(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Mentions autocomplete states
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Auto-resize textbox
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Monitor mention triggers on text changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e);
    
    if (!isGroupChat) {
      setMentionQuery(null);
      return;
    }

    const value = e.target.value;
    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, selectionStart);
    
    // Find the word right before the cursor starting with @
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete navigation
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredMentions[mentionIndex];
        handleSelectMention(selected.name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Standard enter triggers sending
    if (e.key === "Enter" && !e.shiftKey && !isDisabled && !isUploadingVoice) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // Replace text with completed @mention
  const handleSelectMention = (name: string) => {
    if (!textareaRef.current) return;
    
    const selectionStart = textareaRef.current.selectionStart || 0;
    const textBeforeCursor = inputText.slice(0, selectionStart);
    const textAfterCursor = inputText.slice(selectionStart);
    
    // Replace the '@search' word before cursor
    const completedTextBefore = textBeforeCursor.replace(/@\w*$/, `@${name} `);
    
    onInputChange({
      target: { value: completedTextBefore + textAfterCursor }
    } as any);

    setMentionQuery(null);

    // Reposition cursor right after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = completedTextBefore.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 20);
  };

  // Filter mention suggestions
  const filteredMentions = (() => {
    if (mentionQuery === null) return [];

    const list = [
      { id: "everyone", name: "everyone", email: "", role: "Notify all members", isEveryone: true, empDetails: undefined },
      ...employees.map(emp => ({
        id: emp.id,
        name: emp.name || emp.email?.split("@")[0] || "Unknown",
        email: emp.email || "",
        role: emp.role || "Employee",
        empDetails: emp,
        isEveryone: false
      }))
    ];

    if (mentionQuery === "") return list;
    return list.filter(item => item.name.toLowerCase().includes(mentionQuery));
  })();

  // 1. Audio Recording triggers
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      recordingTimeRef.current = 0;
      setRecordingTime(0);
      setAudioVolume(0);

      // Real-time audio analyzer for visual feedback
      let audioContext: AudioContext | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVolume = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
            if (audioContext && audioContext.state !== "closed") {
              audioContext.close();
            }
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioVolume(average);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (err) {
        console.warn("[ChatInput] Audio analyzer failed to start:", err);
      }
      
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0 && recordingTimeRef.current > 1) {
          setIsUploadingVoice(true);
          try {
            await onSendVoiceNote(audioBlob);
          } catch (err) {
            console.error("Failed to send voice note:", err);
          } finally {
            setIsUploadingVoice(false);
          }
        }
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        setAudioVolume(0);
      };

      recorder.start(200);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error("Failed to access microphone:", err);
      alert("Microphone permission denied or unavailable.");
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        setAudioVolume(0);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <div className="p-4 bg-transparent shrink-0 relative">
      
      {/* 1. MENTION AUTOCOMPLETE OVERLAY PANEL */}
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <div className="absolute bottom-[calc(100%-8px)] left-6 right-6 z-40 bg-card/90 backdrop-blur-2xl border border-border/40 shadow-2xl rounded-2xl max-h-[220px] overflow-y-auto p-1.5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="px-3 py-1.5 border-b border-border/10 mb-1 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1">
              <Users className="h-3 w-3" /> Group Mentions
            </span>
            <span className="text-[8px] text-muted-foreground font-semibold">Press Enter to select</span>
          </div>
          <div className="space-y-0.5">
            {filteredMentions.map((item, index) => {
              const isActive = index === mentionIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectMention(item.name)}
                  onMouseEnter={() => setMentionIndex(index)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all border border-transparent select-none text-left",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow" 
                      : "hover:bg-secondary/40 text-foreground"
                  )}
                >
                  {item.isEveryone ? (
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border",
                      isActive ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                      @
                    </div>
                  ) : (
                    <Avatar className="h-7 w-7 border shrink-0">
                      <AvatarImage src={getUserAvatar(item.empDetails)} />
                      <AvatarFallback className="text-[10px] font-bold">{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">@{item.name}</p>
                    <p className={cn(
                      "text-[9px] font-semibold truncate leading-none mt-0.5",
                      isActive ? "text-primary-foreground/75" : "text-muted-foreground"
                    )}>
                      {item.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DRAG AND DROP UPLOADER MODAL */}
      <UploadModal
        isOpen={showUploadModal}
        onOpenChange={setShowUploadModal}
        isPremium={isPremium}
        onUpload={onUploadFile}
        onUploadSuccess={onUploadSuccess}
      />

      <div className="max-w-4xl mx-auto relative flex items-end gap-2.5 bg-card/90 dark:bg-slate-900/90 rounded-2xl p-2 px-3 border border-border/40 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {/* Attachment Toggle */}
        {!isRecording && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowUploadModal(true)}
            disabled={isDisabled || isUploadingVoice}
            className="h-9 w-9 rounded-xl shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary/40 active:scale-95 transition-all"
          >
            {isUploadingVoice ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
            ) : (
              <Plus className="h-4.5 w-4.5" />
            )}
          </Button>
        )}

        {isRecording ? (
          // RECORDING STATE
          <div className="flex-1 flex items-center justify-between bg-card/90 dark:bg-slate-900/90 border border-border/40 p-2 px-4.5 rounded-2xl animate-in fade-in duration-300 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[12px] font-bold text-foreground">Recording Voice...</span>
              
              {/* Real-time audio waveform visualizer */}
              <div className="flex items-center gap-0.5 h-4 px-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                  const scale = 0.15 + (audioVolume / 255) * (0.85 + Math.sin(bar * 0.9) * 0.15);
                  return (
                    <div
                      key={bar}
                      className="w-[2.5px] bg-red-500 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(3, scale * 16)}px`,
                      }}
                    />
                  );
                })}
              </div>

              <span className="text-xs font-mono text-muted-foreground/60 font-bold bg-secondary px-2 py-0.5 rounded-lg">
                {formatRecordingTime(recordingTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                className="h-8.5 w-8.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={stopAndSendRecording}
                className="h-8.5 w-8.5 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow active:scale-95"
              >
                <Check className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>
          </div>
        ) : (
          // CHAT EDIT TEXTAREA STATE
          <>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isUploadingVoice ? "Uploading Voice Note..." : "Message..."}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isDisabled || isUploadingVoice}
              className="flex-1 max-h-[200px] min-h-[40px] bg-transparent border-none focus:ring-0 text-[13px] py-2 px-1 leading-relaxed resize-none scrollbar-hide disabled:opacity-50"
            />
            
            <div className="flex items-center gap-1.5 h-10 mb-0.5 shrink-0">
              {!inputText.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={startRecording}
                  disabled={isDisabled || isUploadingVoice}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 active:scale-95 transition-all"
                >
                  <Mic className="h-4.5 w-4.5" />
                </Button>
              )}

              {(inputText.trim() || isUploadingVoice) && (
                <Button 
                  type="button"
                  size="icon" 
                  onClick={onSendMessage} 
                  disabled={isDisabled || !inputText.trim() || isUploadingVoice}
                  className="h-9 w-9 rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
