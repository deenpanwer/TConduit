"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Mic, 
  Send, 
  Plus, 
  Monitor, 
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isToolsOpen &&
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node) &&
        toolsButtonRef.current &&
        !toolsButtonRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isToolsOpen]);

  const handleScroll = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { scrollTop, scrollHeight, clientHeight } = textarea;
    if (scrollHeight > clientHeight) {
      setIsScrolled(scrollTop > 0);
      setIsAtBottom(scrollHeight - scrollTop <= clientHeight + 1);
    } else {
      setIsScrolled(false);
      setIsAtBottom(true);
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    handleScroll();
  };

  useEffect(() => {
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative px-4 pb-8">
      <AnimatePresence>
          {isToolsOpen && (
              <motion.div 
                  ref={toolsMenuRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-[5.5rem] left-4 p-2 bg-card border border-border shadow-2xl rounded-2xl z-50 flex flex-col gap-1 min-w-[200px]"
              >
                  <button className="flex items-center gap-3 w-full p-3 hover:bg-secondary rounded-xl transition-all text-left group">
                      <div className="size-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                          <ListTodo size={16} />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-tight">Create Task</span>
                          <span className="text-[9px] text-muted-foreground">Assign to team</span>
                      </div>
                  </button>
                  <button className="flex items-center gap-3 w-full p-3 hover:bg-secondary rounded-xl transition-all text-left group">
                      <div className="size-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                          <Monitor size={16} />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-tight">Audit Member</span>
                           <span className="text-[9px] text-muted-foreground">Verify productivity</span>
                      </div>
                  </button>
              </motion.div>
          )}
      </AnimatePresence>

      <div 
        className="relative flex flex-col w-full bg-card rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden"
      >
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder="Message Trac AI..."
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none p-4 text-base font-medium placeholder:text-muted-foreground/60 max-h-[200px] custom-scrollbar"
                rows={1}
            />
            <div className={cn("absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-card to-transparent pointer-events-none transition-opacity", isScrolled ? "opacity-100" : "opacity-0")} />
            <div className={cn("absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-card to-transparent pointer-events-none transition-opacity", !isAtBottom ? "opacity-100" : "opacity-0")} />
        </div>

        <div className="flex items-center justify-between p-2">
            <Button
                ref={toolsButtonRef}
                variant="ghost"
                size="icon"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={cn(
                    "size-9 rounded-lg shrink-0 transition-all text-muted-foreground",
                    isToolsOpen ? "bg-primary/10 text-primary rotate-45" : "hover:bg-secondary"
                )}
            >
                <Plus size={20} />
            </Button>
        
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                    <Mic size={18} />
                </Button>
                
                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    size="icon"
                    className={cn(
                        "size-9 rounded-full transition-all duration-200",
                        message.trim() && !isLoading
                            ? "bg-primary text-white" 
                            : "bg-secondary text-muted-foreground/30 pointer-events-none"
                    )}
                >
                    <Send size={16} />
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
