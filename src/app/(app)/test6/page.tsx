"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Copy, Check, User, Code, FileText, Globe, Info, 
  ChevronLeft, ChevronRight, Github, Star, GitFork, MapPin, 
  Building, Link as LinkIcon, Twitter, Trophy, Calendar, ExternalLink,
  Activity, GitCommit, Eye, Clock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

export default function TestHarvesterPage() {
  const [count, setCount] = useState(2);
  const [profileCount, setProfileCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [githubLogs, setGithubLogs] = useState<string[]>([]);
  
  // Batch Management
  const [sessionProfiles, setSessionProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startHarvest = async () => {
    setLoading(true);
    setAiLogs(["Initiating strategy session..."]);
    setGithubLogs(["Awaiting AI parameters..."]);
    setSessionProfiles([]);
    setCurrentIndex(0);

    try {
      const res = await fetch("/api/test-harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, profileCount }),
      });

      const data = await res.json();
      
      if (data.aiLogs) setAiLogs(data.aiLogs);
      if (data.githubLogs) setGithubLogs(data.githubLogs);
      
      if (data.savedProfiles && data.savedProfiles.length > 0) {
        setSessionProfiles(data.savedProfiles);
      }
      
      if (!data.success) {
        setGithubLogs(prev => [...prev, "CRITICAL: " + data.error]);
      } else {
        setGithubLogs(prev => [...prev, "--- HARVEST COMPLETE ---", `Successfully ingested: ${data.totalSaved}`]);
      }

    } catch (e: any) {
      setGithubLogs(prev => [...prev, "NETWORK ERROR: " + e.message]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < sessionProfiles.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const currentProfile = sessionProfiles[currentIndex];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-12 space-y-10 font-sans text-slate-900">
      
      {/* 1. Control Console */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-emerald-600 p-1.5 rounded-lg">
                  <Github className="w-6 h-6 text-white" />
               </div>
               <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 uppercase italic">Harvester <span className="text-emerald-600 not-italic">Pro</span></h1>
            </div>
            <p className="text-slate-500 font-medium max-w-lg">Advanced GitHub intelligence gathering. Discovering top-tier technical talent through AI niche-mapping.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
            <div className="flex flex-col px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Niches to Map</span>
              <Input 
                type="number" 
                value={count} 
                onChange={(e) => setCount(Number(e.target.value))} 
                className="w-20 h-9 border-none shadow-none text-lg font-bold p-0 focus-visible:ring-0"
              />
            </div>
            <div className="h-10 w-px bg-slate-100 mx-2" />
            <div className="flex flex-col px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Profiles / Niche</span>
              <Input 
                type="number" 
                value={profileCount} 
                onChange={(e) => setProfileCount(Number(e.target.value))} 
                className="w-20 h-9 border-none shadow-none text-lg font-bold p-0 focus-visible:ring-0"
              />
            </div>
            <div className="h-10 w-px bg-slate-100 mx-2" />
            <Button onClick={startHarvest} disabled={loading} className="bg-slate-950 text-white hover:bg-emerald-700 transition-all px-8 py-6 rounded-xl font-bold">
              {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Trophy className="w-5 h-5 mr-3" />}
              {loading ? "Discovering..." : "Execute Harvest"}
            </Button>
          </div>
        </div>

        {/* 2. Monitor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <MonitorPanel title="Strategic Brainstorming" logs={aiLogs} color="emerald" />
          <MonitorPanel title="Crawler Execution Pipeline" logs={githubLogs} color="slate" />
        </div>
      </div>

      <Separator className="max-w-7xl mx-auto opacity-50" />

      {/* 3. Result Navigator & Deep Dive */}
      {currentProfile ? (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg sticky top-6 z-50">
            <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold px-6">
              <ChevronLeft className="w-5 h-5 mr-2" /> Prev
            </Button>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                 <span className="text-xs uppercase font-bold tracking-tighter text-slate-400">Analysis Candidate</span>
                 <Badge className="bg-slate-900 text-[10px] h-5">{currentIndex + 1} / {sessionProfiles.length}</Badge>
              </div>
              <span className="text-lg font-black text-slate-800 tracking-tight">{currentProfile.user.login}</span>
            </div>

            <Button variant="outline" onClick={handleNext} disabled={currentIndex === sessionProfiles.length - 1} className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold px-6">
              Next <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: EXECUTIVE SUMMARY (4 cols) */}
            <div className="xl:col-span-4 space-y-8">
              <ExecutiveProfileCard user={currentProfile.user} meta={currentProfile.meta} />
              <CoreImpactCard user={currentProfile.user} repos={currentProfile.repos} />
              <ActivityPulseCard activity={currentProfile.activity} />
              <ConnectCard socials={currentProfile.socials} user={currentProfile.user} />
            </div>

            {/* COLUMN 2: DEEP EVIDENCE (8 cols) */}
            <div className="xl:col-span-8 space-y-8">
              <CodeCompetencyCard repos={currentProfile.repos} />
              {currentProfile.readme && <TechnicalReadmeCard content={currentProfile.readme} />}
              <RawDataInspector data={currentProfile} />
            </div>

          </div>
        </div>
      ) : (
        <EmptyState loading={loading} />
      )}
    </div>
  );
}

// --- High-End McKinsey Style Components ---

function MonitorPanel({ title, logs, color }: { title: string, logs: string[], color: string }) {
  const accent = color === "emerald" ? "border-emerald-500" : "border-slate-400";
  return (
    <div className={`bg-white rounded-2xl border-l-4 ${accent} shadow-sm overflow-hidden flex flex-col h-56 transition-all hover:shadow-md`}>
      <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</span>
        <div className={`w-2 h-2 rounded-full ${logs.length ? (color === "emerald" ? "bg-emerald-500 animate-pulse" : "bg-blue-500 animate-pulse") : "bg-slate-200"}`} />
      </div>
      <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] text-slate-600 leading-relaxed space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-slate-300 select-none">[{i+1}]</span>
            <span>{log}</span>
          </div>
        ))}
        {logs.length === 0 && <span className="text-slate-300 italic">Pipeline inactive...</span>}
      </div>
    </div>
  );
}

