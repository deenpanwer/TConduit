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
  Search, Video, Brain, FileText, ChevronRight, 
  MapPin, Globe, CheckCircle, MessageSquare, 
  Linkedin, Github, Download, Mic, Award, Sparkles,
  Code
} from "lucide-react";

// --- Normalization for Mercor Style ---
// Mercor is clean, white/light-grey, very structured, AI-focused.

type MercorCandidate = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  hourlyRate: string;
  location: string;
  skills: string[];
  education: string;
  summary: string;
  aiAnalysis: string;
  workHistory: any[];
  badges: string[];
};

const normalizeForMercor = (raw: any): MercorCandidate => {
  if (raw.source === 'freelancer') {
    return {
      id: raw.id,
      name: raw.name,
      role: raw.headline,
      avatar: raw.profile_image_url,
      hourlyRate: "$45/hr",
      location: raw.country,
      skills: raw.skills.slice(0, 8),
      education: "Bachelor's in Computer Science",
      summary: raw.about_me,
      aiAnalysis: "Demonstrates strong consistency in delivering complex desktop applications. High client satisfaction rate indicates reliability.",
      workHistory: [], // Freelancer data structure in mock is simpler
      badges: ["Top Rated", "Python Expert"]
    };
  } else if (raw.source === 'npm') {
    return {
      id: raw.id,
      name: raw.name || raw.username,
      role: "Senior Open Source Engineer",
      avatar: raw.avatar_url,
      hourlyRate: "$85/hr",
      location: "Remote (Global)",
      skills: ["Node.js", "System Architecture", "Performance Optimization", "CI/CD"],
      education: "Master's in Software Engineering",
      summary: `Maintains major NPM packages with ${raw.total_packages} active modules. Expert in high-scale JavaScript infrastructure.`,
      aiAnalysis: "Exceptional impact in the open source community. Codebase analysis suggests mastery of modern JS ecosystems and toolchain development.",
      workHistory: raw.portfolio.map((p: any) => ({
        role: "Lead Maintainer",
        company: p.name,
        duration: "2023 - Present",
        description: p.description
      })),
      badges: ["OSS Hero", "High Impact"]
    };
  } else {
    const user = raw.raw_data.user;
    return {
      id: raw.id,
      name: user.name || user.login,
      role: "Full Stack Developer",
      avatar: user.avatar_url,
      hourlyRate: "$60/hr",
      location: user.location || "Remote",
      skills: ["React", "Cloud Infrastructure", "API Design", "AI Integration"],
      education: "Self Taught / Bootcamp Grad",
      summary: user.bio || "Building the future of tech through open collaboration.",
      aiAnalysis: "Strong GitHub activity with consistent contribution graph. Shows versatility across multiple languages and frameworks.",
      workHistory: raw.raw_data.repos.map((r: any) => ({
        role: "Core Contributor",
        company: r.name,
        duration: "2022 - 2024",
        description: r.description
      })),
      badges: ["Fast Learner", "GitHub Star"]
    };
  }
};

