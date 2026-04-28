'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, MoreHorizontal, Trash2, Edit2, Check } from 'lucide-react';
import { Task, TaskGroup, useTasks } from '@/hooks/useTasks';
import { TaskRowDesktop } from './TaskRows';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskTableBlockProps {
    group?: TaskGroup;
    tasks: Task[];
    orderedTasks: Task[];
    personnel: any[];
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
    onTaskClick: (taskId: string) => void;
    handleEnhanceWithAI: (taskId: string) => void;
    isEnhancing: string | null;
    onUploadFile?: (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => void;
    lastCreatedTaskId: string | null;
    setLastCreatedTaskId: (id: string | null) => void;
}

export const TaskTableBlock = ({
    group,
    tasks,
    orderedTasks,
    personnel,
    onUpdateTask,
    onDeleteTask,
    onTaskClick,
    handleEnhanceWithAI,
    isEnhancing,
    onUploadFile,
    lastCreatedTaskId,
    setLastCreatedTaskId
}: TaskTableBlockProps) => {
    const { updateTaskGroup, deleteTaskGroup, updateDraft, finalizeDraft, drafts } = useTasks();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(group?.name || 'Main Tasks');
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const quickAddInputRef = useRef<HTMLInputElement>(null);

    const handleRename = () => {
        if (group && titleValue.trim() && titleValue !== group.name) {
            updateTaskGroup(group.id, { name: titleValue.trim() });
        }
        setIsEditingTitle(false);
    };

    return (
        <div className="mb-12">
            {/* Table Header */}
            <div className="group/header h-12 flex items-center px-4 gap-4 sticky left-0 z-10 w-full max-w-fit">
                {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                        <input 
                            autoFocus
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            className="bg-background border-b-2 border-primary px-1 text-sm font-black uppercase tracking-widest outline-none"
                        />
                        <button onClick={handleRename} className="text-primary"><Check size={14} /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <h3 
                            className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => group && setIsEditingTitle(true)}
                        >
                            {group?.name || 'Main Tasks'}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground/30 bg-secondary/10 px-2 py-0.5 rounded-full">
                            {tasks.length}
                        </span>
                        
                        {group && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-secondary/20 rounded transition-all">
                                        <MoreHorizontal size={12} className="text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                                        <Edit2 size={12} className="mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteTaskGroup(group.id)} className="text-destructive">
                                        <Trash2 size={12} className="mr-2" /> Delete Bucket
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}
            </div>

            {/* Table Grid */}
            <div className="flex flex-col">
                {/* Column Headers */}
                <div className='sticky top-0 z-20 flex h-10 bg-secondary/20 dark:bg-card border-y border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 select-none'>
                    <div className='sticky left-0 z-30 w-10 shrink-0 border-r border-border/60 bg-secondary/20 dark:bg-card' />
                    <div className='sticky left-10 z-30 w-10 shrink-0 border-r border-border/60 bg-secondary/20 dark:bg-card' />
                    <div className='sticky left-20 z-30 flex-[1.5] min-w-[250px] border-r border-border/60 px-4 flex items-center bg-secondary/20 dark:bg-card'>Task Name</div>
                    <div className='flex-[2] min-w-[400px] border-r border-border/60 px-4 flex items-center'>Description & Brief</div>
                    <div className='w-32 shrink-0 border-r border-border/60 px-4 flex items-center'>Collaborators</div>
                    <div className='w-24 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Points</div>
                    <div className='w-24 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Est. Hrs</div>
                    <div className='w-32 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Timeline</div>
                    <div className='w-32 shrink-0 border-r border-border/60 px-4 flex items-center justify-center'>Priority</div>
                    <div className='w-16 shrink-0 border-r border-border/60 flex items-center justify-center'><MessageSquare size={12} /></div>
                    <div className='w-10 shrink-0' />
                </div>

                {/* Rows */}
                {tasks.map(task => (
                    <TaskRowDesktop 
                        key={`active-${task.id}`} 
                        task={orderedTasks.find(t => t.id === task.id)!}
                        localTask={task}
                        onUpdate={(updates) => onUpdateTask(task.id, updates)}
                        onDelete={onDeleteTask}
                        onTaskClick={onTaskClick}
                        personnel={personnel}
                        handleEnhanceTask={handleEnhanceWithAI}
                        isEnhancing={isEnhancing === task.id}
                        onUploadFile={onUploadFile}
                        autoFocusDescription={lastCreatedTaskId === task.id}
                    />
                ))}

                {/* Drafts for this group */}
                {drafts.filter(d => !d.parentId && (d.type === 'task' || !d.type) && d.groupId === (group?.id || undefined)).map(draft => (
                    <div key={draft.id} className='flex h-12 border-b border-border/60 bg-primary/5 animate-pulse-subtle'>
                        <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-background/50'>
                            <div className="size-5 rounded-full border-2 border-dashed border-primary/20" />
                        </div>
                        <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 bg-background/50' />
                        <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 bg-background/50 flex flex-col justify-center py-1'>
                            <input 
                                autoFocus
                                className='w-full h-full px-4 text-sm font-bold focus:outline-none bg-transparent'
                                value={draft.title}
                                onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        finalizeDraft(draft.id).then((res: any) => {
                                            if (res && typeof res === 'string') setLastCreatedTaskId(res);
                                            else if (res && res.id) setLastCreatedTaskId(res.id);
                                        });
                                    }
                                }}
                                />
                        </div>
                        <div className="flex-1 bg-background/20" />
                    </div>
                ))}

                {/* Quick Add Row */}
                <div className='flex h-12 border-b border-border/60 group/quick'>
                    <div className='sticky left-0 z-10 w-10 shrink-0 border-r border-border/60 flex items-center justify-center bg-background'>
                        <Plus size={16} className='text-muted-foreground/30' />
                    </div>
                    <div className='sticky left-10 z-10 w-10 shrink-0 border-r border-border/60 bg-background' />
                    <div className='sticky left-20 z-10 flex-[1.5] min-w-[250px] border-r border-border/60 bg-background flex flex-col justify-center py-1'>
                        <input 
                            ref={quickAddInputRef} 
                            className='w-full h-full px-4 text-sm font-medium focus:outline-none bg-transparent placeholder:text-muted-foreground/30 placeholder:italic'
                            placeholder='+ Add task'
                            value={newTaskTitle}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.length === 1) {
                                    const draftId = 'draft_' + Date.now();
                                    updateDraft(draftId, { title: val, type: 'task', groupId: group?.id });
                                    setNewTaskTitle('');
                                } else {
                                    setNewTaskTitle(val);
                                }
                            }}
                        />
                        <AnimatePresence>
                            {newTaskTitle.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-primary/40 pointer-events-none"
                                >
                                    Press Enter to add
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className='flex-[2] min-w-[400px] border-r border-border/60' />
                    <div className='w-32 shrink-0 border-r border-border/60' />
                    <div className='w-24 shrink-0 border-r border-border/60' />
                    <div className='w-24 shrink-0 border-r border-border/60' />
                    <div className='w-32 shrink-0 border-r border-border/60' />
                    <div className='w-32 shrink-0 border-r border-border/60' />
                    <div className='w-16 shrink-0 border-r border-border/60' />
                    <div className='w-10 shrink-0' />
                </div>
            </div>
        </div>
    );
};
