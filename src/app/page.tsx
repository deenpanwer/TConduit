"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Maximize } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_TEXTAREA_HEIGHT = 150; // 150px

const AutoResizingTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { isOverflowing: boolean }
>(({ className, isOverflowing, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => internalRef.current!);

  useEffect(() => {
    const textarea = internalRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      
      textarea.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [props.value]);

  return (
    <textarea
      ref={internalRef}
      rows={1}
      className={cn(
        "w-full resize-none border border-black p-1 bg-white text-black max-w-xs",
        "custom-scrollbar pr-2",
        isOverflowing ? "pb-8" : "",
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const isCurrentlyOverflowing = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT;
      if(isCurrentlyOverflowing !== isOverflowing) {
        setIsOverflowing(isCurrentlyOverflowing);
      }
    }
  }, [inputValue, isOverflowing]);


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
        description: "Thank you for providing your contact number.",
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
      setIsModalOpen(false);
    }
  };

  const handleModalSubmit = () => {
    handleSubmit();
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-serif text-4xl mb-4 text-black">
          Kaayf
        </h1>
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-xs items-start justify-center">
          <div className="relative w-full">
            <AutoResizingTextarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="type your number"
              aria-label="Data input"
              disabled={isLoading}
              isOverflowing={isOverflowing}
            />
            {isOverflowing && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="absolute bottom-1 right-1 p-0.5"
                  aria-label="Enlarge input"
                  >
                  <Maximize className="h-4 w-4 text-gray-500" />
                </button>
            )}
          </div>

           <button type="submit" className="ml-2 h-[34px] border border-black bg-white px-2 py-1 text-black" disabled={isLoading}>
            {isLoading ? "..." : "→"}
          </button>
        </form>
        <p className="mt-2 text-sm text-black">
          Please provide your relevant contact information.
        </p>
      </div>
      <Toaster />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-black">Edit your entry</DialogTitle>
          </DialogHeader>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="type your number"
            className="min-h-[150px] bg-white border border-black text-black custom-scrollbar"
            disabled={isLoading}
          />
          <div className="flex justify-end">
             <Button onClick={handleModalSubmit} className="border border-black bg-white px-2 py-1 text-black" disabled={isLoading}>
                {isLoading ? "..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}