export default function MercorTestPage() {
  const [activeTab, setActiveTab] = useState("vetting");
  const [showMoreExperience, setShowMoreExperience] = useState(false);
  
  const candidates = useMemo(() => {
     let list = [...MOCK_CANDIDATES];
     while (list.length < 8) {
        const clone = JSON.parse(JSON.stringify(list[Math.floor(Math.random() * list.length)]));
        clone.id = Math.random().toString(36).substr(2, 9);
        list.push(clone);
     }
     return list.map(normalizeForMercor);
  }, []);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCandidate = candidates[selectedIndex];

  // Reset showMore when selection changes
  useMemo(() => {
    setShowMoreExperience(false);
  }, [selectedIndex]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex">
       
       {/* SEARCH / SIDEBAR */}
       <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col h-screen">
          <div className="p-5 border-b border-gray-100">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                   <div className="w-4 h-4 bg-white rounded-sm" />
                </div>
                <span className="font-bold text-xl tracking-tight">Mercor</span>
             </div>
             
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search for skills, roles..." 
                  className="bg-gray-50 border-gray-200 pl-10 rounded-xl h-12 text-base focus-visible:ring-black/5"
                />
             </div>
             
             <div className="flex gap-2 text-sm text-gray-500">
                <span className="font-medium text-black">{candidates.length}</span> candidates found
             </div>
          </div>

          <ScrollArea className="flex-1">
             {candidates.map((c, idx) => (
               <div 
                 key={c.id}
                 onClick={() => setSelectedIndex(idx)}
                 className={cn(
                   "p-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex gap-4 items-start",
                   selectedIndex === idx ? "bg-blue-50/50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                 )}
               >
                  <Avatar className="w-12 h-12 border border-gray-100">
                    <AvatarImage src={c.avatar} />
                    <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 truncate">{c.name}</h4>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{c.hourlyRate}</span>
                     </div>
                     <p className="text-sm text-gray-600 line-clamp-1 mb-2">{c.role}</p>
                     <div className="flex gap-1.5 flex-wrap">
                        {c.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md">
                             {s}
                          </span>
                        ))}
                     </div>
                  </div>
               </div>
             ))}
          </ScrollArea>
       </div>

       {/* MAIN PROFILE */}
       <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* TOP BAR */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
             <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Candidates</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-black font-medium">{selectedCandidate.name}</span>
             </div>
             <div className="flex gap-3">
                <Button variant="outline" className="rounded-full border-gray-300 font-medium text-gray-700">
                   <MessageSquare className="w-4 h-4 mr-2" /> Message
                </Button>
                <Button className="rounded-full bg-black hover:bg-gray-800 text-white font-medium px-6">
                   Request Interview
                </Button>
             </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <ScrollArea className="flex-1 bg-gray-50/50">
             <div className="max-w-5xl mx-auto p-8 pb-20">
                
                {/* PROFILE HEADER CARD */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-8">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50">
                         <img src={selectedCandidate.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2">
                         <Button size="icon" variant="outline" className="rounded-full w-8 h-8">
                            <Linkedin className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="outline" className="rounded-full w-8 h-8">
                            <Github className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>

                   <div className="flex-1 space-y-4">
                      <div>
                         <h1 className="text-3xl font-bold text-gray-900 mb-1">{selectedCandidate.name}</h1>
                         <p className="text-lg text-gray-600 font-medium">{selectedCandidate.role}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                         <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {selectedCandidate.location}
                         </div>
                         <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-gray-400" />
                            {selectedCandidate.education}
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                         {selectedCandidate.badges.map(b => (
                           <Badge key={b} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {b}
                           </Badge>
                         ))}
                      </div>
                   </div>

                   <div className="w-[1px] bg-gray-100 hidden md:block" />

                   <div className="w-64 space-y-4">
                      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 text-white">
                         <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold">AI Vetting Score</span>
                         </div>
                         <div className="text-4xl font-bold mb-1">98<span className="text-lg text-gray-400 font-normal">/100</span></div>
                         <div className="text-xs text-gray-400">Top 1% of candidates in your search</div>
                      </div>
                   </div>
                </div>

                {/* CONTENT TABS */}
                <div className="flex gap-8 border-b border-gray-200 mb-8">
                   {["vetting", "experience", "projects"].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "pb-4 text-sm font-semibold capitalize transition-all border-b-2",
                          activeTab === tab ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"
                        )}
                      >
                         {tab === "vetting" ? "AI Vetting & Insights" : tab}
                      </button>
                   ))}
                </div>

                {/* TAB CONTENT */}
                <div className="space-y-8">
                   
                   {/* AI VETTING SECTION */}
                   {activeTab === "vetting" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                               <Sparkles className="w-5 h-5 text-purple-600" />
                               Executive Summary
                            </h3>
                            <p className="text-gray-700 leading-relaxed text-base">
                               {selectedCandidate.aiAnalysis}
                               <br /><br />
                               {selectedCandidate.summary}
                            </p>
                         </div>

                         <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                               <h3 className="font-bold mb-4 flex items-center gap-2">
                                  <Video className="w-4 h-4 text-gray-500" />
                                  Video Interview Analysis
                               </h3>
                               <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                     <span className="text-sm text-gray-600">English Fluency</span>
                                     <Badge className="bg-green-100 text-green-700 border-none">Native / Bilingual</Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                     <span className="text-sm text-gray-600">Technical Communication</span>
                                     <Badge className="bg-green-100 text-green-700 border-none">Excellent</Badge>
                                  </div>
                                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                                     <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-0.5" />
                                     </div>
                                     <div className="flex-1">
                                        <div className="text-xs font-bold text-gray-900">Watch Intro Video</div>
                                        <div className="text-[10px] text-gray-500">01:45 • Transcribed</div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                               <h3 className="font-bold mb-4 flex items-center gap-2">
                                  <Code className="w-4 h-4 text-gray-500" />
                                  Code Quality Audit
                               </h3>
                               <div className="space-y-3">
                                  {selectedCandidate.skills.slice(0, 4).map(s => (
                                     <div key={s} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                           <span className="font-medium text-gray-700">{s}</span>
                                           <span className="text-gray-500">Expert</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                           <div className="h-full bg-blue-600 rounded-full w-[90%]" />
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   )}

                   {/* EXPERIENCE SECTION */}
                   {(activeTab === "experience" || activeTab === "projects") && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                            {selectedCandidate.workHistory.length > 0 ? (
                               (showMoreExperience ? selectedCandidate.workHistory : selectedCandidate.workHistory.slice(0, 3)).map((job, i) => (
                                  <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors">
                                     <div className="flex justify-between items-start mb-2">
                                        <div>
                                           <h4 className="font-bold text-gray-900 text-lg">{job.role}</h4>
                                           <div className="text-sm font-medium text-blue-600">{job.company}</div>
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full">{job.duration}</span>
                                     </div>
                                     <p className="text-gray-600 text-sm leading-relaxed mt-3">
                                        {job.description || "Led development of core features and infrastructure..."}
                                     </p>
                                  </div>
                               ))
                            ) : (
                              <div className="p-12 text-center text-gray-500">
                                 Detailed work history is gathered during the interview process.
                              </div>
                            )}
                         </div>
                         
                         {selectedCandidate.workHistory.length > 3 && (
                            <Button 
                              variant="ghost" 
                              onClick={() => setShowMoreExperience(!showMoreExperience)}
                              className="w-full h-12 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl"
                            >
                               {showMoreExperience ? "Show Less" : `Show All Experience (${selectedCandidate.workHistory.length})`}
                            </Button>
                         )}
                      </div>
                   )}

                </div>
             </div>
          </ScrollArea>
       </div>

    </div>
  );
}
