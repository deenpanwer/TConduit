import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  inputText: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  isDisabled: boolean;
}

export function ChatInput({ inputText, onInputChange, onSendMessage, isDisabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-4 bg-background/50 backdrop-blur-xl border-t border-border/40 shrink-0">
      <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-secondary/30 rounded-2xl p-2 px-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Message..."
          value={inputText}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          className="flex-1 max-h-[200px] min-h-[40px] bg-transparent border-none focus:ring-0 text-[13px] py-2 px-1 leading-relaxed resize-none scrollbar-hide"
        />
        
        <div className="flex items-center gap-2 h-10 mb-0.5 shrink-0">
          <Button 
            size="icon" 
            onClick={onSendMessage} 
            disabled={isDisabled || !inputText.trim()}
            className="h-9 w-9 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
