"use client";

import React from "react";
import { useCRM } from "@/hooks/use-crm";
import { useAuth } from "@/hooks/use-auth";
import { 
  History, 
  Bell, 
  Sparkles,
  Phone,
  StickyNote,
  Zap
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CRMOverviewContent } from "@/components/crm/CRMOverviewContent";

export default function CRMPage() {
  const { user } = useAuth();
  const { entities, leads } = useCRM();
  const allHistory = entities.flatMap(e => e.history.map(h => ({ ...h, entityName: e.name })));
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const currentLeads = leads.filter(l => new Date(l.createdAt) >= sevenDaysAgo).length;

  return (
    <div className="min-h-screen bg-background/50">
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black tracking-tighter uppercase font-poppins text-foreground">
              Business <span className="text-blue-500">Dashboard</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
                  <History size={20} className="text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black tracking-tighter">Timeline</SheetTitle>
                  <SheetDescription>Everything that happened recently.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-6 pr-4">
                  <div className="space-y-6">
                    {allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20).map((item, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== 19 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-border/50" />}
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10 border border-border">
                          {item.type === 'Call' ? <Phone size={12} /> : item.type === 'Note' ? <StickyNote size={12} /> : <Zap size={12} />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-foreground">{item.userName}</p>
                            <span className="text-[10px] text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.content}</p>
                          {item.entityName && <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-black tracking-widest">{item.entityName}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary relative">
                  <Bell size={20} className="text-muted-foreground" />
                  {currentLeads > 0 && <span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full border-2 border-background" />}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black tracking-tighter text-blue-500">Updates</SheetTitle>
                  <SheetDescription>What's new while you were away.</SheetDescription>
                </SheetHeader>
                <div className="mt-8 flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="size-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="text-blue-500" size={40} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">You're all caught up!</h3>
                    <p className="text-xs text-muted-foreground mt-1 italic">We'll let you know when something important happens.</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-6 w-px bg-border/50 mx-2" />

            <Avatar className="size-9 border-2 border-border/50 ring-2 ring-background transition-all hover:scale-110 cursor-pointer">
              <AvatarImage src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'trac'}`} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <CRMOverviewContent />
    </div>
  );
}