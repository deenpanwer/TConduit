
"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type IdeationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const aiTools = [
    {
      name: 'ChatGPT',
      icon: (
        <img src="https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B" alt="ChatGPT" className="w-6 h-6" />
      ),
      url: `https://chatgpt.com/?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Perplexity',
      icon: (
        <img src="https://cdn.brandfetch.io/idNdawywEZ/w/800/h/800/theme/dark/idgTrPQ4JH.png?c=1dxbfHSJFAPEGdCLU4o5B" alt="Perplexity" className="w-6 h-6" />
      ),
      url: `https://www.perplexity.ai/?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Grok',
      icon: (
        <img src="/grok.svg" alt="Grok" className="w-6 h-6" />
      ),
      url: `https://x.com/search?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Claude',
      icon: (
        <img src="/claude.svg" alt="Claude" className="w-6 h-6" />
      ),
      url: 'https://claude.ai',
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
