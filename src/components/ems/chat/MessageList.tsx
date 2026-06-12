"use client";

import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble, ChatMessage } from "./MessageBubble";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { getUserAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  userUid: string;
  selectedEmployeePhotoUrl?: string;
  selectedEmployeeName?: string;
  ownerPhotoUrl?: string;
  ownerName?: string;
  isLoading: boolean;
  ownerData: any;
  selectedEmployeeData?: any;
  employees?: any[]; // Dynamic roster lookup for group messaging
  
  // Pagination additions
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function MessageList({
  messages,
  userUid,
  selectedEmployeePhotoUrl,
  selectedEmployeeName,
  ownerPhotoUrl,
  ownerName,
  isLoading,
  ownerData,
  selectedEmployeeData,
  employees = [],
  hasMore = false,
  onLoadMore
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Flag to check if we just loaded more messages to prevent jumping scroll
  const prevScrollHeightRef = useRef<number>(0);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      lastMessageIdRef.current = null;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage.id || (lastMessage.timestamp ? (lastMessage.timestamp.seconds || lastMessage.timestamp) : '') || '';

    const isInitialLoad = !lastMessageIdRef.current;
    const isNewMessageAppended = lastMessageIdRef.current && lastMessageIdRef.current !== lastId && prevScrollHeightRef.current === 0;

    if (isInitialLoad || isNewMessageAppended) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      lastMessageIdRef.current = lastId;
    } else if (prevScrollHeightRef.current > 0) {
      // Hold scroll position on pagination
      if (scrollAreaRef.current) {
        const newScrollHeight = scrollAreaRef.current.scrollHeight;
        const container = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (container) {
          container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        }
      }
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        <Shimmer className="h-20 w-3/4 rounded-xl" />
        <Shimmer className="h-20 w-2/3 ml-auto rounded-xl" />
        <Shimmer className="h-20 w-1/2 rounded-xl" />
        <Shimmer className="h-20 w-full ml-auto rounded-xl" />
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4 custom-scrollbar bg-transparent">
      <div className="flex flex-col gap-2">
        
        {/* PAGINATION TRIGGER BUTTON */}
        {hasMore && onLoadMore && (
          <div className="flex justify-center py-2 animate-in fade-in duration-300">
            <Button
              onClick={() => {
                // Record current viewport height to hold scroll state
                if (scrollAreaRef.current) {
                  prevScrollHeightRef.current = scrollAreaRef.current.scrollHeight;
                }
                onLoadMore();
              }}
              variant="outline"
              size="sm"
              className="gap-2 text-[10px] uppercase tracking-widest font-bold bg-secondary/30 hover:bg-secondary/60 text-muted-foreground border-border/10 rounded-xl transition-all shadow-sm"
            >
              <Clock className="h-3.5 w-3.5" />
              Load Previous Messages
            </Button>
          </div>
        )}

        {messages.map((msg, index) => {
          const isCurrentUserSender = msg.senderId === userUid;
          
          // Resolve sender profile details for group chats
          const groupSender = !isCurrentUserSender
            ? employees.find((emp) => emp.id === msg.senderId)
            : null;

          const senderAvatar = isCurrentUserSender
            ? getUserAvatar(ownerData)
            : (groupSender
                ? getUserAvatar(groupSender)
                : (selectedEmployeeData
                    ? getUserAvatar(selectedEmployeeData)
                    : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${msg.senderName || msg.senderId}`));

          const senderDisplayName = isCurrentUserSender 
            ? ownerName 
            : (groupSender?.name || msg.senderName || selectedEmployeeName || "Unknown");

          return (
            <MessageBubble
              key={msg.id || index}
              message={msg}
              isCurrentUserSender={isCurrentUserSender}
              senderAvatarUrl={senderAvatar}
              senderName={senderDisplayName || "Unknown"}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}
