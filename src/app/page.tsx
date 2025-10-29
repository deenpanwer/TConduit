
"use client";

import 'regenerator-runtime/runtime';
import React, { useState, useRef, useEffect, forwardRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Info, Mic, ArrowRight, X, Check, ChevronUp } from "lucide-react";
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
  const [showIdeationPanel, setShowIdeationPanel] = useState(false);


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

  const aiTools = [
    {
      name: 'ChatGPT',
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path
            d="M22.2819 9.8211a5.9841 5.9841 0 0 0-.5157-2.4313 6.0242 6.0242 0 0 0-4.4965-3.2848 6.0125 6.0125 0 0 0-5.9922 1.9566 6.0047 6.0047 0 0 0-5.4674-1.9324c-2.1121 0-3.991.933-5.2217 2.476C-1.8722 9.5317.5898 14.0733 4.0189 16.321a5.9841 5.9841 0 0 0 2.4313.5157 6.0242 6.0242 0 0 0 4.4965-3.2848 6.0125 6.0125 0 0 0 5.9922-1.9566 6.0047 6.0047 0 0 0 5.4674 1.9324c2.1121 0 3.991-.933 5.2217-2.476.2577-.33.474-.6902.639-1.0708a5.9922 5.9922 0 0 0-.689-5.1594zM4.524 14.155a3.8663 3.8663 0 0 1-2.903-2.1102c-.8222-1.4243-.13-3.2385 1.2943-4.0607a3.8663 3.8663 0 0 1 4.0607 1.2943c.8222 1.4243.13 3.2385-1.2943 4.0607-1.4243.8222-3.2385.13-4.0607-1.2943.0028.005.005.0096.0028.015zm4.881-5.9922a3.8663 3.8663 0 0 1 2.903 2.1102c.8222 1.4243.13 3.2385-1.2943 4.0607a3.8663 3.8663 0 0 1-4.0607-1.2943c-.8222-1.4243-.13-3.2385 1.2943-4.0607-1.4215-.825-3.2328-.1357-4.055.015zm4.8863 5.9922a3.8663 3.8663 0 0 1-2.903-2.1102c-.8222-1.4243-.13-3.2385 1.2943-4.0607a3.8663 3.8663 0 0 1 4.0607 1.2943c.8222 1.4243.13 3.2385-1.2943 4.0607a3.8663 3.8663 0 0 1-1.1574.1841z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      url: `https://chatgpt.com/?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Perplexity',
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path d="M12 12V0h12v12h-3.375v3.375H12v-3.375zm0 0v12H0V12h3.375V8.625H12V12z" fill="currentColor"></path>
        </svg>
      ),
      url: `https://www.perplexity.ai/?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Grok',
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path
            d="M16.551 15.333h-5.277L8.33 18.277h8.889l-2.945-2.944m-2.176-6.19h5.278l2.944-2.944H8.33l2.222 2.944m-2.222 0H3.056l-3.055 3.056v8.888L8.89 24v-8.889H3.056l3.055-3.055m8.889 0h5.278l3.055-3.055V2.778L15.444 0v8.889h5.834l-3.056 3.056"
            fill="currentColor"
          ></path>
        </svg>
      ),
      url: `https://x.com/search?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Claude',
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path
            d="M17.625 12C17.625 15.1065 15.1065 17.625 12 17.625C8.8935 17.625 6.375 15.1065 6.375 12C6.375 8.8935 8.8935 6.375 12 6.375C15.1065 6.375 17.625 8.8935 17.625 12Z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      url: 'https://claude.ai',
    },
  ];
  
  return (
    <main className="relative flex flex-col min-h-screen bg-white animate-fade-in px-4">
      <div className='flex-grow flex flex-col justify-center'>
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
                                    placeholder="Why aren't you growing faster?"
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
                                <div className="relative">
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
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
      </div>
        <div className="pb-8 px-4 w-full max-w-lg mx-auto">
            <div className="flex items-center justify-center text-sm text-black">
                <p>
                    Include your email, and our AI agent will connect you with the most competent individual on the internet to solve your problem.
                </p>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="ml-1.5 cursor-pointer">
                                <Info className="h-4 w-4 text-gray-500" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent align="start" className="text-left max-w-xs sm:max-w-sm">
                            <p className="font-medium">Example Submission:</p>
                            <div className="mt-1 text-xs text-muted-foreground bg-gray-100 p-2 rounded">
                                <p className="font-mono">we’ve been reaching out to b2b decision-makers and showing product demos, but conversion still feels stuck founders aren’t “getting it” yet. i want feedback on how to position the value prop better.</p>
                                <br/>
                                <p className="font-mono">my email: founder@example.com</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
        
        {showIdeationPanel && (
            <div className="fixed bottom-16 right-4 z-10 w-full max-w-xs sm:max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-lg text-black">Ideate problems with AI</h3>
                    <button onClick={() => setShowIdeationPanel(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiTools.map((tool) => (
                        <a
                            key={tool.name}
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm font-medium text-black transition-colors hover:bg-gray-50"
                        >
                            {tool.icon}
                            <span>{tool.name}</span>
                        </a>
                    ))}
                </div>
                <p className="mt-4 text-center text-xs text-gray-400">Prompts open in third-party AI tools.</p>
            </div>
        )}

        <button
            onClick={() => setShowIdeationPanel(prev => !prev)}
            className="fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-black shadow-lg transition-transform hover:scale-105"
        >
            Ideate problems <ChevronUp size={16} className={cn('transition-transform', showIdeationPanel && 'rotate-180')} />
        </button>

        <Toaster />
    </main>
  );
}

    