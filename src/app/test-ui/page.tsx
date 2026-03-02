
"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Lock, Search, Star, Box, Github, MapPin, 
  ArrowUpRight, Download, Terminal, ShieldCheck, 
  ChevronRight, X, Clock, Calendar, Database, 
  Layers, Zap, Globe, FileCode
} from "lucide-react";
import { MOCK_CANDIDATES } from "@/lib/data/mock-test-data";
import { cn } from "@/lib/utils";

// --- Types ---

type UnifiedCandidate = {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  location: string;
  email?: string;
  primaryMetric: { label: string; value: string; icon: React.ReactNode; color: string; bg: string };
  secondaryMetric?: { label: string; value: string };
  skills: string[];
  sourceType: 'freelancer' | 'npm' | 'github';
  raw: any;
};

// --- Normalization ---

const normalizeCandidate = (candidate: any): UnifiedCandidate => {
  if (candidate.source === 'freelancer') {
    return {
      id: candidate.id,
      name: candidate.name,
      avatar: candidate.profile_image_url,
      headline: candidate.headline,
      location: candidate.country,
      email: candidate.email,
      primaryMetric: { 
        label: "Trust Score", 
        value: `${candidate.rating}.0`, 
        icon: <Star className="w-3.5 h-3.5" />,
        color: "text-amber-600",
        bg: "bg-amber-100"
      },
      secondaryMetric: { label: "Reviews", value: candidate.num_reviews.toString() },
      skills: candidate.skills || [],
      sourceType: 'freelancer',
      raw: candidate
    };
  } else if (candidate.source === 'npm') {
    return {
      id: candidate.id,
      name: candidate.username,
      avatar: candidate.avatar_url,
      headline: `NPM Contributor • ${candidate.total_packages} Packages`,
      location: "Global Distributed",
      email: candidate.email,
      primaryMetric: { 
        label: "Weekly Impact", 
        value: `${candidate.total_downloads_weekly}k`, 
        icon: <Download className="w-3.5 h-3.5" />,
        color: "text-rose-600",
        bg: "bg-rose-100"
      },
      secondaryMetric: { label: "Packages", value: candidate.total_packages.toString() },
      skills: ["Node.js", "JavaScript", "TypeScript", "Backend Architecture"],
      sourceType: 'npm',
      raw: candidate
    };
  } else { // GitHub
    const user = candidate.raw_data.user;
    return {
      id: candidate.id,
      name: user.name || candidate.username,
      avatar: user.avatar_url,
      headline: user.bio || "Senior Open Source Engineer",
      location: user.location || "Remote",
      email: user.email,
      primaryMetric: { 
        label: "Community", 
        value: `${user.followers}`, 
        icon: <Github className="w-3.5 h-3.5" />,
        color: "text-slate-800",
        bg: "bg-slate-200"
      },
      secondaryMetric: { label: "Repos", value: user.public_repos.toString() },
      skills: candidate.raw_data.repos.map((r: any) => r.language).filter(Boolean).slice(0, 6),
      sourceType: 'github',
      raw: candidate
    };
  }
};

// --- Visual Generators ---

const getGradient = (str: string) => {
  const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hues = [
    'from-blue-600 to-indigo-900',
    'from-emerald-600 to-teal-900',
    'from-orange-500 to-red-900',
    'from-purple-600 to-fuchsia-900',
    'from-slate-700 to-black',
    'from-pink-600 to-rose-900',
    'from-cyan-600 to-blue-900',
  ];
  return hues[Math.abs(hash) % hues.length];
};

// --- Components ---

const VerifiedBlackCard = ({ index }: { index: number }) => (
  <div 
    className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
    style={{ 
        background: `linear-gradient(135deg, #0f172a 0%, #020617 100%)`,
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
    }}
  >
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
    <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Lock className="w-3 h-3 text-amber-200" />
            <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Top 1% Verified</span>
        </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/10 shadow-lg flex items-center justify-center text-white/20 font-serif text-xl italic">
                ?
             </div>
             <div className="space-y-1">
                 <div className="h-2 w-24 bg-white/20 rounded-full animate-pulse" />
                 <div className="h-2 w-32 bg-white/10 rounded-full animate-pulse delay-75" />
             </div>
        </div>
        <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
             <Badge variant="outline" className="text-[10px] text-white/60 border-white/20">Ex-Google</Badge>
             <Badge variant="outline" className="text-[10px] text-white/60 border-white/20">YC Founder</Badge>
        </div>
    </div>
  </div>
);

