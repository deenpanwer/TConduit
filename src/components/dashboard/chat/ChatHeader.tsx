import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Employee {
  id: string;
  name?: string;
  photoUrl?: string;
}

interface ChatHeaderProps {
  selectedEmployee: Employee | null;
}

export function ChatHeader({ selectedEmployee }: ChatHeaderProps) {
  if (!selectedEmployee) {
    return (
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <div className="h-9 w-9 rounded-full bg-secondary animate-pulse" />
        <h3 className="font-bold text-lg text-muted-foreground">Select a staff member</h3>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 border-b bg-card">
      <Avatar className="h-9 w-9">
        <AvatarImage src={selectedEmployee.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${selectedEmployee.name}`} alt={selectedEmployee.name} />
        <AvatarFallback>{selectedEmployee.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      <h3 className="font-bold text-lg">{selectedEmployee.name || "Selected Employee"}</h3>
    </div>
  );
}