function ExecutiveProfileCard({ user, meta }: { user: any, meta: any }) {
  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 overflow-hidden bg-white">
      <div className="h-24 bg-gradient-to-r from-slate-900 to-slate-800 relative">
         <div className="absolute -bottom-12 left-8">
            <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-white" />
         </div>
      </div>
      <CardContent className="pt-16 pb-8 px-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{user.name || user.login}</h2>
            <div className="flex items-center gap-2 text-slate-400 mt-1">
               <Github className="w-4 h-4" />
               <span className="text-sm font-bold tracking-tight">github.com/{user.login}</span>
            </div>
          </div>
          {meta?.fetched_deep && (
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 px-3 py-1 font-bold text-[10px] uppercase">Validated Lead</Badge>
          )}
        </div>

        {user.bio && (
          <p className="text-slate-600 text-sm leading-relaxed font-medium mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
            "{user.bio}"
          </p>
        )}

        <div className="grid grid-cols-1 gap-4">
          <InfoRow icon={Building} label="Organization" value={user.company} />
          <InfoRow icon={MapPin} label="Geography" value={user.location} />
          <InfoRow icon={Calendar} label="Tenure" value={`Joined ${new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function CoreImpactCard({ user, repos }: { user: any, repos: any[] }) {
  const stars = repos?.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0) || 0;
  
  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 bg-white p-8">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Performance Metrics</h3>
      <div className="grid grid-cols-2 gap-y-10">
        <BigMetric label="Followers" value={user.followers} sub="Peer Authority" />
        <BigMetric label="Repositories" value={user.public_repos} sub="Output Volume" />
        <BigMetric label="Influence" value={stars} sub="Total Stars" />
        <BigMetric label="Public Gists" value={user.public_gists} sub="Snippets" />
      </div>
    </Card>
  );
}

function ActivityPulseCard({ activity }: { activity: any[] }) {
  if (!activity || activity.length === 0) return null;

  const lastActive = new Date(activity[0].created_at);
  const isRecent = (new Date().getTime() - lastActive.getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days

  // Process data for charts
  // 1. Velocity Chart Data (Events per day)
  const activityMap = new Map();
  activity.forEach((event: any) => {
    const date = new Date(event.created_at).toISOString().split('T')[0];
    activityMap.set(date, (activityMap.get(date) || 0) + 1);
  });
  
  const chartData = Array.from(activityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Heatmap Data (Last 28 days)
  const today = new Date();
  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: dateStr,
      count: activityMap.get(dateStr) || 0
    };
  });

  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 bg-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Activity Pulse</h3>
        <Badge variant={isRecent ? "default" : "secondary"} className={isRecent ? "bg-emerald-600" : "bg-slate-200 text-slate-500"}>
          {isRecent ? "Active" : "Inactive"}
        </Badge>
      </div>
      
      <div className="space-y-8">
        {/* Heatmap */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-bold">
            <span>28 Days Ago</span>
            <span>Today</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {heatmapDays.map((day) => (
              <div 
                key={day.date} 
                className={`h-3 w-full rounded-sm transition-all hover:scale-110 ${
                  day.count === 0 ? 'bg-slate-100' :
                  day.count < 3 ? 'bg-emerald-200' :
                  day.count < 6 ? 'bg-emerald-400' :
                  'bg-emerald-600'
                }`}
                title={`${day.date}: ${day.count} events`}
              />
            ))}
          </div>
        </div>

        {/* Velocity Chart */}
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ display: 'none' }}
              />
              <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Events List (Compact) */}
        <div className="space-y-3 pt-4 border-t border-slate-50">
          {activity.slice(0, 3).map((event: any) => (
            <div key={event.id} className="flex gap-3 items-center">
              <div className="p-1.5 bg-slate-50 rounded-md">
                 {event.type === 'PushEvent' && <GitCommit className="w-3 h-3 text-emerald-600" />}
                 {event.type === 'WatchEvent' && <Eye className="w-3 h-3 text-amber-500" />}
                 {event.type === 'CreateEvent' && <GitFork className="w-3 h-3 text-blue-500" />}
                 {!['PushEvent', 'WatchEvent', 'CreateEvent'].includes(event.type) && <Activity className="w-3 h-3 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-700 truncate">{event.type.replace('Event', '')}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{event.repo.name}</div>
              </div>
              <div className="text-[10px] text-slate-300 whitespace-nowrap">{new Date(event.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ConnectCard({ socials, user }: { socials: any[], user: any }) {
  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 bg-white p-8">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Digital Footprint</h3>
      <div className="flex flex-col gap-4">
        {user.blog && <SocialLink icon={Globe} label="Professional Blog" url={user.blog} />}
        {user.twitter_username && <SocialLink icon={Twitter} label="Twitter / X" url={`https://twitter.com/${user.twitter_username}`} />}
        {socials?.map((s, i) => (
          <SocialLink key={i} icon={LinkIcon} label={s.provider} url={s.url} />
        ))}
        {(!socials || socials.length === 0) && !user.blog && !user.twitter_username && (
          <span className="text-slate-400 text-sm italic">No external links found.</span>
        )}
      </div>
    </Card>
  );
}

