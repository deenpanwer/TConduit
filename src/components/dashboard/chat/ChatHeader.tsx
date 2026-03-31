import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, BellOff, BellRing } from "lucide-react";
import { cn, getUserAvatar } from "@/lib/utils";
import { useNotificationSettings, NotificationSetting } from "@/hooks/use-notification-settings";

interface Employee {
  id: string;
  name?: string;
  photoUrl?: string;
  imageUrl?: string;
}

interface ChatHeaderProps {
  selectedEmployee: Employee | null;
  chatId: string | null;
}

export function ChatHeader({ selectedEmployee, chatId }: ChatHeaderProps) {
  const { setting, updateSetting } = useNotificationSettings(chatId || '');
  
  if (!selectedEmployee) {
    return (
      <div className="flex items-center gap-4 p-5 border-b border-border/40 bg-card/50 backdrop-blur-md">
        <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
        <div className="h-4 w-32 bg-secondary animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-5 border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
            <AvatarImage src={getUserAvatar(selectedEmployee)} alt={selectedEmployee.name} />
            <AvatarFallback className="text-xs">{selectedEmployee.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-bold text-[15px] leading-none tracking-tight">{selectedEmployee.name || "Selected Employee"}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1.5 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            Live Personnel
          </span>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            {setting === 'all' ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => updateSetting('all')}>
            <Bell className="mr-2 h-4 w-4" />
            <span>All Messages</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateSetting('silent')}>
            <BellOff className="mr-2 h-4 w-4" />
            <span>Silent</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
