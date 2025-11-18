
"use client";

import 'regenerator-runtime/runtime';
import React, { useState, useRef, useEffect, forwardRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Mic, X, Check, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { IdeationPanel } from '@/components/IdeationPanel';
import { Input } from "@/components/ui/input";


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
            "w-full h-10 resize-none bg-transparent text-black placeholder-gray-500 focus:outline-none custom-scrollbar p-2",
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
  const [contactInfo, setContactInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
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
      console.error("Voice recognition is not supported in your browser.");
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

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    if (!contactInfo.trim()) {
      setEmailError("Email address is required.");
      return;
    }
    if (!validateEmail(contactInfo)) {
      setEmailError("Please enter a valid email address.");
      return;
    }


    setIsLoading(true);
    setEmailError("");

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
            contact_info: contactInfo,
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
      
      setIsSubmitted(true);

    } catch (error) {
      console.error(error);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  
  return (
    <main className="relative flex flex-col min-h-screen bg-white animate-fade-in pb-20">
      <div className='flex-grow flex flex-col justify-center px-4'>
        <div className="absolute top-4 left-4">
          <h1 className="font-poppins font-bold text-3xl md:text-4xl text-black">
            TRAC
          </h1>
          <p className="text-gray-500 text-sm md:text-base">Google for Hiring</p>
        </div>

        <div className="flex-grow flex items-center justify-center">
            <div className="w-full max-w-lg">
                <div className="pt-4">
                  {isSubmitted ? (
                    <div className="animate-fade-in">
                      <div className="relative w-full max-w-4xl rounded-none border border-black overflow-hidden">
                        <Image
                          src="https://images.pexels.com/photos/17483850/pexels-photo-17483850.png"
                          alt="Abstract background"
                          layout="fill"
                          objectFit="cover"
                          className="absolute inset-0 z-0"
                          data-ai-hint="futuristic abstract"
                        />
                        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-8 m-4 md:m-16 text-black text-center">
                          <h1 className="mb-4 text-xl sm:text-2xl md:text-3xl">Thank You</h1>
                          <p className="text-sm sm:text-base md:text-lg mb-6">
                            Our agent is scouring the net to find the right fit to solve your problem. We'll inform you.
                          </p>
                        </div>
                      </div>
                      <div className="mt-8 text-center">
                        <button
                          onClick={() => {
                            setInputValue("");
                            setContactInfo("");
                            setIsSubmitted(false);
                          }}
                          className="inline-block border border-black bg-white px-6 py-2 text-black transition-colors hover:bg-black hover:text-white"
                        >
                          Submit Another Problem
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-center text-xl md:text-2xl font-serif mb-4 text-black">
                        What's stopping you from growing faster?
                      </h2>
                      <form onSubmit={handleSubmit} className="mx-auto w-full animate-fade-in">
                          <div className={cn("relative flex w-full flex-col items-center self-auto border border-black bg-white",
                            listening && "p-0"
                          )}>
                            {listening ? (
                              <VoiceRecordingUI 
                                  onCancel={() => stopRecording(false)}
                                  onAccept={() => stopRecording(true)}
                                  transcript={transcript}
                              />
                            ) : (
                                <div className="w-full">
                                    <div className={cn("relative w-full",
                                        {"fade-top": showTopFade, "fade-bottom": showBottomFade}
                                    )}>
                                        <AutoResizingTextarea
                                          ref={textareaRef}
                                          value={inputValue}
                                          onChange={handleInputChange}
                                          onKeyDown={handleKeyDown}
                                          onPaste={handlePaste}
                                          placeholder="Describe your problem here..."
                                          aria-label="Data input"
                                          disabled={isLoading}
                                          setShowTopFade={setShowTopFade}
                                          setShowBottomFade={setShowBottomFade}
                                        />
                                    </div>
                                </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex items-start gap-2">
                              <div className="flex-grow">
                                  <Input
                                      type="email"
                                      value={contactInfo}
                                      onChange={(e) => {
                                        setContactInfo(e.target.value);
                                        if (emailError) setEmailError("");
                                      }}
                                      onKeyDown={handleKeyDown}
                                      placeholder="Your email address"
                                      aria-label="Contact information"
                                      disabled={isLoading}
                                      className="h-10 w-full rounded-none border-black bg-transparent px-2 focus-visible:ring-0"
                                  />
                                  {emailError && <p className="mt-2 text-xs text-red-600">{emailError}</p>}
                                  <p className="mt-2 text-xs text-gray-700">
                                    Our agent will send profiles of relevant experts to this email.
                                  </p>
                              </div>
                              
                              {!listening && (
                                  <div className="flex h-full items-center justify-end gap-2 self-start shrink-0">
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
                                                      <button type="submit" className="flex h-10 items-center justify-center border border-black px-4 text-black shrink-0 disabled:opacity-50" disabled={isLoading || !inputValue.trim() || listening}>
                                                          {isLoading ? (
                                                              <div className="flex items-center justify-center space-x-1">
                                                                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-black [animation-delay:-0.3s]"></span>
                                                                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-black [animation-delay:-0.15s]"></span>
                                                                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-black"></span>
                                                              </div>
                                                          ) : 'Submit'}
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
                          </div>
                      </form>
                    </>
                  )}
                </div>
            </div>
        </div>
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gray-100 text-black text-sm">
            <div className="md:border-t md:border-gray-200">
                <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
                    <div className="bg-gray-100 py-3 px-4 text-center md:text-left border-t border-black md:border-none">
                    <p>© 2025 TRAC. All rights reserved.</p>
                    </div>
                    <div className="relative bg-gray-100 py-3 px-4">
                        <div className="flex justify-end">
                             <button
                                onClick={() => setShowIdeationPanel(prev => !prev)}
                                className="flex items-center gap-2 text-sm font-medium text-black transition-transform hover:scale-105"
                            >
                                Ideate with PG <ChevronUp size={16} className={cn('transition-transform', showIdeationPanel && 'rotate-180')} />
                            </button>
                            <IdeationPanel isOpen={showIdeationPanel} onClose={() => setShowIdeationPanel(false)} />
                        </div>
                    </div>
                </div>
            </div>
        </footer>

    </main>

    
  );
}

    