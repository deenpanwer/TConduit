
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";


// Define the type for the suggestion, which was previously imported
type InitialRoleSuggestion = {
  title: string;
  final_query: string;
};

type Stage =
  | "LOADING_SUGGESTION"
  | "SHOWING_SUGGESTION"
  | "LOADING_QUESTION"
  | "SHOWING_QUESTION"
  | "LOADING_REFINEMENT"
  | "SHOWING_REFINEMENT"
  | "CONFIRMED"
  | "EDITING"
  | "ERROR";

type Plan2Props = {
  userQuery: string;
  onPlanConfirmed: (result: { title: string; final_query: string }) => void;
};

async function fetcher(url: string, body: object) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || 'An unexpected error occurred');
    }
    return res.json();
}

const motionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export function Plan2({ userQuery, onPlanConfirmed }: Plan2Props) {
  const [stage, setStage] = useState<Stage>("LOADING_SUGGESTION");
  const [suggestion, setSuggestion] = useState<InitialRoleSuggestion | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [editableTitle, setEditableTitle] = useState("");

  const handleInitialSuggestion = useCallback(async () => {
    setStage("LOADING_SUGGESTION");
    setLastAction(() => handleInitialSuggestion);
    try {
      const result = await fetcher('/api/hiring/suggestion', { userQuery });
      setSuggestion(result);
      setStage("SHOWING_SUGGESTION");
    } catch (e: any) {
      setError(e.message || "Sorry, I had trouble coming up with a suggestion.");
      setStage("ERROR");
    }
  }, [userQuery]);

  useEffect(() => {
    handleInitialSuggestion();
  }, [handleInitialSuggestion]);

  const handleYes = () => {
    if (suggestion) {
      onPlanConfirmed(suggestion);
      setStage("CONFIRMED");
    }
  };

  const handleNo = async () => {
    if (!suggestion) return;
    setStage("LOADING_QUESTION");
    const action = () => handleNo();
    setLastAction(() => action);
    try {
      const result = await fetcher('/api/hiring/question', { userQuery, rejectedTitle: suggestion.title });
      setQuestion(result.question);
      setStage("SHOWING_QUESTION");
    } catch (e: any) {
      setError(e.message || "Sorry, I had trouble thinking of a question.");
      setStage("ERROR");
    }
  };

  const handleAnswerSubmit = async () => {
    if (!suggestion || !answer) return;
    setStage("LOADING_REFINEMENT");
    const action = () => handleAnswerSubmit();
    setLastAction(() => action);
    try {
      const result = await fetcher('/api/hiring/refine', { userQuery, rejectedTitle: suggestion.title, userAnswer: answer });
      setSuggestion(result);
      setStage("SHOWING_REFINEMENT");
    } catch (e: any) {
      setError(e.message || "Sorry, I had trouble refining the role.");
      setStage("ERROR");
    }
  };
  
  const handleStartHiring = () => {
    if (suggestion) {
      onPlanConfirmed(suggestion);
      setStage("CONFIRMED");
    }
  };

  const handleEdit = () => {
    if (suggestion) {
        setEditableTitle(suggestion.title);
        setStage("EDITING");
    }
  };

  const handleSaveEdit = () => {
    if (suggestion) {
        const newSuggestion = { ...suggestion, title: editableTitle, final_query: editableTitle.toLowerCase() };
        setSuggestion(newSuggestion);
        setStage("SHOWING_REFINEMENT");
    }
  };


  return (
    <Card className={cn(
        "p-6 w-full max-w-md mx-auto transition-all duration-300 flex flex-col items-center justify-center",
        // Set a fixed height for the card
        "h-[220px]"
    )}>
      <AnimatePresence mode="wait">
        {stage === "LOADING_SUGGESTION" && (
            <motion.div key="loading-suggestion" {...motionVariants} className="w-full">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <div className="flex space-x-4">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </div>
            </motion.div>
        )}

        {stage === "ERROR" && (
            <motion.div key="error" {...motionVariants} className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                {lastAction && (
                    <Button onClick={lastAction} variant="outline">Retry</Button>
                )}
            </motion.div>
        )}

        {stage === "SHOWING_SUGGESTION" && suggestion && (
            <motion.div key="suggestion" {...motionVariants} className="w-full text-center">
                <div className="space-y-4">
                <p className="text-muted-foreground">
                    We think you're looking for:
                </p>
                <h2 className="text-2xl font-bold">{suggestion.title}</h2>
                <div className="flex space-x-4 justify-center">
                    <Button onClick={handleYes} variant="default">
                    Yes, that's right
                    </Button>
                    <Button onClick={handleNo} variant="outline">
                    Not correct
                    </Button>
                </div>
                </div>
            </motion.div>
        )}

        {stage === "LOADING_QUESTION" && (
            <motion.div key="loading-question" {...motionVariants} className="w-full">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </motion.div>
        )}

        {stage === "SHOWING_QUESTION" && (
            <motion.div key="question" {...motionVariants} className="w-full">
                <div className="space-y-4">
                <p className="text-muted-foreground">{question}</p>
                <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Your answer..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                />
                <Button onClick={handleAnswerSubmit}>Submit</Button>
                </div>
            </motion.div>
        )}

        {stage === "LOADING_REFINEMENT" && (
            <motion.div key="loading-refinement" {...motionVariants} className="w-full">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/2 mx-auto" />
                    <div className="flex space-x-4 justify-center">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </motion.div>
        )}

        {stage === "SHOWING_REFINEMENT" && suggestion && (
            <motion.div key="refinement" {...motionVariants} className="w-full text-center">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">{suggestion.title}</h2>
                    <div className="flex space-x-4 justify-center">
                        <Button onClick={handleStartHiring}>Start Hiring</Button>
                        <Button variant="secondary" onClick={handleEdit}>Edit</Button>
                    </div>
                </div>
            </motion.div>
        )}

        {stage === "EDITING" && (
            <motion.div key="editing" {...motionVariants} className="w-full">
                <div className="space-y-4">
                    <p className="text-muted-foreground">Fine-tune the role title:</p>
                    <Input 
                        value={editableTitle}
                        onChange={(e) => setEditableTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <Button onClick={handleSaveEdit}>Save</Button>
                </div>
            </motion.div>
        )}

        {stage === "CONFIRMED" && suggestion && (
            <motion.div key="confirmed" {...motionVariants}>
                <h2 className="text-xl font-bold text-green-600">Great! We'll start looking for a {suggestion.title}.</h2>
            </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
