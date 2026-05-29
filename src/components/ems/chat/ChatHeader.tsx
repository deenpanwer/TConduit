"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatar, isEmployeeOnline, cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface Employee {
  id: string;
  name?: string;
  photoUrl?: string;
  imageUrl?: string;
}

interface GroupChat {
  id: string;
  name: string;
  members: string[];
}

interface ChatHeaderProps {
  selectedEmployee: Employee | null;
  selectedGroup?: GroupChat | null;
}

export function ChatHeader({ selectedEmployee, selectedGroup = null }: ChatHeaderProps) {
  if (!selectedEmployee && !selectedGroup) {
    return (
      <div className="flex items-center gap-4 p-5 border-b border-border/40 bg-card/50 backdrop-blur-md">
        <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
        <div className="h-4 w-32 bg-secondary animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-5 border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4">
        {selectedGroup ? (
          // GROUP CHAT HEADER LAYOUT
          <>
            <div className="relative shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 rounded-2xl text-primary font-bold border border-primary/20 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="font-bold text-[15px] leading-none tracking-tight">{selectedGroup.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground/60"></span>
                </span>
                {selectedGroup.members?.length || 0} collaborators joined
              </span>
            </div>
          </>
        ) : (
          // DIRECT CHAT HEADER LAYOUT
          selectedEmployee && (
            <>
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
                  <AvatarImage src={getUserAvatar(selectedEmployee)} alt={selectedEmployee.name} />
                  <AvatarFallback className="text-xs">{selectedEmployee.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-background rounded-full",
                  isEmployeeOnline(selectedEmployee) ? "bg-green-500" : "bg-zinc-400"
                )} />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-bold text-[15px] leading-none tracking-tight">{selectedEmployee.name || "Selected Employee"}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
                  {isEmployeeOnline(selectedEmployee) ? "Active" : "Offline"}
                </span>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
