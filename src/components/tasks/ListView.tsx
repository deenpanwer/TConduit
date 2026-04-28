'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, MessageSquare, Check, CheckCircle2, 
  Keyboard, HelpCircle, ExternalLink, Command,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Zap, Save, Flag, Trash2, Search
} from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { SyncStatusPulse } from './list-view/ListViewPrimitives';
import { TaskRowDesktop, TaskRowMobile } from './list-view/TaskRows';
import { CompletedTaskTable } from './list-view/CompletedTaskTable';
import { TaskTableBlock } from './list-view/TaskTableBlock';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { triggerBigConfetti } from '@/lib/confetti';

// --- Types & Interfaces ---

export interface ListViewHandle {
  focus: () => void;
}

interface ListViewProps {
  tasks: Task[]; // Array of tasks from the database.
  onTaskClick: (taskId: string) => void; // Function to handle opening the task details drawer.
  personnel: any[]; // Array of personnel/users for assignment.
  onUpdateTask?: (id: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => void;
  onDeleteTask?: (id: string) => void;
  onUploadFile?: (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => void;
}

/**
 * The main component for the List View.
 * It orchestrates the entire grid, including headers, toolbar, and task rows.
 */
const ListViewInner: React.ForwardRefRenderFunction<ListViewHandle, ListViewProps> = (
  { tasks, onTaskClick, personnel, onUpdateTask, onDeleteTask, onUploadFile }, 
  ref
) => {
  const isMobile = useIsMobile();
  const { addTask, deleteTask, isSyncing, hasPending, drafts, updateDraft, finalizeDraft, groups, addTaskGroup } = useTasks();

  // State for task ordering (Drag & Drop)
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);

  useEffect(() => {
      setOrderedTasks(tasks);
  }, [tasks]);

  // State for the "Add new task" input field.
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const desktopAddTaskInputRef = useRef<HTMLInputElement>(null);
  const mobileAddTaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isMobile) {
          mobileAddTaskInputRef.current?.focus();
      } else {
          desktopAddTaskInputRef.current?.focus();
      }
  }, [isMobile]);

  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState<string | null>(null);

  // Focus the scrollable container on mount for keyboard navigation
  const internalRef = useRef<HTMLDivElement>(null);
  
  React.useImperativeHandle(ref, () => ({
    focus: () => {
        internalRef.current?.focus();
    }
  }));

  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => {
        internalRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  useEffect(() => {
    if (lastCreatedTaskId) {
      const timer = setTimeout(() => setLastCreatedTaskId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastCreatedTaskId]);

  useEffect(() => {
    if (isMobile) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      // Allow ESC to pass through even if typing, so we can exit edit mode
      if (isTyping && e.key !== 'Escape') return;

      const container = internalRef.current;
      if (!container) return;

      // Global Keyboard Shortcuts
      switch (e.key.toLowerCase()) {
        case 'n':
            if (!e.metaKey && !e.ctrlKey && !isTyping) {
                e.preventDefault();
                desktopAddTaskInputRef.current?.focus();
            }
            break;
        case 'escape':
            if (target instanceof HTMLElement) {
                target.blur();
                internalRef.current?.focus();
                e.preventDefault();
            }
            break;
      }

      const scrollStep = 100;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const direction = e.key === 'ArrowDown' ? 1 : -1;
          const distance = scrollStep * direction;
          
          // First try to scroll the window
          window.scrollBy({ top: distance, behavior: 'auto' });
          
          // Then try to scroll any overflow parent (like the one in page.tsx)
          const scrollableParent = container.closest('.overflow-y-auto') || container.closest('.overflow-auto');
          if (scrollableParent) {
              scrollableParent.scrollBy({ top: distance, behavior: 'auto' });
          }
          
          // Also try the container itself as fallback
          container.scrollBy({ top: distance, behavior: 'auto' });
          
          e.preventDefault();
      } else if (e.key === 'ArrowRight') {
          container.scrollBy({ left: scrollStep, behavior: 'auto' });
          e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
          container.scrollBy({ left: -scrollStep, behavior: 'auto' });
          e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMobile]);

  const handleEnhanceWithAI = async (taskId: string) => {
      const taskToEnhance = tasks.find(t => t.id === taskId);
      if (!taskToEnhance) return;

      setIsEnhancing(taskId);
      try {
          const response = await fetch('/api/tasks/enhance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  text: taskToEnhance.description || taskToEnhance.title,
                  mode: 'enhance',
                  context: { title: taskToEnhance.title }
              }),
          });

          if (!response.ok) throw new Error('API Error');
          
          const data = await response.json();
          const enhancedSubtasks = (data.subtasks || []).map((s: any) => ({
              ...s,
              id: s.id || Math.random().toString(),
              createdAt: new Date(),
              descriptions: s.description ? [{ id: Math.random().toString(), text: s.description, createdAt: new Date() }] : []
          }));

          onUpdateTask?.(taskId, {
              title: data.title || taskToEnhance.title,
              description: data.description || taskToEnhance.description,
              priority: data.priority || taskToEnhance.priority,
              subtasks: enhancedSubtasks,
              leaderPoints: data.leaderPoints || taskToEnhance.leaderPoints,
              deadlineHours: data.deadlineHours || taskToEnhance.deadlineHours
          });
          toast.success('Task enhanced with AI');

      } catch (error) {
          console.error('AI Enhance error:', error);
          toast.error('Failed to enhance task');
      } finally {
          setIsEnhancing(null);
      }
  };

  const activeTasks = useMemo(() => tasks.filter(t => !t.flagged), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.flagged), [tasks]);

  if (isMobile) {
      return (
          <div className='flex flex-col h-full bg-background'>
              <div className="h-14 px-6 flex items-center justify-between border-b border-border/40 shrink-0">
                  <div className='flex flex-col'>
                    <h2 className='text-[10px] font-black uppercase tracking-widest text-primary/80'>Tasks Mobile</h2>
                    <p className='text-[8px] font-bold text-muted-foreground uppercase'>{tasks.length} Items</p>
                  </div>
                  <SyncStatusPulse isSyncing={isSyncing} hasPending={hasPending} />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <Reorder.Group axis="y" values={orderedTasks} onReorder={setOrderedTasks} className="space-y-3">
                      {activeTasks.map(task => (
                          <TaskRowMobile 
                              key={`mobile-active-${task.id}`} 
                              task={orderedTasks.find(t => t.id === task.id)!}
                              localTask={task}
                              onUpdate={(updates) => onUpdateTask?.(task.id, updates)}
                              onDelete={onDeleteTask || deleteTask}
                              onTaskClick={onTaskClick}
                              handleEnhanceTask={handleEnhanceWithAI}
                              isEnhancing={isEnhancing === task.id}
                              personnel={personnel}
                          />
                      ))}
                      
                      {drafts.filter(d => !d.parentId && (d.type === 'task' || !d.type)).map(draft => (
                          <motion.div 
                              key={`draft-${draft.id}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 p-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl"
                          >
                               <div className="size-5 rounded-full border-2 border-dashed border-primary/30" />
                               <input 
                                    autoFocus
                                    className='flex-1 bg-transparent border-none p-0 text-sm font-bold focus:outline-none'
                                    value={draft.title}
                                    onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') finalizeDraft(draft.id);
                                    }}
                               />
                          </motion.div>
                      ))}
                  </Reorder.Group>

                  <div className="flex flex-col gap-2 p-4 bg-secondary/10 border-2 border-dashed border-border/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Plus size={20} className="text-muted-foreground/40" />
                        <input 
                            ref={mobileAddTaskInputRef} 
                            className='flex-1 bg-transparent border-none p-0 text-sm font-bold focus:outline-none placeholder:text-muted-foreground/30'
                            placeholder='Quick add task...'
                            value={newTaskTitle}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.length === 1) {
                                    const draftId = 'draft_' + Date.now();
                                    updateDraft(draftId, { title: val, type: 'task' });
                                    setNewTaskTitle('');
                                } else {
                                    setNewTaskTitle(val);
                                }
                            }}
                        />
                      </div>
                      <AnimatePresence>
                          {newTaskTitle.length > 0 && (
                              <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-[9px] text-primary/60 font-black uppercase tracking-widest pl-8"
                              >
                                  Press Enter to add
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>

                  {completedTasks.length > 0 && (
                      <div className="mt-8 space-y-3">
                          <div className="flex items-center gap-2 px-1">
                              <CheckCircle2 size={14} className="text-green-500" />
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-green-700">Completed</h3>
                              <span className="text-[10px] font-bold text-green-600/50 ml-auto">{completedTasks.length} Items</span>
                          </div>
                          <div className="opacity-60 grayscale-[0.5] space-y-3">
                              {completedTasks.map(task => (
                                  <TaskRowMobile 
                                      key={`mobile-completed-${task.id}`} 
                                      task={orderedTasks.find(t => t.id === task.id)!}
                                      localTask={task}
                                      onUpdate={(updates) => onUpdateTask?.(task.id, updates)}
                                      onDelete={onDeleteTask || deleteTask}
                                      onTaskClick={onTaskClick}
                                      handleEnhanceTask={handleEnhanceWithAI}
                                      isEnhancing={isEnhancing === task.id}
                                      personnel={personnel}
                                  />
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className='flex flex-col min-h-full bg-background border border-border/60 overflow-hidden shadow-xl'>
      <div className='h-14 px-6 flex items-center justify-between bg-secondary/[0.03] border-b border-border/60 shrink-0'>
          <div className='flex items-center gap-4'>
              <div>
                <h2 className='text-[11px] font-black uppercase tracking-[0.2em] text-primary/80'>Tasks Table</h2>
                <p className='text-[10px] font-bold text-muted-foreground uppercase'>{tasks.length} Active Items</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <SyncStatusPulse isSyncing={isSyncing} hasPending={hasPending} />
              
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary/20">
                          <HelpCircle size={16} className="text-muted-foreground" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-4">
                      <DropdownMenuLabel className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-0 mb-4 opacity-70">
                          <Keyboard size={14} /> Shortcuts
                      </DropdownMenuLabel>
                      
                      <div className="space-y-4">
                          <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase text-muted-foreground">New Task</span>
                              <Badge variant="secondary" className="font-mono text-[10px] min-w-8 flex justify-center">N</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase text-muted-foreground">Edit Cell</span>
                              <Badge variant="secondary" className="font-mono text-[10px] min-w-8 flex justify-center">Enter</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase text-muted-foreground">Exit / Blur</span>
                              <Badge variant="secondary" className="font-mono text-[10px] min-w-8 flex justify-center">Esc</Badge>
                          </div>
                      </div>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
      </div>

      <div 
        ref={internalRef}
        className="flex-1 overflow-auto custom-scrollbar-thick outline-none focus:ring-0"
        tabIndex={0}
      >
          <div style={{ minWidth: 1400 }} className="pb-10">
              {/* Main Tasks (No Group) */}
              <TaskTableBlock 
                  tasks={activeTasks.filter(t => !t.groupId)}
                  orderedTasks={orderedTasks}
                  personnel={personnel}
                  onUpdateTask={onUpdateTask!}
                  onDeleteTask={onDeleteTask || deleteTask}
                  onTaskClick={onTaskClick}
                  handleEnhanceWithAI={handleEnhanceWithAI}
                  isEnhancing={isEnhancing}
                  onUploadFile={onUploadFile}
                  lastCreatedTaskId={lastCreatedTaskId}
                  setLastCreatedTaskId={setLastCreatedTaskId}
              />

              {/* Dynamic Buckets */}
              {groups.map(group => (
                  <TaskTableBlock 
                      key={group.id}
                      group={group}
                      tasks={activeTasks.filter(t => t.groupId === group.id)}
                      orderedTasks={orderedTasks}
                      personnel={personnel}
                      onUpdateTask={onUpdateTask!}
                      onDeleteTask={onDeleteTask || deleteTask}
                      onTaskClick={onTaskClick}
                      handleEnhanceWithAI={handleEnhanceWithAI}
                      isEnhancing={isEnhancing}
                      onUploadFile={onUploadFile}
                      lastCreatedTaskId={lastCreatedTaskId}
                      setLastCreatedTaskId={setLastCreatedTaskId}
                  />
              ))}

              {/* Add New Table Button
              <div className="px-4 py-8">
                  <Button 
                      variant="ghost" 
                      className="group/btn h-12 gap-3 px-6 rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={() => addTaskGroup('New Bucket')}
                  >
                      <div className="size-6 rounded-lg bg-secondary/50 flex items-center justify-center group-hover/btn:bg-primary/20 transition-colors">
                        <Plus size={16} className="text-muted-foreground group-hover/btn:text-primary" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover/btn:text-primary">Add New Table Bucket</span>
                  </Button>
              </div>
              */}
          </div>
      </div>

      <div className="px-6 pb-20">
          <CompletedTaskTable 
              tasks={completedTasks}
              orderedTasks={orderedTasks}
              personnel={personnel}
              onUpdateTask={onUpdateTask!}
              onDeleteTask={onDeleteTask || deleteTask}
              onTaskClick={onTaskClick}
              isEnhancing={isEnhancing}
              handleEnhanceWithAI={handleEnhanceWithAI}
          />
      </div>
    </div>
  );
};

export const ListView = React.forwardRef(ListViewInner);
