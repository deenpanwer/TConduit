"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, Check, Cpu, Database, FileCode, Info, Globe,
  Lock, Star, Download, ShieldCheck, MapPin, Zap, ExternalLink,
  Moon, Sun, RefreshCw, LayoutTemplate, Briefcase, GraduationCap
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const MOCK_PROFILE = {
  id: "user_123",
  name: "Sarah Jenkins",
  username: "sjenkins_dev",
  headline: "Senior AI Research Engineer & Systems Architect",
  bio: "Specializing in large-scale distributed systems and transformer model optimization. Ex-OpenAI, currently building next-gen inference engines.",
  location: "San Francisco, CA",
  avatar: "https://i.pravatar.cc/300?u=sjenkins_dev",
  stats: {
    models: 42,
    datasets: 15,
    papers: 8,
    discussions: 156,
    upvotes: 2400,
    followers: 8500
  },
  skills: ["PyTorch", "Rust", "CUDA", "Distributed Systems", "NLP"],
  orgs: [
    { name: "Hugging Face", avatar: "https://avatars.githubusercontent.com/u/48293186?s=200&v=4" },
    { name: "Meta AI", avatar: "https://avatars.githubusercontent.com/u/10266060?s=200&v=4" }
  ],
  verified: true,
  rating: 4.9,
  reviews: 124,
  hourlyRate: 150
};

