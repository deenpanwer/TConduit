"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, CheckCircle2, ChevronRight, ArrowLeft, Loader2, 
  Sparkles, Wand2, Zap, LayoutDashboard, List as ListIcon, 
  LayoutGrid, Clock, Target, Flag, Rocket, MessageSquare, 
  FileText, Database, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TasksProvider, useTasks } from "@/hooks/useTasks";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
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
  const { user, userData, loading: authLoading } = useAuth();
  const { addTask } = useTasks();
  const [finishing, setFinishing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const router = useRouter();
  
  const [taskData, setTaskData] = useState<any>({
    title: "",
    description: "",
    priority: "medium",
    leaderPoints: 100,
    status: "todo",
    subtasks: [],
    nestedDescriptions: [],
    assignees: [],
    createdAt: new Date(),
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
      setTaskData(prev => ({ ...prev, description: data.description }));
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
      setTaskData(prev => ({ 
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
    if (!taskData.title.trim()) return;
    setFinishing(true);
    try {
      await addTask(
        taskData.title,
        taskData.status,
        taskData.description,
        taskData.priority,
        [user?.uid],
        taskData.leaderPoints,
        4, // default hours
        taskData.subtasks,
        [], [], [],
        taskData.nestedDescriptions
      );

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
      }, 2000);
    } catch (err) {
      toast.error("Failed to save workspace.");
      setFinishing(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !taskData.title.trim()) {
      toast.error("Please name your first task.");
      return;
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
          <div className="flex flex-col gap-4 w-full">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">THE ARCHITECT'S JOURNEY</span>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
               <motion.div className="h-full bg-primary" animate={{ width: `${(step / 5) * 100}%` }} />
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
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Your first <span className="text-primary italic">vision</span></h1>
                      </div>
                      <p className="text-sm text-muted-foreground italic">Name your first major goal. TRAC AI will help you architect the details.</p>
                    </div>
                    <div className="space-y-6">
                      <Input 
                        placeholder="e.g. Build $100M Talent Engine" 
                        value={taskData.title}
                        onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                        className="h-16 bg-secondary/40 border-none rounded-2xl text-lg font-black uppercase tracking-tight px-8 shadow-inner"
                      />
                      <Button 
                        onClick={handleEnhanceDescription}
                        disabled={isEnhancing || !taskData.title}
                        className="w-full h-14 bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl border border-primary/20 flex gap-2 font-black uppercase tracking-widest text-xs"
                      >
                        {isEnhancing ? <Loader2 className="animate-spin" /> : <Wand2 size={16} />}
                        Magic Description
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">Recursive <span className="text-primary italic">Breakdown</span></h1>
                      <p className="text-sm text-muted-foreground italic">Complexity is the enemy. Use the Hierarchical UI to break this goal into atomic units.</p>
                    </div>
                    <Button 
                      onClick={handleAIBreakdown}
                      disabled={isEnhancing}
                      className="w-full h-16 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex gap-2 font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                    >
                      {isEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                      Auto-Decompose Task
                    </Button>
                    <div className="p-4 bg-secondary/20 rounded-2xl border border-dashed border-border text-[10px] font-bold uppercase tracking-widest text-center opacity-60">
                      OR ADD ITEMS MANUALLY IN THE PREVIEW →
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">Skin in <span className="text-primary italic">the Game</span></h1>
                      <p className="text-sm text-muted-foreground italic">Incentivize yourself. Assign points and priority to ensure high-velocity completion.</p>
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
                      <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight">Total <span className="text-primary italic">Perspectives</span></h1>
                      <p className="text-sm text-muted-foreground italic">One architect, three lenses. Switch views to see how your work adapts.</p>
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
                      <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Ready for <span className="text-primary italic">Impact.</span></h1>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">Your Command Center is architected. All systems go.</p>
                    </div>
                    <Button 
                      onClick={handleFinish}
                      disabled={finishing}
                      className="w-full h-20 bg-foreground text-background hover:bg-foreground/90 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-6"
                    >
                      {finishing ? <Loader2 className="animate-spin" /> : "LAUNCH COMMAND CENTER"}
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
                <div className="max-w-md w-full">
                  <TaskCard 
                    task={taskData}
                    onClick={() => {}}
                    onDelete={() => {}}
                    onQuickEdit={() => {}}
                    canManage={true}
                    personnel={[]}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="w-full max-w-4xl bg-card rounded-[2.5rem] p-10 border border-border/50 shadow-2xl">
                  <UnifiedHierarchyRoot 
                    task={taskData}
                    onUpdateTask={(upd) => setTaskData({...taskData, ...upd})}
                    canManage={true}
                    user={user}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="w-full max-w-5xl">
                   <TaskRowDesktop 
                     task={taskData}
                     localTask={taskData}
                     onUpdate={(upd) => setTaskData({...taskData, ...upd})}
                     onDelete={() => {}}
                     onTaskClick={() => {}}
                     personnel={[]}
                     handleEnhanceTask={async () => {}}
                     isEnhancing={false}
                   />
                </div>
              )}

              {step === 4 && (
                <div className="w-full h-full bg-background rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden p-8">
                  {taskData.viewType === 'list' && (
                    <ListView tasks={[taskData]} onTaskClick={() => {}} personnel={[]} />
                  )}
                  {taskData.viewType === 'board' && (
                    <BoardView tasks={[taskData]} onTaskClick={() => {}} onDeleteTask={() => {}} onDropTask={() => {}} onQuickAdd={() => {}} onAddClick={() => {}} onQuickEdit={() => {}} canManage={true} personnel={[]} />
                  )}
                  {taskData.viewType === 'timeline' && (
                    <TimelineView tasks={[taskData]} onTaskClick={() => {}} onUpdateTask={() => {}} onDeleteTask={() => {}} onQuickEdit={() => {}} onAddClick={() => {}} canManage={true} personnel={[]} />
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="w-full h-full bg-background/50 backdrop-blur-3xl rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden">
                   <TasksDashboardContent onTaskClick={() => {}} />
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
