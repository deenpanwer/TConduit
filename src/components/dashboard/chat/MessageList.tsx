import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer"; // Assuming Shimmer is here

interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any;
}

interface MessageListProps {
  messages: ChatMessage[];
  userUid: string;
  selectedEmployeePhotoUrl: string | undefined;
  selectedEmployeeName: string | undefined;
  ownerPhotoUrl: string | undefined;
  ownerName: string | undefined;
  isLoading: boolean;
}

export function MessageList({
  messages,
  userUid,
  selectedEmployeePhotoUrl,
  selectedEmployeeName,
  ownerPhotoUrl,
  ownerName,
  isLoading,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <ScrollArea className="flex-1 p-4 space-y-4 custom-scrollbar">
      {messages.map((msg) => {
        const isCurrentUserSender = msg.senderId === userUid;
        const senderAvatar = isCurrentUserSender
          ? ownerPhotoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${ownerName}`
          : selectedEmployeePhotoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${selectedEmployeeName}`;
        const senderDisplayName = isCurrentUserSender ? ownerName : selectedEmployeeName;

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isCurrentUserSender={isCurrentUserSender}
            senderAvatarUrl={senderAvatar || ""} // Provide fallback for undefined
            senderName={senderDisplayName || "Unknown"} // Provide fallback for undefined
          />
        );
      })}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
}
