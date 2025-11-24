"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type SoundWaveProps = {
  isListening: boolean;
};

export const SoundWave = ({ isListening }: SoundWaveProps) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [barHeights, setBarHeights] = useState(new Uint8Array(30));

  useEffect(() => {
    const setupAudio = async () => {
      if (isListening) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = context;
          
          const source = context.createMediaStreamSource(stream);
          sourceRef.current = source;
          
          const analyser = context.createAnalyser();
          analyser.fftSize = 64; // Determines the number of data points
          analyserRef.current = analyser;
          
          source.connect(analyser);
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          setBarHeights(dataArray);

          const animate = () => {
            if (analyserRef.current) {
              const newData = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(newData);
              setBarHeights(newData);
            }
            animationFrameRef.current = requestAnimationFrame(animate);
          };
          animate();

        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      } else {
        // Cleanup
        cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        setBarHeights(new Uint8Array(30)); // Reset heights
      }
    };

    setupAudio();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
       if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
       }
       if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
       }
    };
  }, [isListening]);


  const numBars = 30;

  return (
    <div className="sound-wave">
      {[...Array(numBars)].map((_, i) => {
        const height = isListening ? (barHeights[i] / 255) * 100 : 5; // Scale height, 5px when silent
        const opacity = isListening ? 0.5 + (height / 100) * 0.5 : 0.35;
        return (
          <div
            key={i}
            ref={el => (barsRef.current[i] = el)}
            className="bar"
            style={{
                height: `${Math.max(5, height)}px`, // Minimum height of 5px
                opacity: `${opacity}`
            }}
          />
        );
      })}
    </div>
  );
};
