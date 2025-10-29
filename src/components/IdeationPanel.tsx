
"use client";

import { X } from "lucide-react";

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
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path
            d="M16.551 15.333h-5.277L8.33 18.277h8.889l-2.945-2.944m-2.176-6.19h5.278l2.944-2.944H8.33l2.222 2.944m-2.222 0H3.056l-3.055 3.056v8.888L8.89 24v-8.889H3.056l3.055-3.055m8.889 0h5.278l3.055-3.055V2.778L15.444 0v8.889h5.834l-3.056 3.056"
            fill="currentColor"
          ></path>
        </svg>
      ),
      url: `https://x.com/search?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Claude',
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path
            d="M17.625 12C17.625 15.1065 15.1065 17.625 12 17.625C8.8935 17.625 6.375 15.1065 6.375 12C6.375 8.8935 8.8935 6.375 12 6.375C15.1065 6.375 17.625 8.8935 17.625 12Z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      url: 'https://claude.ai',
    },
];

export function IdeationPanel({ isOpen, onClose }: IdeationPanelProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-20 bg-black/50 md:bg-transparent md:absolute md:bottom-12 md:right-0 md:inset-auto" 
      onClick={onClose}
    >
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white p-6 shadow-lg md:absolute md:bottom-0 md:w-full md:max-w-lg md:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
          <h3 className="font-serif text-xl md:text-2xl text-black mb-4 text-center">Ideate problems with AI</h3>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {aiTools.map((tool) => (
                  <a
                      key={tool.name}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 border border-gray-200 rounded-lg p-3 text-sm font-medium text-black transition-colors hover:bg-gray-50"
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
