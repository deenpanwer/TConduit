import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer"; // Assuming Shimmer is here
import { getUserAvatar } from "@/lib/utils";

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
  ownerData: any; // Add ownerData
  selectedEmployeeData: any; // Add selectedEmployeeData
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
    <ScrollArea className="flex-1 px-6 py-4 custom-scrollbar">
      <div className="flex flex-col gap-6">
        {messages.map((msg, index) => {
          const isCurrentUserSender = msg.senderId === userUid;
          
          const senderAvatar = isCurrentUserSender
            ? getUserAvatar(ownerData)
            : getUserAvatar(selectedEmployeeData);

          const senderDisplayName = isCurrentUserSender ? ownerName : selectedEmployeeName;

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
