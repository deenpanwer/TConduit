"use client";

import 'regenerator-runtime/runtime';
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { 
  motion, AnimatePresence, LayoutGroup 
} from "framer-motion";
import { 
  Plus, Calendar, Flag, X, Check, Search, 
  Trash2, CheckSquare, Clock, ArrowUpRight, 
  Sun, Moon, MoreHorizontal, LayoutGrid, List as ListIcon, 
  ChevronRight, GripVertical, Image as ImageIcon,
  User as UserIcon, AtSign, Undo2, Link as LinkIcon, Bold, Italic, Keyboard,
  Menu, History, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, getUserAvatar } from "@/lib/utils";
import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { TasksProvider, useTasks, Task, Status, Priority } from "@/hooks/useTasks";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { BoardView, AutoResizingTextarea, PRIORITIES } from "@/components/dashboard/tasks/BoardView";
import { TimelineView } from "@/components/dashboard/tasks/TimelineView";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";
import { SubscriptionBadge } from "@/components/dashboard/SubscriptionBadge";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { VoiceTaskCreator } from "@/components/dashboard/tasks/VoiceTaskCreator";
import { InlineAudioPlayer } from "@/components/dashboard/tasks/InlineAudioPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Wand2, Layers, FileText, Eraser } from "lucide-react";

const MAX_TEXTAREA_HEIGHT_TITLE = 150;
const MAX_TEXTAREA_HEIGHT_DESCRIPTION = 300;
const MAX_TEXTAREA_HEIGHT_SUBTASK = 80;

import { useSidebar } from "@/hooks/use-sidebar";

import { useIsMobile } from "@/hooks/use-mobile";

