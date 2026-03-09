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
        "flex gap-3 mb-1",
        isCurrentUserSender ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="flex-shrink-0 self-end mb-1">
        <Avatar className="h-8 w-8 border border-border/50">
          <AvatarImage src={senderAvatarUrl} alt={senderName} />
          <AvatarFallback className="text-[10px]">{senderName?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
      </div>

      <div
        className={cn(
          "max-w-[85%] flex flex-col group",
          isCurrentUserSender ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 shadow-sm transition-all duration-200",
            isCurrentUserSender
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
              : "bg-muted text-muted-foreground rounded-2xl rounded-bl-sm"
          )}
        >
          <p className="text-[13px] leading-relaxed font-medium">{message.text}</p>
        </div>
        
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
          isCurrentUserSender ? "text-right" : "text-left"
        )}>
          {time}
        </span>
      </div>
    </div>
  );
}
