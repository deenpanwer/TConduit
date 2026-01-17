"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductDemo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
      setPlaybackRate(nextRate);
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!progressBarRef.current || !videoRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / width));
      
      const newTime = percentage * videoRef.current.duration;
      if (isFinite(newTime)) {
          videoRef.current.currentTime = newTime;
          setProgress(percentage * 100);
      }
  };

  const handleMainInteraction = () => {
    if (videoRef.current) {
        if (isMuted) {
            videoRef.current.muted = false;
            setIsMuted(false);
            videoRef.current.currentTime = 0; 
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            togglePlay();
        }
    }
  };

  // Intersection Observer for Lazy Loading Video Source
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setShouldLoad(true);
                observer.disconnect();
            }
        },
        { rootMargin: "200px" } // Load when within 200px
    );
    
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const onTimeUpdate = () => {
        if (video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
            setCurrentTime(video.currentTime);
            // Fallback for duration if loadedmetadata missed it
            if (duration === 0) setDuration(video.duration);
        }
    };
    const onLoadedMetadata = () => {
        if (video.duration) {
            setDuration(video.duration);
        }
    };

    // If video is already loaded (e.g. from cache), capture duration immediately
    if (video.readyState >= 1 && video.duration) {
        setDuration(video.duration);
    }

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("volumechange", onVolumeChange);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [shouldLoad]); // Re-attach when loaded

  return (
    <section className="relative w-full py-24 overflow-hidden">

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={cn(
            "relative w-full max-w-5xl mx-auto aspect-video overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/5 group cursor-pointer bg-black transition-all duration-300",
            isFullscreen ? "rounded-none" : "rounded-3xl"
          )}
          onClick={handleMainInteraction}
        >
          {shouldLoad ? (
             <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
                loop
                poster="/demo-image.jpg"
            >
                <source src="/demo.mp4" type="video/mp4" />
            </video>
          ) : (
            // Placeholder while waiting for lazy load
             <div className="w-full h-full bg-black flex items-center justify-center">
                 <div className="text-white/30 text-sm">Loading Demo...</div>
             </div>
          )}

          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none">
            <AnimatePresence>
                {(isMuted || !isPlaying) && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        className="bg-white/20 backdrop-blur-md p-6 rounded-full text-white shadow-lg border border-white/30 hover:scale-105 transition-transform pointer-events-auto"
                        onClick={handleMainInteraction}
                    >
                        {isMuted ? (
                             <div className="flex flex-col items-center gap-2">
                                <VolumeX size={32} />
                                <span className="text-xs font-medium uppercase tracking-widest">Unmute Demo</span>
                             </div>
                        ) : (
                             <Play size={40} fill="white" className="ml-1" />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div 
            className={cn(
                "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end transition-opacity duration-300 gap-4",
                isHovering || !isPlaying || isMuted ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-end w-full">
                 <div className="text-white">
                    <div className="flex items-center gap-3">
                        <h4 className="font-medium text-lg">TracDairy Demo</h4>
                        <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-white/50">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <p className="text-white/70 text-sm">See how it works in real time</p>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <button
                        onClick={togglePlaybackRate}
                        className="text-white font-mono text-sm hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/10 bg-white/5"
                        title="Playback Speed"
                     >
                        {playbackRate}x
                     </button>

                     <button 
                        onClick={toggleMute} 
                        className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                        title={isMuted ? "Unmute" : "Mute"}
                     >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                     </button>

                     <button 
                        onClick={toggleFullscreen} 
                        className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                     >
                        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                     </button>
                 </div>
             </div>
             
             {/* Progress Bar */}
             <div 
                ref={progressBarRef}
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden hover:h-2 transition-all"
                onClick={handleSeek}
             >
                 <div 
                    className="h-full bg-white rounded-full relative" 
                    style={{ width: `${progress}%` }}
                 >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform" />
                 </div>
             </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}