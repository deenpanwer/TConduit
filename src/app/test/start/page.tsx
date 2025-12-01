"use client";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import {
  Queue,
  QueueItem,
  QueueItemAction,
  QueueItemActions,
  QueueItemAttachment,
  QueueItemContent,
  QueueItemDescription,
  QueueItemFile,
  QueueItemImage,
  QueueItemIndicator,
  QueueList,
  type QueueMessage,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
  type QueueTodo,
} from "@/components/ai-elements/queue";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { Button } from "@/components/ui/button";
import { SiReact } from "@icons-pack/react-simple-icons";
import { ArrowUp, FileText, ImageIcon, SearchIcon, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { type ReactNode, useCallback, useEffect, useState } from "react";

const reasoningSteps = [
  "Let me think about this hiring process step by step.",
  "\n\nFirst, I need to understand the role requirements for a Frontend Engineer.",
  "\n\nThey need to be proficient in React, Next.js, and Tailwind CSS. They should also have experience with UI/UX design principles.",
  "\n\nI will start by searching for candidates on LinkedIn, GitHub, and Dribbble.",
].join("");

const sampleMessages: QueueMessage[] = [
  {
    id: "msg-1",
    parts: [{ type: "text", text: "Review John Doe's portfolio." }],
  },
  {
    id: "msg-2",
    parts: [{ type: "text", text: "Schedule an interview with Jane Smith." }],
  },
  {
    id: "msg-3",
    parts: [
      { type: "text", text: "Send a rejection email to a candidate." },
      {
        type: "file",
        url: "https://github.com/shadcn.png",
        filename: "rejection-template.pdf",
        mediaType: "application/pdf",
      },
    ],
  },
];

const sampleTodos: QueueTodo[] = [
  {
    id: "todo-1",
    title: "Define the Frontend Engineer role.",
    description: "Write a clear job description.",
    status: "completed",
  },
  {
    id: "todo-2",
    title: "Set up the interview process.",
    status: "pending",
  },
  {
    id: "todo-3",
    title: "Find and screen candidates.",
    status: "pending",
  },
];

const StartPage = () => {
  const [messages, setMessages] = useState(sampleMessages);
  const [todos, setTodos] = useState(sampleTodos);
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);

  const handleRemoveMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleRemoveTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleSendNow = (id: string) => {
    console.log("Send now:", id);
    handleRemoveMessage(id);
  };

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
    setContent("");
    setCurrentTokenIndex(0);
    setIsStreaming(true);
  }, [chunkIntoTokens]);

  useEffect(() => {
    if (!isStreaming || currentTokenIndex >= tokens.length) {
      if (isStreaming) {
        setIsStreaming(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setContent((prev) => prev + tokens[currentTokenIndex]);
      setCurrentTokenIndex((prev) => prev + 1);
    }, 25);

    return () => clearTimeout(timer);
  }, [isStreaming, currentTokenIndex, tokens]);

  const tasks: { key: string; value: ReactNode }[] = [
    { key: nanoid(), value: 'Searching "Frontend Engineer profiles"' },
    {
      key: nanoid(),
      value: (
        <span className="inline-flex items-center gap-1" key="read-page-tsx">
          Read
          <TaskItemFile>
            <SiReact className="size-4" color="#149ECA" />
            <span>John Doe's Resume</span>
          </TaskItemFile>
        </span>
      ),
    },
    { key: nanoid(), value: "Scanning 52 LinkedIn profiles" },
    { key: nanoid(), value: "Scanning 12 GitHub repositories" },
  ];

  return (
    <div className="p-4 md:p-8">
      <Shimmer as="h1" className="text-4xl font-bold text-center mb-8">
        Hiring Dashboard
      </Shimmer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2">
          <ChainOfThought defaultOpen>
            <ChainOfThoughtHeader />
            <ChainOfThoughtContent>
              <ChainOfThoughtStep
                icon={SearchIcon}
                label="Searching for Frontend Engineer profiles"
                status="complete"
              >
                <ChainOfThoughtSearchResults>
                  {[
                    "https://www.linkedin.com",
                    "https://www.github.com",
                    "https://www.dribbble.com",
                  ].map((website) => (
                    <ChainOfThoughtSearchResult key={website}>
                      {new URL(website).hostname}
                    </ChainOfThoughtSearchResult>
                  ))}
                </ChainOfThoughtSearchResults>
              </ChainOfThoughtStep>

              <ChainOfThoughtStep
                icon={ImageIcon}
                label="Found a promising candidate: Jane Doe"
                status="complete"
              >
                <ChainOfThoughtImage caption="Jane Doe's profile photo from LinkedIn.">
                  <img
                    src="/ivas-1-scaled.webp"
                    alt="Jane Doe's profile photo"
                    className="aspect-square h-[150px] border"
                  />
                </ChainOfThoughtImage>
              </ChainOfThoughtStep>

              <ChainOfThoughtStep
                label="Jane Doe is a Frontend Engineer with 5 years of experience in React and Next.js. She is based in New York."
                status="complete"
              />

              <ChainOfThoughtStep
                icon={SearchIcon}
                label="Searching for recent work..."
                status="active"
              >
                <ChainOfThoughtSearchResults>
                  {[ "https://www.github.com/janedoe", "https://www.dribbble.com/janedoe"].map(
                    (website) => (
                      <ChainOfThoughtSearchResult key={website}>
                        {new URL(website).hostname}
                      </ChainOfThoughtSearchResult>
                    )
                  )}
                </ChainOfThoughtSearchResults>
              </ChainOfThoughtStep>
            </ChainOfThoughtContent>
          </ChainOfThought>
        </div>

        <div>
          <Plan defaultOpen={true}>
            <PlanHeader>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="size-4" />
                  <PlanTitle>Hire a Frontend Engineer</PlanTitle>
                </div>
                <PlanDescription>
                  Hire a Frontend Engineer to join the team and work on our new
                  product. The ideal candidate has experience with React,
                  Next.js, and Tailwind CSS.
                </PlanDescription>
              </div>
              <PlanTrigger />
            </PlanHeader>
            <PlanContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="mb-2 font-semibold">Key Steps</h3>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Define the role and job description</li>
                    <li>Source candidates from various platforms</li>
                    <li>Screen and interview candidates</li>
                    <li>Make an offer to the best candidate</li>
                  </ul>
                </div>
              </div>
            </PlanContent>
            <PlanFooter className="justify-end">
              <PlanAction>
                <Button size="sm">
                  Start Hiring <kbd className="font-mono">⌘↩</kbd>
                </Button>
              </PlanAction>
            </PlanFooter>
          </Plan>
        </div>

        <div className="lg:col-span-2">
          <Queue>
            {messages.length > 0 && (
              <QueueSection>
                <QueueSectionTrigger>
                  <QueueSectionLabel count={messages.length} label="Queued" />
                </QueueSectionTrigger>
                <QueueSectionContent>
                  <QueueList>
                    {messages.map((message) => {
                      const summary = (() => {
                        const textParts = message.parts.filter(
                          (p) => p.type === "text"
                        );
                        const text = textParts
                          .map((p) => p.text)
                          .join(" ")
                          .trim();
                        return text || "(queued message)";
                      })();

                      const hasFiles = message.parts.some(
                        (p) => p.type === "file" && p.url
                      );

                      return (
                        <QueueItem key={message.id}>
                          <div className="flex items-center gap-2">
                            <QueueItemIndicator />
                            <QueueItemContent>{summary}</QueueItemContent>
                            <QueueItemActions>
                              <QueueItemAction
                                aria-label="Remove from queue"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveMessage(message.id);
                                }}
                                title="Remove from queue"
                              >
                                <Trash2 size={12} />
                              </QueueItemAction>
                              <QueueItemAction
                                aria-label="Send now"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSendNow(message.id);
                                }}
                              >
                                <ArrowUp size={14} />
                              </QueueItemAction>
                            </QueueItemActions>
                          </div>
                          {hasFiles && (
                            <QueueItemAttachment>
                              {message.parts
                                .filter((p) => p.type === "file" && p.url)
                                .map((file) => {
                                  if (
                                    file.mediaType?.startsWith("image/") &&
                                    file.url
                                  ) {
                                    return (
                                      <QueueItemImage
                                        alt={file.filename || "attachment"}
                                        key={file.url}
                                        src={file.url}
                                      />
                                    );
                                  }
                                  return (
                                    <QueueItemFile key={file.url}>
                                      {file.filename || "file"}
                                    </QueueItemFile>
                                  );
                                })}
                            </QueueItemAttachment>
                          )}
                        </QueueItem>
                      );
                    })}
                  </QueueList>
                </QueueSectionContent>
              </QueueSection>
            )}
            {todos.length > 0 && (
              <QueueSection>
                <QueueSectionTrigger>
                  <QueueSectionLabel count={todos.length} label="Todo" />
                </QueueSectionTrigger>
                <QueueSectionContent>
                  <QueueList>
                    {todos.map((todo) => {
                      const isCompleted = todo.status === "completed";

                      return (
                        <QueueItem key={todo.id}>
                          <div className="flex items-center gap-2">
                            <QueueItemIndicator completed={isCompleted} />
                            <QueueItemContent completed={isCompleted}>
                              {todo.title}
                            </QueueItemContent>
                            <QueueItemActions>
                              <QueueItemAction
                                aria-label="Remove todo"
                                onClick={() => handleRemoveTodo(todo.id)}
                              >
                                <Trash2 size={12} />
                              </QueueItemAction>
                            </QueueItemActions>
                          </div>
                          {todo.description && (
                            <QueueItemDescription completed={isCompleted}>
                              {todo.description}
                            </QueueItemDescription>
                          )}
                        </QueueItem>
                      );
                    })}
                  </QueueList>
                </QueueSectionContent>
              </QueueSection>
            )}
          </Queue>
        </div>

        <div>
          <div className="w-full h-full flex flex-col gap-4">
            <Reasoning className="w-full" isStreaming={isStreaming}>
              <ReasoningTrigger />
              <ReasoningContent>{content}</ReasoningContent>
            </Reasoning>
            <Task className="w-full">
              <TaskTrigger title="Found project files" />
              <TaskContent>
                {tasks.map((task) => (
                  <TaskItem key={task.key}>{task.value}</TaskItem>
                ))}
              </TaskContent>
            </Task>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
