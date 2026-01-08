"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, ExternalLink, Star, MapPin, Briefcase, 
  Github, Box, Download, Layers, ShieldCheck, 
  Clock, MessageSquare, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// --- Types ---

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any | null; // The raw_data object
  sourceType: 'freelancer' | 'github' | 'npm' | null;
}

// --- Main Drawer Component ---

export const ProfileDrawer = ({ isOpen, onClose, profile, sourceType }: ProfileDrawerProps) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!profile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
                <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider">
                  {sourceType === 'freelancer' ? 'Freelancer Profile' : 
                   sourceType === 'github' ? 'GitHub Engineering Dossier' : 'NPM Package Maintainer'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(getProfileUrl(profile, sourceType), '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original
                </Button>
                <Button size="sm">
                  Hire Candidate
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 md:p-8">
                {sourceType === 'freelancer' && <FreelancerView profile={profile} />}
                {sourceType === 'github' && <GithubView profile={profile} />}
                {sourceType === 'npm' && <NpmView profile={profile} />}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Helper: Get URL ---
const getProfileUrl = (profile: any, type: string | null) => {
  if (type === 'freelancer') return profile.page_url;
  if (type === 'github') return profile.user?.html_url;
  if (type === 'npm') return `https://www.npmjs.com/~${profile.username}`;
  return '#';
};


// --- Sub-View: Freelancer ---

const FreelancerView = ({ profile }: { profile: any }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Hero */}
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="relative shrink-0">
        <img 
          src={profile.profile_image_url} 
          alt={profile.name} 
          className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-background"
        />
        <div className="absolute -bottom-3 -right-3 bg-[#FFD21E] text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
          Pro
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-2">{profile.name}</h2>
        <h3 className="text-lg text-muted-foreground font-medium mb-4">{profile.headline}</h3>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.country}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {profile.average_response_time}</span>
          <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {profile.rating} ({profile.num_reviews} reviews)</span>
        </div>
      </div>
    </div>

    {/* About */}
    <div className="bg-muted/30 p-6 rounded-2xl border border-border">
      <h4 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
        <Briefcase className="w-4 h-4" /> Professional Summary
      </h4>
      <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {profile.about_me}
      </p>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard label="Competence" value={`${profile.competence_score || 0}%`} icon={<Zap className="w-4 h-4 text-amber-500" />} />
      <MetricCard label="Agency Score" value={`${profile.agency_score || 0}%`} icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} />
      <MetricCard label="Projects" value={profile.num_projects || "N/A"} icon={<Layers className="w-4 h-4 text-blue-500" />} />
      <MetricCard label="Reviews" value={profile.num_reviews} icon={<MessageSquare className="w-4 h-4 text-purple-500" />} />
    </div>

    {/* Skills */}
    <div>
      <h4 className="font-bold uppercase tracking-widest text-sm mb-4">Core Competencies</h4>
      <div className="flex flex-wrap gap-2">
        {profile.skills?.map((skill: string) => (
          <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-sm">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  </div>
);


// --- Sub-View: GitHub ---

const GithubView = ({ profile }: { profile: any }) => {
  const user = profile.user || {};
  const repos = profile.repos || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative shrink-0">
          <img 
            src={user.avatar_url} 
            alt={user.name} 
            className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-background"
          />
          <div className="absolute -bottom-3 -right-3 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-1">
            <Github className="w-3 h-3" /> Dev
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">{user.name || profile.username}</h2>
          <h3 className="text-lg text-muted-foreground font-medium mb-4">{user.bio || "Open Source Engineer"}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.location || "Remote"}</span>
            <span className="flex items-center gap-1"><Box className="w-4 h-4" /> {user.public_repos} Repos</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {user.followers} Followers</span>
          </div>
        </div>
      </div>

      {/* Top Repositories */}
      <div>
        <h4 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Top Repositories
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.slice(0, 6).map((repo: any) => (
            <a 
              key={repo.id} 
              href={repo.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-5 rounded-xl border border-border bg-card hover:shadow-lg transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{repo.name}</h5>
                {repo.language && (
                  <Badge variant="outline" className="text-[10px]">{repo.language}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {repo.description || "No description provided."}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers_count}</span>
                <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {repo.size}kb</span>
                <span className="ml-auto text-[10px]">{new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      
      {/* Activity / Readme Preview (Mocked for now as we don't have readme content) */}
      <div className="bg-muted/30 p-6 rounded-2xl border border-border">
         <h4 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
           <Github className="w-4 h-4" /> Contribution Profile
         </h4>
         <div className="flex gap-4 items-center justify-between">
            <div className="text-center">
                <div className="text-2xl font-bold">{user.public_repos}</div>
                <div className="text-xs text-muted-foreground uppercase">Public Repos</div>
            </div>
             <div className="text-center">
                <div className="text-2xl font-bold">{user.public_gists}</div>
                <div className="text-xs text-muted-foreground uppercase">Gists</div>
            </div>
             <div className="text-center">
                <div className="text-2xl font-bold">{user.followers}</div>
                <div className="text-xs text-muted-foreground uppercase">Followers</div>
            </div>
             <div className="text-center">
                <div className="text-2xl font-bold">{new Date().getFullYear() - new Date(user.created_at).getFullYear()}y</div>
                <div className="text-xs text-muted-foreground uppercase">Experience</div>
            </div>
         </div>
      </div>

    </div>
  );
};


// --- Sub-View: NPM ---

const NpmView = ({ profile }: { profile: any }) => {
  const portfolio = typeof profile.portfolio === 'string' 
    ? JSON.parse(profile.portfolio) 
    : (profile.portfolio || []);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative shrink-0">
          <img 
            src={profile.avatar_url} 
            alt={profile.name} 
            className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-background"
          />
          <div className="absolute -bottom-3 -right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-1">
            <Box className="w-3 h-3" /> NPM
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">{profile.name || profile.username}</h2>
          <h3 className="text-lg text-muted-foreground font-medium mb-4">NPM Package Maintainer</h3>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
             <span className="flex items-center gap-1"><Download className="w-4 h-4" /> {profile.total_downloads_weekly?.toLocaleString()} / week</span>
             <span className="flex items-center gap-1"><Box className="w-4 h-4" /> {profile.total_packages} Packages</span>
          </div>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Weekly Downloads" value={profile.total_downloads_weekly?.toLocaleString()} icon={<Download className="w-4 h-4 text-blue-500" />} />
        <MetricCard label="Total Packages" value={profile.total_packages} icon={<Box className="w-4 h-4 text-red-500" />} />
        <MetricCard label="Avg. Impact" value={~~(profile.total_downloads_weekly / (profile.total_packages || 1))} icon={<Zap className="w-4 h-4 text-amber-500" />} />
      </div>

      {/* Package Portfolio */}
      <div>
        <h4 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Published Packages
        </h4>
        <div className="space-y-3">
          {portfolio.map((pkg: any, i: number) => (
            <div key={i} className="flex items-start justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-bold truncate">{pkg.name}</h5>
                  <Badge variant="secondary" className="text-[10px]">{pkg.version}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-sm font-bold mb-1">
                  <Download className="w-3 h-3 text-muted-foreground" />
                  {pkg.downloads?.toLocaleString()}
                </div>
                <a 
                  href={pkg.npm_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on NPM
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon }: any) => (
  <div className="p-4 bg-card border border-border rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
    <div className="mb-2 p-2 bg-muted rounded-full">{icon}</div>
    <div className="font-bold text-lg leading-none mb-1">{value}</div>
    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</div>
  </div>
);
