"use client";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Copy, Github, Terminal } from "lucide-react";
import { toast } from "sonner";

interface DeploymentActionsProps {
  deployment: {
    uid: string;
    url: string;
    meta?: {
      githubCommitSha?: string;
    }
  }
}

export function DeploymentActions({ deployment }: DeploymentActionsProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors outline-none">
          <MoreHorizontal size={16} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-2xl border-black/10 dark:border-white/10">
        <DropdownMenuItem 
          onClick={() => window.open(`https://${deployment.url}`, '_blank')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest p-3 cursor-pointer rounded-lg"
        >
          <ExternalLink size={14} /> View Deployment
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => copyToClipboard(deployment.url, "URL")}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest p-3 cursor-pointer rounded-lg"
        >
          <Copy size={14} /> Copy URL
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
