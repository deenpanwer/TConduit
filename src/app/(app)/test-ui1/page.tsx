"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MOCK_CANDIDATES } from "@/lib/data/mock-test-data";
import { cn } from "@/lib/utils";
import { 
  Search, MapPin, Briefcase, ChevronRight, Star, 
  Github, Box, ExternalLink, Zap, Shield, 
  ArrowUpRight, Code, Terminal, Clock,
  Filter, Sparkles, CheckCircle2
} from "lucide-react";

// --- Types & Normalization ---

type JuiceCandidate = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  location: string;
  matchScore: number;
  skills: string[];
  experience: string;
  about: string;
  highlights: { label: string; value: string; icon: React.ReactNode }[];
  projects: any[];
  source: 'github' | 'npm' | 'freelancer';
};

const normalizeForJuicebox = (raw: any): JuiceCandidate => {
  if (raw.source === 'freelancer') {
    return {
      id: raw.id,
      name: raw.name,
      username: raw.username,
      avatar: raw.profile_image_url,
      role: raw.headline.split(' - ')[0] || raw.headline,
      location: raw.country,
      matchScore: Math.floor(raw.competence_score || 95),
      skills: raw.skills.slice(0, 5),
      experience: "4+ Years",
      about: raw.about_me,
      highlights: [
        { label: "Rating", value: `${raw.rating}.0`, icon: <Star className="w-3 h-3 text-orange-400" /> },
        { label: "Projects", value: `${raw.num_projects}`, icon: <Briefcase className="w-3 h-3 text-blue-400" /> },
      ],
      projects: [],
      source: 'freelancer'
    };
  } else if (raw.source === 'npm') {
    return {
      id: raw.id,
      name: raw.name || raw.username,
      username: raw.username,
      avatar: raw.avatar_url,
      role: "Senior Package Maintainer",
      location: "Remote",
      matchScore: 98,
      skills: ["Node.js", "TypeScript", "System Design", "Open Source"],
      experience: "6+ Years",
      about: `Maintainer of ${raw.total_packages} packages with over ${(raw.total_downloads_weekly/1000).toFixed(1)}k weekly downloads. Specialized in scalable infrastructure and developer tools.`,
      highlights: [
        { label: "Downloads", value: `${(raw.total_downloads_weekly/1000).toFixed(0)}k/wk`, icon: <Zap className="w-3 h-3 text-yellow-400" /> },
        { label: "Packages", value: `${raw.total_packages}`, icon: <Box className="w-3 h-3 text-red-400" /> },
      ],
      projects: raw.portfolio,
      source: 'npm'
    };
  } else { // GitHub
    const user = raw.raw_data.user;
    return {
      id: raw.id,
      name: user.name || user.login,
      username: user.login,
      avatar: user.avatar_url,
      role: user.bio ? user.bio.split(',')[0] : "Software Engineer",
      location: user.location || "Global",
      matchScore: 92,
      skills: raw.raw_data.repos.map((r: any) => r.language).filter(Boolean).slice(0, 5),
      experience: "5+ Years",
      about: user.bio || "Passionate open source contributor and software engineer.",
      highlights: [
        { label: "Followers", value: `${user.followers}`, icon: <Github className="w-3 h-3 text-purple-400" /> },
        { label: "Repos", value: `${user.public_repos}`, icon: <Code className="w-3 h-3 text-green-400" /> },
      ],
      projects: raw.raw_data.repos,
      source: 'github'
    };
  }
};

