"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CandidateStat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export interface CandidateCardProps {
  name: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  email?: string; // Added email prop
  skills?: string[];
  stats?: CandidateStat[];
  className?: string;
  onHire?: () => void;
  onViewProfile?: () => void;
}

export const CandidateCard = ({
  name,
  username,
  avatarUrl,
  bio,
  email,
  skills = [],
  stats = [],
  className,
  onHire,
  onViewProfile,
}: CandidateCardProps) => {
  const [showEmail, setShowEmail] = React.useState(false);

  const handleHireClick = () => {
    setShowEmail(true);
    if (onHire) onHire();
  };

  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full text-slate-900 dark:text-slate-100",
      className
    )}>
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-900 rounded-full -mr-32 -mt-32 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors" />
      
      {/* Profile Header */}
      <div className="relative flex flex-col items-start gap-6 mb-8">
         <div className="shrink-0 relative">
            <img 
              src={avatarUrl && !avatarUrl.startsWith('/') ? avatarUrl : `https://avatar.vercel.sh/${username}`}
              className="w-24 h-24 rounded-[2rem] object-cover ring-[8px] ring-slate-50 dark:ring-slate-900 group-hover:ring-blue-100 dark:group-hover:ring-blue-900/30 transition-all shadow-xl"
              alt={name}
            />
            {/* Permanent Pro Badge */}
            <div className="absolute -bottom-2 -right-2 bg-[#FFD21E] text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-xl uppercase tracking-widest border-2 border-white dark:border-slate-950">
              Pro
            </div>
         </div>
         
         <div className="flex-1 min-w-0 w-full">
            <h4 className="text-2xl font-black tracking-tight truncate mb-1">{name}</h4>
            <div className="flex items-center gap-2 mb-4">
               <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">@{username}</span>
            </div>
            
            {showEmail && email && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl animate-in fade-in slide-in-from-top-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Direct Contact (Time Being)</p>
                <p className="text-sm font-bold truncate selection:bg-blue-200">{email}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
               {skills.slice(0, 4).map((skill) => (
                 <Badge key={skill} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none shadow-none">
                   {skill}
                 </Badge>
               ))}
               {skills.length > 4 && (
                 <span className="text-[9px] font-bold text-slate-400 px-1">+{skills.length - 4}</span>
               )}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-2 min-h-[40px]">
              {bio || "Technical profile active in ecosystem development and artifact maintenance."}
            </p>
         </div>
      </div>

      {/* Flexible Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-8">
         {stats.map((stat, idx) => (
           <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-white dark:group-hover:bg-slate-900">
             <div className="flex items-center gap-1 mb-1">
               {stat.icon && <stat.icon className="w-3 h-3 text-slate-400" />}
               <span className="text-[14px] font-black leading-none">{stat.value.toLocaleString()}</span>
             </div>
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{stat.label}</span>
           </div>
         ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto flex gap-3 pt-6 border-t border-slate-50 dark:border-slate-900">
         <Button 
           variant="outline" 
           onClick={onViewProfile}
           className="flex-1 rounded-2xl font-black text-xs uppercase tracking-widest h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
         >
           View Profile
         </Button>
         <Button 
           onClick={handleHireClick}
           className="flex-1 rounded-2xl bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 text-white font-black text-xs uppercase tracking-widest h-12 shadow-lg"
         >
           Hire
         </Button>
      </div>
    </div>
  );
};