import React, { useRef, useState, useEffect, useMemo } from "react";
import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InlineAudioPlayerProps {
  url?: string;
  audioBase64?: string;
  audioMimeType?: string;
  audioDuration: number; // in seconds
  className?: string;
  buttonClassName?: string;
}

export function InlineAudioPlayer({
  url,
  audioBase64,
  audioMimeType,
  audioDuration,
  className,
  buttonClassName,
}: InlineAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration);
  const [isLoaded, setIsLoaded] = useState(false);

  // Update internal duration state if prop changes
  useEffect(() => {
    if (audioDuration > 0) setDuration(audioDuration);
  }, [audioDuration]);

  // Clean the base64 string if provided, otherwise use URL
  const audioSrc = useMemo(() => {
    if (url) return url;
    if (audioBase64) {
        const base64Data = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;
        return `data:${audioMimeType || 'audio/webm'};base64,${base64Data}`;
    }
    return '';
  }, [url, audioBase64, audioMimeType]);

  useEffect(() => {
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
        setIsLoaded(true);
        // If duration is 0 or not provided, try to get it from the audio object
        if (duration === 0 && audio.duration && isFinite(audio.duration)) {
            setDuration(audio.duration);
        }
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [audioSrc]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(err => console.error("Playback failed:", err));
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (audio && isLoaded) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pos * duration;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds === undefined || seconds === null || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 bg-secondary/50 hover:bg-secondary/80 transition-colors rounded-2xl p-2 pr-4 border border-border/50 group/player",
      className
    )}>
      <button
        onClick={togglePlayPause}
        className={cn(
          "size-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0",
          buttonClassName
        )}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-end">
           <span className="text-[10px] font-mono font-bold text-muted-foreground whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
           </span>
        </div>

        {/* Smooth Progress Bar */}
        <div 
          className="h-1.5 w-full bg-border/70 rounded-full overflow-hidden relative cursor-pointer group/bar"
          onClick={handleProgressClick}
        >
           <motion.div 
              className="absolute inset-y-0 left-0 bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.1 }}
           />
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}