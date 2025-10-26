"use client";

import React, { useState, useRef, useEffect, forwardRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Info, Mic, ArrowUp, X, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


const MAX_TEXTAREA_HEIGHT = 200;

interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setShowTopFade: (show: boolean) => void;
  setShowBottomFade: (show: boolean) => void;
}

const AutoResizingTextarea = forwardRef<HTMLTextAreaElement, AutoResizingTextareaProps>(
  ({ className, setShowTopFade, setShowBottomFade, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = () => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
        handleScroll();
      }
    };

    const handleScroll = useCallback(() => {
      const textarea = internalRef.current;
      if (textarea) {
        const { scrollTop, scrollHeight, clientHeight } = textarea;
        setShowTopFade(scrollTop > 0);
        setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1);
      }
    }, [setShowTopFade, setShowBottomFade]);

    useEffect(() => {
        handleInput();
    }, [props.value]);

    useEffect(() => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleInput);
        return () => {
            textarea.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleInput);
        }
      }
    }, [handleScroll]);

    return (
      <div className="relative w-full">
        <textarea
          ref={internalRef}
          rows={1}
          onInput={handleInput}
          className={cn(
            "w-full resize-none bg-transparent text-black placeholder-gray-400 focus:outline-none custom-scrollbar pr-2",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
AutoResizingTextarea.displayName = 'AutoResizingTextarea';


const VoiceRecordingUI = ({ onCancel, onAccept, transcript }: { onCancel: () => void; onAccept: () => void; transcript: string }) => {
    return (
        <div className="flex h-[42px] w-full items-center justify-between bg-white p-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-full items-center gap-1 shrink-0">
                    <span className="h-4 w-1 animate-pulse rounded-full bg-black [animation-delay:-0.3s]"></span>
                    <span className="h-4 w-1 animate-pulse rounded-full bg-black [animation-delay:-0.15s]"></span>
                    <span className="h-4 w-1 animate-pulse rounded-full bg-black"></span>
                </div>
                <p className="text-sm text-gray-600 truncate">{transcript || "Listening..."}</p>
            </div>
            <div className="flex items-center">
                <button onClick={onCancel} className="p-2 text-black hover:bg-gray-100">
                    <X size={20} />
                </button>
                <button onClick={onAccept} className="p-2 text-black hover:bg-gray-100">
                    <Check size={20} />
                </button>
            </div>
        </div>
    );
};


export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const startRecording = () => {
    if (!browserSupportsSpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser.",
      });
      return;
    }
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopRecording = (shouldAccept: boolean) => {
    SpeechRecognition.stopListening();
    if (shouldAccept) {
        setInputValue(prev => prev ? `${prev}\n${transcript}` : transcript);
    }
    resetTranscript();
  };


  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("https://sheetdb.io/api/v1/q1xovvwyyhvv0", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [{ input: inputValue }],
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit data. Please try again.";
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      setInputValue("");
      router.push('/thank-you');

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <main className="relative flex flex-col min-h-screen bg-white py-10 md:py-20 animate-fade-in px-4">
        <h1 className="absolute top-4 left-4 font-serif text-3xl md:text-4xl text-black">
          TRAC
        </h1>
        <div className="flex-grow flex items-center justify-center">
            <div className="w-full max-w-lg">
                <div className="pt-4">
                    <form onSubmit={handleSubmit} className="mx-auto flex flex-col items-start justify-start">
                      <div className={cn("relative flex w-full items-start border border-black p-2 bg-white",
                        listening && "p-0"
                      )}>
                        {listening ? (
                          <VoiceRecordingUI 
                              onCancel={() => stopRecording(false)}
                              onAccept={() => stopRecording(true)}
                              transcript={transcript}
                          />
                        ) : (
                          <>
                            <div className={cn("relative w-full",
                                {"fade-top": showTopFade, "fade-bottom": showBottomFade}
                            )}>
                                <AutoResizingTextarea
                                  ref={textareaRef}
                                  value={inputValue}
                                  onChange={(e) => setInputValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  placeholder="Write the problem you're facing."
                                  aria-label="Data input"
                                  disabled={isLoading}
                                  setShowTopFade={setShowTopFade}
                                  setShowBottomFade={setShowBottomFade}
                                />
                            </div>
                            <div className="flex flex-col border-l border-black ml-2 pl-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="submit" className="flex h-[21px] w-[21px] items-center justify-center text-black shrink-0 disabled:opacity-50" disabled={isLoading || !inputValue.trim()}>
                                                {isLoading ? (
                                                    <div className="flex space-x-1">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse-dot"></span>
                                                    </div>
                                                ) : <ArrowUp size={18} />}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Send (Ctrl+Enter)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="button" onClick={startRecording} className="flex h-[21px] w-[21px] items-center justify-center text-black shrink-0" disabled={isLoading}>
                                                <Mic size={16} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Voice Input</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                          </>
                        )}
                      </div>
                    </form>
                    <div className="mt-2 flex items-center justify-start text-sm text-black">
                        <p>
                            Also provide your contact details at the end.
                        </p>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="ml-1.5 cursor-pointer">
                                        <Info className="h-4 w-4 text-gray-500" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent align="center" className="text-left">
                                    <p className="font-medium">Format:</p>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        <p><span className="font-semibold">Problem:</span> Your problem description</p>
                                        <p><span className="font-semibold">Contact:</span> Your email or phone</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
        <Toaster />
    </main>
  );
}