function CodeCompetencyCard({ repos }: { repos: any[] }) {
  if (!repos || repos.length === 0) return null;
  const languages = Array.from(new Set(repos.map(r => r.language).filter(Boolean)));

  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 bg-white overflow-hidden">
      <CardHeader className="p-8 pb-0">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Code Competency</h3>
            <p className="text-slate-400 text-sm font-medium">Primary evidence from top GitHub repositories.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end max-w-xs">
            {languages.slice(0, 4).map((l:any) => (
              <Badge key={l} variant="outline" className="border-slate-200 text-slate-500 font-bold text-[10px]">{l}</Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.slice(0, 6).map((repo: any) => (
            <div key={repo.id} className="group p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <a href={repo.html_url} target="_blank" className="font-bold text-slate-800 hover:text-emerald-600 flex items-center gap-2 truncate pr-4">
                  {repo.name} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-black text-slate-600">{repo.stargazers_count}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{repo.description || "No project documentation available."}</p>
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    {repo.language && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{repo.language}</span>}
                    <span className="text-[10px] font-medium text-slate-300 tracking-tighter">Updated {new Date(repo.pushed_at).toLocaleDateString()}</span>
                 </div>
                 {repo.fork && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Fork</Badge>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TechnicalReadmeCard({ content }: { content: string }) {
  return (
    <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/60 bg-white overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
          <FileText className="w-5 h-5 text-emerald-600" /> 
          Strategic Narrative <span className="text-slate-400 font-medium text-sm">(Profile README)</span>
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-10 max-h-[500px] overflow-y-auto">
          <div className="prose prose-slate prose-sm max-w-none">
             <pre className="text-sm text-slate-600 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
               {content}
             </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RawDataInspector({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  return (
    <Card className="rounded-3xl border-2 border-dashed border-slate-200 shadow-none bg-transparent overflow-hidden">
      <CardHeader className="px-8 py-4 bg-white/50 flex flex-row items-center justify-between border-b border-slate-100">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Structural Intelligence (JSON)</h3>
        <Button variant="ghost" size="sm" onClick={() => {
          navigator.clipboard.writeText(json);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }} className="rounded-xl hover:bg-white">
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
        </Button>
      </CardHeader>
      <div className="p-8">
        <div className="h-40 overflow-y-auto text-[10px] font-mono text-slate-400 leading-tight">
          {json}
        </div>
      </div>
    </Card>
  );
}

// --- Atomic UI Helpers ---

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 group">
      <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider leading-none mb-1">{label}</div>
        <div className="text-sm font-bold text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function BigMetric({ label, value, sub }: { label: string, value: number | string, sub: string }) {
  return (
    <div>
      <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">{label}</div>
      <div className="text-xs font-medium text-slate-400">{sub}</div>
    </div>
  );
}

function SocialLink({ icon: Icon, label, url }: { icon: any, label: string, url: string }) {
  return (
    <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" 
       className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{label}</span>
      </div>
      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-600" />
    </a>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="max-w-7xl mx-auto text-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-slate-50 mb-6 transition-transform hover:scale-110 duration-500">
        {loading ? <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /> : <User className="w-10 h-10 text-slate-200" />}
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Pipeline Offline</h3>
      <p className="text-slate-400 font-medium max-w-sm mx-auto mt-3 leading-relaxed">
        Initiate a discovery session to map the GitHub talent landscape. Results will be analyzed and presented here.
      </p>
    </div>
  );
}