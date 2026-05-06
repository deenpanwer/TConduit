"use client";

import { ChatBubble } from "./ChatBubble";
import { cn } from "@/lib/utils";
import { Sparkles, Hammer, CheckCircle2 } from "lucide-react";
import { isToolUIPart } from 'ai';
import { AuditVisualizer } from "./AuditVisualizer";
import type { TracAiUIMessage as Message } from '@/lib/ai/agents/trac-ai';

interface ChatItemProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatItem({ message, isLoading }: ChatItemProps) {
  const isAssistant = message.role === "assistant";
  
  // Robustly extract content from content or parts
  const textContent = (message as any).content || message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || "";

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(
        "flex w-full gap-4 px-4 py-2",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        {isAssistant && (
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
            <Sparkles size={20} />
          </div>
        )}
        <ChatBubble 
          content={textContent} 
          role={isAssistant ? "assistant" : "user"} 
          isLoading={isLoading} 
        />
      </div>

      {/* Parts-based Rendering (v6) - Only for Tool UI/Visuals */}
      <div className="flex flex-col gap-4 px-4 md:px-14">
        {message.parts?.map((part: any, i: number) => {
           if (isToolUIPart(part)) {
             const { toolCallId, state } = part;
             const isComplete = state === 'output-available';
             
             // Extract toolName from type (e.g. 'tool-audit_employee' -> 'audit_employee')
             const toolName = part.type.startsWith('tool-') ? part.type.slice(5) : 'unknown';

             return (
               <div key={toolCallId} className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 bg-secondary/20 w-fit px-3 py-1 rounded-full border border-border/50">
                   {isComplete ? <CheckCircle2 size={12} className="text-green-500" /> : <Hammer size={12} className="animate-pulse" />}
                   {toolName.replace(/_/g, ' ')}
                 </div>

                 {isComplete && (
                     <div className="mt-2 w-full max-w-lg">
                         {/* Render specific tool results here */}
                         {part.type === 'tool-audit_employee' && (part.output as any)?.success && (
                             <AuditVisualizer 
                                 employeeId={(part.output as any).employeeId}
                                 employeeName={(part.output as any).employeeName}
                                 date={(part.output as any).date}
                             />
                         )}
                         {part.type === 'tool-list_employees' && (
                            <div className="text-xs text-muted-foreground bg-secondary/10 p-2 rounded border border-border/50">
                                Found {(part.output as any[]).length} employees.
                            </div>
                         )}
                     </div>
                 )}
               </div>
             );
           }
           return null;
        })}
      </div>
    </div>
  );
}
