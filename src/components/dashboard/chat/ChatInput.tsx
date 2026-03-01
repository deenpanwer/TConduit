import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  isDisabled: boolean;
}

export function ChatInput({ inputText, onInputChange, onSendMessage, isDisabled }: ChatInputProps) {
  return (
    <div className="p-4 border-t bg-card flex items-center gap-2">
      <Input
        placeholder="Type your message..."
        value={inputText}
        onChange={onInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
            e.preventDefault();
            onSendMessage();
          }
        }}
        className="flex-1 rounded-xl pr-10"
        disabled={isDisabled}
      />
      <Button size="icon" onClick={onSendMessage} disabled={isDisabled || !inputText.trim()}>
        <Send className="h-5 w-5" />
        <span className="sr-only">Send message</span>
        {/* Visual indicator for Enter key, only if not disabled */}
        {!isDisabled && <CornerDownLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
      </Button>
    </div>
  );
}
