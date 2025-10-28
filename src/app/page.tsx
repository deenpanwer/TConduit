
"use client";

import 'regenerator-runtime/runtime';
import React, { useState, useRef, useEffect, forwardRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Info, Mic, ArrowRight, X, Check } from "lucide-react";
import { format } from "date-fns";
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
            if (textarea) {
              textarea.removeEventListener('scroll', handleScroll);
            }
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
            "w-full h-10 resize-none bg-transparent text-black placeholder-gray-400 focus:outline-none custom-scrollbar p-2",
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

    return (
        <div className="flex h-auto min-h-[40px] w-full items-center justify-between bg-white p-2">
            <div className="flex items-start gap-2 overflow-hidden w-full">
                <div className="flex h-full items-center gap-1 shrink-0 pt-1">
                    <span className="h-4 w-1 animate-pulse rounded-full bg-black [animation-delay:-0.3s]"></span>
                    <span className="h-4 w-1 animate-pulse rounded-full bg-black [animation-delay:-0.15s]"></span>
                    <span className="h-4 w-1 animate-pulse rounded-full bg-black"></span>
                </div>
                <div ref={scrollRef} className="text-sm text-gray-600 w-full max-h-[80px] overflow-y-auto custom-scrollbar">
                    {transcript || "Listening..."}
                </div>
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

  const [interactionState, setInteractionState] = useState({ voiceUsed: false, keystrokes: 0, pasted: false });
  const pageLoadTime = useRef<number>(0);
  const pageLoadEnd = useRef<number>(0);
  const referrer = useRef<string>("");
  const deviceType = useRef<string>("");
  const networkType = useRef<string>("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    pageLoadTime.current = Date.now();
    referrer.current = document.referrer || "direct";
    deviceType.current = /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    networkType.current = connection ? connection.effectiveType : 'unknown';
    
    const handleLoad = () => {
        if(performance.timing.domInteractive && performance.timing.navigationStart) {
            pageLoadEnd.current = (performance.timing.domInteractive - performance.timing.navigationStart) / 1000;
        }
    };

    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
    };

  }, []);


  const startRecording = () => {
    if (!browserSupportsSpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser.",
      });
      return;
    }
    setInteractionState(prev => ({ ...prev, voiceUsed: true }));
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

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  }


  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const formattedTime = format(now, "PPpp");
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeToSubmit = ((Date.now() - pageLoadTime.current) / 1000).toFixed(2) + " seconds";

      let interactionMethod = "";
      const keyboardUsed = interactionState.keystrokes > 0;

      if (interactionState.voiceUsed && keyboardUsed) {
        interactionMethod = `Voice & Keyboard (${interactionState.keystrokes} keystrokes)`;
      } else if (interactionState.voiceUsed) {
        interactionMethod = "Voice";
      } else if (keyboardUsed) {
        interactionMethod = `Keyboard (${interactionState.keystrokes} keystrokes)`;
      } else if (interactionState.pasted) {
        interactionMethod = "Paste";
      }

      const response = await fetch("https://sheetdb.io/api/v1/q1xovvwyyhvv0", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [{ 
            input: inputValue, 
            time: formattedTime, 
            timezone: timezone,
            referrer: referrer.current,
            timeToSubmit: timeToSubmit,
            deviceType: deviceType.current,
            interactionMethod: interactionMethod,
            network: networkType.current,
            pageLoadTime: pageLoadEnd.current > 0 ? `${pageLoadEnd.current.toFixed(2)}s` : 'N/A',
            timeOfDay: getTimeOfDay(),
            pastedContent: interactionState.pasted,
          }],
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (e.target.value) {
      setInteractionState(prev => ({...prev, keystrokes: prev.keystrokes + 1}));
    }
  };
  
  const handlePaste = () => {
    setInteractionState(prev => ({...prev, pasted: true}));
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
                    <form onSubmit={handleSubmit} className="mx-auto flex w-full items-end justify-start gap-2">
                        <div className={cn("relative flex w-full items-start border border-black bg-white",
                          listening && "p-0"
                        )}>
                          {listening ? (
                            <VoiceRecordingUI 
                                onCancel={() => stopRecording(false)}
                                onAccept={() => stopRecording(true)}
                                transcript={transcript}
                            />
                          ) : (
                              <div className={cn("relative w-full",
                                  {"fade-top": showTopFade, "fade-bottom": showBottomFade}
                              )}>
                                  <AutoResizingTextarea
                                    ref={textareaRef}
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                    placeholder="Write the problem you're facing."
                                    aria-label="Data input"
                                    disabled={isLoading}
                                    setShowTopFade={setShowTopFade}
                                    setShowBottomFade={setShowBottomFade}
                                  />
                              </div>
                          )}
                        </div>
                         {!listening && (
                            <div className="flex h-10 items-end gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="button" onClick={startRecording} className="flex h-10 w-10 items-center justify-center border border-black text-black shrink-0" disabled={isLoading || listening}>
                                                <Mic size={16} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Voice Input</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="submit" className="flex h-10 w-10 items-center justify-center border border-black text-black shrink-0 disabled:opacity-50" disabled={isLoading || !inputValue.trim() || listening}>
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-black [animation-delay:-0.3s]"></span>
                                                        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-black [animation-delay:-0.15s]"></span>
                                                        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-black"></span>
                                                    </div>
                                                ) : <ArrowRight size={18} />}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Send (Ctrl+Enter)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
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
