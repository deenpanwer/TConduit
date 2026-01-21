"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, User, Bot, Plus, Search, MoreHorizontal, Check, CheckCheck, ShieldCheck, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { HiringData } from "../HiringModal";

import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface CommsTabProps {
  candidateName: string;
  hiringData: HiringData;
  isSent: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "candidate" | "system";
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
}

export function CommsTab({ candidateName, hiringData, isSent }: CommsTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize messages from hiringData
  useEffect(() => {
    if (!hasInitialized && hiringData.message) {
      setMessages([{
        id: "initial-msg",
        text: hiringData.message,
        sender: "user",
        timestamp: new Date(),
        status: "read"
      }]);
      setHasInitialized(true);
    }
  }, [hiringData.message, hasInitialized]);

  // Add system message when packet is sent
  useEffect(() => {
    if (isSent && !messages.some(m => m.id === "system-sent")) {
      setMessages(prev => [...prev, {
        id: "system-sent",
        text: `Onboarding packet with ${hiringData.hiringType === "hourly" ? "Contract" : "Offer Letter"} has been dispatched to ${candidateName}.`,
        sender: "system",
        timestamp: new Date(),
      }]);
    }
  }, [isSent, candidateName, hiringData.hiringType]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (text = inputValue) => {
    const finalMsg = text.trim();
    if (!finalMsg) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: finalMsg,
      sender: "user",
      timestamp: new Date(),
      status: "delivered"
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
  };

  const handleAiAction = (action: string) => {
    setIsAiLoading(true);
    toast({
      title: "AI Co-pilot",
      description: `Analyzing conversation to ${action.toLowerCase()}...`,
    });

    setTimeout(() => {
      setIsAiLoading(false);
      if (action === "Draft Follow-up") {
        setInputValue(`Hi ${candidateName}, following up on the documents we sent over. Let me know if you have any questions!`);
      } else {
        toast({
          title: "AI Analysis Complete",
          description: action === "Summarize" 
            ? "Summary: Hiring process initiated, candidate responsive." 
            : "Legal Check: No sensitive data violations found.",
        });
      }
    }, 1500);
  };

  const copyMessageText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Message text copied to clipboard.",
    });
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    toast({
      title: "Deleted",
      description: "Message has been removed.",
    });
  };

  const copyMessageLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/hired/${hiringData.orgName}?msg=${id}`);
    toast({
      title: "Link Copied",
      description: "Message link copied to clipboard.",
    });
  };

  if (!isSent) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 text-center"
        >
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Candidate Communication</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Communication will be available once the onboarding packet is sent. Your initial message will be sent automatically.
            </p>
            <Button variant="outline" disabled className="gap-2">
                <Plus className="size-4" /> Start New Conversation
            </Button>
        </motion.div>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex h-[700px] w-full max-w-none rounded-[3rem] border bg-card overflow-hidden shadow-2xl"
    >
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 hidden md:flex flex-col">
        <div className="p-4 border-b">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input placeholder="Search messages..." className="pl-9 bg-background/50 text-xs rounded-xl" />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="p-2">
                <div className="p-3 bg-primary/10 rounded-2xl flex items-center gap-3 border border-primary/20">
                    <Avatar className="size-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">{candidateName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{candidateName}</div>
                        <div className="text-[10px] text-primary font-medium animate-pulse">Active Now</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar className="size-8 md:hidden">
                    <AvatarFallback>{candidateName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="text-sm font-bold">{candidateName}</div>
                    <div className="text-[10px] text-muted-foreground">Software Engineer Candidate</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("rounded-full size-8", isAiLoading && "animate-pulse text-primary")}>
                      <Bot className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 rounded-2xl" align="end">
                    <div className="space-y-1">
                      <Button variant="ghost" onClick={() => handleAiAction("Summarize")} className="w-full justify-start text-xs font-bold gap-2 rounded-lg">
                        <MessageSquare className="size-3" /> Summarize Chat
                      </Button>
                      <Button variant="ghost" onClick={() => handleAiAction("Check Legal")} className="w-full justify-start text-xs font-bold gap-2 rounded-lg">
                        <ShieldCheck className="size-3" /> Compliance Check
                      </Button>
                      <Button variant="ghost" onClick={() => handleAiAction("Draft Follow-up")} className="w-full justify-start text-xs font-bold gap-2 rounded-lg">
                        <Send className="size-3" /> Draft Follow-up
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" className="rounded-full size-8"><MoreHorizontal className="size-4" /></Button>
            </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
            <AnimatePresence>
                {messages.map((msg) => {
                    if (msg.sender === "system") {
                        return (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-center my-4"
                            >
                                <div className="px-6 py-2 rounded-2xl bg-secondary/50 border text-[11px] font-bold text-muted-foreground flex items-center gap-2 italic">
                                    <ShieldCheck className="size-3 text-purple-500" />
                                    {msg.text}
                                </div>
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                "flex items-end gap-3 max-w-[85%] group",
                                msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <Avatar className="size-8 shrink-0">
                                <AvatarFallback className={cn(
                                    "text-[10px] font-bold",
                                    msg.sender === "user" ? "bg-purple-600 text-white" : "bg-secondary"
                                )}>
                                    {msg.sender === "user" ? "ME" : candidateName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                                <div className="relative">
                                  <div className={cn(
                                      "p-4 rounded-2xl text-sm shadow-sm",
                                      msg.sender === "user" 
                                          ? "bg-purple-600 text-white rounded-br-none" 
                                          : "bg-secondary text-secondary-foreground rounded-bl-none"
                                  )}>
                                      {msg.text}
                                  </div>
                                  
                                  {/* Message Actions Trigger */}
                                  <div className={cn(
                                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                    msg.sender === "user" ? "-left-10" : "-right-10"
                                  )}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8 rounded-full"><MoreHorizontal className="size-3" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align={msg.sender === "user" ? "end" : "start"} className="rounded-xl">
                                        <DropdownMenuItem className="text-xs font-bold gap-2" onClick={() => copyMessageText(msg.text)}>
                                          <Copy className="size-3" /> Copy Text
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs font-bold gap-2">
                                          <Bot className="size-3" /> Translate (Beta)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs font-bold gap-2 text-red-500" onClick={() => deleteMessage(msg.id)}>
                                          <Trash2 className="size-3" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                <div className={cn(
                                    "flex items-center gap-1.5 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
                                    msg.sender === "user" ? "flex-row-reverse" : ""
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender === "user" && (
                                        <span className="text-purple-500">
                                            {msg.status === "read" ? <CheckCheck className="size-3" /> : <Check className="size-3" />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
            <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-2xl border">
                <Input 
                    placeholder="Type your message..." 
                    className="border-none bg-transparent focus-visible:ring-0 text-sm"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                    size="icon" 
                    className="rounded-xl size-9 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleSendMessage()}
                >
                    <Send className="size-4" />
                </Button>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
