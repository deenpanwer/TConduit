"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_TEXTAREA_HEIGHT = 300;

const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void; }
>(({ className, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  React.useImperativeHandle(ref, () => internalRef.current!);

  useEffect(() => {
    const textarea = internalRef.current;
    if (textarea) {
      const isCurrentlyOverflowing = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT;
      if (isCurrentlyOverflowing !== isOverflowing) {
        setIsOverflowing(isCurrentlyOverflowing);
      }

      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [props.value, isOverflowing]);

  return (
    <textarea
      ref={internalRef}
      rows={1}
      className={cn(
        "w-full resize-none overflow-y-auto border border-black p-2 bg-white text-black",
        isOverflowing ? "custom-scrollbar" : "scrollbar-hide",
        className
      )}
      {...props}
    />
  );
});

AutoResizingTextarea.displayName = 'AutoResizingTextarea';

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Success!",
        description: "Your message has been sent. We'll be in touch.",
      });
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
    <main className="flex items-center justify-center min-h-screen bg-white py-20">
      <div className="w-full max-w-lg text-center">
        <h1 className="font-serif text-4xl mb-4 text-black">
          Kaayf
        </h1>
        <div className="pt-4">
            <form onSubmit={handleSubmit} className="mx-auto flex items-start justify-center">
            <AutoResizingTextarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write the problem you're facing."
              aria-label="Data input"
              disabled={isLoading}
            />
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="submit" className="ml-2 h-[42px] border border-black bg-white px-3 py-1 text-black" disabled={isLoading}>
                            {isLoading ? "..." : "→"}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Send (Ctrl+Enter)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </form>
            <div className="mt-2 flex items-center justify-center text-sm text-black">
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
                            <p className="font-medium">Example format:</p>
                            <div className="mt-1 text-xs text-muted-foreground">
                                <p><span className="font-semibold">Problem:</span> My website is too slow and I'm losing customers.</p>
                                <p><span className="font-semibold">Contact:</span> email@example.com</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
