"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface WaveformPlayerProps {
  src: string;
  isCurrentUserSender: boolean;
}

export function WaveformPlayer({ src, isCurrentUserSender }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const isCalculatingDurationRef = useRef(false);

  // Generate 25 static bar heights for the visualizer wiggles
  const barHeights = [
    30, 45, 20, 60, 35, 75, 40, 55, 30, 85, 
    50, 65, 40, 70, 35, 80, 45, 60, 25, 50, 
    30, 40, 20, 35, 25
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    
    const handleDurationChange = () => {
      if (audio.duration === Infinity) {
        isCalculatingDurationRef.current = true;
        audio.currentTime = 1e9;
      } else if (audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleSeeked = () => {
      if (isCalculatingDurationRef.current) {
        isCalculatingDurationRef.current = false;
        audio.currentTime = 0;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("ended", handleEnded);

    // Bootstrap checks
    if (audio.duration && audio.duration !== Infinity) {
      setDuration(audio.duration);
    } else if (audio.duration === Infinity) {
      isCalculatingDurationRef.current = true;
      audio.currentTime = 1e9;
    }

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("seeked", handleSeeked);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error("Audio playback blocked:", err));
    }
  };

  const handleSpeedToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleBarClick = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const targetTime = (index / barHeights.length) * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3.5 p-3 rounded-2xl border w-[290px] shadow-sm select-none transition-all duration-200 ${
      isCurrentUserSender 
        ? "bg-primary border-primary/20 text-primary-foreground shadow-lg shadow-primary/10" 
        : "bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-slate-900 dark:text-slate-100"
    }`}>
      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 ${
          isCurrentUserSender
            ? "bg-white text-primary hover:bg-white/95 text-primary shadow"
            : "bg-primary text-white hover:bg-primary/95 shadow"
        }`}
      >
        {isPlaying ? (
          <Pause className="h-4.5 w-4.5 fill-current" />
        ) : (
          <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
        )}
      </button>

      {/* Stylized waveform container */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-end gap-0.5 h-7 pt-1 px-1 cursor-pointer">
          {barHeights.map((height, i) => {
            const barProgress = (i / barHeights.length) * 100;
            const isActive = progressPercentage >= barProgress;

            return (
              <div
                key={i}
                onClick={() => handleBarClick(i)}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full transition-all duration-200 ${
                  isActive 
                    ? isCurrentUserSender 
                      ? "bg-white" 
                      : "bg-primary" 
                    : isCurrentUserSender 
                      ? "bg-white/30 hover:bg-white/50" 
                      : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
                }`}
              />
            );
          })}
        </div>

        {/* Time elapsed and remaining */}
        <div className="flex items-center justify-between text-[9px] font-bold tracking-tight opacity-80 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Speed rate selection bubble */}
      <button
        onClick={handleSpeedToggle}
        className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider shrink-0 transition-all border ${
          isCurrentUserSender
            ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
            : "bg-slate-200/60 dark:bg-slate-900/60 border-slate-300/40 dark:border-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
        }`}
      >
        {playbackRate}x
      </button>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