export default function JuiceboxTestPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [showMoreProjects, setShowMoreProjects] = useState(false);

  const candidates = useMemo(() => {
     // Generate more candidates for the feeling of a full platform
     let list = [...MOCK_CANDIDATES];
     while (list.length < 12) {
        const clone = JSON.parse(JSON.stringify(list[Math.floor(Math.random() * list.length)]));
        clone.id = Math.random().toString(36).substr(2, 9);
        list.push(clone);
     }
     return list.map(normalizeForJuicebox);
  }, []);

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  // Reset showMore when selection changes
  useMemo(() => {
    setShowMoreProjects(false);
  }, [selectedId]);

  return (
    <div className="flex h-screen bg-[#0F1115] text-white font-sans overflow-hidden selection:bg-purple-500/30">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-20 bg-[#161920] border-r border-white/5 hidden md:flex flex-col items-center py-8 gap-8 z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <div className="space-y-6 flex flex-col items-center">
          <NavItem icon={<Search className="w-5 h-5" />} active />
          <NavItem icon={<Star className="w-5 h-5" />} />
          <NavItem icon={<Briefcase className="w-5 h-5" />} />
          <NavItem icon={<Clock className="w-5 h-5" />} />
        </div>
        <div className="mt-auto">
           <Avatar className="w-10 h-10 border-2 border-white/10">
             <AvatarImage src="https://github.com/shadcn.png" />
             <AvatarFallback>JD</AvatarFallback>
           </Avatar>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LIST COLUMN */}
        <div className={cn(
          "w-full md:w-[450px] bg-[#0F1115] border-r border-white/5 flex flex-col z-10 transition-all duration-300",
          selectedId ? "hidden md:flex" : "flex"
        )}>
           
           {/* HEADER */}
           <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold tracking-tight">Talent Pool</h1>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 px-3 py-1">
                  {candidates.length} Matches
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input 
                  placeholder="Search by role, skill, or name..." 
                  className="bg-[#161920] border-white/10 pl-10 h-11 rounded-lg focus-visible:ring-purple-500/50 text-sm"
                />
              </div>
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                 {["All", "Engineering", "Design", "Product", "Contract"].map(f => (
                   <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "text-xs font-medium px-4 py-1.5 rounded-full transition-all whitespace-nowrap",
                      filter === f 
                        ? "bg-white text-black" 
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                   >
                     {f}
                   </button>
                 ))}
              </div>
           </div>

           {/* LIST */}
           <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-3">
                 {candidates.map((c) => (
                   <div 
                     key={c.id}
                     onClick={() => setSelectedId(c.id)}
                     className={cn(
                       "group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                       selectedId === c.id 
                         ? "bg-[#1C1F2A] border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]" 
                         : "bg-[#161920] border-white/5 hover:border-white/10 hover:bg-[#1C1F2A]"
                     )}
                   >
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="relative">
                          <Avatar className="w-12 h-12 rounded-lg border border-white/10">
                            <AvatarImage src={c.avatar} />
                            <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0F1115] rounded-full flex items-center justify-center border border-white/10">
                             {c.source === 'github' && <Github className="w-3 h-3 text-white" />}
                             {c.source === 'npm' && <Box className="w-3 h-3 text-red-500" />}
                             {c.source === 'freelancer' && <Star className="w-3 h-3 text-orange-500" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                             <h3 className={cn("font-medium truncate pr-2", selectedId === c.id ? "text-purple-400" : "text-white")}>
                               {c.name}
                             </h3>
                             <span className="text-xs font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                               {c.matchScore}%
                             </span>
                           </div>
                           <p className="text-sm text-gray-400 truncate mb-2">{c.role}</p>
                           <div className="flex gap-2 flex-wrap">
                              {c.skills.slice(0, 2).map(s => (
                                <span key={s} className="text-[10px] text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">
                                  {s}
                                </span>
                              ))}
                           </div>
                        </div>
                      </div>
                      {selectedId === c.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
                      )}
                   </div>
                 ))}
              </div>
           </ScrollArea>
        </div>

        {/* PROFILE DETAIL COLUMN */}
        <div className={cn(
          "flex-1 bg-[#0F1115] flex flex-col overflow-y-auto transition-all duration-300",
          selectedId ? "flex" : "hidden md:flex"
        )}>
           {selectedCandidate ? (
             <div className="max-w-4xl mx-auto w-full p-6 md:p-12 space-y-12">
                
                {/* BACK BUTTON (Mobile & Desktop) */}
                <div className="flex md:hidden mb-6">
                   <Button 
                     variant="ghost" 
                     onClick={() => setSelectedId(null)}
                     className="text-gray-400 hover:text-white pl-0"
                   >
                      <ChevronRight className="w-5 h-5 rotate-180 mr-2" />
                      Back to Pool
                   </Button>
                </div>
                <div className="hidden md:flex mb-6">
                   <Button 
                     variant="ghost" 
                     onClick={() => setSelectedId(null)}
                     className="text-gray-500 hover:text-white"
                   >
                      <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                      Close Profile
                   </Button>
                </div>

                {/* HERO */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="relative group">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative z-10">
                        <img src={selectedCandidate.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full z-0 group-hover:bg-purple-500/30 transition-all duration-700" />
                   </div>
                   
                   <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h1 className="text-4xl font-bold tracking-tight text-white">{selectedCandidate.name}</h1>
                           <Badge className="bg-green-500/20 text-green-400 border-none hover:bg-green-500/30">Verified</Badge>
                        </div>
                        <p className="text-xl text-gray-400 font-light">{selectedCandidate.role}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 pt-2">
                         <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#1C1F2A] px-4 py-2 rounded-lg border border-white/5">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            {selectedCandidate.location}
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#1C1F2A] px-4 py-2 rounded-lg border border-white/5">
                            <Briefcase className="w-4 h-4 text-blue-400" />
                            {selectedCandidate.experience}
                         </div>
                         {selectedCandidate.highlights.map((h, i) => (
                           <div key={i} className="flex items-center gap-2 text-sm text-gray-400 bg-[#1C1F2A] px-4 py-2 rounded-lg border border-white/5">
                              {h.icon}
                              <span className="font-semibold text-white">{h.value}</span>
                              <span className="text-xs opacity-70">{h.label}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="flex flex-col gap-3 min-w-[180px]">
                      <Button className="h-12 bg-white text-black hover:bg-gray-200 font-semibold rounded-xl w-full text-md">
                        Hire Candidate
                      </Button>
                      <Button variant="outline" className="h-12 border-white/10 text-white hover:bg-white/5 hover:text-white rounded-xl w-full">
                        View Resume
                      </Button>
                   </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* BIO & SKILLS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <div className="md:col-span-2 space-y-8">
                      <section>
                         <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                           <Sparkles className="w-5 h-5 text-purple-400" />
                           About
                         </h3>
                         <p className="text-gray-400 leading-relaxed text-lg font-light">
                           {selectedCandidate.about}
                         </p>
                      </section>

                      <section>
                         <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                           <Code className="w-5 h-5 text-blue-400" />
                           Work History & Projects
                         </h3>
                         <div className="space-y-4">
                            {selectedCandidate.projects.length > 0 ? (
                              <>
                                {(showMoreProjects ? selectedCandidate.projects : selectedCandidate.projects.slice(0, 4)).map((p: any, i) => (
                                  <div key={i} className="group p-5 bg-[#161920] border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
                                     <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-base font-medium text-white group-hover:text-purple-400 transition-colors">
                                          {p.name || "Untitled Project"}
                                        </h4>
                                        {p.url || p.html_url || p.npm_url ? (
                                          <a href={p.url || p.html_url || p.npm_url} target="_blank" className="text-gray-500 hover:text-white">
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                        ) : null}
                                     </div>
                                     <p className="text-sm text-gray-500 line-clamp-2">
                                       {p.description || "No description provided."}
                                     </p>
                                     <div className="mt-4 flex gap-4 text-xs text-gray-400 font-mono">
                                        {p.language && <span>{p.language}</span>}
                                        {p.downloads !== undefined && <span>{p.downloads.toLocaleString()} downloads</span>}
                                        {p.stars !== undefined && <span>{p.stars} stars</span>}
                                     </div>
                                  </div>
                                ))}
                                
                                {selectedCandidate.projects.length > 4 && (
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setShowMoreProjects(!showMoreProjects)}
                                    className="w-full h-12 border border-dashed border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl mt-2"
                                  >
                                    {showMoreProjects ? "Show Less" : `Show All (${selectedCandidate.projects.length})`}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-gray-500">
                                No projects visible for this candidate type.
                              </div>
                            )}
                         </div>
                      </section>
                   </div>
                   
                   <div className="space-y-8">
                      <section>
                        <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                           {selectedCandidate.skills.map(s => (
                             <Badge key={s} variant="secondary" className="bg-[#1C1F2A] hover:bg-[#252936] text-gray-300 border-none px-3 py-1.5 text-sm font-normal">
                               {s}
                             </Badge>
                           ))}
                        </div>
                      </section>

                      <section className="bg-[#161920] p-6 rounded-2xl border border-white/5">
                         <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Vibe Check</h3>
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Technical Depth</span>
                                  <span className="text-white font-mono">9.8</span>
                               </div>
                               <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 w-[98%]" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Communication</span>
                                  <span className="text-white font-mono">9.2</span>
                               </div>
                               <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 w-[92%]" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Culture Fit</span>
                                  <span className="text-white font-mono">8.5</span>
                               </div>
                               <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 w-[85%]" />
                               </div>
                            </div>
                         </div>
                      </section>
                   </div>
                </div>

             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a candidate to view details
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, active }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-xl transition-all cursor-pointer group relative",
      active ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-white"
    )}>
      {icon}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full" />}
    </div>
  );
}
