"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CandidateCard, CandidateStat } from "@/components/ai-elements/CandidateCard";
import ProfileDrawer2 from "@/components/ai-elements/ProfileDrawer2";
import { ProfileDrawer } from "@/components/ai-elements/ProfileDrawer";
import { Users, Book, Star, FileText, Clock, Briefcase, Download, Box, Zap } from "lucide-react";

export default function Test10Page() {
  const [source, setSource] = useState<"github" | "npm">("github");
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();

  const [currentJsonIndex, setCurrentJsonIndex] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setData(null);
    setCurrentJsonIndex(0);
    try {
      const response = await fetch("/api/test10", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source, limit }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result.profiles);
      toast({
        title: "Success",
        description: `Fetched ${result.profiles.length} profiles from ${source}.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentJsonString = data && data.length > 0 ? JSON.stringify(data[currentJsonIndex], null, 2) : "";

  const copyToClipboard = () => {
    if (!currentJsonString) return;
    navigator.clipboard.writeText(currentJsonString);
    toast({
      title: "Copied!",
      description: "Current JSON item copied to clipboard.",
    });
  };

  const handleNext = () => {
    if (data && currentJsonIndex < data.length - 1) {
      setCurrentJsonIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (data && currentJsonIndex > 0) {
      setCurrentJsonIndex(prev => prev - 1);
    }
  };

  // Calculate metrics
  const getMetrics = (text: string) => {
    if (!text) return { words: 0, chars: 0, lines: 0 };
    return {
      words: text.split(/\s+/).filter(Boolean).length,
      chars: text.length,
      lines: text.split("\n").length
    };
  };

  const metrics = getMetrics(currentJsonString);

  const handleViewProfile = (profile: any) => {
    setSelectedProfile(profile);
    setIsDrawerOpen(true);
  };

  return (
    <div className="container mx-auto py-10 p-4">
      <Card className="w-full max-w-4xl mx-auto mb-10">
        <CardHeader>
          <CardTitle>Test 10: Profile Fetcher</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-8 md:space-y-0">
            <div className="space-y-2">
              <Label>Source</Label>
              <RadioGroup
                defaultValue="github"
                value={source}
                onValueChange={(val) => setSource(val as "github" | "npm")}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="github" id="github" />
                  <Label htmlFor="github">GitHub</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="npm" id="npm" />
                  <Label htmlFor="npm">NPM</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="limit">Number of Profiles</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Button onClick={fetchData} disabled={loading} className="w-full md:w-auto">
            {loading ? "Fetching..." : "Fetch Profiles"}
          </Button>
        </CardContent>
      </Card>

      {data && data.length > 0 && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((profile, idx) => {
              if (source === 'github') {
                const rawData = profile.raw_data || {};
                const user = rawData.user || {};
                const repos = rawData.repos || [];
                
                const totalStars = repos.reduce((acc: number, repo: any) => acc + (repo.stargazers_count || 0), 0);
                const yearsExp = user.created_at 
                  ? new Date().getFullYear() - new Date(user.created_at).getFullYear()
                  : 0;

                const combinedSkills = Array.from(new Set([
                  ...Array.from(new Set(repos.map((r: any) => r.language).filter(Boolean))) as string[],
                  ...Array.from(new Set(repos.flatMap((r: any) => r.topics || []).filter(Boolean))) as string[]
                ].slice(0, 5)));

                const stats: CandidateStat[] = [
                  { label: "Followers", value: user.followers || 0, icon: Users },
                  { label: "Repos", value: user.public_repos || 0, icon: Book },
                  { label: "Stars", value: totalStars, icon: Star },
                  { label: "Gists", value: user.public_gists || 0, icon: FileText },
                  { label: "Following", value: user.following || 0, icon: Users },
                  { label: "Exp. Years", value: yearsExp, icon: Clock },
                ];

                return (
                  <CandidateCard
                    key={user.id || idx}
                    name={user.name || user.login}
                    username={user.login}
                    avatarUrl={user.avatar_url}
                    bio={user.bio}
                    skills={combinedSkills}
                    stats={stats}
                    onViewProfile={() => handleViewProfile(rawData)}
                    onHire={() => toast({ title: "Interest Logged", description: `Added ${user.login} to outreach.` })}
                  />
                );
              } else {
                // NPM Mapping
                const stats: CandidateStat[] = [
                  { label: "Weekly DLs", value: profile.total_downloads_weekly?.toLocaleString() || 0, icon: Download },
                  { label: "Packages", value: profile.total_packages || 0, icon: Box },
                  { label: "Impact", value: ~~((profile.total_downloads_weekly || 0) / (profile.total_packages || 1)), icon: Zap },
                  { label: "Type", value: "NPM", icon: Box },
                ];

                return (
                  <CandidateCard
                    key={profile.id || idx}
                    name={profile.name || profile.username}
                    username={profile.username}
                    avatarUrl={profile.avatar_url}
                    bio={`Maintainer of ${profile.total_packages} packages with ${profile.total_downloads_weekly?.toLocaleString()} weekly downloads.`}
                    skills={["Node.js", "NPM", "JavaScript", "Open Source"]}
                    stats={stats}
                    onViewProfile={() => handleViewProfile(profile)}
                    onHire={() => toast({ title: "Interest Logged", description: `Added ${profile.username} to outreach.` })}
                  />
                );
              }
            })}
          </div>

          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
                <div className="space-y-1">
                  <CardTitle>Raw JSON Data (Item {currentJsonIndex + 1} of {data.length})</CardTitle>
                  <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                    <span>Words: {metrics.words}</span>
                    <span>Chars: {metrics.chars}</span>
                    <span>LOC: {metrics.lines}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentJsonIndex === 0}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNext} disabled={currentJsonIndex === data.length - 1}>
                    Next
                  </Button>
                  <Button variant="default" size="sm" onClick={copyToClipboard}>
                    Copy JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[500px] text-xs font-mono">
                <pre>{currentJsonString}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {source === 'github' ? (
        <ProfileDrawer2
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          profile={selectedProfile}
        />
      ) : (
        <ProfileDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          profile={selectedProfile}
          sourceType="npm"
        />
      )}
    </div>
  );
}
