
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
import { processQueryWithGemini } from '@/app/actions';
import SocialScan2 from "@/components/ai-elements/SocialScan2";
import { nanoid } from "nanoid";
import { useTheme } from "next-themes";
import ProfileCard from "@/components/ProfileCard";
import { SiGithub, SiLinkedin, SiDribbble } from "@icons-pack/react-simple-icons";

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
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Gemini output states
  const [geminiReasoning, setGeminiReasoning] = useState("");
  const [geminiPlanContent, setGeminiPlanContent] = useState<string[]>([]); // Array for bullet points
  const [geminiFormalizedQuery, setGeminiFormalizedQuery] = useState("");
  const [isGeminiLoading, setIsGeminiLoading] = useState(true); // Loading state for Gemini call

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to fetch Gemini output
  useEffect(() => {
    const fetchGeminiOutput = async () => {
      setIsGeminiLoading(true);
      const storedInputValue = sessionStorage.getItem('geminiInputValue');
      if (storedInputValue) {
        try {
          const result = await processQueryWithGemini(storedInputValue);
          setGeminiReasoning(result.reasoning);
          // Assuming plan_content is a markdown list, parse it into an array
          const parsedPlan = result.plan_content.split('\n').filter((line: string) => line.startsWith('*')).map((line: string) => line.substring(1).trim());
          setGeminiPlanContent(parsedPlan);
          setGeminiFormalizedQuery(result.formalizedQuery);
        } catch (error) {
          console.error("Failed to get Gemini output:", error);
          setGeminiReasoning("Error generating reasoning.");
          setGeminiPlanContent(["Error generating plan."]);
          setGeminiFormalizedQuery("Error");
        }
      } else {
        setGeminiReasoning("No problem statement provided.");
        setGeminiPlanContent(["Please go back and submit a problem."]);
        setGeminiFormalizedQuery("No input");
      }
      setIsGeminiLoading(false);
    };

    fetchGeminiOutput();
  }, []); // Run once on component mount

  const [reasoningContent, setReasoningContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);

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

  // Update effect to use geminiReasoning once it's available
  useEffect(() => {
    if (geminiReasoning && !isGeminiLoading) {
      const tokenizedSteps = chunkIntoTokens(geminiReasoning);
      setTokens(tokenizedSteps);
      setReasoningContent("");
      setCurrentTokenIndex(0);
      setIsStreaming(true);
    }
  }, [geminiReasoning, isGeminiLoading, chunkIntoTokens]);

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
      const timer = setTimeout(() => {
        setStage("stage3");
      }, 14000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const tasks: { key: string; value: ReactNode }[] = [
    { key: nanoid(), value: `Searching "${geminiFormalizedQuery}"` },
    {
      key: nanoid(),
      value: (
        <span className="inline-flex items-center gap-1">
          <SiLinkedin className="size-4" />
          <span>Scanning 52 LinkedIn profiles</span>
        </span>
      ),
    },
    {
      key: nanoid(),
      value: (
        <span className="inline-flex items-center gap-1">
          <SiGithub className="size-4" />
          <span>Analyzing 12 GitHub repositories</span>
        </span>
      ),
    },
    {
        key: nanoid(),
        value: (
          <span className="inline-flex items-center gap-1">
            <SiDribbble className="size-4" />
            <span>Reviewing 24 Dribbble portfolios</span>
          </span>
        ),
      },
  ];

  return (
      <div className="flex h-screen bg-background text-foreground">
        {/* Side Strip */}
        <div
          className={`bg-card border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              {!isCollapsed && <div className="font-bold text-2xl">Trac</div>}
              <div className="font-bold text-2xl">
              <img
                src="/1.png"
                alt="Trac Logo"
                className="w-8 h-8"
              />
              </div>
            </div>

            <div className="flex-grow"></div>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-semibold">
                  <img src="/1.png" alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
              </Button>
              {mounted && (
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "light" ? <Moon /> : <Sun />}
                </Button>
              )}
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
                {isGeminiLoading ? (
                  <PlanSkeleton />
                ) : (
                  <>
                    <Reasoning
                      className="w-full"
                      isStreaming={isStreaming}
                    >
                      <ReasoningTrigger />
                      <ReasoningContent>{reasoningContent}</ReasoningContent>
                    </Reasoning>

                    <AnimatePresence>
                      {showPlan && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Plan className="mt-4" defaultOpen={true}>
                            <PlanHeader>
                              <div>
                                <div className="mb-4 flex items-center gap-2">
                                  <FileText className="size-4" />
                                  <PlanTitle>{geminiFormalizedQuery}</PlanTitle>
                                </div>
                                <PlanDescription>
                                  {geminiReasoning}
                                </PlanDescription>
                              </div>
                              <PlanTrigger />
                            </PlanHeader>
                            <PlanContent>
                              <div className="space-y-4 text-sm">
                                <div>
                                  <h3 className="mb-2 font-semibold">Key Steps</h3>
                                  <ul className="list-inside list-disc space-y-1">
                                    {geminiPlanContent.map((step, index) => (
                                      <li key={index}>{step}</li>
                                    ))}
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
                  </>
                )}
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
                className="w-full flex flex-row items-start justify-center max-w-5xl gap-8"
              >
                <div className="flex flex-col items-start space-y-6 p-4 rounded-lg bg-gray-800 text-white shadow-lg">
                  <h3 className="text-xl font-bold mb-2">Performance Barometers</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold">Agency:</span>
                    <div className="w-32 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{85}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold">Competence:</span>
                    <div className="w-32 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{92}%</span>
                    </div>
                  </div>
                </div>

                <ProfileCard
                  name={"Ibrahim"}
                  title={"Make Your Dream Come True with a Professional Website Developer!"}
                  description={"Looking for a high-performing Website Development service that will truly represent your brand? I’m a professional Full Stack Website Developer with years of experience crafting modern,scalable websites that not only look great but perform flawlessly across all devices."}
                  imageUrl={"https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto,t_profile_original/v1/attachments/profile/photo/cae22dc07b3de50d59364ad00cb904e7-1733032799131/57124dfb-dcde-43e7-bf4f-ddbaed230ad9.png"}
                  skills={[
                    "Custom Websites",
                    "Full stack web development",
                    "MEAN stack",
                    "Express.js",
                    "Web developer",
                    "Website copywriter",
                    "Website analytics expert",
                    "Website migration expert",
                    "Website consultant",
                    "Website editor",
                    "Custom website developer",
                    "Website designer",
                    "Website developer",
                    "Full stack web developer",
                    "Front-end web developer",
                    "Back-end developer",
                    "Node.js expert",
                    "Express.js expert",
                    "MongoDB expert",
                    "Next.js developer",
                    "PHP Laravel developer",
                    "PHP developer",
                    "Laravel developer",
                    "MySQL database developer",
                    "React expert",
                    "Dashboards developer",
                    "MEAN stack expert",
                    "Web designer",
                    "JavaScript ES6 developer",
                    "Html5 expert"
                  ]}
                  rating={4.9}
                  numReviews={368}
                  sellerLevel={"Level 2"}
                  averageResponseTime={"Average response time: 1 hour"}
                  email={"ibrahim3571@gmail.com"}
                  phone={"+880 709-920-1"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
  );
};

export default Test2Page;

    