export default function Test9Page() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    triggerLoad();
  }, []);

  const triggerLoad = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000); // Simulate network request
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-12 font-sans transition-colors duration-300">
      
      {/* Header Controls */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">UI Candidate Lab</h1>
          <p className="text-muted-foreground">Comparing architectural variants for the new Search Interface.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button onClick={triggerLoad} disabled={loading} className="font-bold">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Reload Interface
          </Button>
        </div>
      </div>

      {/* Grid Display */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- Variant 1: The "Classic" (Test 8 Replica) --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <Badge variant="outline" className="font-mono text-xs">VARIANT A (Test 8)</Badge>
          </div>
          {loading ? <CardSkeletonV1 /> : <Variant1Card profile={MOCK_PROFILE} />}
        </div>

        {/* --- Variant 2: The "Modern Dark" (Test UI Replica) --- */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
            <Badge variant="outline" className="font-mono text-xs">VARIANT B (Test UI)</Badge>
          </div>
          {loading ? <CardSkeletonV2 /> : <Variant2Card profile={MOCK_PROFILE} />}
        </div>

        {/* --- Variant 3: The "Hybrid" (Best of Both) --- */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
            <Badge variant="outline" className="font-mono text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">VARIANT C (Proposed)</Badge>
          </div>
          {loading ? <CardSkeletonV3 /> : <Variant3Card profile={MOCK_PROFILE} />}
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// VARIANT 1: The "Hugging Face" Style (Direct port from Test 8)
// ----------------------------------------------------------------------
const Variant1Card = ({ profile }: { profile: typeof MOCK_PROFILE }) => (
  <div className="p-8 rounded-[2.5rem] border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full text-slate-900 dark:text-slate-100">
    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-900 rounded-full -mr-32 -mt-32 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors" />
    
    <div className="relative flex flex-col items-start gap-6 mb-8">
       <div className="shrink-0 relative">
          <img 
            src={profile.avatar}
            className="w-24 h-24 rounded-[2rem] object-cover ring-[8px] ring-slate-50 dark:ring-slate-900 group-hover:ring-blue-100 dark:group-hover:ring-blue-900/30 transition-all shadow-xl"
            alt={profile.name}
          />
          <div className="absolute -bottom-2 -right-2 bg-[#FFD21E] text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-xl uppercase tracking-widest border-2 border-white dark:border-slate-950">
            Pro
          </div>
       </div>
       <div className="flex-1 min-w-0 w-full">
          <h4 className="text-2xl font-black tracking-tight truncate mb-1">{profile.name}</h4>
          <div className="flex items-center gap-2 mb-4">
             <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">@{profile.username}</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-4">
             {profile.skills.slice(0, 3).map((skill) => (
               <Badge key={skill} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none shadow-none">
                 {skill}
               </Badge>
             ))}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-2">
            {profile.bio}
          </p>
       </div>
    </div>

    {/* Technical Activity Grid */}
    <div className="grid grid-cols-3 gap-2 mb-8">
       {[
         { label: 'Models', val: profile.stats.models, icon: Cpu },
         { label: 'Datasets', val: profile.stats.datasets, icon: Database },
         { label: 'Papers', val: profile.stats.papers, icon: FileCode },
         { label: 'Discussions', val: profile.stats.discussions, icon: Info },
         { label: 'Upvotes', val: profile.stats.upvotes, icon: Check },
         { label: 'Followers', val: profile.stats.followers, icon: Globe },
       ].map((stat) => (
         <div key={stat.label} className="bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex flex-col items-center justify-center text-center">
           <span className="text-[14px] font-black leading-none mb-1">{stat.val.toLocaleString()}</span>
           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{stat.label}</span>
         </div>
       ))}
    </div>

    {/* Affiliated Orgs */}
    <div className="mb-8 p-5 bg-slate-50/30 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Affiliated Organizations</span>
      <div className="flex flex-wrap gap-4">
        {profile.orgs.map((org, i) => (
          <div key={i} className="flex items-center gap-2 group/org">
            <img 
              src={org.avatar}
              className="w-6 h-6 rounded-lg object-cover grayscale group-hover/org:grayscale-0 transition-all"
              alt={org.name}
            />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 group-hover/org:text-blue-600 transition-colors">{org.name}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-auto flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-900">
       <Button className="w-full rounded-2xl bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest h-14 shadow-xl">
         View Profile
       </Button>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// VARIANT 2: The "Black Card" Style (Direct port from Test UI)
// ----------------------------------------------------------------------
const Variant2Card = ({ profile }: { profile: typeof MOCK_PROFILE }) => (
  <div 
    className="group relative h-[28rem] rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl flex flex-col justify-end"
    style={{ 
        background: `linear-gradient(135deg, #0f172a 0%, #020617 100%)`,
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)"
    }}
  >
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
    
    {/* Top Badges */}
    <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Lock className="w-3 h-3 text-amber-200" />
            <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Top 1% Verified</span>
        </div>
        <div className="flex items-center gap-1">
             <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
             <span className="text-sm font-bold text-white">{profile.rating}</span>
        </div>
    </div>

    {/* Main Content Area */}
    <div className="relative z-10 p-8 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-32">
        <div className="flex items-end gap-5 mb-6">
             <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/20 shadow-lg shrink-0 overflow-hidden">
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover opacity-90" />
             </div>
             <div className="pb-1">
                 <h3 className="text-2xl font-bold text-white leading-none mb-2">{profile.name}</h3>
                 <p className="text-sm text-slate-400 font-medium line-clamp-1">{profile.headline}</p>
             </div>
        </div>

        <div className="space-y-4">
             <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 3).map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] text-white/70 border-white/10 bg-white/5 hover:bg-white/10">
                        {s}
                    </Badge>
                ))}
             </div>
             
             <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/10 mt-4">
                 <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block mb-1">Weekly Downloads</span>
                    <span className="text-lg font-mono font-bold text-white">2.4m</span>
                 </div>
                 <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block mb-1">Total Packages</span>
                    <span className="text-lg font-mono font-bold text-white">48</span>
                 </div>
             </div>

             <Button className="w-full bg-white text-black hover:bg-slate-200 font-bold rounded-xl h-12">
                View Full Dossier
             </Button>
        </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// VARIANT 3: The "Hybrid" (Proposed)
// ----------------------------------------------------------------------
const Variant3Card = ({ profile }: { profile: typeof MOCK_PROFILE }) => (
  <div className="bg-card text-card-foreground rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
    
    {/* Header Section with Gradient/Pattern */}
    <div className="h-32 bg-slate-100 dark:bg-slate-900 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-4 right-4 flex gap-2">
            <Badge className="bg-white/80 dark:bg-black/50 backdrop-blur-sm text-foreground hover:bg-white dark:hover:bg-black border-none shadow-sm gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Verified</span>
            </Badge>
        </div>
    </div>

    {/* Profile Section - Overlapping Header */}
    <div className="px-6 relative flex-1">
        <div className="flex justify-between items-end -mt-12 mb-4">
             <div className="relative">
                <div className="w-24 h-24 rounded-2xl p-1 bg-background shadow-lg">
                    <img src={profile.avatar} className="w-full h-full rounded-xl object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                </div>
             </div>
             <div className="flex flex-col items-end mb-1">
                 <div className="text-2xl font-bold font-mono">{profile.rating}</div>
                 <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rating</div>
             </div>
        </div>

        <div className="mb-6">
            <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-primary transition-colors">{profile.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{profile.headline}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </div>
                <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> 5y Exp
                </div>
            </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-secondary/50 rounded-xl border border-border/50 text-center">
                <div className="text-sm font-bold">{profile.stats.followers}</div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">Followers</div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-xl border border-border/50 text-center">
                <div className="text-sm font-bold">{profile.stats.models}</div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">Models</div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-xl border border-border/50 text-center">
                <div className="text-sm font-bold">{profile.hourlyRate}/hr</div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">Rate</div>
            </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
            {profile.skills.slice(0, 4).map((s) => (
                <Badge key={s} variant="secondary" className="font-medium text-[10px] px-2.5 py-1">
                    {s}
                </Badge>
            ))}
            {profile.skills.length > 4 && (
                <Badge variant="outline" className="font-medium text-[10px] px-2.5 py-1 text-muted-foreground">
                    +{profile.skills.length - 4}
                </Badge>
            )}
        </div>
    </div>

    {/* Footer Actions */}
    <div className="p-4 border-t border-border mt-auto bg-muted/20 flex gap-3">
        <Button className="flex-1 font-bold rounded-xl h-11" size="sm">
            Hire Talent
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
            <ExternalLink className="w-4 h-4" />
        </Button>
    </div>

  </div>
);


// ----------------------------------------------------------------------
// Skeletons
// ----------------------------------------------------------------------
const CardSkeletonV1 = () => (
    <div className="p-8 rounded-[2.5rem] border border-slate-200 bg-white h-[600px] flex flex-col">
        <div className="flex gap-6 mb-8">
            <Skeleton className="w-24 h-24 rounded-[2rem]" />
            <div className="space-y-3 flex-1 pt-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-8">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
        <Skeleton className="h-32 rounded-3xl mb-8" />
        <Skeleton className="h-14 rounded-2xl mt-auto" />
    </div>
);

const CardSkeletonV2 = () => (
    <div className="h-[28rem] rounded-3xl bg-slate-900 p-8 flex flex-col justify-end space-y-4">
        <div className="flex items-end gap-5">
            <Skeleton className="h-20 w-20 rounded-2xl bg-slate-800" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4 bg-slate-800" />
                <Skeleton className="h-4 w-1/2 bg-slate-800" />
            </div>
        </div>
        <div className="flex gap-2">
            <Skeleton className="h-5 w-12 bg-slate-800" />
            <Skeleton className="h-5 w-12 bg-slate-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-800">
            <Skeleton className="h-10 bg-slate-800" />
            <Skeleton className="h-10 bg-slate-800" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl bg-slate-800" />
    </div>
);

const CardSkeletonV3 = () => (
    <div className="rounded-3xl border border-border bg-card h-[500px] flex flex-col overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <div className="px-6 flex-1">
            <div className="flex justify-between items-end -mt-12 mb-4">
                <Skeleton className="w-24 h-24 rounded-2xl ring-4 ring-background" />
                <Skeleton className="h-10 w-16 rounded-lg" />
            </div>
            <div className="space-y-3 mb-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
            </div>
        </div>
        <div className="p-4 border-t border-border mt-auto">
             <Skeleton className="h-11 w-full rounded-xl" />
        </div>
    </div>
);
