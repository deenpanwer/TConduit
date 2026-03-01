import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any; // Firebase Timestamp
}

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUserSender: boolean;
  senderAvatarUrl: string;
  senderName: string;
}

export function MessageBubble({ message, isCurrentUserSender, senderAvatarUrl, senderName }: MessageBubbleProps) {
  const time = message.timestamp?.toDate ? format(message.timestamp.toDate(), "p") : "";

  return (
    <div
      className={cn(
        "flex items-end gap-3",
        isCurrentUserSender ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUserSender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderAvatarUrl} alt={senderName} />
          <AvatarFallback>{senderName?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%] p-3 rounded-lg flex flex-col",
          isCurrentUserSender
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-muted-foreground rounded-bl-none"
        )}
      >
        <p className="text-sm">{message.text}</p>
        <span className="block self-end text-xs opacity-70 mt-1">
          {time}
        </span>
      </div>
      {isCurrentUserSender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderAvatarUrl} alt={senderName} />
          <AvatarFallback>{senderName?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
