"use client";

import React from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getUserAvatar } from "@/lib/utils";
import { format } from "date-fns";
import { Task, PRIORITIES } from "./BoardView";
import { Check, Clock, AlertCircle } from "lucide-react";

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  personnel: any[];
}

export function ListView({ tasks, onTaskClick, personnel }: ListViewProps) {
  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary/20">
          <TableRow>
            <TableHead className="w-[40%] text-[10px] font-bold uppercase tracking-widest">Task</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Priority</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Assignees</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-xs">
                No tasks found
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow 
                key={task.id} 
                className="cursor-pointer hover:bg-secondary/10 transition-colors group"
                onClick={() => onTaskClick(task.id)}
              >
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm group-hover:text-primary transition-colors">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{task.description || "No description"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-tighter py-0.5 px-2">
                    {task.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", PRIORITIES[task.priority || 'medium'].color)} />
                    <span className="text-[10px] font-medium capitalize">{task.priority}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex -space-x-1.5 justify-center">
                    {(task.assignees || []).map((uid) => {
                      const u = personnel.find((p) => p.id === uid);
                      return (
                        <Avatar key={uid} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={getUserAvatar(u)} />
                          <AvatarFallback className="text-[8px]">{u?.name?.[0]}</AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {(task.assignees || []).length === 0 && (
                       <span className="text-[9px] text-muted-foreground italic">Unassigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date"}
                    </span>
                    {task.dueDate && new Date(task.dueDate) < new Date() && !task.flagged && (
                      <span className="text-[9px] text-destructive font-bold flex items-center gap-1">
                        <AlertCircle size={8} /> Overdue
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="p-8 text-center border-t border-border/40 bg-secondary/5">
         <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase py-1 px-4">
            Advanced Filtering & Bulk Actions Coming Soon
         </Badge>
      </div>
    </div>
  );
}
