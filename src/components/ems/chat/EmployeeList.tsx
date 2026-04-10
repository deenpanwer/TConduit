import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { cn, getUserAvatar } from "@/lib/utils";
import { motion } from "framer-motion";

interface Employee {
  id: string;
  name?: string;
  photoUrl?: string;
  imageUrl?: string;
}

interface EmployeeListProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelectEmployee: (employee: Employee) => void;
  isLoading: boolean;
}

export function EmployeeList({ employees, selectedEmployee, onSelectEmployee, isLoading }: EmployeeListProps) {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-6 border-b border-border/40 bg-secondary/10">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Team Personnel</h3>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col p-3 gap-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Shimmer className="h-9 w-9 rounded-full shrink-0" />
                <Shimmer className="h-4 w-3/4 rounded-full" />
              </div>
            ))
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-xs font-medium text-muted-foreground/50 italic">No available personnel</p>
            </div>
          ) : (
            employees.map((emp) => (
              <Button
                key={emp.id}
                variant="ghost"
                className={cn(
                  "h-14 justify-start gap-4 px-3 rounded-xl transition-all duration-200 group relative border border-transparent",
                  selectedEmployee?.id === emp.id 
                    ? "bg-primary/5 border-primary/10 shadow-sm" 
                    : "hover:bg-secondary/50"
                )}
                onClick={() => onSelectEmployee(emp)}
              >
                {selectedEmployee?.id === emp.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-full" 
                  />
                )}
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-border/50 transition-transform group-hover:scale-105">
                    <AvatarImage src={getUserAvatar(emp)} alt={emp.name} />
                    <AvatarFallback className="text-xs">{emp.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className={cn(
                    "text-[13px] font-semibold truncate transition-colors",
                    selectedEmployee?.id === emp.id ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                  )}>
                    {emp.name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tight">Active now</span>
                </div>
              </Button>
            ))
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}