const ProjectCard = ({ title, date, description, link, meta, stats, type }: any) => (
  <a 
    href={link || "#"} 
    target="_blank" 
    rel="noopener noreferrer"
    className="group block relative overflow-hidden rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
  >
    <div className={cn("h-36 w-full bg-gradient-to-br p-6 relative flex flex-col justify-end", getGradient(title))}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                 <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                     {type}
                 </div>
                 {meta && <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/90">{meta}</div>}
             </div>
             <h4 className="text-white font-bold text-lg leading-tight group-hover:underline decoration-white/50 underline-offset-4 line-clamp-1">
                {title}
            </h4>
        </div>
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
            <ArrowUpRight className="w-4 h-4" />
        </div>
    </div>
    
    <div className="p-5 flex-1 flex flex-col justify-between">
        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
            {description || "No description provided."}
        </p>
        
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
            <div className="flex gap-4">
                {stats.map((stat: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        {stat.icon}
                        <span>{stat.value}</span>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{date ? new Date(date).getFullYear() : 'N/A'}</span>
            </div>
        </div>
    </div>
  </a>
);

export default function TestUIPage() {
  const [query, setQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<UnifiedCandidate | null>(null);
  const [showMoreProjects, setShowMoreProjects] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const allCandidates = useMemo(() => {
    let raw = [...MOCK_CANDIDATES];
    // Ensure at least 15 profiles
    while (raw.length < 15) {
      const random = raw[Math.floor(Math.random() * raw.length)];
      // Clone to avoid reference issues
      const clone = JSON.parse(JSON.stringify(random));
      clone.id = Math.random().toString(36).substr(2, 9);
      if (clone.source === 'npm') clone.username += `_${Math.floor(Math.random() * 100)}`;
      raw.push(clone);
    }
    return raw.map(normalizeCandidate);
  }, []);

  const totalPages = Math.ceil(allCandidates.length / ITEMS_PER_PAGE);
  const unifiedCandidates = allCandidates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset showMore when selection changes
  useMemo(() => {
    setShowMoreProjects(false);
  }, [selectedCandidate?.id]);

  return (
    <div className="h-screen bg-[#F0F2F5] font-sans text-slate-900 overflow-hidden flex flex-col md:flex-row">
      
      {/* --- Left Panel: Master List --- */}
      <div className={cn(
          "flex flex-col h-full bg-white border-r border-slate-200 shadow-sm z-10 transition-all duration-500 ease-apple-ease",
          selectedCandidate ? "w-full md:w-[450px]" : "w-full md:w-full max-w-6xl mx-auto border-r-0 bg-[#F0F2F5] shadow-none"
      )}>
        
        <div className={cn(
            "p-6 md:p-8 sticky top-0 z-20 transition-colors duration-300",
            selectedCandidate ? "bg-white/90 backdrop-blur" : "bg-[#F0F2F5]"
        )}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <span className="text-white font-playfair font-bold text-xl italic">T</span>
                </div>
                <div>
                    <h1 className="font-playfair font-bold text-2xl tracking-tight text-slate-900 leading-none">
                        TRAC <span className="text-slate-400 font-sans font-normal text-sm ml-1">Intelligence</span>
                    </h1>
                </div>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search engineering talent..." 
                    className="h-14 pl-12 pr-4 rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-900 transition-all text-base"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-20 custom-scrollbar">
            
            {!selectedCandidate && (
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-slate-900" />
                            Verified Executive Network
                        </h3>
                        <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">Invite Only</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1,2,3].map(i => <VerifiedBlackCard key={i} index={i} />)}
                    </div>
                </div>
            )}

            <div className={cn("transition-all duration-500", !selectedCandidate && "bg-white p-8 rounded-3xl shadow-sm border border-slate-100")}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Market Candidates
                    </h3>
                </div>

                <div className="space-y-3">
                    {unifiedCandidates.map(candidate => {
                        const isSelected = selectedCandidate?.id === candidate.id;
                        return (
                            <div 
                                key={candidate.id} 
                                onClick={() => setSelectedCandidate(candidate)}
                                className={cn(
                                    "group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
                                    isSelected 
                                        ? "bg-slate-900 shadow-xl shadow-slate-900/20 z-10 scale-[1.02]" 
                                        : "bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md"
                                )}
                            >
                                <Avatar className={cn("h-14 w-14 border-2", isSelected ? "border-slate-700" : "border-slate-50")}>
                                    <AvatarImage src={candidate.avatar} />
                                    <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className={cn("font-bold text-base", isSelected ? "text-white" : "text-slate-900")}>
                                            {candidate.name}
                                        </h4>
                                        <Badge variant="secondary" className={cn("text-[10px] font-bold uppercase tracking-wider h-5", candidate.primaryMetric.bg, candidate.primaryMetric.color)}>
                                            {candidate.sourceType}
                                        </Badge>
                                    </div>
                                    <p className={cn("text-sm truncate", isSelected ? "text-slate-400" : "text-slate-500")}>
                                        {candidate.headline}
                                    </p>
                                </div>

                                {isSelected && (
                                    <ChevronRight className="text-white w-5 h-5 animate-in slide-in-from-left-2" />
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-slate-500"
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-slate-500"
                  >
                    Next
                  </Button>
                </div>
            </div>
        </div>
      </div>

      {/* --- Right Panel: The Dossier --- */}
      <div className={cn(
          "flex-1 bg-[#FAFAFA] relative overflow-hidden flex flex-col transition-all duration-500 ease-apple-ease",
          selectedCandidate ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 absolute inset-0 md:static md:w-0 md:flex-none"
      )}>
        {selectedCandidate && (
            <>
                {/* Dossier Toolbar */}
                <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)} className="mr-2">
                            <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
                        </Button>
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest hidden md:block">
                            CONFIDENTIAL CANDIDATE DOSSIER
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2 bg-white">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                        <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 gap-2 shadow-lg shadow-slate-900/20">
                            Unlock Profile
                        </Button>
                    </div>
                </div>

                {/* Dossier Body */}
                <ScrollArea className="flex-1">
                    <div className="max-w-5xl mx-auto p-8 md:p-12 space-y-12">
                        
                        {/* 1. Identity Header */}
                        <section className="flex flex-col md:flex-row gap-8 items-start">
                             <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-2xl rounded-2xl">
                                    <AvatarImage src={selectedCandidate.avatar} className="object-cover" />
                                    <AvatarFallback className="text-4xl">{selectedCandidate.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-3 -right-3 bg-slate-900 text-white p-2 rounded-lg shadow-lg">
                                    {selectedCandidate.sourceType === 'npm' && <Box className="w-5 h-5" />}
                                    {selectedCandidate.sourceType === 'github' && <Github className="w-5 h-5" />}
                                    {selectedCandidate.sourceType === 'freelancer' && <Star className="w-5 h-5" />}
                                </div>
                             </div>
                             
                             <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-slate-900 leading-tight">
                                        {selectedCandidate.name}
                                    </h1>
                                    <p className="text-lg text-slate-500 mt-2 font-medium leading-relaxed">
                                        {selectedCandidate.headline}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 shadow-sm">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {selectedCandidate.location}
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 shadow-sm">
                                        {selectedCandidate.primaryMetric.icon}
                                        {selectedCandidate.primaryMetric.value} <span className="text-slate-400 font-normal">{selectedCandidate.primaryMetric.label}</span>
                                    </div>
                                </div>
                             </div>
                        </section>

                        <Separator />

                        {/* 2. Skills & Expertise */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Terminal className="w-4 h-4" /> Core Competencies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedCandidate.skills.map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* 3. Work Artifacts (The "Visual Proof") */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> 
                                    {selectedCandidate.sourceType === 'npm' ? 'Package Registry' : 'Project Portfolio'}
                                </h3>
                                <Badge variant="outline" className="text-xs font-mono">
                                    {selectedCandidate.sourceType === 'npm' ? selectedCandidate.raw.portfolio.length : 
                                     selectedCandidate.sourceType === 'github' ? selectedCandidate.raw.raw_data.repos.length : 
                                     selectedCandidate.raw.num_projects} ITEMS
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* NPM Render */}
                                {selectedCandidate.sourceType === 'npm' && (showMoreProjects ? selectedCandidate.raw.portfolio : selectedCandidate.raw.portfolio.slice(0, 3)).map((pkg: any, i: number) => (
                                    <ProjectCard 
                                        key={i}
                                        type="NPM Package"
                                        title={pkg.name}
                                        date={pkg.date}
                                        description={pkg.description}
                                        link={pkg.npm_url}
                                        meta={`v${pkg.version}`}
                                        stats={[
                                            { icon: <Download className="w-3.5 h-3.5" />, value: pkg.downloads }
                                        ]}
                                    />
                                ))}

                                {/* GitHub Render */}
                                {selectedCandidate.sourceType === 'github' && (showMoreProjects ? selectedCandidate.raw.raw_data.repos : selectedCandidate.raw.raw_data.repos.slice(0, 3)).map((repo: any, i: number) => (
                                    <ProjectCard 
                                        key={i}
                                        type="Repository"
                                        title={repo.name}
                                        date={repo.updated_at}
                                        description={repo.description}
                                        link={repo.html_url}
                                        meta={repo.language}
                                        stats={[
                                            { icon: <Star className="w-3.5 h-3.5" />, value: repo.stars },
                                            { icon: <FileCode className="w-3.5 h-3.5" />, value: repo.size + 'kb' }
                                        ]}
                                    />
                                ))}

                                {/* Freelancer Render */}
                                {selectedCandidate.sourceType === 'freelancer' && (
                                    <div className="col-span-full">
                                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-6">
                                            <h4 className="font-playfair font-bold text-xl mb-4 flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-amber-500" />
                                                Professional Summary
                                            </h4>
                                            <p className="text-slate-600 leading-relaxed text-lg font-light whitespace-pre-wrap">
                                                {selectedCandidate.raw.about_me}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                                                <div className="text-4xl font-bold text-slate-900">{selectedCandidate.raw.num_projects}</div>
                                                <div className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-semibold">Projects</div>
                                            </div>
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                                                <div className="text-4xl font-bold text-slate-900">{selectedCandidate.raw.rating}</div>
                                                <div className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-semibold">Rating</div>
                                            </div>
                                            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                                                <div className="text-4xl font-bold text-slate-900">4.5y</div>
                                                <div className="text-xs text-slate-400 uppercase tracking-widest mt-2 font-semibold">Experience</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Show More Button */}
                            {((selectedCandidate.sourceType === 'npm' && selectedCandidate.raw.portfolio.length > 3) ||
                              (selectedCandidate.sourceType === 'github' && selectedCandidate.raw.raw_data.repos.length > 3)) && (
                                <div className="mt-8 flex justify-center">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowMoreProjects(!showMoreProjects)}
                                        className="rounded-full px-8 py-6 font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        {showMoreProjects ? "Show Less" : "Show All Work Artifacts"}
                                    </Button>
                                </div>
                            )}
                        </section>
                        
                        {/* Call to Action */}
                        <div className="pt-8 pb-12">
                             <Button className="w-full h-14 text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200/50 rounded-xl transition-all hover:scale-[1.01]">
                                Contact {selectedCandidate.name.split(' ')[0]}
                             </Button>
                             <div className="flex justify-center mt-6 gap-6 text-slate-400">
                                 <div className="flex items-center gap-1.5 text-xs font-medium">
                                     <ShieldCheck className="w-3.5 h-3.5" /> Background Check Passed
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-medium">
                                     <Globe className="w-3.5 h-3.5" /> Remote Ready
                                 </div>
                             </div>
                        </div>
                    </div>
                </ScrollArea>
            </>
        )}
      </div>

    </div>
  );
}
