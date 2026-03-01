import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name?: string;
  photoUrl?: string;
}

interface EmployeeListProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelectEmployee: (employee: Employee) => void;
  isLoading: boolean;
}

export function EmployeeList({ employees, selectedEmployee, onSelectEmployee, isLoading }: EmployeeListProps) {
  return (
    <div className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-bold text-lg">Staff Members</h3>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Shimmer className="h-7 w-7 rounded-full shrink-0" />
                <Shimmer className="h-4 w-3/4 rounded" />
              </div>
            ))
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground text-sm p-2">No staff to chat with.</p>
          ) : (
            employees.map((emp) => (
              <Button
                key={emp.id}
                variant="ghost"
                className={cn(
                  "justify-start gap-3 w-full",
                  selectedEmployee?.id === emp.id && "bg-secondary"
                )}
                onClick={() => onSelectEmployee(emp)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={emp.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.name}`} alt={emp.name} />
                  <AvatarFallback>{emp.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <span className="truncate">{emp.name || "Unknown"}</span>
              </Button>
            ))
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}
