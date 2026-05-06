"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
  content: string;
  role: "user" | "assistant";
  isLoading?: boolean;
}

export function ChatBubble({ content, role, isLoading }: ChatBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-[2rem] text-sm md:text-base leading-relaxed font-medium shadow-sm",
        isAssistant 
          ? "bg-secondary/40 text-foreground border border-border/50 rounded-tl-none" 
          : "bg-primary text-white rounded-tr-none ml-auto"
      )}
    >
      {isLoading ? (
        <div className="flex gap-1.5 py-2 items-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1 }}
            className="size-1.5 bg-primary rounded-full" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            className="size-1.5 bg-primary rounded-full" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            className="size-1.5 bg-primary rounded-full" 
          />
        </div>
      ) : (
        <div className={cn(
          "prose prose-sm md:prose-base max-w-none break-words prose-p:my-0 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0",
          isAssistant ? "prose-neutral dark:prose-invert" : "prose-invert"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
}
