"use client";

import {
  Plan,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
  PlanAction,
} from "@/components/ai-elements/plan";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Moon, Sun, ChevronsLeft, ChevronsRight } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";

const reasoningSteps = [
  "Let me think step by step.",
  "\n\nThe user wants to find the two most talented frontend engineers.",
  "\n\nI need to define a plan to achieve this.",
  "\n\n1. Search for candidates on popular platforms.",
  "\n\n2. Filter candidates based on their skills and experience.",
  "\n\n3. Rank the filtered candidates to find the top two.",
].join("");

const PlanSkeleton = () => (
  <div className="mt-4 w-full max-w-2xl rounded-lg border bg-card text-card-foreground shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse"></div>
      <div className="h-8 w-8 bg-muted rounded-md animate-pulse"></div>
    </div>
    <div className="mt-4 h-4 w-1/2 bg-muted rounded-md animate-pulse"></div>
    <div className="mt-8 space-y-4">
      <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
      <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
      <div className="h-4 w-3/4 bg-muted rounded-md animate-pulse"></div>
    </div>
    <div className="mt-8 flex justify-end">
        <div className="h-9 w-20 bg-muted rounded-md animate-pulse"></div>
    </div>
  </div>
);

const Test2Page = () => {
  const [stage, setStage] = useState("stage1");
  const [theme, setTheme] = useState("light");
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [reasoningContent, setReasoningContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [showPlan, setShowPlan] = useState(false);

  const [peopleCount, setPeopleCount] = useState(0);

  const chunkIntoTokens = useCallback((text: string): string[] => {
    const tokens: string[] = [];
    let i = 0;
    while (i < text.length) {
      const chunkSize = Math.floor(Math.random() * 2) + 3;
      tokens.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return tokens;
  }, []);

  useEffect(() => {
    const tokenizedSteps = chunkIntoTokens(reasoningSteps);
    setTokens(tokenizedSteps);
    setReasoningContent("");
    setCurrentTokenIndex(0);
    setIsStreaming(true);
    setShowPlan(false);
  }, [chunkIntoTokens]);

  useEffect(() => {
    if (!isStreaming || currentTokenIndex >= tokens.length) {
      if (isStreaming) {
        setIsStreaming(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setReasoningContent((prev) => prev + tokens[currentTokenIndex]);
      setCurrentTokenIndex((prev) => prev + 1);
    }, 25);

    return () => clearTimeout(timer);
  }, [isStreaming, currentTokenIndex, tokens]);
  
  useEffect(() => {
    if (!isStreaming && tokens.length > 0 && currentTokenIndex >= tokens.length) {
      const timer = setTimeout(() => {
        setShowPlan(true);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [isStreaming, tokens, currentTokenIndex]);


  useEffect(() => {
    if (stage === "stage2") {
      const interval = setInterval(() => {
        setPeopleCount((prev) => {
          const newCount = prev + 4;
          if (newCount >= 100) {
            clearInterval(interval);
            setTimeout(() => setStage("stage3"), 2000);
            return 100;
          }
          return newCount;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const tasks: { key: string; value: ReactNode }[] = [
    { key: nanoid(), value: `Looking at ${peopleCount} people` },
    { key: nanoid(), value: "Filtering candidates..." },
    { key: nanoid(), value: "Ranking candidates..." },
  ];

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className={`${theme}`}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Side Strip */}
        <div
          className={`bg-card border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <div
                className={`font-bold text-2xl ${isCollapsed ? "hidden" : ""}`}
              >
                Talent
              </div>
              <div className="font-bold text-2xl">T</div>
            </div>
            <div className="mt-8">
              <div className="w-10 h-10 bg-muted rounded-full mx-auto"></div>
            </div>

            <div className="flex-grow"></div>
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "light" ? <Moon /> : <Sun />}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {stage === "stage1" && (
              <motion.div
                key="stage1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl"
              >
                <Reasoning
                  className="w-full"
                  isStreaming={isStreaming}
                  open={isReasoningOpen}
                  onOpenChange={setIsReasoningOpen}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{reasoningContent}</ReasoningContent>
                </Reasoning>

                <AnimatePresence>
                  {!showPlan ? (
                     isStreaming || (!isStreaming && !showPlan) ? <PlanSkeleton /> : null
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Plan className="mt-4" defaultOpen={true}>
                        <PlanHeader>
                          <div>
                            <div className="mb-4 flex items-center gap-2">
                              <FileText className="size-4" />
                              <PlanTitle>Find Top Frontend Engineers</PlanTitle>
                            </div>
                            <PlanDescription>
                              A plan to find the two most talented frontend
                              engineers for our new project.
                            </PlanDescription>
                          </div>
                          <PlanTrigger />
                        </PlanHeader>
                        <PlanContent>
                          <div className="space-y-4 text-sm">
                            <div>
                              <h3 className="mb-2 font-semibold">Key Steps</h3>
                              <ul className="list-inside list-disc space-y-1">
                                <li>
                                  Search for candidates on popular platforms.
                                </li>
                                <li>
                                  Filter candidates based on their skills and
                                  experience.
                                </li>
                                <li>
                                  Rank the filtered candidates to find the top
                                  two.
                                </li>
                              </ul>
                            </div>
                          </div>
                        </PlanContent>
                        <PlanFooter className="justify-end">
                          <PlanAction>
                            <Button
                              size="sm"
                              onClick={() => setStage("stage2")}
                            >
                              Start Hiring <kbd className="font-mono">⌘↩</kbd>
                            </Button>
                          </PlanAction>
                        </PlanFooter>
                      </Plan>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {stage === "stage2" && (
              <motion.div
                key="stage2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl"
              >
                <Task className="w-full">
                  <TaskTrigger title="Finding Candidates" />
                  <TaskContent>
                    {tasks.map((task) => (
                      <TaskItem key={task.key}>{task.value}</TaskItem>
                    ))}
                  </TaskContent>
                </Task>
              </motion.div>
            )}

            {stage === "stage3" && (
              <motion.div
                key="stage3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex gap-8"
              >
                <div className="flex-1 h-96 bg-card border rounded-lg p-4">
                  Profile 1
                </div>
                <div className="flex-1 h-96 bg-card border rounded-lg p-4">
                  Profile 2
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Test2Page;