function TasksPageContent() {
  const { tasks, loading, addTask, updateTask, deleteTask, addComment, canManageTasks } = useTasks();
  const { employees, owner } = useTeam();
  const { user, userData } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const { setIsMobileOpen } = useSidebar();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [activeView, setActiveView] = useState<"board" | "timeline">("board");
  
  useEffect(() => {
    if (userData) {
      fetchOrgDetails();
    }
  }, [userData]);

  const fetchOrgDetails = async () => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (targetOrgId) {
      const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
      if (orgDoc.exists()) setOrgData(orgDoc.data());
    }
  };

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
  const [editingNewTask, setEditingNewTask] = useState<Partial<Task> | null>(null);
  const [pendingVoiceTaskData, setPendingVoiceTaskData] = useState<Partial<Task> | null>(null);
  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false); // New state for selection modal
  const [createTaskMode, setCreateTaskMode] = useState<"type" | "voice" | null>(null); // New state for mode
  const [initialMetadata, setInitialMetadata] = useState<{status?: Status, date?: Date}>({});
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  const [showTopFadeTitle, setShowTopFadeTitle] = useState(false);
  const [showBottomFadeTitle, setShowBottomFadeTitle] = useState(false);
  const [showTopFadeDescription, setShowTopFadeDescription] = useState(false);
  const [showBottomFadeDescription, setShowBottomFadeDescription] = useState(false);

  // AI Enhancement for Manual Task
  const handleEnhanceTask = async () => {
    if (!editingNewTask?.title && !editingNewTask?.description) {
      toast.error("Please enter a title or description first.");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/tasks/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editingNewTask.description || editingNewTask.title,
          mode: 'enhance',
          context: editingNewTask
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEditingNewTask(prev => ({
          ...prev,
          title: data.title || prev?.title,
          description: data.description || prev?.description,
          priority: data.priority || prev?.priority,
          subtasks: data.subtasks || prev?.subtasks,
        }));
        toast.success("Task enhanced by AI.");
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
      toast.error("AI enhancement failed.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleBulkParse = async () => {
    if (!bulkInput.trim()) {
      toast.error("Please enter some text to parse.");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/tasks/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: bulkInput,
          mode: 'bulk'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEditingNewTask({
          ...editingNewTask,
          title: data.title,
          description: data.description,
          priority: data.priority,
          subtasks: data.subtasks,
        });
        setIsBulkMode(false);
        toast.success("AI parsed your bulk input.");
      }
    } catch (error) {
      console.error("Bulk parse failed:", error);
      toast.error("Failed to parse bulk input.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Sync localTask when selectedTaskId changes
  useEffect(() => {
    if (selectedTaskId && selectedTaskId !== "new") {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        setLocalTask(task);
        setOriginalTask(task);
      }
    } else {
      setLocalTask(null);
      setOriginalTask(null);
    }
  }, [selectedTaskId, tasks]);

  // Ensure current user is always in personnel for history lookup
  const personnel = useMemo(() => {
    const list = [...employees];
    if (owner && !list.find(p => p.id === owner.id)) {
      list.push(owner);
    }
    // Also check the current logged in user from auth
    if (userData && !list.find(p => p.id === user?.uid)) {
      list.push({ id: user?.uid, ...userData });
    }
    
    // Strict deduplication by ID and filtering out nulls/undefineds
    const seen = new Set();
    return list.filter(p => {
        if (!p || !p.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });
  }, [owner, employees, userData, user]);

  // Helper to format history actions
  const formatAction = (entry: any) => {
    if (entry.action === 'created') return 'created the task';
    if (entry.action === 'comment_added') return 'added a comment';
    if (entry.action === 'manual_save') return 'saved task updates';
    if (entry.action === 'deleted') return 'deleted this task';
    if (entry.action === 'task_completed') return 'marked as complete';
    if (entry.action === 'subtask_toggled') return 'toggled a subtask';
    if (entry.action === 'subtask_deleted') return 'deleted a subtask';
    if (entry.action === 'subtask_added') return 'added a subtask';
    if (entry.action === 'assignees_updated') return 'updated assignees';
    if (entry.action === 'due_date_updated') return 'updated due date';
    if (entry.action === 'cover_image_updated') return 'updated cover image';
    
    if (entry.action === 'updated' && entry.details?.status === 'done') {
      return 'moved to Done';
    }
    
    return entry.action;
  };

  // Aggregated Global History
  const globalHistory = useMemo(() => {
    const allHistory = tasks.flatMap(task => 
      (task.history || []).map(entry => ({ ...entry, taskTitle: task.title, taskId: task.id }))
    );
    return allHistory.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt instanceof Date ? a.createdAt : new Date(0));
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt instanceof Date ? b.createdAt : new Date(0));
        return dateB.getTime() - dateA.getTime();
    });
  }, [tasks]);

  // Reset showHistory when task selection changes
  useEffect(() => {
    setShowHistory(false);
  }, [selectedTaskId]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const lowerQuery = searchQuery.toLowerCase();
    
    if (lowerQuery.includes("high") || lowerQuery.includes("critical")) {
       return tasks.filter(t => t.priority === "high" || t.priority === "critical");
    }
    
    return tasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      (t.description || "").toLowerCase().includes(lowerQuery) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [tasks, searchQuery]);

  const selectedTask = useMemo(() => {
    if (selectedTaskId === "new") {
      return editingNewTask as Task;
    }
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId, editingNewTask]);

  const handleAddNewTaskClick = useCallback((initialStatus?: Status, initialDate?: Date) => {
    setInitialMetadata({ status: initialStatus, date: initialDate });
    setShowCreateTaskModal(true);
  }, []);

  const handleAddNewTaskTypeClick = useCallback((initialStatus?: Status, initialDate?: Date) => {
    if (!editingNewTask) {
        const newTask: Partial<Task> = {
            title: "",
            description: "",
            status: initialStatus || "todo",
            priority: "medium",
            assignees: [],
            subtasks: [],
            comments: [],
            tags: [],
            dueDate: initialDate ? initialDate.toISOString() : new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setEditingNewTask(newTask);
    } else if (initialStatus || initialDate) {
        // Only update if specific metadata was passed (e.g. from board column/timeline day)
        setEditingNewTask(prev => ({
            ...prev,
            status: initialStatus || prev?.status || "todo",
            dueDate: initialDate ? initialDate.toISOString() : (prev?.dueDate || new Date().toISOString())
        }));
    }
    
    setSelectedTaskId("new");
    setShowCreateTaskModal(false); // Close selection modal
    setCreateTaskMode("type"); // Ensure it's set for type mode
  }, [editingNewTask]);

  const handleUpdateTaskLocal = useCallback((id: string, updates: Partial<Task>, action?: string, skipHistory?: boolean) => {
    if (id === "new") {
      setEditingNewTask(prev => prev ? { ...prev, ...updates } : null);
    } else {
      updateTask(id, updates, action, skipHistory);
    }
  }, [updateTask]);

  const handleSaveNewTask = useCallback(async () => {
    if (editingNewTask && selectedTaskId === "new") {
      const title = editingNewTask.title || "New Task";
      const status = editingNewTask.status || "todo";
      const newId = await addTask(
        title, 
        status, 
        editingNewTask.description, 
        editingNewTask.priority, 
        editingNewTask.assignees, 
        undefined,
        editingNewTask.leaderPoints || 20,
        editingNewTask.deadlineHours || 4
      );
      if (newId) {
        // Update the rest of the fields (tags, coverImage, etc.)
        const { title: t, status: s, description: d, priority: p, assignees: a, leaderPoints: lp, deadlineHours: dh, ...rest } = editingNewTask;
        if (Object.keys(rest).length > 0) {
            await updateTask(newId, rest);
        }
        toast.success("Task created!");
      }
      setEditingNewTask(null);
      setSelectedTaskId(null);
      setLocalTask(null);
      setCreateTaskMode(null); // Reset mode
    }
  }, [editingNewTask, selectedTaskId, addTask, updateTask]);

  const handleSaveVoiceTask = useCallback(async (audioData: { base64: string; mimeType: string; duration: number }, metadata: Partial<Task>) => {
    // metadata already contains title, priority, assignees, dueDate, status
    const newId = await addTask(
      metadata.title || "Voice Task",
      metadata.status || "todo",
      metadata.description,
      metadata.priority,
      metadata.assignees,
      audioData,
      metadata.leaderPoints,
      metadata.deadlineHours
    );
    if (newId) {
      toast.success("Voice task created!");
      setPendingVoiceTaskData(null); // Clear draft
    } else {
      toast.error("Failed to create voice task.");
    }
    setSelectedTaskId(null);
    setCreateTaskMode(null); // Reset mode
    setShowCreateTaskModal(false); // Close selection modal
  }, [addTask]);

  const handleDeleteTaskLocal = useCallback((id: string) => {
    deleteTask(id);
    if (selectedTaskId === id) setSelectedTaskId(null);
  }, [deleteTask, selectedTaskId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Syncing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InviteModal 
          isOpen={showInviteModal}
          onOpenChange={setShowInviteModal}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 px-6 flex items-center justify-between shrink-0 bg-background/60 backdrop-blur-xl z-10 border-b border-border/40">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
                    <Menu size={20} />
                </Button>
                <div className="flex items-center">
                    <span className="font-bold text-sm tracking-tight uppercase tracking-widest">Tasks</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative group hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={14} />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter tasks..."
                        className="h-9 w-48 bg-secondary/30 border-transparent focus:bg-secondary/50 focus:w-64 focus:border-transparent focus:ring-0 transition-all rounded-lg pl-9 text-xs"
                    />
                </div>

                <div className="flex items-center gap-1 border-l border-border/40 pl-3">
                    <Button 
                        variant={activeView === "board" ? "secondary" : "ghost"} 
                        size="sm" 
                        className={cn("h-8 text-xs", isMobile ? "px-2" : "px-3")}
                        onClick={() => setActiveView("board")}
                    >
                        <LayoutGrid size={14} className={cn(!isMobile && "mr-2")} /> {!isMobile && "Board"}
                    </Button>
                    <Button 
                        variant={activeView === "timeline" ? "secondary" : "ghost"} 
                        size="sm" 
                        className={cn("h-8 text-xs", isMobile ? "px-2" : "px-3")}
                        onClick={() => setActiveView("timeline")}
                    >
                        <ListIcon size={14} className={cn(!isMobile && "mr-2")} /> {!isMobile && "Timeline"}
                    </Button>
                </div>

                <div className="flex items-center gap-3 border-l border-border/40 pl-3">
                    {!isMobile && <SubscriptionBadge orgData={orgData} userData={userData} />}
                    <Button
                        className={cn("font-semibold text-xs h-8 rounded-md", isMobile ? "px-2" : "px-3")}
                        onClick={() => {
                          setInitialMetadata({});
                          setShowCreateTaskModal(true);
                        }}
                    >
                        <Plus size={14} className={cn(!isMobile && "mr-2")} /> {!isMobile && "Add Task"}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 rounded-full hover:bg-secondary", isGlobalHistoryOpen && "text-primary bg-secondary")}
                            onClick={() => setIsGlobalHistoryOpen(!isGlobalHistoryOpen)}
                        >
                            <History size={14} />
                        </Button>
                        <Avatar className="h-8 w-8 border border-border/50">
                            <AvatarImage src={getUserAvatar(userData)} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background">
            {!isSubscriptionActive ? (
                <PaywallScreen 
                    orgData={orgData}
                    userData={userData}
                />
            ) : activeView === "board" ? (
                <BoardView 
                    tasks={filteredTasks}
                    onTaskClick={setSelectedTaskId}
                    onDeleteTask={handleDeleteTaskLocal}
                    onDropTask={(taskId, status) => updateTask(taskId, { status })}
                    onQuickAdd={(status, title) => addTask(title, status)}
                    onAddClick={handleAddNewTaskClick}
                    onQuickEdit={(id, title) => updateTask(id, { title })}
                    canManage={canManageTasks}
                    personnel={personnel}
                />
            ) : (
                <TimelineView 
                    tasks={filteredTasks}
                    onTaskClick={setSelectedTaskId}
                    onUpdateTask={handleUpdateTaskLocal}
                    onDeleteTask={handleDeleteTaskLocal}
                    onQuickEdit={(id, title) => updateTask(id, { title })}
                    onAddClick={handleAddNewTaskClick}
                    canManage={canManageTasks}
                    personnel={personnel}
                />
            )}
        </div>
      </main>

      <AnimatePresence>
        {isGlobalHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGlobalHistoryOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                "fixed inset-y-0 right-0 z-50 bg-card border-l border-border/50 shadow-2xl flex flex-col",
                isMobile ? "w-full" : "w-full max-w-sm"
              )}
            >
                <div className="h-14 px-6 border-b border-border/40 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-sm tracking-tight">Organization Activity</h3>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsGlobalHistoryOpen(false)}>
                        <X size={16} />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {globalHistory.map((entry: any) => {
                            const entryUser = personnel.find(p => p.id === entry.userId);
                            const uniqueKey = `${entry.taskId}-${entry.createdAt?.seconds || Math.random()}`;
                            return (
                                <div key={uniqueKey} className="flex gap-3 items-start group">
                                    <Avatar className="h-8 w-8 shrink-0 border border-border/50 mt-0.5">
                                        <AvatarImage src={getUserAvatar(entryUser)} />
                                        <AvatarFallback>{entryUser?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs leading-relaxed">
                                            <span className="font-bold text-foreground">{entryUser?.name || 'User'}</span>
                                            <span className="text-muted-foreground mx-1.5">{formatAction(entry)}</span>
                                            <span className="font-medium text-primary hover:underline cursor-pointer block mt-0.5" onClick={() => {
                                                setSelectedTaskId(entry.taskId);
                                                setIsGlobalHistoryOpen(false);
                                            }}>
                                                {entry.taskTitle}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                                            {entry.createdAt?.toDate ? formatDistanceToNow(entry.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {globalHistory.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/30">
                                <History size={32} className="mb-2 opacity-20" />
                                <p className="text-xs font-medium uppercase tracking-widest">No activity yet</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Existing Task Detail / Edit Modal */}
        {(selectedTask && selectedTaskId !== "new") && ( 
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                  setSelectedTaskId(null);
              }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={isMobile ? { x: "100%" } : { opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={isMobile ? { x: "100%" } : { opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "fixed z-50 bg-card border border-border/50 shadow-2xl overflow-hidden flex flex-col outline-none",
                isMobile ? "inset-0 rounded-none" : "inset-y-4 right-4 w-full max-w-lg rounded-2xl"
              )}
            >
              <div className="h-40 shrink-0 relative bg-secondary/30 group">
                {selectedTask.coverImage ? (
                  <img src={selectedTask.coverImage} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-muted-foreground/10 bg-gradient-to-br from-secondary/50 to-background">
                      <ImageIcon size={48} />
                   </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="secondary" size="sm" className="h-8 px-3 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-tight">Add Image</span>
                            <ImageIcon size={14} />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3">
                         <div className="space-y-2">
                            <h4 className="font-medium leading-none text-xs">Set Cover Image</h4>
                            <Input 
                               placeholder="Image URL..." 
                               className="h-8 text-xs"
                               onKeyDown={(e) => {
                                  if(e.key === 'Enter') {
                                     handleUpdateTaskLocal(selectedTaskId!, { coverImage: e.currentTarget.value }, 'cover_image_updated');
                                  }
                               }}
                            />
                         </div>
                      </PopoverContent>
                   </Popover>

                   <Button 
                      size="icon" variant="secondary" 
                      className={cn("h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm", showHistory && "text-primary")}
                      onClick={() => setShowHistory(!showHistory)}
                   >
                      <History size={14} />
                   </Button>

                   <Button 
                      size="icon" variant="secondary" 
                      className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm"
                      onClick={() => {
                        setSelectedTaskId(null);
                      }}
                   >
                      <X size={14} />
                   </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 -mt-6 relative bg-card rounded-t-3xl border-t border-border/50 custom-scrollbar">
                 {showHistory ? (
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-bold tracking-tight">Activity History</h3>
                         <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowHistory(false)}>Back to Details</Button>
                      </div>
                      <div className="space-y-4">
                         {(selectedTask.history || []).slice().reverse().map((entry: any) => {
                            const entryUser = personnel.find(p => p.id === entry.userId);
                            return (
                               <div key={entry.id} className="flex gap-3 items-start group/hist">
                                  <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                                     <AvatarImage src={getUserAvatar(entryUser)} />
                                     <AvatarFallback>{entryUser?.name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-sm leading-snug">
                                        <span className="font-bold text-foreground">{entryUser?.name || 'User'}</span>
                                        <span className="text-muted-foreground ml-1.5">{formatAction(entry)}</span>
                                     </p>
                                     <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                        {entry.createdAt?.toDate ? formatDistanceToNow(entry.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                     </p>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                 ) : (
                   <>
                 <div className="flex items-center gap-3 mb-6">
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild disabled={!canManageTasks}>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider gap-2 border-border/50" disabled={!canManageTasks}>
                             <div className={cn("w-2 h-2 rounded-full", PRIORITIES[selectedTask.priority || 'medium'].color)} />
                             {selectedTask.priority || 'Medium'} Priority
                          </Button>
                       </DropdownMenuTrigger>
                       { canManageTasks && (
                          <DropdownMenuContent align="start">
                             {Object.entries(PRIORITIES).map(([key, val]) => (
                                <DropdownMenuItem key={key} onClick={() => handleUpdateTaskLocal(selectedTaskId!, { priority: key as Priority })}>
                                   <div className={cn("w-2 h-2 rounded-full mr-2", val.color)} />
                                   {val.label}
                                </DropdownMenuItem>
                             ))}
                          </DropdownMenuContent>
                       )}
                    </DropdownMenu>

                    <Popover>
                      <PopoverTrigger asChild disabled={!canManageTasks}>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" disabled={!canManageTasks}>
                            <Calendar size={12} className="mr-2" />
                            {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), "MMM d") : "Set Date"}
                        </Button>
                      </PopoverTrigger>
                      { canManageTasks && (
                         <PopoverContent className="w-auto p-0" align="start">
                           <CalendarComponent
                             mode="single"
                             selected={selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined}
                             onSelect={(date) => handleUpdateTaskLocal(selectedTaskId!, { dueDate: date ? date.toISOString() : undefined })}
                             initialFocus
                           />
                         </PopoverContent>
                      )}
                    </Popover>

                    <Button 
                        variant="ghost" size="sm" 
                        className={cn("h-7 text-[10px] font-bold uppercase tracking-wider gap-2 ml-auto transition-all duration-300", 
                           selectedTask.flagged 
                           ? "text-[#1DB954] hover:text-[#1ed760] bg-[#1DB954]/10 border border-[#1DB954]/20" 
                           : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => handleUpdateTaskLocal(selectedTaskId!, { flagged: !selectedTask.flagged }, 'task_completed')}
                    >
                        {selectedTask.flagged ? <Check size={12} strokeWidth={3} className="animate-in zoom-in" /> : <Flag size={12} fill="none" />}
                        {selectedTask.flagged ? 'Complete' : 'Mark as Complete'}
                    </Button>
                 </div>

                 <div className={cn("relative w-full",
                    {"fade-top": showTopFadeTitle, "fade-bottom": showBottomFadeTitle}
                 )}>
                    <AutoResizingTextarea
                       value={selectedTask.title || ""}
                       onChange={(e) => handleUpdateTaskLocal(selectedTaskId!, { title: e.target.value }, 'updated', true)}
                       onBlur={() => handleUpdateTaskLocal(selectedTaskId!, {}, 'content_updated')}
                       className="text-3xl font-bold bg-transparent border-none p-0 shadow-none focus-visible:ring-0 leading-tight mb-6 placeholder:text-muted-foreground/30 min-h-[48px] scrollbar-hide focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-xl"
                       placeholder="Task Title"
                       setShowTopFade={setShowTopFadeTitle}
                       setShowBottomFade={setShowBottomFadeTitle}
                       maxHeight={MAX_TEXTAREA_HEIGHT_TITLE}
                       readOnly={!canManageTasks}
                    />
                 </div>

                 <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Assigned To</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {(selectedTask.assignees || []).length > 0 ? (
                          selectedTask.assignees.map(uid => {
                             const u = personnel.find(p => p.id === uid);
                             if (!u) return null;
                             return (
                                <Badge key={`assignee-${uid}`} variant="secondary" className="pl-1 pr-2 py-1 gap-2 hover:bg-secondary/80">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={getUserAvatar(u)} />
                                        <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{u.name}</span>
                                    { canManageTasks && (
                                       <X 
                                          size={12} 
                                          className="cursor-pointer text-muted-foreground hover:text-destructive"
                                          onClick={() => {
                                                const newAssignees = selectedTask.assignees.filter(a => a !== uid);
                                                handleUpdateTaskLocal(selectedTaskId!, { assignees: newAssignees }, 'assignees_updated');
                                          }}
                                       />
                                    )}
                                </Badge>
                             )
                          })
                       ) : (
                          <div className="text-xs text-muted-foreground flex items-center gap-2 px-2 py-1 bg-secondary/30 rounded-md border border-dashed border-border">
                             <AtSign size={12} /> Everyone
                          </div>
                       )}
                       
                        { canManageTasks && (
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 border border-dashed border-border hover:border-primary">
                                       <Plus size={14} />
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent>
                                   <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   {personnel.map(user => {
                                       const isAssigned = (selectedTask.assignees || []).some(uid => uid === user.id);
                                       return (
                                           <DropdownMenuItem 
                                               key={`assign-user-${user.id}`}
                                               onClick={() => {
                                                   if (isAssigned) return;
                                                   handleUpdateTaskLocal(selectedTaskId!, { assignees: [...(selectedTask.assignees || []), user.id] }, 'assignees_updated');
                                               }}
                                               disabled={isAssigned}
                                           >
                                               <Avatar className="h-5 w-5 mr-2">
                                                   <AvatarImage src={getUserAvatar(user)} />
                                                   <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                               </Avatar>
                                               {user.name}
                                           </DropdownMenuItem>
                                       )
                                   })}
                               </DropdownMenuContent>
                           </DropdownMenu>
                        )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                          <Sparkles size={10} className="text-primary" /> Leader Points
                       </label>
                       <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                          <Input 
                             type="number"
                             min="0"
                             className="h-8 bg-transparent border-none focus-visible:ring-0 font-bold text-sm"
                             defaultValue={selectedTask.leaderPoints || 20}
                             onBlur={(e) => handleUpdateTaskLocal(selectedTaskId!, { leaderPoints: Math.max(0, Number(e.target.value)) })}
                             disabled={!canManageTasks}
                          />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase pr-2">Points</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                          <Clock size={10} className="text-orange-500" /> Effort / Deadline
                       </label>
                       <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                          <Input 
                             type="number"
                             min="0"
                             className="h-8 bg-transparent border-none focus-visible:ring-0 font-bold text-sm"
                             defaultValue={selectedTask.deadlineHours || 4}
                             onBlur={(e) => handleUpdateTaskLocal(selectedTaskId!, { deadlineHours: Math.max(0, Number(e.target.value)) })}
                             disabled={!canManageTasks}
                          />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase pr-2">Hours</span>
                       </div>
                    </div>
                 </div>

                 <div className="mb-8 group">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest mb-2 group-focus-within:text-primary transition-colors">
                       Description
                    </label>
                    <div className={cn("relative w-full rounded-xl",
                        {"fade-top": showTopFadeDescription, "fade-bottom": showBottomFadeDescription}
                    )}>
                       <AutoResizingTextarea
                          value={selectedTask.description || ""}
                          onChange={(e) => handleUpdateTaskLocal(selectedTaskId!, { description: e.target.value }, 'updated', true)}
                          onBlur={() => handleUpdateTaskLocal(selectedTaskId!, {}, 'content_updated')}
                          className="min-h-[120px] text-sm bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none rounded-xl leading-relaxed scrollbar-hide p-2"
                          placeholder="Add details about this task..."
                          setShowTopFade={setShowTopFadeDescription}
                          setShowBottomFade={setShowBottomFadeDescription}
                          maxHeight={MAX_TEXTAREA_HEIGHT_DESCRIPTION}
                          readOnly={!canManageTasks}
                       />
                    </div>
                 </div>

                 {selectedTask.audioBase64 && selectedTask.audioMimeType && selectedTask.audioDuration !== undefined && (
                    <div className="mb-8">
                       <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest mb-2">
                          Voice Brief
                       </label>
                       <InlineAudioPlayer 
                         audioBase64={selectedTask.audioBase64}
                         audioMimeType={selectedTask.audioMimeType}
                         audioDuration={selectedTask.audioDuration}
                       />
                    </div>
                 )}

                 <div>
                    <div className="flex items-center justify-between mb-3">
                       <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest">
                          Subtasks
                       </label>
                       <span className="text-[10px] font-mono text-muted-foreground/50">
                          {Math.round(((selectedTask.subtasks || []).filter(s => s.completed).length / (selectedTask.subtasks || []).length || 0) * 100)}% Complete
                       </span>
                    </div>

                    <div className="w-full h-1.5 bg-secondary/30 rounded-full mb-4 overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((selectedTask.subtasks || []).filter(s => s.completed).length / (selectedTask.subtasks || []).length || 0) * 100}%` }}
                          className="h-full bg-primary rounded-full"
                       />
                    </div>

                    <div className="space-y-1">
                       {(selectedTask.subtasks || []).map((sub, idx) => (
                          <div key={sub.id} className="flex items-center gap-2 group/sub">
                             <button 
                                onClick={() => {
                                   const newSub = [...(selectedTask.subtasks || [])];
                                   newSub[idx].completed = !newSub[idx].completed;
                                   newSub[idx].completedBy = newSub[idx].completed ? user?.uid : undefined;
                                   handleUpdateTaskLocal(selectedTaskId!, { subtasks: newSub });
                                }}
                                className={cn(
                                   "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                   sub.completed ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"
                                )}
                             >
                                {sub.completed && <Check size={12} />}
                             </button>
                             <AutoResizingTextarea
                                   value={sub.title}
                                   onChange={(e) => {
                                      const newSub = [...(selectedTask.subtasks || [])];
                                      newSub[idx].title = e.target.value;
                                      handleUpdateTaskLocal(selectedTaskId!, { subtasks: newSub }, 'updated', true);
                                   }}
                                   onBlur={() => handleUpdateTaskLocal(selectedTaskId!, {}, 'content_updated')}
                                   className={cn(
                                      "relative w-full flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-md scrollbar-hide",
                                      sub.completed && "text-muted-foreground line-through decoration-border"
                                   )}
                                   maxHeight={MAX_TEXTAREA_HEIGHT_SUBTASK}
                                   readOnly={!canManageTasks}
                                />
                             
                             {sub.completed && sub.completedBy && (
                                <div className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground whitespace-nowrap">
                                   <Check size={8} /> {personnel.find(p => p.id === sub.completedBy)?.name?.split(' ')[0] || 'User'}
                                </div>
                             )}

                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                    const newSub = selectedTask.subtasks.filter(s => s.id !== sub.id);
                                    handleUpdateTaskLocal(selectedTaskId!, { subtasks: newSub });
                                    }}
                                >
                                    <X size={12} />
                                </Button>
                          </div>
                       ))}
                        <Button 
                            variant="ghost" size="sm" 
                            className="h-8 text-xs text-muted-foreground hover:text-primary justify-start pl-1 mt-2"
                            onClick={() => handleUpdateTaskLocal(selectedTaskId!, { subtasks: [...(selectedTask.subtasks || []), { id: Math.random().toString(), title: "", completed: false }] })}
                            disabled={!canManageTasks}
                        >
                            <Plus size={14} className="mr-2" /> Add Item
                        </Button>
                    </div>
                 </div>

                 <div className="mt-12 pt-8 border-t border-border/30">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest mb-4">
                       Collaboration
                    </label>
                    
                    <div className="space-y-6 mb-8">
                       {(selectedTask.comments || []).map((comment) => {
                          const commenter = personnel.find(p => p.id === comment.userId);
                          return (
                             <div key={comment.id} className="flex gap-3 group/comment">
                                <Avatar className="h-7 w-7 border border-border/50 shrink-0 mt-0.5 shadow-sm">
                                   <AvatarImage src={getUserAvatar(commenter)} />
                                   <AvatarFallback className="text-[10px]">{commenter?.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-baseline gap-2 mb-1">
                                      <span className="text-xs font-bold text-foreground leading-none">{commenter?.name || 'User'}</span>
                                      <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-tighter">
                                         {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                      </span>
                                   </div>
                                   <p className="text-sm text-muted-foreground/80 leading-relaxed break-words">{comment.text}</p>
                                </div>
                             </div>
                          )
                       })}
                       
                       {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground/20 border-2 border-dashed border-border/10 rounded-2xl">
                             <AtSign size={24} className="mb-2 opacity-50" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">No conversation yet</p>
                          </div>
                       )}
                    </div>

                    <div className="flex gap-4 items-start bg-secondary/20 p-4 rounded-2xl border border-border/30 focus-within:border-primary/30 focus-within:bg-background transition-all">
                       <Avatar className="h-8 w-8 border border-border/50 shrink-0 shadow-sm">
                          <AvatarImage src={getUserAvatar(userData)} />
                          <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 space-y-3">
                          <AutoResizingTextarea
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                             placeholder="Write a message..."
                             className="min-h-[40px] text-sm bg-transparent border-none p-0 focus:ring-0 placeholder:text-muted-foreground/40"
                             maxHeight={200}
                             onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   if (newComment.trim()) {
                                      addComment(selectedTaskId!, newComment.trim());
                                      setNewComment("");
                                   }
                                }
                             }}
                          />
                          <div className="flex justify-end items-center gap-3">
                             <span className="text-[9px] text-muted-foreground/40 font-medium">Press Enter to post</span>
                             <Button 
                                size="sm" 
                                className="h-7 text-[10px] font-bold uppercase rounded-lg px-4"
                                onClick={() => {
                                   if (newComment.trim()) {
                                      addComment(selectedTaskId!, newComment.trim());
                                      setNewComment("");
                                   }
                                }}
                                disabled={!newComment.trim()}
                             >
                                Send
                             </Button>
                          </div>
                       </div>
                    </div>
                 </div>
                 </>
                 )}
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50 bg-card shrink-0">
                 <Button variant="outline" onClick={() => {
                    setSelectedTaskId(null);
                 }}>
                    Cancel
                 </Button>
                 <Button onClick={() => {
                    if (localTask && originalTask) {
                       // Deep compare to see if we actually need a history entry
                       const hasChanged = 
                          localTask.title !== originalTask.title ||
                          localTask.description !== originalTask.description ||
                          localTask.status !== originalTask.status ||
                          localTask.priority !== originalTask.priority ||
                          localTask.dueDate !== originalTask.dueDate ||
                          localTask.flagged !== originalTask.flagged ||
                          JSON.stringify(localTask.assignees) !== JSON.stringify(originalTask.assignees) ||
                          JSON.stringify(localTask.subtasks) !== JSON.stringify(originalTask.subtasks) ||
                          localTask.audioBase64 !== originalTask.audioBase64 ||
                          localTask.audioMimeType !== originalTask.audioMimeType ||
                          localTask.audioDuration !== originalTask.audioDuration;

                       if (hasChanged) {
                          const { history, updatedAt, createdAt, id, ...updates } = localTask;
                          handleUpdateTaskLocal(selectedTaskId!, updates, 'manual_save');
                       }
                       setSelectedTaskId(null);
                    }
                 }}>
                    Save
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* New Task Creation Modal (Selection) */}
        {showCreateTaskModal && (
          <motion.div
            key="create-task-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateTaskModal(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              key="create-task-modal-content"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-card rounded-2xl p-6 shadow-2xl border flex flex-col gap-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <h3 className="text-xl font-bold tracking-tight text-center">Create New Task</h3>
              <Button 
                onClick={() => {
                  handleAddNewTaskTypeClick(initialMetadata.status, initialMetadata.date); // Pass metadata
                  setShowCreateTaskModal(false);
                }} 
                className="h-12 text-base font-bold flex gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Keyboard size={20} /> Type Task
              </Button>
              <Button 
                onClick={() => {
                  setCreateTaskMode("voice");
                  setShowCreateTaskModal(false);
                }} 
                className="h-12 text-base font-bold flex gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                variant="outline"
              >
                <Mic size={20} /> Record Voice Task
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateTaskModal(false)}>Cancel</Button>
            </motion.div>
          </motion.div>
        )}

        {/* Voice Task Creator Modal */}
        {createTaskMode === "voice" && (
            <motion.div
                key="voice-task-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCreateTaskMode(null)}
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    key="voice-task-modal-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-card rounded-2xl shadow-2xl border flex flex-col max-w-md w-full h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <VoiceTaskCreator
                        onSave={handleSaveVoiceTask}
                        onCancel={() => {
                          setCreateTaskMode(null);
                        }}
                        isLoading={false} // Add actual loading state later
                        canManage={canManageTasks}
                        initialStatus={initialMetadata.status}
                        initialDueDate={initialMetadata.date}
                        initialData={pendingVoiceTaskData || undefined}
                        onDataChange={setPendingVoiceTaskData}
                    />
                </motion.div>
            </motion.div>
        )}
        
        {/* New Task Typing Modal */}
        {(selectedTaskId === "new" && createTaskMode === "type") && [
          <motion.div
            key="new-task-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
                setSelectedTaskId(null);
                setCreateTaskMode(null); // Reset mode
            }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          />,
          <motion.div
            key="new-task-modal"
            initial={isMobile ? { x: "100%" } : { opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={isMobile ? { x: "100%" } : { opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-50 bg-card border border-border/50 shadow-2xl overflow-hidden flex flex-col outline-none",
              isMobile ? "inset-0 rounded-none" : "inset-y-4 right-4 w-full max-w-lg rounded-2xl"
            )}
          >
                  <div className="h-40 shrink-0 relative bg-secondary/30 group">
                    {editingNewTask?.coverImage ? (
                      <img src={editingNewTask.coverImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/10 bg-gradient-to-br from-secondary/50 to-background">
                        <ImageIcon size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-8 px-3 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-tight">Add Image</span>
                            <ImageIcon size={14} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none text-xs">Set Cover Image</h4>
                            <Input 
                              placeholder="Image URL..." 
                              className="h-8 text-xs"
                              onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                  handleUpdateTaskLocal("new", { coverImage: e.currentTarget.value }, 'cover_image_updated');
                                }
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button 
                        size="icon" variant="secondary" 
                        className={cn("h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm", showHistory && "text-primary")}
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        <History size={14} />
                      </Button>
                      <Button 
                        size="icon" variant="secondary" 
                        className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background border shadow-sm"
                        onClick={() => {
                            setSelectedTaskId(null);
                            setCreateTaskMode(null);
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 -mt-6 relative bg-card rounded-t-3xl border-t border-border/50 custom-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider gap-2 border-border/50">
                              <div className={cn("w-2 h-2 rounded-full", PRIORITIES[editingNewTask?.priority || 'medium'].color)} />
                              {editingNewTask?.priority || 'Medium'} Priority
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {Object.entries(PRIORITIES).map(([key, val]) => (
                              <DropdownMenuItem key={key} onClick={() => handleUpdateTaskLocal("new", { priority: key as Priority })}>
                                <div className={cn("w-2 h-2 rounded-full mr-2", val.color)} />
                                {val.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              <Calendar size={12} className="mr-2 h-4 w-4" />
                              {editingNewTask?.dueDate ? format(new Date(editingNewTask.dueDate), "MMM d") : "Set Date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={editingNewTask?.dueDate ? new Date(editingNewTask.dueDate) : undefined}
                              onSelect={(date) => handleUpdateTaskLocal("new", { dueDate: date ? date.toISOString() : undefined })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            className={cn("h-8 px-3 rounded-md text-xs flex items-center gap-2 transition-colors", isBulkMode ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                            onClick={() => setIsBulkMode(!isBulkMode)}
                            title="Bulk Add"
                          >
                            <Layers size={14} />
                            Bulk Add
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => {
                                setEditingNewTask({ ...editingNewTask, title: "", description: "", subtasks: [] });
                                setBulkInput("");
                            }}
                            title="Clear"
                          >
                            <Trash2 size={14} />
                          </Button>
                      </div>
                    </div>

                    {isBulkMode ? (
                        <div className="space-y-4 mb-8">
                            <label className="text-[10px] font-bold uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                <Sparkles size={12} /> Bulk Task Parser
                            </label>
                            <Textarea 
                                value={bulkInput}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkInput(e.target.value)}
                                placeholder="Paste your messy notes here... AI will structure them into a task with subtasks."
                                className="min-h-[250px] bg-secondary/10 border-dashed border-2 border-border/50 rounded-2xl p-4 focus:bg-background transition-all resize-none text-sm leading-relaxed"
                            />
                            <Button 
                                onClick={handleBulkParse} 
                                disabled={isEnhancing || !bulkInput.trim()}
                                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                {isEnhancing ? <Wand2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                                {isEnhancing ? "Parsing with AI..." : "Magic Parse"}
                            </Button>
                            <p className="text-[9px] text-muted-foreground/60 text-center uppercase tracking-tighter">
                                Pro tip: Include steps with dashes for better subtask extraction
                            </p>
                        </div>
                    ) : (
                        <>
                    <div className={cn("relative w-full",
                      {"fade-top": showTopFadeTitle, "fade-bottom": showBottomFadeTitle}
                    )}>
                      {isEnhancing ? (
                          <Skeleton className="h-12 w-full mb-6 rounded-xl" />
                      ) : (
                        <AutoResizingTextarea
                            value={editingNewTask?.title || ""}
                            onChange={(e) => handleUpdateTaskLocal("new", { title: e.target.value }, 'updated', true)}
                            onBlur={() => handleUpdateTaskLocal("new", {}, 'content_updated')}
                            className="text-3xl font-bold bg-transparent border-none p-0 shadow-none focus-visible:ring-0 leading-tight mb-6 placeholder:text-muted-foreground/30 min-h-[48px] scrollbar-hide focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-xl"
                            placeholder="Task Title"
                            setShowTopFade={setShowTopFadeTitle}
                            setShowBottomFade={setShowBottomFadeTitle}
                            maxHeight={MAX_TEXTAREA_HEIGHT_TITLE}
                        />
                      )}
                    </div>
                    <div className="mb-8">
                       <label className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Assigned To</span>
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                       <Plus size={12} className="mr-1" /> Assign
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent>
                                   <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   {personnel.map(p => {
                                       const isAssigned = (editingNewTask?.assignees || []).some(uid => uid === p.id);
                                       return (
                                           <DropdownMenuItem 
                                               key={`new-task-assign-user-${p.id}`}
                                               onClick={() => {
                                                   if (isAssigned) {
                                                      handleUpdateTaskLocal("new", { assignees: (editingNewTask?.assignees || []).filter(uid => uid !== p.id) }, 'assignees_updated');
                                                   } else {
                                                      handleUpdateTaskLocal("new", { assignees: [...(editingNewTask?.assignees || []), p.id] }, 'assignees_updated');
                                                   }
                                               }}
                                               className="flex items-center"
                                           >
                                               <Avatar className="h-5 w-5 mr-2">
                                                   <AvatarImage src={getUserAvatar(p)} />
                                                   <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                                               </Avatar>
                                               {p.name}
                                               {isAssigned && <Check size={16} className="ml-auto" />}
                                           </DropdownMenuItem>
                                       )
                                   })}
                               </DropdownMenuContent>
                           </DropdownMenu>
                       </label>
                        <div className="flex flex-wrap gap-2">
                           {(editingNewTask?.assignees || []).length > 0 ? (
                              editingNewTask?.assignees?.map(uid => {
                                 const u = personnel.find(p => p.id === uid);
                                 if (!u) return null;
                                 return (
                                    <Badge key={`new-task-assignee-${uid}`} variant="secondary" className="pl-1 pr-2 py-1 gap-2 hover:bg-secondary/80">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={getUserAvatar(u)} />
                                            <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span>{u.name}</span>
                                        <X 
                                          size={12} 
                                          className="cursor-pointer text-muted-foreground hover:text-destructive"
                                          onClick={() => {
                                                const newAssignees = (editingNewTask?.assignees || []).filter(a => a !== uid);
                                                handleUpdateTaskLocal("new", { assignees: newAssignees }, 'assignees_updated');
                                          }}
                                        />
                                    </Badge>
                                 )
                              })
                           ) : (
                              <div className="text-xs text-muted-foreground flex items-center gap-2 px-2 py-1 bg-secondary/30 rounded-md border border-dashed border-border">
                                 <AtSign size={12} /> Everyone
                              </div>
                           )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                             <Sparkles size={10} className="text-primary" /> Leader Points
                          </label>
                          <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                             <Input 
                                type="number"
                                min="0"
                                className="h-8 bg-transparent border-none focus-visible:ring-0 font-bold text-sm"
                                value={editingNewTask?.leaderPoints || 20}
                                onChange={(e) => handleUpdateTaskLocal("new", { leaderPoints: Math.max(0, Number(e.target.value)) })}
                             />
                             <span className="text-[10px] font-bold text-muted-foreground uppercase pr-2">Points</span>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                             <Clock size={10} className="text-orange-500" /> Effort / Deadline
                          </label>
                          <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                             <Input 
                                type="number"
                                min="0"
                                className="h-8 bg-transparent border-none focus-visible:ring-0 font-bold text-sm"
                                value={editingNewTask?.deadlineHours || 4}
                                onChange={(e) => handleUpdateTaskLocal("new", { deadlineHours: Math.max(0, Number(e.target.value)) })}
                             />
                             <span className="text-[10px] font-bold text-muted-foreground uppercase pr-2">Hours</span>
                          </div>
                       </div>
                    </div>
                    <div className="mb-8 group">
                       <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest group-focus-within:text-primary transition-colors">
                            Description
                        </label>
                        {(editingNewTask?.description?.length || 0) > 20 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleEnhanceTask}
                                disabled={isEnhancing}
                                className="h-7 text-[9px] uppercase font-bold tracking-widest text-primary gap-1.5 hover:bg-primary/5"
                            >
                                <Sparkles size={10} /> Enhance Task
                            </Button>
                        )}
                       </div>
                       <div className={cn("relative w-full rounded-xl",
                           {"fade-top": showTopFadeDescription, "fade-bottom": showBottomFadeDescription}
                       )}>
                          {isEnhancing ? (
                              <Skeleton className="h-32 w-full rounded-xl" />
                          ) : (
                            <AutoResizingTextarea
                                value={editingNewTask?.description || ""}
                                onChange={(e) => handleUpdateTaskLocal("new", { description: e.target.value }, 'updated', true)}
                                onBlur={() => handleUpdateTaskLocal("new", {}, 'content_updated')}
                                className="min-h-[120px] text-sm bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none rounded-xl leading-relaxed scrollbar-hide p-2"
                                placeholder="Add details about this task..."
                                setShowTopFade={setShowTopFadeDescription}
                                setShowBottomFade={setShowBottomFadeDescription}
                                maxHeight={MAX_TEXTAREA_HEIGHT_DESCRIPTION}
                            />
                          )}
                       </div>
                    </div>
                    <div>
                       <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground/50 tracking-widest">
                             Subtasks
                          </label>
                          <span className="text-[10px] font-mono text-muted-foreground/50">
                             {(editingNewTask?.subtasks || []).filter(s => s.completed).length}/{(editingNewTask?.subtasks || []).length}
                          </span>
                       </div>
                       <div className="space-y-1">
                          {isEnhancing ? (
                              <div className="space-y-2">
                                <Skeleton className="h-8 w-full rounded-md" />
                                <Skeleton className="h-8 w-full rounded-md opacity-60" />
                              </div>
                          ) : (
                            <>
                            {(editingNewTask?.subtasks || []).map((sub, idx) => (
                                <div key={sub.id} className="flex items-center gap-2 group/sub">
                                    <button 
                                    onClick={() => {
                                        const newSub = [...(editingNewTask?.subtasks || [])];
                                        newSub[idx].completed = !newSub[idx].completed;
                                        newSub[idx].completedBy = newSub[idx].completed ? user?.uid : undefined;
                                        handleUpdateTaskLocal("new", { subtasks: newSub });
                                    }}
                                    className={cn(
                                        "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                        sub.completed ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"
                                    )}
                                    >
                                    {sub.completed && <Check size={12} />}
                                    </button>
                                    <AutoResizingTextarea
                                        value={sub.title}
                                        onChange={(e) => {
                                            const newSub = [...(editingNewTask?.subtasks || [])];
                                            newSub[idx].title = e.target.value;
                                            handleUpdateTaskLocal("new", { subtasks: newSub }, 'updated', true);
                                        }}
                                        onBlur={() => handleUpdateTaskLocal("new", {}, 'content_updated')}
                                        className={cn(
                                            "relative w-full flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent rounded-md scrollbar-hide",
                                            sub.completed && "text-muted-foreground line-through decoration-border"
                                        )}
                                        maxHeight={MAX_TEXTAREA_HEIGHT_SUBTASK}
                                    />
                                    
                                    {sub.completed && sub.completedBy && (
                                    <div className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground whitespace-nowrap">
                                        <Check size={8} /> {personnel.find(p => p.id === sub.completedBy)?.name?.split(' ')[0] || 'User'}
                                    </div>
                                    )}

                                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                        const newSub = (editingNewTask?.subtasks || []).filter(s => s.id !== sub.id);
                                        handleUpdateTaskLocal("new", { subtasks: newSub });
                                        }}
                                    >
                                        <X size={12} />
                                    </Button>
                                </div>
                            ))}
                                <Button 
                                    variant="ghost" size="sm" 
                                    className="h-8 text-xs text-muted-foreground hover:text-primary justify-start pl-1 mt-2"
                                    onClick={() => handleUpdateTaskLocal("new", { subtasks: [...(editingNewTask?.subtasks || []), { id: Math.random().toString(), title: "", completed: false }] })}
                                >
                                    <Plus size={14} className="mr-2" /> Add Item
                                </Button>
                            </>
                          )}
                       </div>
                    </div>
                    </>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50 bg-card shrink-0">
                    <Button variant="outline" onClick={() => {
                       setEditingNewTask(null);
                       setSelectedTaskId(null);
                       setCreateTaskMode(null);
                    }}>
                       Cancel
                    </Button>
                    <Button onClick={handleSaveNewTask}>
                       Save
                    </Button>
                  </div>
                </motion.div>
              ]
            }
        </AnimatePresence>
    </>
  );
}

export default function TasksPage() {
    return (
        <TasksProvider>
            <TasksPageContent />
        </TasksProvider>
    );
}
