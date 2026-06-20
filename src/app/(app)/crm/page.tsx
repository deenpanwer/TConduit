"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/hooks/use-crm";
import { useAuth } from "@/hooks/use-auth";
import { CRMNotificationsDrawer } from "@/components/crm/CRMNotificationsDrawer";
import { AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { 
  History, 
  Bell, 
  Sparkles,
  Phone,
  StickyNote,
  Zap,
  FileText
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
import { CRMReportsModal } from "@/components/crm/CRMReportsModal";

export default function CRMPage() {
  const { user } = useAuth();
  const { entities } = useCRM();
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [crmNotificationsCount, setCrmNotificationsCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("type", "==", "crm_missed_followup"),
      where("status", "==", "pending")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCrmNotificationsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  const pendingCount = crmNotificationsCount;

  const allHistory = entities.flatMap(e => e.history.map(h => ({ ...h, entityName: e.name })));

  return (
    <div className="h-full overflow-y-auto bg-background/50">
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black tracking-tighter uppercase font-poppins text-foreground">
              Business <span className="text-blue-500">Dashboard</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* 
            <Button 
              onClick={() => setIsReportsModalOpen(true)}
              variant="destructive" 
              size="icon" 
              className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10"
            >
              <FileText size={20} />
            </Button>
            */}

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

            <Button 
              onClick={() => setIsNotificationsOpen(true)}
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-secondary relative"
            >
              <Bell size={20} className="text-muted-foreground" />
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full border-2 border-background" />
              )}
            </Button>

            <div className="h-6 w-px bg-border/50 mx-2" />

            <Avatar className="size-9 border-2 border-border/50 ring-2 ring-background transition-all hover:scale-110 cursor-pointer">
              <AvatarImage src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'trac'}`} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <CRMOverviewContent />
      <AnimatePresence>
        {isNotificationsOpen && (
          <CRMNotificationsDrawer 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />
        )}
      </AnimatePresence>
      <CRMReportsModal 
        isOpen={isReportsModalOpen} 
        onClose={() => setIsReportsModalOpen(false)} 
      />
    </div>
  );
}