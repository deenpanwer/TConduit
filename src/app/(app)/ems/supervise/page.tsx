'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DashboardSidebar } from '@/components/ems/DashboardSidebar';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { format, isToday, parseISO } from 'date-fns';
import { useTeam } from '@/hooks/use-team';
import { useSupervise } from '@/hooks/use-supervise';
import { Shimmer } from '@/components/ems/main/shared/Shimmer';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- UTILS ---

/**
 * generateCollageBase64: Client-side "Embedding Clustering" implementation.
 * Takes up to 4 image URLs and combines them into a single 2x2 collage.
 */
async function generateCollageBase64(urls: string[]): Promise<string> {
  if (!urls || urls.length === 0) return "";
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject("Canvas context error");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, size, size);

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    const limit = Math.min(urls.length, 4);
    
    urls.slice(0, limit).forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        images[i] = img;
        loadedCount++;
        if (loadedCount === limit) draw();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === limit) draw();
      };
      img.src = url;
    });

    function draw() {
      if (!ctx) return; // TS Safety
      const w = size / 2;
      const h = size / 2;
      for (let i = 0; i < 4; i++) {
        const img = images[i];
        if (!img) continue;
        const x = (i % 2) * w;
        const y = Math.floor(i / 2) * h;
        
        // Use Math.min (contain) instead of Math.max (cover) to prevent cropping
        const ratio = Math.min(w / img.width, h / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        const nx = x + (w - nw) / 2;
        const ny = y + (h - nh) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, nx, ny, nw, nh);
      }
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      console.log(`[Trac Supervise] Collage Generated:`, base64);
      resolve(base64);
    }
  });
}

const ScanningSkeleton = () => (
  <div className="relative w-full h-12 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
    <div className="p-3 space-y-2">
      <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
      <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
    </div>
    <style jsx>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Menu,
  UserPlus,
  X,
  Maximize2,
  Monitor,
  User,
  Calendar as CalendarIcon,
  History,
  Search as SearchIcon,
  MessageCircle,
  Sparkles,
  ChevronDown,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn, getUserAvatar, isEmployeeOnline } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { InviteModal } from '@/components/ems/InviteModal';
import { PaywallScreen } from '@/components/ems/PaywallScreen';
import { SubscriptionBadge } from '@/components/ems/SubscriptionBadge';
import { useSidebar } from '@/hooks/use-sidebar';

// --- SHARED COMPONENTS ---

/**
 * SuperviseFeedItem: Unified component for both Mobile & Desktop to handle image loops.
 */
