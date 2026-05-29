"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Copy, Check, Search, Terminal, Database,
  Cpu, FileCode, Layers, Info, ExternalLink, Globe,
  Rocket, BrainCircuit
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HuggingFaceTestPage() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const [logCopied, setLogCopied] = useState(false);

  const startSweep = async () => {
    if (!query) return;
    setLoading(true);
    setLogs(["Initiating intelligence sweep across HF Registry..."]);
    setResults(null);

    try {
      const res = await fetch("/api/test-hf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit }),
      });

      const data = await res.json();
      
      if (data.logs) setLogs(prev => [...prev, ...data.logs]);
      if (data.success) {
        setResults(data.results);
      } else {
        setLogs(prev => [...prev, "❌ CRITICAL ERROR: " + data.error]);
      }

    } catch (e: any) {
      setLogs(prev => [...prev, "❌ NETWORK ERROR: " + e.message]);
    } finally {
      setLoading(false);
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setLogCopied(true);
    setTimeout(() => setLogCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-12 space-y-10 font-sans text-slate-900">
      
      {/* 1. Control Console */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-[#FFD21E] p-1.5 rounded-lg shadow-lg">
                  <BrainCircuit className="w-6 h-6 text-slate-900" />
               </div>
               <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 uppercase italic">HF <span className="text-[#FFD21E] not-italic">Scout</span></h1>
            </div>
            <p className="text-slate-500 font-medium max-w-lg">Advanced talent and technical artifact mapping engine for Hugging Face ecosystems.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center px-3 border-r border-slate-100">
              <Search className="w-5 h-5 text-slate-300 mr-2" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Domain (e.g. 'vision', 'quantization')" 
                className="border-none shadow-none text-lg font-bold p-0 focus-visible:ring-0 min-w-[200px]"
                onKeyDown={(e) => e.key === 'Enter' && startSweep()}
              />
            </div>
            <div className="flex flex-col px-3 border-r border-slate-100">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Depth</span>
              <Input 
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border-none shadow-none text-sm font-black p-0 focus-visible:ring-0 w-12"
              />
            </div>
            <Button onClick={startSweep} disabled={loading} className="bg-slate-950 text-white hover:bg-slate-800 transition-all px-8 py-6 rounded-xl font-bold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Rocket className="w-5 h-5 mr-2" />}
              {loading ? "ANALYZING..." : "EXECUTE SWEEP"}
            </Button>
          </div>
        </div>

        {/* 2. Monitor Panel */}
        <div className="bg-slate-950 rounded-2xl border-l-4 border-[#FFD21E] shadow-2xl overflow-hidden flex flex-col h-48 mb-12 relative group">
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Intelligence Pipeline Monitor</span>
                <div className="flex items-center gap-4">
                  <button onClick={copyLogs} className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                    {logCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {logCopied ? "COPIED" : "COPY LOGS"}
                  </button>
                  <div className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-slate-700"}`} />
                </div>
            </div>
            <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] text-slate-400 leading-relaxed space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="text-slate-700 select-none">[{i+1}]</span>
                        <span className={log.includes('✅') || log.includes('🚀') ? 'text-emerald-400' : log.includes('❌') ? 'text-red-400' : ''}>{log}</span>
                    </div>
                ))}
                {logs.length === 0 && <span className="text-slate-700 italic">System idle. Ready for domain search...</span>}
            </div>
        </div>
      </div>

      <Separator className="max-w-7xl mx-auto opacity-50" />

      {/* 3. Result Display */}
      {results ? (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
          <Tabs defaultValue="models" className="w-full">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <Layers className="w-6 h-6 text-slate-400" />
                 Registry Intelligence
               </h3>
               <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
                 <TabsTrigger value="models" className="rounded-lg font-bold data-[state=active]:bg-slate-950 data-[state=active]:text-white">Models</TabsTrigger>
                 <TabsTrigger value="datasets" className="rounded-lg font-bold data-[state=active]:bg-slate-950 data-[state=active]:text-white">Datasets</TabsTrigger>
                 <TabsTrigger value="spaces" className="rounded-lg font-bold data-[state=active]:bg-slate-950 data-[state=active]:text-white">Spaces</TabsTrigger>
                 <TabsTrigger value="authors" className="rounded-lg font-bold data-[state=active]:bg-slate-950 data-[state=active]:text-white">Authors</TabsTrigger>
                 <TabsTrigger value="profiles-raw" className="rounded-lg font-bold data-[state=active]:bg-slate-950 data-[state=active]:text-white">Profiles (Raw)</TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value="models">
               <DataStreamViewer 
                 data={results.models} 
                 title="Model Portfolio Matrix" 
                 icon={Cpu} 
                 visualizer={(items) => (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {items.map((m: any) => (
                       <div key={m.id} className="group relative p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-slate-300 hover:shadow-2xl transition-all duration-500">
                         <div className="flex justify-between items-start mb-6">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Architecture</span>
                             <Badge variant="outline" className="w-fit bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px] uppercase px-2 py-0.5">
                               {m.pipeline_tag || 'Standard'}
                             </Badge>
                           </div>
                           <div className="flex gap-4 text-right">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Likes</span>
                                <span className="text-xs font-black text-slate-900">{m.likes.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Usage</span>
                                <span className="text-xs font-black text-slate-900">{m.downloads?.toLocaleString() || '0'}</span>
                              </div>
                           </div>
                         </div>
                         
                         <h4 className="font-bold text-slate-900 text-lg leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                            {m.id.split('/')[1] || m.id}
                            <span className="block text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">by {m.id.split('/')[0]}</span>
                         </h4>

                         <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                               <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Library</span>
                               <span className="text-[10px] font-bold text-slate-700 truncate block">{m.library_name || 'N/A'}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                               <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Created</span>
                               <span className="text-[10px] font-bold text-slate-700 block">{new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                            </div>
                         </div>

                         <div className="flex flex-wrap gap-1.5">
                            {m.tags?.filter((t: string) => !t.includes(':')).slice(0, 4).map((t: string) => (
                              <span key={t} className="text-[9px] font-bold text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-lg border border-slate-100 capitalize">
                                {t.replace('-', ' ')}
                              </span>
                            ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               />
            </TabsContent>
            
            <TabsContent value="datasets">
               <DataStreamViewer 
                 data={results.datasets} 
                 title="Dataset Portfolio Review" 
                 icon={Database} 
                 visualizer={(items) => (
                   <div className="space-y-8">
                     {items.map((d: any) => (
                       <div key={d.id} className="p-8 rounded-[3rem] border border-slate-100 bg-white hover:border-slate-200 hover:shadow-2xl transition-all group">
                         <div className="flex flex-col gap-6">
                           <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.25em] mb-2 block">Principal Entity</span>
                                <h4 className="text-4xl font-black text-slate-900 mb-1">{d.id.split('/')[0]}</h4>
                                <p className="text-base font-bold text-slate-400 tracking-tight">Path: /{d.id.split('/')[1]}</p>
                              </div>
                              <div className="flex flex-col items-end gap-3 min-w-fit">
                                <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-black px-4 py-1.5 uppercase tracking-tighter">
                                  {d.tags?.find((t: string) => t.startsWith('size_categories:'))?.split(':')[1] || 'Standard Scale'}
                                </Badge>
                                <div className="text-right">
                                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Global Downloads</span>
                                  <span className="text-xl font-black text-slate-900">{d.downloads?.toLocaleString() || '0'}</span>
                                </div>
                              </div>
                           </div>

                           <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                              <div className="text-[15px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap italic">
                                {d.description 
                                  ? d.description.split('See the full description')[0]
                                      .replace(/\n/g, '\n')
                                      .replace(/\t/g, '\t')
                                      .trim() 
                                  : 'System failed to extract technical summary for this artifact.'}
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-4">
                              <div className="flex flex-wrap gap-2">
                                {d.tags?.filter((t: string) => t.startsWith('modality:')).map((t: string) => (
                                  <Badge key={t} variant="outline" className="text-[10px] font-black text-slate-500 uppercase border-slate-200 px-5 py-2 rounded-xl bg-white">{t.split(':')[1]}</Badge>
                                ))}
                              </div>
                              <Button variant="ghost" className="rounded-2xl font-black text-slate-400 gap-3 hover:bg-slate-950 hover:text-white transition-all px-8 py-7 border border-slate-100 hover:border-slate-900 group/btn">
                                 <ExternalLink className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                 HF REPOSITORY
                              </Button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               />
            </TabsContent>

            <TabsContent value="spaces">
               <DataStreamViewer 
                 data={results.spaces} 
                 title="Live Deployment Analytics" 
                 icon={Rocket} 
                 visualizer={(items) => (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {items.map((s: any) => (
                       <div key={s.id} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:shadow-2xl transition-all border-b-8 border-b-blue-500/10 hover:border-b-blue-500 group">
                         <div className="flex justify-between items-center mb-8">
                           <Badge variant="outline" className="text-[11px] font-black uppercase tracking-widest border-slate-100 text-slate-400 px-4 py-1">
                             {s.sdk} STACK
                           </Badge>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                             <span className="text-sm font-black text-slate-900">{s.likes}</span>
                           </div>
                         </div>
                         <h5 className="font-black text-slate-900 text-2xl mb-1 truncate">{s.id.split('/')[1]}</h5>
                         <p className="text-sm font-bold text-slate-400 mb-10 uppercase tracking-[0.15em]">{s.id.split('/')[0]}</p>
                         <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-slate-300 uppercase block tracking-widest mb-1">Created Date</span>
                               <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-slate-950 group-hover:text-white transition-all">
                               <ExternalLink className="w-5 h-5" />
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               />
            </TabsContent>

            <TabsContent value="authors">
               <DataStreamViewer 
                 data={results.profiles} 
                 title="Global Contributor Network" 
                 icon={Globe} 
                 visualizer={(profiles) => (
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                     {profiles.map((p: any) => (
                       <div key={p.user} className="p-10 rounded-[3rem] border border-slate-100 bg-white shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 group-hover:bg-blue-50/50 transition-colors" />
                         
                         <div className="relative flex flex-col md:flex-row items-start gap-10 mb-8">
                            <div className="shrink-0 relative">
                               <img 
                                 src={p.avatarUrl && !p.avatarUrl.startsWith('/') ? p.avatarUrl : `https://avatar.vercel.sh/${p.user}`}
                                 className="w-28 h-28 rounded-[2.5rem] object-cover ring-[10px] ring-slate-50 group-hover:ring-blue-100 transition-all shadow-xl"
                                 alt={p.user}
                               />
                               {p.isOrg ? (
                                 <div className="absolute -bottom-2 -right-2 bg-slate-950 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-xl uppercase tracking-widest border-2 border-white">
                                   Org
                                 </div>
                               ) : p.isPro ? (
                                 <div className="absolute -bottom-2 -right-2 bg-[#FFD21E] text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-xl uppercase tracking-widest border-2 border-white">
                                   Pro
                                 </div>
                               ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-2xl font-black text-slate-900 tracking-tight truncate mb-0.5">{p.fullname || p.user}</h4>
                               <div className="flex items-center gap-2 mb-4">
                                  <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">@{p.user}</span>
                                  {p.createdAt && (
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Joined {new Date(p.createdAt).getFullYear()}</span>
                                  )}
                               </div>
                               
                               <div className="flex flex-wrap gap-1.5 mb-4">
                                  {p.scoutedFrom?.map((source: string) => (
                                    <Badge key={source} className="bg-slate-100 text-slate-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none shadow-none">
                                      {source}
                                    </Badge>
                                  ))}
                               </div>

                               <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                 {p.bio || p.details || "Technical profile active in ecosystem development and artifact maintenance."}
                               </p>
                            </div>
                         </div>

                         {/* Technical Activity Grid */}
                         <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                            {[
                              { label: 'Models', val: p.numModels, icon: Cpu },
                              { label: 'Datasets', val: p.numDatasets, icon: Database },
                              { label: 'Papers', val: p.numPapers, icon: FileCode },
                              { label: 'Discussions', val: p.numDiscussions, icon: Info },
                              { label: 'Upvotes', val: p.numUpvotes, icon: Check },
                              { label: 'Followers', val: p.numFollowers, icon: Globe },
                            ].map((stat) => (
                              <div key={stat.label} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 flex flex-col items-center justify-center text-center">
                                <span className="text-[14px] font-black text-slate-900 leading-none mb-1">{stat.val?.toLocaleString() || 0}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{stat.label}</span>
                              </div>
                            ))}
                         </div>

                         {/* Affiliated Orgs */}
                         {p.orgs && p.orgs.length > 0 && (
                           <div className="mb-8 p-5 bg-slate-50/30 rounded-3xl border border-slate-100">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Affiliated Organizations</span>
                             <div className="flex flex-wrap gap-4">
                               {p.orgs.map((org: any) => (
                                 <div key={org.id} className="flex items-center gap-2 group/org">
                                   <img 
                                     src={org.avatarUrl && !org.avatarUrl.startsWith('/') ? org.avatarUrl : `https://avatar.vercel.sh/${org.name}`}
                                     className="w-6 h-6 rounded-lg object-cover grayscale group-hover/org:grayscale-0 transition-all"
                                     alt={org.name}
                                   />
                                   <span className="text-[11px] font-bold text-slate-600 group-hover/org:text-blue-600 transition-colors">{org.fullname || org.name}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         <div className="mt-auto flex gap-4 pt-6 border-t border-slate-50">
                            <a 
                              href={`https://huggingface.co/${p.user}`} 
                              target="_blank" 
                              className="flex-1"
                            >
                              <Button className="w-full rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest h-14 shadow-xl shadow-slate-200">
                                View HF Profile
                              </Button>
                            </a>
                            <Button variant="outline" className="rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest h-14 px-8 hover:bg-slate-50">
                               Contact Lead
                            </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               />
            </TabsContent>

            <TabsContent value="profiles-raw">
               <DataStreamViewer 
                 data={results.profiles} 
                 title="Metadata Enrichment (Raw)" 
                 icon={Terminal} 
               />
            </TabsContent>
          </Tabs>

          {/* Full JSON Trace at Bottom */}
          <Separator className="my-12 opacity-50" />
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-xl">
                    <Database className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Intelligence Trace</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete System JSON Payload</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-2xl border-slate-200 font-bold gap-2 hover:bg-slate-950 hover:text-white transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                  }}
                >
                  <Copy className="w-4 h-4" />
                  COPY FULL TRACE
                </Button>
             </div>
             <pre className="p-8 bg-slate-950 text-slate-400 text-[10px] font-mono rounded-[2.5rem] border border-slate-800 h-96 overflow-y-auto custom-scrollbar leading-relaxed">
               {JSON.stringify(results, null, 2)}
             </pre>
          </div>
        </div>
      ) : (
        <EmptyState loading={loading} />
      )}
    </div>
  );
}

function DataStreamViewer({ data, title, icon: Icon, visualizer }: { data: any, title: string, icon: any, visualizer?: (data: any) => React.ReactNode }) {
  const [view, setView] = useState<"visual" | "json">(visualizer ? "visual" : "json");
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  return (
    <Card className="rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-4">
           <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
              <Icon className="w-5 h-5 text-slate-400" />
           </div>
           <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {visualizer && (
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mr-4">
              <button 
                onClick={() => setView("visual")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${view === 'visual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                VISUAL
              </button>
              <button 
                onClick={() => setView("json")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${view === 'json' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                JSON
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => {
            navigator.clipboard.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }} className="rounded-xl hover:bg-white text-slate-400 font-bold gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "COPIED" : "COPY JSON"}
          </Button>
        </div>
      </CardHeader>
      <div className="p-8 bg-white min-h-[400px]">
        {view === "visual" && visualizer ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {visualizer(data)}
          </div>
        ) : (
          <pre className="h-[600px] overflow-y-auto text-[11px] font-mono text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 custom-scrollbar whitespace-pre-wrap">
            {json || "No data received."} 
          </pre>
        )}
      </div>
    </Card>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="max-w-7xl mx-auto text-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-slate-50 mb-6 transition-transform hover:scale-110 duration-500">
        {loading ? <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" /> : <Layers className="w-10 h-10 text-slate-200" />}
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Intelligence Scan Required</h3>
      <p className="text-slate-400 font-medium max-w-sm mx-auto mt-3 leading-relaxed">
        Specify a technical niche to perform a metadata extraction session from the Hugging Face registry.
      </p>
    </div>
  );
}