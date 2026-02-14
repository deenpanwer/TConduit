
"use client";

import 'regenerator-runtime/runtime';
import React from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Mic, X, Check, ChevronUp } from "lucide-react"; // Added Search icon
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
import { Button } from "@/components/ui/button";
import { Brands } from '@/components/Brands';
import { SoundWave } from '@/components/SoundWave';
import { CandidateJourney } from '@/components/CandidateJourney';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { ProductDemo } from '@/components/ProductDemo';


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


const VoiceRecordingUI = ({ onCancel, onAccept, transcript, isListening }: { onCancel: () => void; onAccept: () => void; transcript: string; isListening: boolean; }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

    return (
        <div className="flex h-auto min-h-[56px] w-full items-center justify-between p-4">
            <div className="flex items-center gap-3 overflow-hidden w-full">
                <SoundWave isListening={isListening} />
                <div ref={scrollRef} className="text-base text-muted-foreground w-full max-h-[80px] overflow-y-auto custom-scrollbar pl-2">
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
          timeout = setTimeout(type, 20);
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
          timeout = setTimeout(type, 50);
        } else {
          timeout = setTimeout(() => setIsDeleting(true), 2000);
        }
      }
    };

    timeout = setTimeout(type, 100);

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

    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.hostname === window.location.hostname) {
          setHasInteracted(true);
          setInputValue("I need someone to ");
          textareaRef.current?.focus();
        }
      } catch (e) {
        // Invalid URL
      }
    }


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
    setInputValue("");
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopRecording = (shouldAccept: boolean) => {
    SpeechRecognition.stopListening();
    if (shouldAccept) {
        setInputValue(transcript.trim());
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
    // setEmailError(""); // This line should be removed to preserve email validation errors

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

    try {
      // --- Original sheetdb.io submission logic ---
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

      const sheetdbResponse = await fetch("https://sheetdb.io/api/v1/q1xovvwyyhvv0", {
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

      if (!sheetdbResponse.ok) {
        let errorMessage = "Failed to submit data to SheetDB. Please try again.";
        try {
            const errorData = await sheetdbResponse.json();
            errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
            errorMessage = sheetdbResponse.statusText || errorMessage;
        }
        console.error(errorMessage); // Log the error, but don't show to user
        setIsLoading(false); // Ensure loading state is reset
        return; 
      }
      // --- End original sheetdb.io submission logic ---

      // --- Custom API call logic ---
      const planResponse = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userQuery: inputValue,
        }),
      });

      if (!planResponse.ok) {
        let errorMessage = "Failed to generate plan. Please try again.";
        try {
            const errorData = await planResponse.json();
            errorMessage = errorData.details || errorMessage;
        } catch (jsonError) {
            errorMessage = planResponse.statusText || errorMessage;
        }
        console.error(errorMessage); // Log the error, but don't show to user
        setIsLoading(false); // Ensure loading state is reset
        return; 
      }
      
      const planData = await planResponse.json();
      sessionStorage.setItem('generatedPlanData', JSON.stringify(planData));
      sessionStorage.setItem('userQueryForPlan', planData.final_query);
      
      sessionStorage.setItem('userEmail', contactInfo); // Store the user's email
      sessionStorage.setItem('geminiInputValue', inputValue); // Keep original behavior
      
      // Use a proper UUID for the search ID to align with DB format from the start
      const searchId = crypto.randomUUID();
      router.push(`/search/${searchId}`);

    } catch (error) {
      console.error(error); // Log the error, but don't show to user
    } finally {
      setIsLoading(false); // Ensure loading state is reset even for unexpected errors
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (!hasInteracted && value) {
      setHasInteracted(true);
    }
    setInputValue(value);
    
    if (value) {
      setInteractionState(prev => ({...prev, keystrokes: prev.keystrokes + 1}));
    }
  };

  const handleFocus = () => {
    if (inputValue === "") {
        // The animation will continue until user starts typing
    }
  };

  const handleBlur = () => {
     if (inputValue === "I need someone to ") {
       setInputValue("");
       setHasInteracted(false);
     }
  }
  
  const handlePaste = () => {
    if (!hasInteracted) {
        setHasInteracted(true);
    }
    setInteractionState(prev => ({...prev, pasted: true}));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(); // Call handleSubmit directly
    }
  };

  
  return (
    <main className="relative flex flex-col min-h-screen bg-background animate-fade-in font-sans selection:bg-primary/20">
      <BackgroundGradient />
      
      {/* Hero Section */}
      <section className="relative flex flex-col min-h-screen w-full">
        <header className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-between items-center z-20">
            <Link href="/">
              <h1 className="font-poppins font-bold text-2xl text-foreground">
              TRAC AI
              </h1>
            </Link>
            <div className="flex flex-col items-end md:flex-row md:items-center gap-2 md:gap-4">
            <p className="text-sm text-muted-foreground text-right md:text-left">15,000+ experts available for hire.</p>
            <Link href="/trac-diary">
                <Button variant="outline" className="h-8 animate-shake">
                Join the Network
                </Button>
            </Link>
            </div>
        </header>

        <div className='flex-grow flex flex-col justify-center px-4 pt-32 md:pt-0 relative z-10'>
            <div className="flex-grow flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <div className="pt-4">
                        <div className="animate-fade-in">
                        <h2 className="text-center text-3xl md:text-4xl font-medium mb-4 text-foreground leading-tight font-playfair">
                            What's stopping you from growing faster?
                        </h2>
                        <p className="text-center text-muted-foreground mb-8">
                            please be specific that helps us find better candidates for you
                        </p>
                        <form onSubmit={handleSubmit} className="mx-auto w-full space-y-4">
                            <div className={cn("relative w-full overflow-hidden flex flex-col items-center self-auto border border-primary/20 bg-secondary/30 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-primary/50 transition-all",
                                listening && "p-0"
                            )}>
                                {listening ? (
                                <VoiceRecordingUI 
                                    onCancel={() => stopRecording(false)}
                                    onAccept={() => stopRecording(true)}
                                    transcript={transcript}
                                    isListening={listening}
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
                                            onBlur={handleBlur}
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
                                        className="h-14 w-full rounded-2xl bg-secondary/30 text-base shadow-md border-primary/20 focus-visible:ring-primary/50 transition-all"
                                    />
                                    {emailError && <p className="mt-2 text-sm text-red-500">{emailError}</p>}
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Our AI will find the best candidates for your role.
                                    </p>
                                </div>
                                
                                {!listening && (
                                    <div className="flex h-full items-center justify-end gap-2 self-start shrink-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button type="button" onClick={startRecording} variant="secondary" size="icon" className="h-14 w-14 rounded-full shadow-md border border-primary/20" disabled={isLoading || listening}>
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
                                                    <Button 
                                                        type="submit" 
                                                        size="lg" 
                                                        className={cn(
                                                            "h-14 rounded-full px-8 shadow-lg transition-all duration-300 font-bold text-base",
                                                            (!inputValue.trim() || !contactInfo.trim() || emailError !== "") 
                                                                ? "bg-primary/20 dark:bg-white/10 text-primary-foreground/50 dark:text-white/30 cursor-not-allowed" 
                                                                : "bg-primary dark:bg-white text-primary-foreground dark:text-black hover:scale-105 active:scale-95",
                                                            isLoading && "bg-primary/50 dark:bg-white/50 cursor-wait scale-95"
                                                        )} 
                                                        disabled={isLoading || !inputValue.trim() || !contactInfo.trim() || emailError !== "" || listening}
                                                    >
                                                        {isLoading ? (
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
                                                                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
                                                                <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
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
                        <div className="mt-16">
                            <div className="mb-24 text-center">
                                <Link href="/trac-diary" className="text-lg text-foreground hover:text-primary transition-colors block">
                                    <span className="font-medium">Looking to get hired?</span> <br /> <span className="font-bold underline text-xl">Download Our Software.</span>
                                </Link>
                            </div>
                            <Brands />
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* New Components Section */}
      <div className="relative pb-24">
         {/* <div className="hidden lg:block">
            <CandidateJourney />
         </div>
         <div className="lg:hidden">
            <CandidateJourneyMobile />
         </div> */}
        <ProductDemo />
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 z-50 text-sm bg-background/20 backdrop-blur-sm border-t border-border/10 transition-all duration-300 hover:bg-background/40">
            <div className="container mx-auto px-4 py-1 md:py-2">
                <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
                    <div className="py-1 px-4 md:py-2 text-center md:text-left">
                      <p className="font-semibold text-foreground/70 dark:text-foreground/40 hover:text-foreground transition-colors">Google for Hiring</p>
                    </div>
                    <div className="relative py-1 px-4 md:py-3">
                        <div className="flex justify-center md:justify-end">
                             {/* <button
                                onClick={() => setShowIdeationPanel(prev => !prev)}
                                className="flex items-center gap-2 text-sm font-medium text-foreground transition-transform hover:scale-105"
                            >
                                Ideate with PG <ChevronUp size={16} className={cn('transition-transform', showIdeationPanel && 'rotate-180')} />
                            </button>
                            <IdeationPanel isOpen={showIdeationPanel} onClose={() => setShowIdeationPanel(false)} /> */}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </main> 
  );
}
