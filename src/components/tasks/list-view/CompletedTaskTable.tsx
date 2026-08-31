'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { TaskRowDesktop } from './TaskRows';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface CompletedTaskTableProps {
    tasks: Task[];
    orderedTasks: Task[];
    personnel: any[];
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    onTaskClick: (taskId: string) => void;
    isEnhancing: string | null;
    handleEnhanceWithAI: (taskId: string) => void;
}

export const CompletedTaskTable = ({
    tasks,
    orderedTasks,
    personnel,
    onUpdateTask,
    onDeleteTask,
    onTaskClick,
    isEnhancing,
    handleEnhanceWithAI
}: CompletedTaskTableProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (tasks.length === 0) return null;

    return (
        <div className="mt-8 mb-4">
            <div 
                className={cn(
                    "group/completed bg-secondary/10 dark:bg-white/[0.02] border border-border/40 rounded-2xl overflow-hidden transition-all duration-500",
                    isCollapsed ? "shadow-sm" : "shadow-md"
                )}
            >
                {/* Section Header */}
                <div 
                    className="h-12 px-6 flex items-center gap-4 cursor-pointer hover:bg-green-500/[0.03] transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-green-600" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-green-700/80">
                            Completed History
                        </h3>
                        <span className="text-[10px] font-bold text-green-600/50 bg-green-500/10 px-2.5 py-0.5 rounded-full">
                            {tasks.length} Items Done
                        </span>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                         <span className="text-[9px] font-bold uppercase opacity-30 group-hover/completed:opacity-100 transition-opacity">
                            {isCollapsed ? 'Click to view archive' : 'Hide archive'}
                         </span>
                         <ChevronRight 
                            size={16} 
                            className={cn(
                                "text-muted-foreground/30 transition-transform duration-300", 
                                !isCollapsed && "rotate-90"
                            )} 
                         />
                    </div>
                </div>

                {/* Table Content */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                            <div className="bg-background/40">
                                {/* Sub-Header */}
                                <div className="sticky top-0 z-20 flex h-10 bg-card border-b border-border/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 select-none shadow-sm">
                                    <div className="sticky left-0 z-30 w-10 shrink-0 border-r border-border/60 bg-card" />
                                    <div className="sticky left-10 z-30 w-10 shrink-0 border-r border-border/60 bg-card" />
                                    <div className="sticky left-20 z-30 flex-[1.5] min-w-[250px] border-r border-border/60 bg-card px-4 flex items-center">Task Name</div>
                                    <div className="flex-[2] min-w-[400px] border-r border-border/60 px-4 flex items-center bg-card">Description</div>
                                    <div className="w-32 shrink-0 border-r border-border/60 px-4 flex items-center bg-card">Assignees</div>
                                    <div className="w-24 shrink-0 border-r border-border/60 px-4 flex items-center justify-center bg-card">Points</div>
                                    <div className="w-24 shrink-0 border-r border-border/60 px-4 flex items-center justify-center bg-card">Hours</div>
                                    <div className="w-32 shrink-0 border-r border-border/60 px-4 flex items-center justify-center bg-card">Timeline</div>
                                    <div className="w-28 shrink-0 border-r border-border/60 px-4 flex items-center justify-center bg-card">Stage</div>
                                    <div className="w-28 shrink-0 border-r border-border/60 px-4 flex items-center justify-center bg-card">Priority</div>
                                    <div className="w-16 shrink-0 border-r border-border/60 bg-card" />
                                    <div className="w-10 shrink-0 bg-card" />
                                </div>

                                {/* Rows */}
                                <div className="flex flex-col opacity-60 grayscale-[0.4] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                                    {tasks.map(task => (
                                        <TaskRowDesktop 
                                            key={`completed-${task.id}`} 
                                            task={orderedTasks.find(t => t.id === task.id)!}
                                            localTask={task}
                                            onUpdate={(updates) => onUpdateTask(task.id, updates)}
                                            onDelete={onDeleteTask}
                                            onTaskClick={onTaskClick}
                                            personnel={personnel}
                                            handleEnhanceTask={handleEnhanceWithAI}
                                            isEnhancing={isEnhancing === task.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