function SuperviseFeedItem({ 
  emp, 
  variant = 'mobile', // 'mobile' | 'desktop'
  index, 
  total,
  screenshots, 
  isOnline, 
  isTodayView, 
  selectedDate,
  isLoadingIntent,
  currentIntent,
  currentError,
  onScrollToNext,
  onOpenTeam,
  onOpenChat,
  onSetLoaded,
  onEnlarge
}: any) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (screenshots.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % screenshots.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [screenshots.length]);

  const screenshot = screenshots[activeIdx] || screenshots[0];
  const imageUrl = screenshot?.url || screenshot?.imageUrl || screenshot?.activity?.cloudinaryUrl;
  const timestamp = screenshot?.timestamp?.toDate ? screenshot.timestamp.toDate() : new Date();
  const isHistoricalFallback = screenshot?.isFallback;

  if (variant === 'desktop') {
    return (
      <div className="group relative bg-card border-2 border-border rounded-[2rem] overflow-hidden isolate transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 h-full min-h-[385px] flex flex-col justify-between">
        <div>
          <div className="aspect-video w-full bg-secondary relative overflow-hidden">
            {screenshots.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 bg-gradient-to-br from-secondary/80 via-secondary/40 to-background relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
                <div className="relative size-11 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center shadow-inner">
                  <Monitor size={20} className="opacity-40 text-foreground animate-pulse" />
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-25" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-4 opacity-70 z-10">
                  {isTodayView ? "No Activity Today" : "No History Available"}
                </span>
              </div>
            ) : imageUrl ? (
              <div className="w-full h-full relative bg-black/40">
                <img
                  src={imageUrl}
                  alt={emp.name}
                  className={cn(
                    "w-full h-full object-contain transition-all duration-700 cursor-pointer",
                    "opacity-100 scale-100"
                  )}
                  onLoad={() => onSetLoaded(imageUrl)}
                  onClick={() => onEnlarge(screenshot)}
                />
                {/* Desktop Mini-Loop Progress */}
                {screenshots.length > 1 && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                    {screenshots.map((_: any, i: number) => (
                      <div key={i} className={cn("h-0.5 rounded-full transition-all duration-300", activeIdx === i ? "w-4 bg-white" : "w-1 bg-white/30")} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
              {isTodayView && !isHistoricalFallback && (
                <div className={`size-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
              )}
              <span className={cn(
                'text-[10px] font-black uppercase tracking-widest backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1',
                isHistoricalFallback ? 'bg-orange-500/80' : 'bg-black/50',
              )}>
                {isHistoricalFallback && <History size={10} />}
                {isHistoricalFallback ? 'Last Active' : isTodayView ? (isOnline ? 'Live' : 'Offline') : format(selectedDate, 'MMM d')}
              </span>
            </div>

            {imageUrl && (
              <button
                onClick={() => onEnlarge(screenshot)}
                className="absolute bottom-4 right-4 size-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <Maximize2 size={18} />
              </button>
            )}
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div onClick={onOpenTeam} className="size-10 rounded-full bg-secondary border border-border overflow-hidden cursor-pointer hover:brightness-110 transition-all shrink-0">
                <img src={getUserAvatar(emp)} alt={emp.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black tracking-tight truncate">{emp.name}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate">
                  {mounted && screenshot ? format(timestamp, 'hh:mm:ss a') : '---'}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-primary/5 shrink-0" onClick={onOpenTeam}>View</Button>
          </div>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-1 min-h-[4.8rem] max-h-[4.8rem] relative justify-start overflow-hidden">
          <div className="relative">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">What he's doing right now?:</p>
            {isLoadingIntent && <div className="absolute inset-0 z-10"><ScanningSkeleton /></div>}
            <div className={cn("transition-all duration-500", isLoadingIntent ? "opacity-20 blur-[1px] scale-[0.98]" : "opacity-100 blur-0 scale-100")}>
              {currentError ? (
                <p className="text-[10px] text-red-400 truncate">{currentError}</p>
              ) : (
                <p className="text-[10px] text-foreground/80 line-clamp-3 leading-snug">
                  {currentIntent || (screenshots.length === 0 ? (isTodayView ? "No activity detected today." : "No history available.") : "")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile TikTok View
  return (
    <div className="h-dvh w-full snap-start relative flex flex-col justify-between isolate bg-black overflow-hidden shrink-0">
      {/* Centered Image / Content */}
      <div className="absolute inset-0 flex items-center justify-center p-0 z-0">
        {!imageUrl ? (
          <div className="w-full px-8 flex flex-col items-center justify-center text-muted-foreground">
            <Monitor size={64} className="opacity-10 mb-6" />
            <span className="text-sm font-black uppercase tracking-[0.3em] text-white/40">
              {isTodayView ? "No Activity Today" : "No History Available"}
            </span>
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <img
              src={imageUrl}
              alt={emp.name}
              className="w-full h-auto max-h-full object-contain transition-all duration-700"
              onLoad={() => onSetLoaded(imageUrl)}
              onClick={() => onEnlarge(screenshot)}
            />
            {screenshots.length > 1 && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                {screenshots.map((_: any, i: number) => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-300", activeIdx === i ? "w-6 bg-white" : "w-1.5 bg-white/30")} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-20 left-0 right-0 p-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className={cn(
            'text-[10px] font-black uppercase tracking-widest backdrop-blur-xl text-white px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10',
            isHistoricalFallback ? 'bg-orange-500/40' : 'bg-black/40',
          )}>
            {isTodayView && !isHistoricalFallback && (
              <div className={`size-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-zinc-500'}`} />
            )}
            {isHistoricalFallback ? 'Last Active' : isTodayView ? (isOnline ? 'Live' : 'Offline') : format(selectedDate, 'MMM d')}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest backdrop-blur-xl text-white px-4 py-2 rounded-2xl bg-black/40 border border-white/10">
            {mounted ? format(timestamp, 'hh:mm:ss a') : ''}
          </span>
        </div>
      </div>

      <div className="absolute right-4 bottom-[20%] flex flex-col items-center gap-6 z-30">
        <div onClick={onOpenTeam} className="relative group">
           <div className="size-14 rounded-full p-0.5 bg-gradient-to-tr from-primary to-blue-500 shadow-2xl active:scale-95 transition-transform">
              <img src={getUserAvatar(emp)} alt={emp.name} className="w-full h-full object-cover rounded-full border-2 border-black" />
           </div>
           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-5 bg-primary rounded-full flex items-center justify-center border-2 border-black">
              <Plus size={12} className="text-white" />
           </div>
        </div>

        <button onClick={onOpenChat} className="size-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl">
          <MessageCircle size={24} />
        </button>

        {total > 1 && index < total - 1 && (
           <button onClick={onScrollToNext} className="flex flex-col items-center gap-1 opacity-60 animate-bounce mt-4 cursor-pointer">
              <ChevronDown size={24} className="text-white" />
           </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
        <div className="flex flex-col gap-4 max-w-[85%]">
          <div className="flex flex-col">
            <span className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-2xl mb-1">{emp.name}</span>
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.25em]">{emp.role || 'Personnel'}</span>
          </div>

          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 text-white/60">
                <Sparkles size={14} className="text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest">What he's doing right now?:</span>
             </div>
             <div className="relative min-h-[3rem]">
                {isLoadingIntent && <div className="absolute inset-0 z-10"><ScanningSkeleton /></div>}
                <div className={cn("transition-all duration-500", isLoadingIntent ? "opacity-20 blur-sm translate-y-2" : "opacity-100 blur-0 translate-y-0")}>
                  {currentError ? (
                    <p className="text-[12px] text-red-400 font-bold bg-red-500/10 p-3 rounded-2xl border border-red-500/20">{currentError}</p>
                  ) : (
                    <p className="text-[14px] font-medium text-white/90 leading-snug">
                      {currentIntent || (screenshots.length === 0 ? (isTodayView ? "No activity detected." : "No history available.") : "")}
                    </p>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function SupervisePage() {
  const { employees, owner, loading: teamLoading, selectedDate, setSelectedDate } = useTeam();
  const { user, userData, loading: authLoading } = useAuth();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { monitoredPersonnel, latestScreenshots, loading: superviseLoading } = useSupervise(selectedDate);
  const isClientUser = userData?.role === "client" || userData?.isClient === true;

  const [inferredIntents, setInferredIntents] = useState<Record<string, string>>({});
  const [aiIntentLoading, setAiIntentLoading] = useState<Record<string, boolean>>({});
  const [aiIntentErrors, setAiIntentErrors] = useState<Record<string, string>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const aiStateRef = useRef({ aiIntentLoading, inferredIntents });
  useEffect(() => { aiStateRef.current = { aiIntentLoading, inferredIntents }; }, [aiIntentLoading, inferredIntents]);

  const lastFetchedUrlRef = useRef<Record<string, string>>({});
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInferredIntents({});
    setAiIntentLoading({});
    setAiIntentErrors({});
    setLoadedImages({});
    lastFetchedUrlRef.current = {};
  }, [dateStr]);

  const [selectedScreenshot, setSelectedScreenshot] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const { setIsMobileOpen } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/ems/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userData) {
      const fetchOrgDetails = async () => {
        const targetOrgId = userData?.ownedOrgId || userData?.orgId;
        if (targetOrgId) {
          const orgDoc = await getDoc(doc(db, 'organizations', targetOrgId));
          if (orgDoc.exists()) setOrgData(orgDoc.data());
        }
      };
      fetchOrgDetails();
    }
  }, [userData]);

  const fetchEmployeeIntent = useCallback(async (empId: string, empName: string, screenshotsArray: any[]) => {
    if (!screenshotsArray || screenshotsArray.length === 0) return;
    const latestScreenshot = screenshotsArray[0];
    const screenshotUrl = latestScreenshot?.url || latestScreenshot?.imageUrl || latestScreenshot?.activity?.cloudinaryUrl;
    const { aiIntentLoading: currentLoading } = aiStateRef.current;

    if (!screenshotUrl || lastFetchedUrlRef.current[empId] !== screenshotUrl) {
      setInferredIntents((prev) => { const next = { ...prev }; delete next[empId]; return next; });
    }
    if (currentLoading[empId] || lastFetchedUrlRef.current[empId] === screenshotUrl) return;

    lastFetchedUrlRef.current[empId] = screenshotUrl;
    setAiIntentLoading((prev) => ({ ...prev, [empId]: true }));
    setAiIntentErrors((prev) => ({ ...prev, [empId]: '' }));

    try {
      const collageBase64 = await generateCollageBase64(
        screenshotsArray.map(s => s.redactedUrl || s.url || s.imageUrl || s.activity?.cloudinaryUrl).filter(Boolean)
      );
      const response = await fetch('/api/employee/supervise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: empName,
          date: dateStr,
          screenshotUrls: [collageBase64],
          screenshotMetadata: screenshotsArray,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setInferredIntents((prev) => ({ ...prev, [empId]: data.inferredIntent }));
    } catch (error: any) {
      setAiIntentErrors((prev) => ({ ...prev, [empId]: error.message }));
      setInferredIntents((prev) => ({ ...prev, [empId]: "Failed to infer intent." }));
    } finally {
      setAiIntentLoading((prev) => ({ ...prev, [empId]: false }));
    }
  }, [dateStr]);

  useEffect(() => {
    if (!superviseLoading && monitoredPersonnel.length > 0) {
      monitoredPersonnel.forEach((emp) => {
        const screenshotsArray = latestScreenshots[emp.id];
        if (screenshotsArray && screenshotsArray.length > 0) {
          fetchEmployeeIntent(emp.id, emp.name, screenshotsArray);
        } else {
          setInferredIntents((prev) => ({ ...prev, [emp.id]: isToday(selectedDate) ? "He didn't do anything today." : "He didn't do anything on this day." }));
        }
      });
    }
  }, [monitoredPersonnel, latestScreenshots, dateStr, selectedDate, superviseLoading, fetchEmployeeIntent]);

  const handleScrollToNext = (index: number) => {
    if (mobileContainerRef.current) {
      mobileContainerRef.current.scrollTo({ top: mobileContainerRef.current.clientHeight * (index + 1), behavior: 'smooth' });
    }
  };

  if (authLoading || teamLoading) {
    return (
      <main className="flex-1 flex flex-col bg-background">
        <header className="h-16 border-b flex items-center px-8 shrink-0"><Shimmer className="h-4 w-32 rounded-full" /></header>
        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => <Shimmer key={i} className="aspect-video w-full rounded-2xl" />)}
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden relative sm:bg-background bg-black">
        <header className="h-16 border-b sm:bg-card/50 sm:backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0 sm:relative absolute w-full bg-transparent border-none sm:border-b border-white/5">
          <div className="sm:hidden flex items-center justify-between w-full mt-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="bg-black/20 backdrop-blur-md text-white border border-white/10 rounded-xl"><Menu /></Button>
              <h2 className="font-black uppercase tracking-widest text-sm text-white drop-shadow-md">Supervise</h2>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4 border-2 bg-black/20 backdrop-blur-md text-white border-white/10">
                  <CalendarIcon size={14} className="mr-2" />{isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none bg-card" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} disabled={(date) => date > new Date()} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden sm:flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}><Menu /></Button>
              <h2 className="font-black uppercase tracking-widest text-sm">Supervise Personnel</h2>
            </div>
            <div className="flex items-center gap-2">
              <SubscriptionBadge orgData={orgData} userData={userData} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4 border-2">
                    <CalendarIcon size={14} className="mr-2" />{isToday(selectedDate) ? 'Today (Live)' : format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none bg-card" align="end">
                  <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
              <button onClick={() => router.push('/ems/settings')} className="size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-90 ml-2">
                <img src={userData?.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'admin'}`} alt="Avatar" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden sm:bg-background bg-black">
          <div ref={mobileContainerRef} className="sm:hidden flex flex-col h-dvh snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth scrollbar-hide">
            {monitoredPersonnel.length === 0 ? (
              <div className="h-dvh flex flex-col items-center justify-center text-center space-y-4 p-4 snap-start">
                <h3 className="text-xl font-bold text-white">No personnel found</h3>
                {!isClientUser && <Button onClick={() => setShowInviteModal(true)} className="rounded-xl h-12 px-8">Add Staff Member</Button>}
              </div>
            ) : superviseLoading ? (
              <div className="h-dvh flex flex-col justify-center items-center snap-start"><Shimmer className="w-full h-full opacity-10" /></div>
            ) : (
              monitoredPersonnel.map((emp, index) => (
                <SuperviseFeedItem
                  key={emp.id}
                  emp={emp}
                  variant="mobile"
                  index={index}
                  total={monitoredPersonnel.length}
                  screenshots={latestScreenshots[emp.id] || []}
                  isOnline={isToday(selectedDate) && isEmployeeOnline(emp)}
                  isTodayView={isToday(selectedDate)}
                  selectedDate={selectedDate}
                  isLoadingIntent={aiIntentLoading[emp.id]}
                  currentIntent={inferredIntents[emp.id]}
                  currentError={aiIntentErrors[emp.id]}
                  onScrollToNext={() => handleScrollToNext(index)}
                  onOpenTeam={() => router.push(`/ems/team/${emp.id}`)}
                  onOpenChat={() => router.push(`/ems/chat?id=${emp.id}`)}
                  onSetLoaded={(url: string) => setLoadedImages(prev => ({ ...prev, [url]: true }))}
                  onEnlarge={(s: any) => setSelectedScreenshot({ ...s, employeeName: emp.name })}
                />
              ))
            )}
          </div>

          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-8 custom-scrollbar h-full overflow-y-auto items-stretch">
            {monitoredPersonnel.length === 0 ? (
              <div className="col-span-full h-full flex items-center justify-center">No personnel found</div>
            ) : superviseLoading ? (
              monitoredPersonnel.map((p) => <Shimmer key={p.id} className="aspect-video w-full rounded-3xl" />)
            ) : (
              monitoredPersonnel.map((emp) => (
                <SuperviseFeedItem
                  key={emp.id}
                  emp={emp}
                  variant="desktop"
                  screenshots={latestScreenshots[emp.id] || []}
                  isOnline={isToday(selectedDate) && isEmployeeOnline(emp)}
                  isTodayView={isToday(selectedDate)}
                  selectedDate={selectedDate}
                  isLoadingIntent={aiIntentLoading[emp.id]}
                  currentIntent={inferredIntents[emp.id]}
                  currentError={aiIntentErrors[emp.id]}
                  onOpenTeam={() => router.push(`/ems/team/${emp.id}`)}
                  onOpenChat={() => router.push(`/ems/chat?id=${emp.id}`)}
                  onSetLoaded={(url: string) => setLoadedImages(prev => ({ ...prev, [url]: true }))}
                  onEnlarge={(s: any) => setSelectedScreenshot({ ...s, employeeName: emp.name })}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-[98vw] md:max-w-[95vw] h-[95vh] p-0 border-none bg-black/95 overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col [&>button]:hidden">
          <VisuallyHidden.Root><DialogTitle>Screenshot Viewer</DialogTitle></VisuallyHidden.Root>
          
          <div className="absolute top-0 left-0 right-0 p-8 z-50 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"><Monitor size={24} /></div>
              <div>
                <h3 className="text-white text-xl font-black uppercase tracking-tighter leading-none mb-1">{selectedScreenshot?.employeeName}</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {selectedScreenshot && format(selectedScreenshot.timestamp?.toDate ? selectedScreenshot.timestamp.toDate() : new Date(), 'hh:mm:ss a')}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedScreenshot(null)} className="pointer-events-auto size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"><X size={24} /></button>
          </div>

          {selectedScreenshot && (
            <TransformWrapper initialScale={1} centerOnInit>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <button onClick={() => zoomOut()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><Minus size={20} /></button>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={() => resetTransform()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><RotateCcw size={18} /></button>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={() => zoomIn()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><Plus size={20} /></button>
                  </div>

                  <div className="flex-1 w-full h-full overflow-hidden cursor-move">
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                      <img
                        src={selectedScreenshot.redactedUrl || selectedScreenshot.url || selectedScreenshot.imageUrl || selectedScreenshot.activity?.cloudinaryUrl}
                        className="max-w-full max-h-full object-contain"
                        alt="Enlarged"
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </TransformComponent>
                  </div>
                </>
              )}
            </TransformWrapper>
          )}
        </DialogContent>
      </Dialog>

      <InviteModal isOpen={showInviteModal} onOpenChange={setShowInviteModal} />
    </>
  );
}