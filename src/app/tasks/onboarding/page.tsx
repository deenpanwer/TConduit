"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, CheckCircle2, ChevronRight, ArrowLeft, Loader2, 
  Sparkles, Wand2, Zap, LayoutDashboard, List as ListIcon, 
  LayoutGrid, Clock, Target, Flag, Rocket, MessageSquare, 
  FileText, Database, ShieldCheck, X, Video, Mic, Paperclip, 
  Image as ImageIcon, Link, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { TasksProvider, useTasks } from "@/hooks/useTasks";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { triggerBigConfetti, triggerSmallConfetti } from "@/lib/confetti";

// Import our native Task components
import { TaskCard } from "@/components/tasks/BoardView";
import { UnifiedHierarchyRoot } from "@/components/tasks/HierarchicalUI";
import { TaskRowDesktop } from "@/components/tasks/list-view/TaskRows";
import { TasksDashboardContent } from "@/components/tasks/TasksDashboardContent";
import { BoardView } from "@/components/tasks/BoardView";
import { ListView } from "@/components/tasks/ListView";
import { TimelineView } from "@/components/tasks/TimelineView";

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const { addTask } = useTasks();
  const [finishing, setFinishing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const router = useRouter();

  const DUMMY_TASKS = useMemo(() => [
    {
      id: 'dummy-1',
      title: 'Pick up Pizza for the Team',
      description: 'Crucial mission: Grab 3 large pizzas on your way in. If you smell like pepperoni during the meeting, you\'re doing it right. Just don\'t eat the crusts on the way!',
      status: 'todo' as any,
      priority: 'high' as any,
      leaderPoints: 50,
      deadlineHours: 1,
      assignees: [],
      tags: [],
      subtasks: [
        { 
          id: 's1', 
          title: 'Find a place that isn\'t closed', 
          completed: false,
          descriptions: [{ id: 'n1', text: 'Check the one on 5th street first.', createdAt: new Date() }]
        },
        { 
          id: 's2', 
          title: 'Protect the boxes from the wind', 
          completed: false,
          descriptions: [{ id: 'n2', text: 'Use the heavy-duty pizza carrier in the trunk.', createdAt: new Date() }]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      history: []
    },
    {
      id: 'dummy-2',
      title: 'Sketch a New Website Logo',
      description: 'Time for a vibe check. We need something bold, modern, and definitely not in Comic Sans. Think "Future of Work" but cooler.',
      status: 'done' as any,
      priority: 'medium' as any,
      leaderPoints: 100,
      deadlineHours: 4,
      assignees: [],
      tags: [],
      flagged: true,
      subtasks: [
        { 
          id: 's3', 
          title: 'Draft initial concepts', 
          completed: true,
          descriptions: [{ id: 'n3', text: 'Focus on minimalist geometric shapes.', createdAt: new Date() }]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      history: []
    },
    {
      id: 'dummy-3',
      title: 'Record a Team Podcast',
      description: 'Let\'s talk about the future of talent. High energy, clear audio, and absolutely no background lawnmower noises.',
      status: 'in_progress' as any,
      priority: 'critical' as any,
      leaderPoints: 200,
      deadlineHours: 2,
      assignees: [],
      tags: [],
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      history: []
    }
  ], []);

  const [taskData, setTaskData] = useState<any>({
    title: "",
    description: "",
    priority: "medium",
    leaderPoints: 100,
    status: "todo",
    subtasks: [],
    nestedDescriptions: [],
    assignees: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    viewType: "list"
  });

  const handleEnhanceDescription = async () => {
    if (!taskData.title.trim()) {
      toast.error("Enter a title first!");
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/tasks/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskData.title, mode: 'description_only' })
      });
      const data = await res.json();
      setTaskData((prev: any) => ({ ...prev, description: data.description }));
      toast.success("AI generated a description!");
    } catch (err) {
      toast.error("AI enhancement failed.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAIBreakdown = async () => {
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/tasks/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskData.title, mode: 'enhance', context: taskData })
      });
      const data = await res.json();
      setTaskData((prev: any) => ({ 
        ...prev, 
        subtasks: data.subtasks || [],
        priority: data.priority || prev.priority,
        leaderPoints: data.leaderPoints || prev.leaderPoints
      }));
      triggerSmallConfetti();
      toast.success("AI decomposed the task!");
    } catch (err) {
      toast.error("AI breakdown failed.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFinish = async () => {
    if (!taskData.title.trim() || !user) return;
    setFinishing(true);
    try {
      // Ensure subtasks have proper IDs and mapped descriptions
      const finalizedSubtasks = (taskData.subtasks || []).map((st: any) => ({
        ...st,
        id: st.id || `st-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        completed: st.completed || false,
        createdAt: st.createdAt || new Date()
      }));

      const taskId = await addTask(
        taskData.title.trim(),
        taskData.status || "todo",
        taskData.description || "",
        taskData.priority || "medium",
        [user.uid],
        taskData.leaderPoints || 100,
        4, // default hours
        finalizedSubtasks,
        [], // resources
        [], // attachments
        [], // voiceNotes
        taskData.nestedDescriptions || [],
        [], // images
        undefined // groupId explicitly undefined (will be cleaned by useTasks)
      );

      if (!taskId) {
        throw new Error("Failed to create task in Firestore");
      }

      // Mark tour as complete
      await updateDoc(doc(db, "users", user.uid), {
        tasksTourCompleted: true,
        updatedAt: new Date().toISOString()
      });

      await refreshUserData();

      // Final celebration
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }
      triggerBigConfetti();
      
      toast.success("Welcome to TRAC Tasks!", {
        description: "Your workspace is architected and ready."
      });
      
      setTimeout(() => {
        router.push('/tasks?view=dashboard');
      }, 1500);
    } catch (err) {
      console.error("Onboarding finish error:", err);
      toast.error("Failed to save workspace. Please try again.");
    } finally {
      setFinishing(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !taskData.title.trim()) {
      toast.error("Please name your first task.");
      return;
    }
    
    // Simulate background generation when moving from Step 1
    if (step === 1) {
      setTaskData((prev: any) => ({
        ...prev,
        subtasks: [
          { 
            id: 'auto-s1', 
            title: `Kickoff ${prev.title}`, 
            completed: false,
            descriptions: [{ id: 'auto-n1', text: 'Define the initial scope and key milestones.', createdAt: new Date() }]
          },
          { 
            id: 'auto-s2', 
            title: 'Gather required resources', 
            completed: false,
            descriptions: [{ id: 'auto-n2', text: 'Identify the team members and tools needed for success.', createdAt: new Date() }]
          }
        ]
      }));
    }
    
    setStep(s => s + 1);
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-screen w-screen bg-background flex flex-col md:flex-row overflow-hidden font-poppins relative text-foreground">
      <style jsx global>{`
        .font-dancing { font-family: 'Dancing Script', cursive; }
        .perspective-1000 { perspective: 1000px; }
        .sandbox-recessed {
            box-shadow: inset 0 20px 80px -20px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05);
        }
        .dark .sandbox-recessed {
            box-shadow: inset 0 20px 80px -20px rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02);
        }
      `}</style>

      {/* LEFT: THE GUIDE (40%) */}
      <div className="w-full md:w-[40%] h-full border-r border-border/40 flex flex-col bg-card/50 backdrop-blur-xl shrink-0 z-20 shadow-2xl relative">
        <div className="p-8 md:p-12 pb-0">
          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center shadow-lg shadow-primary/5">
                <Target size={20} className="text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black uppercase tracking-tight text-foreground">trac ai</span>
                <span className="text-2xl font-light uppercase tracking-tight text-foreground">tasks</span>
              </div>
            </div>
            
            <div className="space-y-2">
                <span className="text-[10px] font-black tracking-[0.3em] text-primary">Short and Sweet</span>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary" animate={{ width: `${(step / 5) * 100}%` }} />
                </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
                {step === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap className="text-primary" />
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-[0.9]">Add your <span className="text-primary">first task</span></h1>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed opacity-80">
                        Assign the work you want the team to do 😊
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Task Title</label>
                        <Input 
                          placeholder="e.g. Launch New Product" 
                          value={taskData.title}
                          onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                          className="h-16 bg-secondary/40 border-none rounded-2xl text-lg font-black uppercase tracking-tight px-8 shadow-inner"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleEnhanceDescription}
                        disabled={isEnhancing || !taskData.title}
                        className="w-full h-14 bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl border border-primary/20 flex gap-2 font-black uppercase tracking-widest text-xs"
                      >
                        {isEnhancing ? <Loader2 className="animate-spin" /> : <Wand2 size={16} />}
                        Auto-Generate Description
                      </Button>

                      <div className="pt-6 border-t border-border/40 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Example Goals</p>
                        <div className="flex flex-col gap-2">
                          {DUMMY_TASKS.map(t => (
                            <div key={t.id} className="px-4 py-3 bg-secondary/20 rounded-xl border border-border/20 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                              {t.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">Add <span className="text-primary">any item</span></h1>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed opacity-80">
                        Subtasks, Video files, Audio notes, Files, Images, Resources... you can add anything you want to your task. 😊
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-6 bg-secondary/20 rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-4">
                        <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <Plus size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">
                          Everything in one place.<br/>No more scattered context.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">Get <span className="text-primary ">Shit Done</span></h1>
                      <p className="text-sm text-muted-foreground">Assign points and priority to ensure getting it done.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-secondary/40 rounded-3xl border border-border/50 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Points</label>
                        <Input 
                          type="number" 
                          value={taskData.leaderPoints}
                          onChange={(e) => setTaskData({...taskData, leaderPoints: Number(e.target.value)})}
                          className="h-10 bg-transparent border-none p-0 text-2xl font-black text-primary"
                        />
                      </div>
                      <div className="p-6 bg-secondary/40 rounded-3xl border border-border/50 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</label>
                        <select 
                          value={taskData.priority}
                          onChange={(e) => setTaskData({...taskData, priority: e.target.value})}
                          className="bg-transparent border-none text-sm font-black uppercase tracking-widest text-foreground outline-none w-full"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">Same Data <span className="text-primary">Different Views</span></h1>
                      <p className="text-sm text-muted-foreground">Switch views to see how your work is happening.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { id: 'list', label: 'Clean Grid', icon: ListIcon },
                        { id: 'board', label: 'Visual Board', icon: LayoutGrid },
                        { id: 'timeline', label: 'Timeline View', icon: Clock }
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => setTaskData({...taskData, viewType: v.id})}
                          className={cn(
                            "h-16 rounded-2xl border-2 flex items-center px-6 gap-4 transition-all",
                            taskData.viewType === v.id ? "border-primary bg-primary/5 text-primary shadow-lg" : "border-border/40 bg-secondary/20 grayscale opacity-60"
                          )}
                        >
                          <v.icon size={20} />
                          <span className="text-xs font-black uppercase tracking-widest">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-8 text-center">
                    <div className="size-20 bg-primary rounded-[2rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl shadow-primary/40 rotate-3">
                      <Target size={40} />
                    </div>
                    <div className="space-y-4">
                      <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">All <span className="text-primary">Set.</span></h1>
                      <p className="text-sm text-muted-foreground leading-relaxed">Onboarding is completed, Now create tasks.</p>
                    </div>
                    <Button 
                      onClick={handleFinish}
                      disabled={finishing}
                      className="w-full h-20 bg-foreground text-background hover:bg-foreground/90 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-6"
                    >
                      {finishing ? <Loader2 className="animate-spin" /> : "Go to Tasks"}
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="p-8 md:p-12 pt-0">
          <div className="pt-8 border-t border-border/40 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
            ) : <div />}
            {step < 5 && (
              <Button onClick={handleNext} className="h-12 px-10 bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                Continue <ChevronRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: LIVE STAGE (60%) */}
      <div className="flex-1 h-full bg-slate-100 dark:bg-slate-900/50 relative overflow-hidden flex items-center justify-center z-10 sandbox-recessed p-12">
        {/* Global Stage Elements */}
        <button 
          onClick={handleFinish}
          disabled={finishing}
          className="absolute top-8 right-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-2xl text-foreground disabled:opacity-50"
        >
          {finishing ? <Loader2 className="animate-spin size-3" /> : <>Skip Tour <X size={14} /></>}
        </button>

        <div className="absolute top-8 left-8 z-50">
           <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800/40 rounded-[2rem] p-4 flex items-center gap-4 shadow-2xl">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/40 shrink-0">
                  <CheckCircle2 size={18} />
              </div>
              <div className="text-left">
                  <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-0.5">Highly Recommended</p>
                  <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase leading-tight opacity-80">
                    Increases productivity by 15% from the first day.
                  </p>
              </div>
           </div>
        </div>

        <div className="w-full h-full flex items-center justify-center perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={step + taskData.viewType}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              className="w-full h-full flex items-center justify-center"
            >
              {step === 1 && (
                <div className="w-full h-full max-h-[600px] bg-background rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden flex flex-col">
                  {/* Fake Table Header */}
                  <div className="h-14 px-8 flex items-center justify-between bg-secondary/10 border-b border-border/40 shrink-0">
                    <div className="flex flex-col">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Command Center</h2>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">3 Active Items</p>
                    </div>
                  </div>

                  {/* Fake Column Headers */}
                  <div className="flex h-10 bg-secondary/5 border-b border-border/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">
                    <div className="w-12 shrink-0 border-r border-border/40" />
                    <div className="flex-[1.5] min-w-[200px] border-r border-border/40 px-6 flex items-center">Task Name</div>
                    <div className="flex-[2] min-w-[300px] border-r border-border/40 px-6 flex items-center">Description</div>
                    <div className="w-24 shrink-0 px-4 flex items-center justify-center">Points</div>
                  </div>

                  {/* Fake Rows */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* User's Task Row */}
                    <div className="flex h-16 border-b border-border/40 bg-primary/5 items-center transition-colors">
                      <div className="w-12 shrink-0 flex items-center justify-center">
                        <div className="size-5 rounded-full border-2 border-primary/40 flex items-center justify-center">
                          <div className="size-2 bg-primary rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="flex-[1.5] min-w-[200px] border-r border-border/40 px-6">
                        <p className="text-sm font-black uppercase tracking-tight text-foreground truncate">{taskData.title || "Your Task Title"}</p>
                      </div>
                      <div className="flex-[2] min-w-[300px] border-r border-border/40 px-6">
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{taskData.description || "Auto-generating description..."}</p>
                      </div>
                      <div className="w-24 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-primary">--</span>
                      </div>
                    </div>

                    {/* Dummy Task Rows */}
                    {DUMMY_TASKS.map((t, idx) => (
                      <div key={t.id} className={cn(
                        "flex h-16 border-b border-border/40 items-center transition-colors",
                        idx === 0 ? "opacity-60 grayscale-[0.5]" : "opacity-30 grayscale"
                      )}>
                        <div className="w-12 shrink-0 flex items-center justify-center">
                          <div className="size-5 rounded-full border-2 border-border/40" />
                        </div>
                        <div className="flex-[1.5] min-w-[200px] border-r border-border/40 px-6">
                          <p className="text-sm font-black uppercase tracking-tight text-foreground truncate">{t.title}</p>
                        </div>
                        <div className="flex-[2] min-w-[300px] border-r border-border/40 px-6">
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</p>
                        </div>
                        <div className="w-24 shrink-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-primary">{t.leaderPoints}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Quick Add Placeholder */}
                    <div className="flex h-16 items-center opacity-20">
                      <div className="w-12 shrink-0 flex items-center justify-center">
                        <Plus size={16} />
                      </div>
                      <div className="px-6 text-xs font-bold tracking-widest text-muted-foreground">
                        + Add another task...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="w-full max-w-4xl bg-card rounded-[2.5rem] p-12 border border-border/50 shadow-2xl space-y-8 overflow-hidden relative">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">{taskData.title || "Your Main Goal"}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{taskData.description || "The central hub for all your context."}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 relative">
                    {[
                      { label: 'Subtasks', icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                      { label: 'Video Files', icon: Video, color: 'text-rose-500', bg: 'bg-rose-500/5' },
                      { label: 'Audio Notes', icon: Mic, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                      { label: 'Documents', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                      { label: 'Images', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-500/5' },
                      { label: 'Resources', icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/5' },
                      { label: 'Team Chat', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
                      { label: 'External Links', icon: Link, color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
                    ].map((item, idx) => (
                      <motion.div 
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-3xl border border-border/40 transition-all shadow-sm",
                          item.bg,
                          idx >= 6 && "opacity-40 grayscale-[0.5] blur-[0.5px]",
                          idx >= 8 && "opacity-10 grayscale blur-[1px]"
                        )}
                      >
                        <div className={cn("size-10 rounded-2xl bg-background flex items-center justify-center shadow-sm", item.color)}>
                          <item.icon size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground">{item.label}</span>
                      </motion.div>
                    ))}
                    
                    {/* Fade Effect at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="w-full max-w-5xl bg-background rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden flex flex-col">
                  {/* Table Header */}
                  <div className="h-14 px-8 flex items-center justify-between bg-secondary/10 border-b border-border/40 shrink-0">
                    <div className="flex flex-col">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Skin in the Game</h2>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Setting Rewards</p>
                    </div>
                  </div>

                  {/* Column Headers with Points and Priority */}
                  <div className="flex h-10 bg-secondary/5 border-b border-border/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">
                    <div className="w-12 shrink-0 border-r border-border/40" />
                    <div className="flex-[1.5] min-w-[200px] border-r border-border/40 px-6 flex items-center">Task Name</div>
                    <div className="w-24 shrink-0 border-r border-border/40 px-4 flex items-center justify-center">Points</div>
                    <div className="w-32 shrink-0 px-4 flex items-center justify-center">Priority</div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* User Task Row */}
                    <div className="flex h-16 border-b border-border/40 bg-primary/5 items-center">
                      <div className="w-12 shrink-0 flex items-center justify-center">
                        <div className="size-5 rounded-full border-2 border-primary/40" />
                      </div>
                      <div className="flex-[1.5] min-w-[200px] border-r border-border/40 px-6 font-black text-xs uppercase tracking-tight">
                        {taskData.title || "Your Task"}
                      </div>
                      <div className="w-24 shrink-0 border-r border-border/40 flex items-center justify-center">
                        <span className="text-sm font-mono font-bold text-blue-600">{taskData.leaderPoints}</span>
                      </div>
                      <div className="w-32 shrink-0 flex items-center justify-center">
                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 border-blue-500/20">
                          {taskData.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Dummy Tasks for context */}
                    {DUMMY_TASKS.map((t, idx) => (
                      <div key={t.id} className="flex h-16 border-b border-border/40 items-center opacity-60">
                        <div className="w-12 shrink-0 flex items-center justify-center">
                          {t.flagged ? <CheckCircle2 size={16} className="text-green-500" /> : <div className="size-5 rounded-full border-2 border-border/40" />}
                        </div>
                        <div className="flex-[1.5] min-w-[200px] border-r border-border/40 px-6 font-black text-xs uppercase tracking-tight">
                          {t.title}
                        </div>
                        <div className="w-24 shrink-0 border-r border-border/40 flex items-center justify-center">
                          <span className="text-sm font-mono font-bold text-blue-600">{t.leaderPoints}</span>
                        </div>
                        <div className="w-32 shrink-0 flex items-center justify-center">
                           <Badge variant="secondary" className={cn(
                             "text-[9px] font-black uppercase tracking-widest",
                             t.priority === 'high' || t.priority === 'critical' ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"
                           )}>
                            {t.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="w-full h-full bg-background rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden p-8">
                  {taskData.viewType === 'list' && (
                    <ListView tasks={[taskData.title ? taskData : DUMMY_TASKS[0], ...DUMMY_TASKS]} onTaskClick={() => {}} personnel={[]} />
                  )}
                  {taskData.viewType === 'board' && (
                    <BoardView tasks={[taskData.title ? taskData : DUMMY_TASKS[0], ...DUMMY_TASKS]} onTaskClick={() => {}} onDeleteTask={() => {}} onDropTask={() => {}} onQuickAdd={() => {}} onAddClick={() => {}} onQuickEdit={() => {}} canManage={true} personnel={[]} />
                  )}
                  {taskData.viewType === 'timeline' && (
                    <TimelineView tasks={[taskData.title ? taskData : DUMMY_TASKS[0], ...DUMMY_TASKS]} onTaskClick={() => {}} onUpdateTask={() => {}} onDeleteTask={() => {}} onQuickEdit={() => {}} onAddClick={() => {}} canManage={true} personnel={[]} />
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="w-full h-full bg-background/50 backdrop-blur-3xl rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden relative">
                   <TasksDashboardContent onTaskClick={() => {}} />
                   <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function TasksOnboarding() {
  return (
    <TasksProvider>
      <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>}>
        <OnboardingContent />
      </Suspense>
    </TasksProvider>
  );
}
