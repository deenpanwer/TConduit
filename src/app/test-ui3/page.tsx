"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_CANDIDATES } from "@/lib/data/mock-test-data";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  TrendingUp,
  Users,
  Award,
  Globe,
  Briefcase,
  FileText,
  BarChart3,
  PieChart,
  Check,
  Building2,
  Phone,
  Mail,
  MoreHorizontal
} from "lucide-react";

// --- Types & Normalization ---

type McKinseyCandidate = {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: string;
  contact: { email: string | null; phone: string | null };
  avatar: string;
  status: "Vetted" | "Interviewing" | "Offer Extended" | "New";
  metrics: {
    impactScore: number; // 0-100
    technicalDepth: number; // 0-100
    leadershipPotential: number; // 0-100
    globalReach: string; // e.g. "2.2M+"
  };
  summary: string;
  coreCompetencies: string[];
  education: string;
  experience: {
    title: string;
    entity: string;
    period: string;
    description: string;
  }[];
  portfolioItems: {
    name: string;
    metric: string;
    metricLabel: string;
    date: string;
    description: string;
  }[];
  source: "npm" | "github" | "freelancer";
};

const normalizeForMcKinsey = (raw: any): McKinseyCandidate => {
  const impactBase = Math.floor(Math.random() * 15) + 85; // High impact mock
  
  if (raw.source === 'npm') {
    return {
      id: raw.id,
      name: raw.name || raw.username,
      initials: (raw.name || raw.username).slice(0, 2).toUpperCase(),
      role: "Principal Infrastructure Engineer",
      location: "Global / Remote",
      contact: { email: raw.email, phone: "+1 (555) 012-3456" },
      avatar: raw.avatar_url,
      status: "Vetted",
      metrics: {
        impactScore: 98,
        technicalDepth: 99,
        leadershipPotential: 85,
        globalReach: `${(raw.total_downloads_weekly / 1000000).toFixed(1)}M Wkly`
      },
      summary: `Distinguished open-source maintainer managing ${raw.total_packages} critical infrastructure packages. Demonstrates exceptional capability in maintaining high-availability systems used by millions globally.`,
      coreCompetencies: ["System Architecture", "Node.js Ecosystem", "API Design", "Performance Engineering"],
      education: "M.S. Computer Science, Stanford University (Inferred)",
      experience: [
        { title: "Lead Maintainer", entity: "NPM Registry", period: "2018 - Present", description: "Orchestrating maintenance and feature development for core libraries." },
        { title: "Senior Software Engineer", entity: "Tech Giants (Various)", period: "2015 - 2018", description: "Consulting on scalability and developer tooling." }
      ],
      portfolioItems: raw.portfolio.map((p: any) => ({
        name: p.name,
        metric: p.downloads?.toLocaleString() || "N/A",
        metricLabel: "Downloads",
        date: new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        description: p.description
      })),
      source: "npm"
    };
  } else if (raw.source === 'github') {
    const user = raw.raw_data.user;
    return {
      id: raw.id,
      name: user.name || user.login,
      initials: (user.name || user.login).slice(0, 2).toUpperCase(),
      role: "Senior Full Stack Engineer",
      location: user.location || "Remote",
      contact: { email: user.email, phone: null },
      avatar: user.avatar_url,
      status: "Interviewing",
      metrics: {
        impactScore: 92,
        technicalDepth: 94,
        leadershipPotential: 88,
        globalReach: `${user.followers} Followers`
      },
      summary: user.bio || "Prolific contributor to the open-source community with a focus on scalable web technologies and developer productivity tools.",
      coreCompetencies: ["React/Next.js", "Cloud Infrastructure", "CI/CD Pipelines", "Team Leadership"],
      education: "B.S. Engineering, MIT (Inferred)",
      experience: [
        { title: "Open Source Contributor", entity: "GitHub", period: "2019 - Present", description: "Developing and maintaining widely used developer tools and libraries." }
      ],
      portfolioItems: raw.raw_data.repos.map((r: any) => ({
        name: r.name,
        metric: r.stars?.toString() || "0",
        metricLabel: "Stars",
        date: new Date(r.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        description: r.description
      })),
      source: "github"
    };
  } else {
    return {
      id: raw.id,
      name: raw.name,
      initials: raw.name.slice(0, 2).toUpperCase(),
      role: raw.headline.split('-')[0].trim(),
      location: raw.country,
      contact: { email: raw.email, phone: raw.phone_number },
      avatar: raw.profile_image_url,
      status: "New",
      metrics: {
        impactScore: Math.floor(raw.competence_score),
        technicalDepth: 90,
        leadershipPotential: 82,
        globalReach: `${raw.num_projects} Clients`
      },
      summary: raw.about_me,
      coreCompetencies: raw.skills.slice(0, 4),
      education: "B.Tech Computer Science (verified)",
      experience: [
        { title: "Senior Freelance Developer", entity: "Upwork / Fiverr", period: "2019 - Present", description: "Delivering high-value custom software solutions for enterprise clients." }
      ],
      portfolioItems: Array(5).fill(null).map((_, i) => ({
        name: `Enterprise Project Alpha-${i+1}`,
        metric: "5.0",
        metricLabel: "Rating",
        date: "2023",
        description: "Confidential enterprise development project involving complex system integration."
      })),
      source: "freelancer"
    };
  }
};

export default function TestUI3Page() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data Logic
  const candidates = useMemo(() => {
    let list = [...MOCK_CANDIDATES];
    // Ensure sufficient data
    while (list.length < 15) {
      const clone = JSON.parse(JSON.stringify(list[Math.floor(Math.random() * list.length)]));
      clone.id = Math.random().toString(36).substr(2, 9);
      list.push(clone);
    }
    return list.map(normalizeForMcKinsey);
  }, []);

  const selectedCandidate = candidates.find(c => c.id === selectedId) || candidates[0];

  return (
    <div className="flex h-screen bg-[#F4F5F7] text-slate-900 font-sans overflow-hidden">
      
      {/* 1. Sidebar (Collapsible) */}
      <div className={cn(
        "bg-[#0B1E3D] text-white flex flex-col transition-all duration-300 shadow-xl z-20",
        isSidebarOpen ? "w-[280px]" : "w-16"
      )}>
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <div className="w-8 h-8 bg-white text-[#0B1E3D] rounded-sm flex items-center justify-center font-serif font-bold text-xl mr-3 shrink-0">
            M
          </div>
          {isSidebarOpen && (
            <span className="font-serif text-lg tracking-wide font-semibold opacity-90 animate-in fade-in duration-300">
              MERIDIAN
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 space-y-2">
          <SidebarItem icon={<Users />} label="Talent Pipeline" active isOpen={isSidebarOpen} />
          <SidebarItem icon={<BarChart3 />} label="Market Analytics" isOpen={isSidebarOpen} />
          <SidebarItem icon={<Building2 />} label="Hiring Needs" isOpen={isSidebarOpen} />
          <SidebarItem icon={<FileText />} label="Assessments" isOpen={isSidebarOpen} />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronRight className="rotate-180 w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl text-[#0B1E3D] font-bold">Executive Search</h1>
            <div className="h-6 w-px bg-slate-300 mx-2" />
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active Campaign: Q1 Engineering Expansion
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#0B1E3D]" 
                placeholder="Search candidates..." 
              />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Mail className="w-5 h-5" />
            </Button>
            <Avatar className="w-9 h-9 ring-2 ring-slate-100">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Split View: List & Detail */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* Candidates List */}
          <div className="w-[350px] bg-white border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {candidates.length} Qualified Leads
              </span>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <Filter className="w-3 h-3 mr-2" /> Filter
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "p-5 hover:bg-slate-50 cursor-pointer transition-all duration-200 group border-l-4",
                      selectedCandidate.id === c.id 
                        ? "bg-slate-50 border-l-[#0B1E3D]" 
                        : "border-l-transparent hover:border-l-slate-300"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={cn(
                        "font-bold text-sm",
                        selectedCandidate.id === c.id ? "text-[#0B1E3D]" : "text-slate-700"
                      )}>
                        {c.name}
                      </h3>
                      <Badge variant="secondary" className={cn(
                        "text-[10px] h-5 px-1.5 rounded-sm font-medium border-none",
                        c.status === 'Vetted' ? "bg-emerald-100 text-emerald-800" :
                        c.status === 'Interviewing' ? "bg-blue-100 text-blue-800" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-1">{c.role}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {c.metrics.impactScore} Impact
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {c.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Profile Detail */}
          <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
            <div className="max-w-[1000px] mx-auto p-8 space-y-8">
              
              {/* Profile Header */}
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-8">
                <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-sm border border-slate-200 flex items-center justify-center overflow-hidden">
                      {selectedCandidate.avatar ? (
                        <img src={selectedCandidate.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-serif text-slate-400">{selectedCandidate.initials}</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-3xl font-serif font-bold text-[#0B1E3D] mb-2">
                        {selectedCandidate.name}
                      </h1>
                      <div className="text-lg text-slate-600 mb-4">{selectedCandidate.role}</div>
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" /> {selectedCandidate.location}
                        </div>
                        {selectedCandidate.contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" /> {selectedCandidate.contact.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> {selectedCandidate.experience[0]?.entity}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button className="bg-[#0B1E3D] hover:bg-[#1a2e52] text-white rounded-sm px-6 h-10 shadow-sm font-medium">
                      Schedule Interview
                    </Button>
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm px-6 h-10">
                      Download CV
                    </Button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-4 gap-8">
                  <MetricBox label="Strategic Impact" value={selectedCandidate.metrics.impactScore} sub="Top 2%" />
                  <MetricBox label="Technical Depth" value={selectedCandidate.metrics.technicalDepth} sub="Expert" />
                  <MetricBox label="Leadership" value={selectedCandidate.metrics.leadershipPotential} sub="High Potential" />
                  <MetricBox label="Global Reach" value={selectedCandidate.metrics.globalReach} sub="Audience" />
                </div>
              </div>

              {/* Executive Summary & Competencies */}
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                  
                  {/* Summary */}
                  <Card className="rounded-sm border-slate-200 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="font-serif text-lg text-[#0B1E3D]">Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-slate-700 leading-relaxed text-base">
                        {selectedCandidate.summary}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Professional Experience */}
                  <Card className="rounded-sm border-slate-200 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="font-serif text-lg text-[#0B1E3D]">Professional Trajectory</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {selectedCandidate.experience.map((exp, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-[#0B1E3D] shrink-0" />
                          <div>
                            <div className="flex items-baseline justify-between w-full">
                              <h4 className="font-bold text-slate-900">{exp.title}</h4>
                              <span className="text-sm text-slate-500 ml-4 font-mono">{exp.period}</span>
                            </div>
                            <div className="text-slate-600 text-sm font-medium mb-1">{exp.entity}</div>
                            <p className="text-slate-500 text-sm leading-relaxed">{exp.description}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Detailed Portfolio / Projects */}
                  <Card className="rounded-sm border-slate-200 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                      <CardTitle className="font-serif text-lg text-[#0B1E3D]">Key Initiatives & Portfolio</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs uppercase font-bold tracking-wider text-slate-500">
                        View All
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-slate-200">
                            <TableHead className="font-bold text-slate-700">Project / Package</TableHead>
                            <TableHead className="font-bold text-slate-700">Key Metric</TableHead>
                            <TableHead className="font-bold text-slate-700">Timeline</TableHead>
                            <TableHead className="font-bold text-slate-700 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCandidate.portfolioItems.slice(0, 5).map((item, i) => (
                            <TableRow key={i} className="hover:bg-slate-50 border-b-slate-100">
                              <TableCell className="font-medium text-slate-900">
                                {item.name}
                                <div className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">{item.description}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-mono text-slate-900 font-medium">{item.metric}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{item.metricLabel}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm">{item.date}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                </div>

                {/* Right Column: Skills & Education */}
                <div className="space-y-8">
                  
                  <Card className="rounded-sm border-slate-200 shadow-sm bg-[#0B1E3D] text-white">
                    <CardHeader className="pb-3 border-white/10">
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        Core Competencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {selectedCandidate.coreCompetencies.map((skill, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm font-medium opacity-90">{skill}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(dot => (
                              <div key={dot} className={cn("w-1.5 h-1.5 rounded-full", dot <= 4 ? "bg-amber-400" : "bg-white/20")} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-sm border-slate-200 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="font-serif text-lg text-[#0B1E3D]">Credentials</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div>
                        <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Education</h5>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{selectedCandidate.education}</div>
                            <div className="text-sm text-slate-500">Graduated with Honors</div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />

                      <div>
                        <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Verification</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-sm border border-emerald-100">
                            <Check className="w-4 h-4" /> Identity Verified
                          </div>
                          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-sm border border-emerald-100">
                            <Check className="w-4 h-4" /> Skills Assessment Passed
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-slate-100 p-6 rounded-sm text-center border border-slate-200">
                    <h4 className="font-serif font-bold text-[#0B1E3D] mb-2">Internal Notes</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      Candidate is a strong fit for the Staff Engineer role. Highly recommended for final round interviews.
                    </p>
                    <Button variant="outline" className="w-full bg-white border-slate-300 text-slate-700">Add Note</Button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, isOpen }: { icon: React.ReactNode, label: string, active?: boolean, isOpen?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors relative group",
      active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
    )}>
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />}
      <div className="shrink-0">{icon}</div>
      {isOpen && (
        <span className="text-sm font-medium tracking-wide animate-in fade-in slide-in-from-left-2 duration-300">
          {label}
        </span>
      )}
      {!isOpen && (
        <div className="absolute left-16 bg-[#0B1E3D] text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string, value: string | number, sub: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-serif text-[#0B1E3D]">{value}</div>
      <div className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> {sub}
      </div>
    </div>
  );
}
