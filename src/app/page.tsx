
"use client";

import 'regenerator-runtime/runtime';
import React from "react";
import { useRouter } from "next/navigation";
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
import { Button } from '@/components/ui/button';


const MAX_TEXTAREA_HEIGHT = 200;


interface AutoResizingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setShowTopFade: (show: boolean) => void;
  setShowBottomFade: (show: boolean) => void;
}

const AutoResizingTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizingTextareaProps>(
  ({ className, setShowTopFade, setShowBottomFade, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
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

    const handleScroll = React.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea) {
        const { scrollTop, scrollHeight, clientHeight } = textarea;
        setShowTopFade(scrollTop > 0);
        setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1);
      }
    }, [setShowTopFade, setShowBottomFade]);

    React.useEffect(() => {
        handleInput();
    }, [props.value]);

    React.useEffect(() => {
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
            "w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none custom-scrollbar p-4 text-base",
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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

    return (
        <div className="flex h-auto min-h-[56px] w-full items-center justify-between p-4">
            <div className="flex items-start gap-3 overflow-hidden w-full">
                <div className="flex h-full items-center gap-1.5 shrink-0 pt-1">
                    <span className="h-5 w-1 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]"></span>
                    <span className="h-5 w-1 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]"></span>
                    <span className="h-5 w-1 animate-pulse rounded-full bg-primary"></span>
                </div>
                <div ref={scrollRef} className="text-base text-muted-foreground w-full max-h-[80px] overflow-y-auto custom-scrollbar">
                    {transcript || "Listening..."}
                </div>
            </div>
            <div className="flex items-center">
                <Button onClick={onCancel} variant="ghost" size="icon">
                    <X />
                </Button>
                <Button onClick={onAccept} variant="ghost" size="icon">
                    <Check />
                </Button>
            </div>
        </div>
    );
};

const placeholderProblems = [
    "design a landing page that converts.",
    "write a cold email sequence that gets replies.",
    "manage our social media presence.",
    "build a financial model for fundraising.",
    "find our first 100 paying customers.",
    "create a pitch deck that investors will love.",
    "automate our user onboarding process.",
    "handle our customer support inquiries."
];
const basePlaceholder = "I need someone to ";


export default function Home() {
  const [inputValue, setInputValue] = React.useState("");
  const [contactInfo, setContactInfo] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState("");
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const router = useRouter();
  const [showIdeationPanel, setShowIdeationPanel] = React.useState(false);

  const [placeholder, setPlaceholder] = React.useState(basePlaceholder);
  const [problemIndex, setProblemIndex] = React.useState(0);
  const [charIndex, setCharIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);


  const [interactionState, setInteractionState] = React.useState({ voiceUsed: false, keystrokes: 0, pasted: false });
  const pageLoadTime = React.useRef<number>(0);
  const pageLoadEnd = React.useRef<number>(0);
  const referrer = React.useRef<string>("");
  const deviceType = React.useRef<string>("");
  const networkType = React.useRef<string>("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  const [showTopFade, setShowTopFade] = React.useState(false);
  const [showBottomFade, setShowBottomFade] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (hasInteracted) return;

    const currentProblem = placeholderProblems[problemIndex];
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (isDeleting) {
        if (placeholder.length > basePlaceholder.length) {
          setPlaceholder(prev => prev.slice(0, -1));
          timeout = setTimeout(type, 10);
        } else {
          setIsDeleting(false);
          setProblemIndex((prevIndex) => (prevIndex + 1) % placeholderProblems.length);
          setCharIndex(0);
          timeout = setTimeout(type, 500);
        }
      } else {
        if (charIndex < currentProblem.length) {
          setPlaceholder(prev => basePlaceholder + currentProblem.substring(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
          timeout = setTimeout(type, 20);
        } else {
          timeout = setTimeout(() => setIsDeleting(true), 2000);
        }
      }
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, problemIndex, placeholder.length, hasInteracted]);

  React.useEffect(() => {
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
    setHasInteracted(true);
    setInteractionState(prev => ({ ...prev, voiceUsed: true }));
    resetTranscript();
    const prefix = "I need someone to ";
    if (!inputValue.trim()) {
      setInputValue(prefix);
    }
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopRecording = (shouldAccept: boolean) => {
    SpeechRecognition.stopListening();
    if (shouldAccept) {
        const prefix = "I need someone to ";
        const currentTranscript = transcript.trim();
        setInputValue(prev => {
          if (prev === prefix) {
            return `${prefix}${currentTranscript}`;
          }
          return prev ? `${prev} ${currentTranscript}` : `${prefix}${currentTranscript}`;
        });
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

  const handleFocus = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setInputValue("I need someone to ");
    }
  };
  
  const handlePaste = () => {
    if (!hasInteracted) {
        setHasInteracted(true);
    }
    setInteractionState(prev => ({...prev, pasted: true}));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  
  return (
    <main className="relative flex flex-col min-h-screen bg-background animate-fade-in pb-20 font-sans">
      <header className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-between items-center">
        <h1 className="font-poppins font-bold text-2xl text-foreground">
          TRAC
        </h1>
        <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2L9.4 9.4L2 12L9.4 14.6L12 22L14.6 14.6L22 12L14.6 9.4L12 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
      </header>

      <div className='flex-grow flex flex-col justify-center px-4'>
        <div className="flex-grow flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="pt-4">
                  {isSubmitted ? (
                    <div className="animate-fade-in text-center">
                      <div className="inline-block bg-secondary p-4 rounded-full mb-6">
                        <Check className="text-primary" size={48} />
                      </div>
                      <h1 className="mb-4 text-3xl font-bold text-foreground">Thank You</h1>
                      <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                        Our agent is scouring the net to find the right fit to solve your problem. We'll be in touch.
                      </p>
                      <Button
                        onClick={() => {
                          setInputValue("");
                          setContactInfo("");
                          setIsSubmitted(false);
                          setHasInteracted(false);
                        }}
                        variant="outline"
                        size="lg"
                      >
                        Submit Another Problem
                      </Button>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <h2 className="text-center text-4xl md:text-5xl font-medium mb-4 text-foreground leading-tight font-playfair">
                        What's stopping you from growing faster?
                      </h2>
                      <p className="text-center text-muted-foreground mb-8">
                        please be specific that helps us find better candidates for you
                      </p>
                      <form onSubmit={handleSubmit} className="mx-auto w-full space-y-4">
                          <div className={cn("relative w-full overflow-hidden flex flex-col items-center self-auto border bg-secondary/30 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/50",
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
                                          onFocus={handleFocus}
                                          onKeyDown={handleKeyDown}
                                          onPaste={handlePaste}
                                          placeholder={hasInteracted ? '' : placeholder}
                                          aria-label="Data input"
                                          disabled={isLoading}
                                          setShowTopFade={setShowTopFade}
                                          setShowBottomFade={setShowBottomFade}
                                          className="h-20 md:h-14"
                                        />
                                    </div>
                                </div>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-4 pt-2">
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
                                      className="h-14 w-full rounded-2xl bg-secondary/30 text-base"
                                  />
                                  {emailError && <p className="mt-2 text-sm text-red-500">{emailError}</p>}
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Our agent will send profiles of relevant experts to this email.
                                  </p>
                              </div>
                              
                              {!listening && (
                                  <div className="flex h-full items-center justify-end gap-2 self-start shrink-0">
                                      <TooltipProvider>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button type="button" onClick={startRecording} variant="secondary" size="icon" className="h-14 w-14 rounded-2xl" disabled={isLoading || listening}>
                                                  <Mic />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>Voice Input</p>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button type="submit" size="lg" className="h-14 rounded-2xl px-6" disabled={isLoading || !inputValue.trim() || listening}>
                                                    {isLoading ? (
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary-foreground [animation-delay:-0.3s]"></span>
                                                            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary-foreground [animation-delay:-0.15s]"></span>
                                                            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary-foreground"></span>
                                                        </div>
                                                    ) : 'Submit'}
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>Send (Ctrl+Enter)</p>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                  </div>
                              )}
                          </div>
                      </form>
                    </div>
                  )}
                </div>
            </div>
        </div>
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 z-10 text-sm">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
                    <div className="py-3 px-4 text-center md:text-left text-muted-foreground">
                      <p>Google for Hiring</p>
                    </div>
                    <div className="relative py-3 px-4">
                        <div className="flex justify-center md:justify-end">
                             <button
                                onClick={() => setShowIdeationPanel(prev => !prev)}
                                className="flex items-center gap-2 text-sm font-medium text-foreground transition-transform hover:scale-105"
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
