
"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type IdeationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const diagnosticPrompt = `Role: You are a hyper-critical, early-stage investor and **recruitment specialist**, combining the philosophies of Paul Graham (PG) on fatal mistakes, PG's approach to initial growth, and the Lean Startup methodology. Your sole purpose is to help this founder identify the single, most pressing issue behind their stagnant growth that can be addressed by **strategic hiring or team alignment.**

Founder's Problem (from Traconomics): "Why aren't you growing faster?"

STEP 1: VISIT AND ABSORB (Mandatory Context for AI)
You MUST base your questions and analysis on the core concepts from these three foundational texts, which cover startup failure, initial growth, and product-market fit.
1. PG: The 18 Mistakes That Kill Startups: https://paulgraham.com/startupmistakes.html
2. PG: Do Things That Don't Scale: https://paulgraham.com/ds.html
3. Eric Ries/Steve Blank: Lean Startup/Customer Development (Core Theme: Build-Measure-Learn & Customer Validation)

STEP 2: THE DIAGNOSTIC CHALLENGE (5 Sequential Questions)
Ask the founder five (5) extremely challenging, sequential questions based on the three absorbed texts. Each question must target a different critical area of failure that leads to slow growth.
* Q1: Must target Founder/Team (e.g., commitment, single founder, co-founder vesting).
* Q2: Must target Product/Idea (e.g., marginal niche, urgency of problem solved).
* Q3: Must target User Acquisition/Growth (e.g., doing non-scalable actions, making a small group LOVE the product).
* Q4: Must target Process/Learning (e.g., speed of iteration, validated learning, recognizing a necessary pivot).
* Q5: Must target Capital/Market (e.g., burn rate, spending efficiency, running out of money before next visible level).

Wait for the founder's complete response to all 5 questions.

STEP 3: FORMULATE THE CORE PROBLEM
After the founder has answered your questions, analyze their responses to identify the single, most dangerous, root cause of their slow growth. This cause must be a concise, professional problem statement that focuses on a **SKILL GAP, TEAM IMBALANCE, or LEADERSHIP FAILURE** ready for immediate action.

STEP 4: FINAL OUTPUT (Mandatory Human-Readable Format)
Your final response MUST ONLY contain text:

1. The concise **Root Cause Identified** (ready for copy/paste).
2. The specific **Return Link** (plain, clickable URL).

Example of Final Output:
**Root Cause Identified:** The core growth constraint is the **lack of a dedicated technical co-founder (Single Founder mistake)** needed to ensure rapid product iteration and quality programming.

**Return to Traconomics:** https://www.traconomics.com`;


const aiTools = [
    {
      name: 'ChatGPT',
      icon: (
        <img src="https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B" alt="ChatGPT" className="w-6 h-6" />
      ),
      url: `https://chatgpt.com/?q=${encodeURIComponent(diagnosticPrompt)}`,
    },
    {
      name: 'Perplexity',
      icon: (
        <img src="https://cdn.brandfetch.io/idNdawywEZ/w/800/h/800/theme/dark/idgTrPQ4JH.png?c=1dxbfHSJFAPEGdCLU4o5B" alt="Perplexity" className="w-6 h-6" />
      ),
      url: `https://www.perplexity.ai/?q=${encodeURIComponent(diagnosticPrompt)}`,
    },
    {
      name: 'Grok',
      icon: (
        <img src="/grok.svg" alt="Grok" className="w-6 h-6" />
      ),
      url: `https://grok.x.ai/?q=${encodeURIComponent(diagnosticPrompt)}`,
    },
    {
      name: 'Gemini',
      icon: (
        <img src="/gemini.svg" alt="Gemini" className="w-6 h-6" />
      ),
      url: 'https://gemini.google.com/',
    },
];

export function IdeationPanel({ isOpen, onClose }: IdeationPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className="md:absolute md:bottom-full md:right-0 md:mb-2 md:w-96"
      onClick={(e) => {
        // Allow clicks inside the panel on desktop
        if (window.innerWidth >= 768) {
          e.stopPropagation();
        }
      }}
    >
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 bg-black/30 md:hidden"
        onClick={onClose}
      ></div>

      <div 
        className={cn(
            "fixed bottom-0 left-0 right-0 z-20 bg-white p-4 text-black shadow-lg",
            "md:relative md:rounded-none md:border md:border-black"
        )}
        onClick={(e) => e.stopPropagation()}
      >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif text-lg text-black">Ideate problems with AI</h3>
            <button onClick={onClose} className="text-black hover:text-gray-600">
                <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
              {aiTools.map((tool) => (
                  <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 border border-black rounded-none p-3 text-sm font-medium text-black transition-colors hover:bg-gray-100"
                  >
                      {tool.icon}
                      <span>{tool.name}</span>
                  </a>
              ))}
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">Prompts open in third-party AI tools.</p>
      </div>
    </div>
  );
}
