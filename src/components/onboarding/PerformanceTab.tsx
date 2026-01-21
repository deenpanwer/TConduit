"use client";

import { motion } from "framer-motion";
import { 
    Activity, Zap, Target, TrendingUp, BarChart3, Clock, Layers, 
    ShieldCheck, Cpu, Code2, BookOpen, GitBranch, Terminal,
    Bug, Rocket, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PerformanceTab() {
  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full pb-20"
    >
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center mb-12">
            <div className="relative mb-6">
                <div className="size-20 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-purple-500/20 flex items-center justify-center shadow-2xl border border-white/10 backdrop-blur-xl">
                    <Activity className="size-10 text-primary" />
                </div>
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute -inset-2 bg-primary/20 rounded-[2.5rem] blur-xl -z-10"
                />
            </div>
            <h3 className="text-4xl font-black tracking-tighter mb-4">Engineering Intelligence</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Our AI-driven performance engine will calibrate once the candidate joins your workspace. 
                Experience real-time insights into velocity, code health, and technical impact.
            </p>
        </div>

        {/* Primary Metrics Grid - Bigger & Better */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 opacity-40 grayscale pointer-events-none filter blur-[1px] mb-12">
            <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm p-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sprint Velocity</CardTitle>
                        <CardDescription className="text-xs">PRs & Tasks merged</CardDescription>
                    </div>
                    <Zap className="size-5 text-yellow-500" />
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-4xl font-black tracking-tighter">14.8 <span className="text-sm font-bold text-muted-foreground tracking-normal">/ wk</span></div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[75%]" />
                        </div>
                        <span className="text-[10px] font-black text-yellow-500">+12%</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm p-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Security Health</CardTitle>
                        <CardDescription className="text-xs">Vulnerability checks</CardDescription>
                    </div>
                    <ShieldCheck className="size-5 text-green-500" />
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-4xl font-black tracking-tighter">99.8<span className="text-sm font-bold text-muted-foreground tracking-normal">%</span></div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[98%]" />
                        </div>
                        <span className="text-[10px] font-black text-green-500">GODLY</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm p-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Documentation</CardTitle>
                        <CardDescription className="text-xs">Knowledge Base Impact</CardDescription>
                    </div>
                    <BookOpen className="size-5 text-blue-500" />
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-4xl font-black tracking-tighter">A+</div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[90%]" />
                        </div>
                        <span className="text-[10px] font-black text-blue-500">EXPERT</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm p-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Onboarding</CardTitle>
                        <CardDescription className="text-xs">Time to first PR</CardDescription>
                    </div>
                    <Rocket className="size-5 text-purple-500" />
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-4xl font-black tracking-tighter">2.4 <span className="text-sm font-bold text-muted-foreground tracking-normal">days</span></div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[85%]" />
                        </div>
                        <span className="text-[10px] font-black text-purple-500">FAST</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Secondary Detailed Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 opacity-30 grayscale pointer-events-none filter blur-[2px]">
            {/* Chart Placeholder */}
            <Card className="lg:col-span-2 bg-card/30 border-none shadow-none p-8 flex flex-col justify-between h-[400px]">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-lg font-black tracking-tight">Code Contribution Graph</h4>
                        <p className="text-xs text-muted-foreground">Activity across all repositories</p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="size-3 rounded-full bg-muted" />)}
                    </div>
                </div>
                <div className="flex-1 flex items-end gap-2 px-4">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="flex-1 bg-muted/50 rounded-t-lg" 
                            style={{ height: `${Math.random() * 80 + 20}%` }}
                        />
                    ))}
                </div>
                <div className="mt-6 flex justify-between px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                </div>
            </Card>

            {/* Side Skills Radar Placeholder */}
            <div className="space-y-6">
                <Card className="bg-card/30 border-none shadow-none p-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Tech Mastery</h4>
                    <div className="space-y-6">
                        {[
                            { label: "Frontend Architecture", score: 92, color: "bg-blue-500" },
                            { label: "Backend Systems", score: 85, color: "bg-purple-500" },
                            { label: "Cloud & DevOps", score: 78, color: "bg-green-500" }
                        ].map((skill, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span>{skill.label}</span>
                                    <span>{skill.score}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full", skill.color)} style={{ width: `${skill.score}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-6 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                        <Star className="size-6" />
                    </div>
                    <div>
                        <div className="text-sm font-black">Top Contributor</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Projected Badge</div>
                    </div>
                </Card>
            </div>
        </div>

        {/* Bottom Activity Stream Placeholder */}
        <div className="mt-12 opacity-20 grayscale pointer-events-none filter blur-[3px]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 text-center">Simulated Activity Stream</h4>
            <div className="space-y-4 max-w-4xl mx-auto">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-white/5">
                        <div className="size-10 rounded-xl bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-48 bg-muted rounded" />
                            <div className="h-2 w-32 bg-muted/50 rounded" />
                        </div>
                        <div className="h-4 w-12 bg-muted/30 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
  );
}