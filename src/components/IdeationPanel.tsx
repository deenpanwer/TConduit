
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
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path
            d="M22.2819 9.8211a5.9841 5.9841 0 0 0-.5157-2.4313 6.0242 6.0242 0 0 0-4.4965-3.2848 6.0125 6.0125 0 0 0-5.9922 1.9566 6.0047 6.0047 0 0 0-5.4674-1.9324c-2.1121 0-3.991.933-5.2217 2.476C-1.8722 9.5317.5898 14.0733 4.0189 16.321a5.9841 5.9841 0 0 0 2.4313.5157 6.0242 6.0242 0 0 0 4.4965-3.2848 6.0125 6.0125 0 0 0 5.9922-1.9566 6.0047 6.0047 0 0 0 5.4674 1.9324c2.1121 0 3.991-.933 5.2217-2.476.2577-.33.474-.6902.639-1.0708a5.9922 5.9922 0 0 0-.689-5.1594zM4.524 14.155a3.8663 3.8663 0 0 1-2.903-2.1102c-.8222-1.4243-.13-3.2385 1.2943-4.0607a3.8663 3.8663 0 0 1 4.0607 1.2943c.8222 1.4243.13 3.2385-1.2943 4.0607-1.4243.8222-3.2385.13-4.0607-1.2943.0028.005.005.0096.0028.015zm4.881-5.9922a3.8663 3.8663 0 0 1 2.903 2.1102c.8222 1.4243.13 3.2385-1.2943 4.0607a3.8663 3.8663 0 0 1-4.0607-1.2943c-.8222-1.4243-.13-3.2385 1.2943-4.0607-1.4215-.825-3.2328-.1357-4.055.015zm4.8863 5.9922a3.8663 3.8663 0 0 1-2.903-2.1102c-.8222-1.4243-.13-3.2385 1.2943-4.0607a3.8663 3.8663 0 0 1 4.0607 1.2943c.8222 1.4243.13 3.2385-1.2943 4.0607a3.8663 3.8663 0 0 1-1.1574.1841z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      url: `https://chatgpt.com/?q=${encodeURIComponent("What are the most common reasons a startup's growth stalls?")}`,
    },
    {
      name: 'Perplexity',
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
          <path d="M12 12V0h12v12h-3.375v3.375H12v-3.375zm0 0v12H0V12h3.375V8.625H12V12z" fill="currentColor"></path>
        </svg>
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
    <div className="fixed bottom-16 right-4 z-10 w-full max-w-xs sm:max-w-sm border border-black bg-white p-4 shadow-lg animate-fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif text-lg text-black">Ideate problems with AI</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {aiTools.map((tool) => (
                <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border border-black p-3 text-sm font-medium text-black transition-colors hover:bg-gray-50"
                >
                    {tool.icon}
                    <span>{tool.name}</span>
                </a>
            ))}
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">Prompts open in third-party AI tools.</p>
    </div>
  );
}
