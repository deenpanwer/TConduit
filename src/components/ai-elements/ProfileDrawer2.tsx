"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Briefcase,
  MapPin,
  Star,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Users,
  Search,
  Calendar,
  CheckCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface ProfileDrawer2Props {
  isOpen: boolean;
  onClose: () => void;
  profile: any; // Raw GitHub profile data
}

const ProfileDrawer2 = ({ isOpen, onClose, profile }: ProfileDrawer2Props) => {
  // Normalize data between raw_data (nested) and github_profiles (flat)
  const isFlat = profile && !profile.user;
  
  const user = isFlat ? profile : (profile?.user || {});
  const repos = isFlat ? (profile?.full_repos || []) : (profile?.repos || []);
  let readme = isFlat ? (profile?.readme_text || "") : (profile?.readme || "");
  const activity = isFlat ? (profile?.full_activity || []) : (profile?.activity || []);
  const meta = isFlat ? { 
    source_keyword: profile?.source_keyword, 
    crawled_at: profile?.scraped_at 
  } : (profile?.meta || {});

  // Pre-process README to fix Mixed Content (HTTP -> HTTPS) for common badge providers
  if (readme) {
    readme = readme.replace(/http:\/\/github-readme-stats\.vercel\.app/g, 'https://github-readme-stats.vercel.app');
    readme = readme.replace(/http:\/\/github-profile-summary-cards\.vercel\.app/g, 'https://github-profile-summary-cards.vercel.app');
    readme = readme.replace(/http:\/\/komarev\.com/g, 'https://komarev.com');
  }
  
  // Fix: Handle both 'username' (flat table) and 'login' (raw GitHub)
  const handle = user.username || user.login || "user";
  const displayName = user.name || handle;

  const socials = isFlat ? [
    profile?.linkedin_url && { provider: 'linkedin', url: profile.linkedin_url },
    profile?.twitter_url && { provider: 'twitter', url: profile.twitter_url },
    profile?.leetcode_url && { provider: 'leetcode', url: profile.leetcode_url },
    profile?.stackoverflow_url && { provider: 'stackoverflow', url: profile.stackoverflow_url },
    profile?.portfolio_url && { provider: 'portfolio', url: profile.portfolio_url },
  ].filter(Boolean) : (profile?.socials || []);

  // Derived Data
  const totalStars = isFlat ? (profile?.total_stars || 0) : repos.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0);
  
  // Fix: Skill Fallbacks (Use source_keyword if languages are empty)
  const languages = isFlat 
    ? (profile?.top_languages?.length > 0 ? profile.top_languages : (meta.source_keyword ? [meta.source_keyword] : []))
    : Array.from(new Set(repos.map((r: any) => r.language).filter(Boolean))).slice(0, 5);
    
  const topics = isFlat ? (profile?.technical_topics || []) : Array.from(new Set(repos.flatMap((r: any) => r.topics || []).filter(Boolean))).slice(0, 10);
  
  const createdDate = isFlat ? profile?.gh_created_at : user.created_at;
  const yearsOfExperience = createdDate
    ? new Date().getFullYear() - new Date(createdDate).getFullYear()
    : 0;

  const leetcode = isFlat ? profile?.leetcode_stats : null;



  const getSocialIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      case "twitter": return <Twitter className="h-4 w-4" />;
      case "github": return <Github className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  // Custom component mapping for ReactMarkdown to handle legacy HTML attributes
  const markdownComponents = {
    td: ({ node, ...props }: any) => {
      const { vAlign, ...rest } = props;
      return <td valign={vAlign} {...rest} />;
    },
    th: ({ node, ...props }: any) => {
      const { vAlign, ...rest } = props;
      return <th valign={vAlign} {...rest} />;
    },
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table {...props} className="min-w-full border-collapse" />
      </div>
    ),
    img: ({ node, ...props }: any) => (
      <img 
        {...props} 
        onError={(e: any) => {
          e.target.style.display = 'none'; // Hide if service is down (503/500)
        }}
        className="inline-block max-w-full h-auto rounded-lg" 
      />
    ),
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[65vw] flex flex-col border-l dark:border-slate-800 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{displayName}</SheetTitle>
          <SheetDescription>Detailed technical profile for @{handle}</SheetDescription>
        </SheetHeader>

        {!profile ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p className="animate-pulse font-bold uppercase tracking-widest">Loading Artifacts...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header Area */}
            <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-24 w-24 rounded-[2rem] shadow-xl ring-4 ring-white dark:ring-slate-950">
                  <AvatarImage src={user.avatar_url} alt={handle} />
                  <AvatarFallback className="text-2xl">{handle.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl font-black tracking-tighter">{displayName}</h2>
                    {user.hireable && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        HIREABLE
                      </Badge>
                    )}
                    {user.organization_role && (
                      <Badge variant="outline" className="border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400 font-black px-3 py-1 rounded-full">
                        {user.organization_role.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-sm">@{handle}</p>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                    {user.bio || "Technical profile active in ecosystem development and artifact maintenance."}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    {user.company && (
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Briefcase className="h-4 w-4" />
                        {user.company}
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </div>
                    )}
                    {user.blog && (
                      <Link href={user.blog} target="_blank" className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:underline">
                        <Globe className="h-4 w-4" />
                        Website
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-12 pb-20">
                
                {/* TALENT CONTEXT SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white">
                      <Search className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Acquisition Niche</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{meta.source_keyword || "Organic Search"}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-slate-500 rounded-2xl text-white">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Profile Sync</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {meta.crawled_at ? new Date(meta.crawled_at).toLocaleDateString() : "Just now"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* STATS GRID */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Technical Metrics</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {[
                                      { label: "Followers", value: user.followers, icon: Users, color: "text-blue-500" },
                                      { label: "Repositories", value: user.public_repos, icon: Layers, color: "text-purple-500" },
                                      { label: "Total Stars", value: totalStars, icon: Star, color: "text-yellow-500" },
                                      { label: "LeetCode", value: leetcode?.score, icon: Zap, color: "text-orange-500", hidden: !leetcode?.score },
                                      { label: "Following", value: user.following, icon: CheckCircle2, color: "text-green-500" },
                                      { label: "Exp. Years", value: yearsOfExperience, icon: Clock, color: "text-cyan-500" },
                                    ].filter(s => !s.hidden).map((stat, i) => (
                                      <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                                        <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                                        <p className="text-xl font-black">{stat.value?.toLocaleString() || 0}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                                      </div>
                                    ))}
                                  </div>
                  
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* SKILLS MATRIX */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Core Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((lang: any, i: number) => (
                          <Badge key={i} className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-lg border-none">
                            {String(lang)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Technical Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {topics.map((topic: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-slate-500 dark:text-slate-400 font-bold text-[10px] px-3 py-1 rounded-lg border-slate-200 dark:border-slate-800">
                            #{String(topic)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* RECENT ACTIVITY */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Public Activity</h3>
                      <div className="space-y-3">
                        {activity.slice(0, 5).map((event: any, i: number) => (
                          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50 items-center">
                            <div className="shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                            <div className="flex-1">
                              <p className="text-sm font-black">{event.type?.replace("Event", "").replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-[10px] font-bold text-slate-500">{event.repo?.name}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400">
                              {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                        {activity.length === 0 && <p className="text-xs text-slate-400 italic">No recent public activity tracked.</p>}
                      </div>
                    </div>
                  </div>

                  {/* PROJECT SPOTLIGHT */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Project Spotlight</h3>
                    <div className="space-y-4">
                      {repos
                        .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
                        .slice(0, 4)
                        .map((repo: any) => (
                          <div key={repo.id} className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                              <Link href={repo.html_url} target="_blank" className="text-lg font-black text-blue-500 hover:underline flex items-center gap-2">
                                {repo.name} <ExternalLink className="h-4 w-4" />
                              </Link>
                              <div className="flex items-center gap-1.5 text-yellow-500 font-black text-xs">
                                <Star className="h-4 w-4 fill-current" />
                                {repo.stargazers_count}
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4">
                              {repo.description || "No project description provided."}
                            </p>
                            <div className="flex items-center gap-3">
                              {repo.language && (
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
                                  {repo.language}
                                </Badge>
                              )}
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Updated {new Date(repo.pushed_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <Separator className="dark:bg-slate-800" />

                {/* README SECTION */}
                {readme && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Profile Artifact (README)</h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden prose dark:prose-invert max-w-none prose-img:rounded-xl prose-a:text-blue-500 prose-headings:font-black">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents as any}>
                        {readme}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* SOCIAL CONNECTIVITY */}
                {socials.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Social Connectivity</h3>
                    <div className="flex flex-wrap gap-4">
                      {socials.map((social: any, i: number) => (
                        <Link
                          key={i}
                          href={social.url}
                          target="_blank"
                          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all"
                        >
                          {getSocialIcon(social.provider)}
                          <span className="text-sm font-black uppercase tracking-widest">{social.provider}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ProfileDrawer2;