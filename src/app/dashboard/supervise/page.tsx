'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { format, isToday, parseISO } from 'date-fns'; // Added parseISO for date handling
import { useTeam } from '@/hooks/use-team';
import { useSupervise } from '@/hooks/use-supervise'; // Assuming this hook will be updated to fetch from new API
import { Shimmer } from '@/components/dashboard/main/shared/Shimmer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Importing icons
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn, getUserAvatar } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { PaywallScreen } from '@/components/dashboard/PaywallScreen';
import { SubscriptionBadge } from '@/components/dashboard/SubscriptionBadge';
import { useSidebar } from '@/hooks/use-sidebar';

export default function SupervisePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { employees, owner, loading: teamLoading } = useTeam();
  const { user, userData, loading: authLoading } = useAuth();
  const {
    monitoredPersonnel,
    latestScreenshots, // This is Record<string, any> from the hook
    loading: superviseLoading,
  } = useSupervise(selectedDate);

  // State to store inferred intents for each employee
  const [inferredIntents, setInferredIntents] = useState<Record<string, string>>({});
  // State to track loading status of AI intent inference for each employee
  const [aiIntentLoading, setAiIntentLoading] = useState<Record<string, boolean>>({});
  // State to store errors for AI intent inference
  const [aiIntentErrors, setAiIntentErrors] = useState<Record<string, string>>({});


  const [selectedScreenshot, setSelectedScreenshot] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const { setIsMobileOpen } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/dashboard/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userData) {
      fetchOrgDetails();
    }
  }, [userData]);

  const fetchOrgDetails = async () => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (targetOrgId) {
      const orgDoc = await getDoc(doc(db, 'organizations', targetOrgId));
      if (orgDoc.exists()) setOrgData(orgDoc.data());
    }
  };

  const isSubscriptionActive = orgData?.subscriptionExpiry
    ? orgData.subscriptionExpiry.toDate() > new Date()
    : true;

  // Function to fetch AI intent for a single employee
  const fetchEmployeeIntent = useCallback(async (empId: string, empName: string, screenshotData: any) => {
    // Clear previous state if no screenshot data for today
    if (!screenshotData && isToday(selectedDate)) { // Using isToday from date-fns
      setInferredIntents((prev) => ({ ...prev, [empId]: "No recent activity data to infer intent." }));
      setAiIntentLoading((prev) => ({ ...prev, [empId]: false }));
      setAiIntentErrors((prev) => ({ ...prev, [empId]: '' }));
      return;
    } else if (!screenshotData && !isToday(selectedDate)) { // Using isToday from date-fns
       setInferredIntents((prev) => ({ ...prev, [empId]: "Activity not available for this date." }));
       setAiIntentLoading((prev) => ({ ...prev, [empId]: false }));
       setAiIntentErrors((prev) => ({ ...prev, [empId]: '' }));
       return;
    }

    // Prevent fetching if already loading or if intent is already fetched and is not a fallback
    if (aiIntentLoading[empId] || (inferredIntents[empId] && !screenshotData.isFallback)) {
      return;
    }

    setAiIntentLoading((prev) => ({ ...prev, [empId]: true }));
    setAiIntentErrors((prev) => ({ ...prev, [empId]: '' })); // Clear previous error

    try {
      const response = await fetch('/api/employee/supervise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeName: empName,
          date: format(selectedDate, "yyyy-MM-dd"),
          screenshotUrls: [screenshotData.url], // API expects an array
          screenshotMetadata: [screenshotData], // Pass the whole screenshot object as metadata
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON, use status text
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInferredIntents((prev) => ({ ...prev, [empId]: data.inferredIntent }));
    } catch (error: any) {
      console.error(`Error fetching AI intent for ${empName}:`, error);
      setAiIntentErrors((prev) => ({ ...prev, [empId]: error.message }));
      setInferredIntents((prev) => ({ ...prev, [empId]: "Failed to infer intent." })); // Set a fallback message on error
    } finally {
      setAiIntentLoading((prev) => ({ ...prev, [empId]: false }));
    }
  }, [selectedDate, aiIntentLoading, inferredIntents, monitoredPersonnel]); // No need for isDateToday here as it's from date-fns which is always available

  // Effect to trigger API calls when personnel, screenshots, or date changes
  useEffect(() => {
    if (!superviseLoading && monitoredPersonnel.length > 0 && Object.keys(latestScreenshots).length > 0) {
      monitoredPersonnel.forEach((emp) => {
        const screenshotData = latestScreenshots[emp.id];
        // Call fetchEmployeeIntent for each employee
        fetchEmployeeIntent(emp.id, emp.name, screenshotData);
      });
    } else if (!superviseLoading && monitoredPersonnel.length === 0) {
        // Clear states if no personnel
        setInferredIntents({});
        setAiIntentLoading({});
        setAiIntentErrors({});
    }
  }, [monitoredPersonnel, latestScreenshots, selectedDate, superviseLoading, fetchEmployeeIntent]); // fetchEmployeeIntent is stable due to useCallback

  if (authLoading || teamLoading) {
    return (
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card/50 flex items-center px-8 shrink-0">
          <Shimmer className="h-4 w-32 rounded-full" />
        </header>
        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Shimmer key={i} className="aspect-video w-full rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER SECTION */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          {/* Mobile Header (TikTok Style) */}
          <div className="sm:hidden flex items-center justify-between w-full">
            {' '}
            {/* Ensure it spans full width */}
            <div className="flex items-center gap-4">
              {' '}
              {/* Left side of mobile header */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu />
              </Button>
              <h2 className="font-black uppercase tracking-widest text-sm">
                Supervise Personnel
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {' '}
              {/* Right side of mobile header */}
              <SearchIcon className="size-5 text-muted-foreground" />{' '}
              {/* Search Icon */}
              {/* Date Picker for Mobile - Moved from desktop header */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4 border-2"
                  >
                    <CalendarIcon size={14} className="mr-2" />
                    {isToday(selectedDate) // Using isToday from date-fns
                      ? 'Today (Live)'
                      : format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none bg-card"
                  align="end"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Desktop Header (Existing) */}
          <div className="hidden sm:flex items-center justify-between w-full">
            {' '}
            {/* This div is for desktop */}
            <div className="flex items-center gap-4">
              {/* Desktop Menu Button - might need hiding if sidebar is always visible on desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu />
              </Button>
              <h2 className="font-black uppercase tracking-widest text-sm">
                Supervise Personnel
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <SubscriptionBadge orgData={orgData} userData={userData} />
              {/* Date Picker Popover - This will be hidden on mobile due to sm:flex on the parent div */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4 border-2"
                  >
                    <CalendarIcon size={14} className="mr-2" />
                    {isToday(selectedDate) // Using isToday from date-fns
                      ? 'Today (Live)'
                      : format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none bg-card"
                  align="end"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <button
                onClick={() => router.push('/dashboard/settings')}
                className="size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-90 ml-2"
              >
                <img
                  src={
                    userData?.photoUrl ||
                    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'admin'}`
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto">
          {' '}
          {/* Changed to overflow-auto for snap scrolling */}
          {/* Mobile TikTok Style View */}
          <div className="sm:hidden flex flex-col h-screen snap-y snap-mandatory overflow-y-scroll">
            {' '}
            {/* Visible on small screens */}
            {monitoredPersonnel.length === 0 ? (
              // No personnel state for mobile
              <div className="h-screen flex flex-col items-center justify-center text-center space-y-4 p-4">
                <div className="size-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <User size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No personnel found</h3>
                <p className="text-muted-foreground max-w-xs">
                  Personnel using the Trac app or invited staff will appear
                  here.
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8"
                >
                  <UserPlus size={16} className="mr-2" /> Add Staff Member
                </Button>
              </div>
            ) : superviseLoading ? (
              // Loading state for mobile feed (covers visuals and initial text areas)
              <div className="h-screen flex flex-col justify-center items-center">
                <Shimmer className="w-full h-full" />
              </div>
            ) : (
              // Personnel feed for mobile
              monitoredPersonnel.map((emp, index) => {
                const screenshot = latestScreenshots[emp.id];
                const isOnline =
                  isToday(selectedDate) && emp.heartbeat?.isCurrentlyRunning; // Using isToday from date-fns
                const isHistoricalFallback = screenshot?.isFallback;
                const timestamp = screenshot?.timestamp?.toDate
                  ? screenshot.timestamp.toDate()
                  : new Date();

                // Determine if AI intent is loading for THIS employee
                const isLoadingIntent = aiIntentLoading[emp.id];
                const currentIntent = inferredIntents[emp.id];
                const currentError = aiIntentErrors[emp.id];

                // Determine display messages based on data availability and date
                const showNoActivityMessage = !screenshot && isToday(selectedDate); // Using isToday from date-fns
                const showHistoricalMessage = !screenshot && !isToday(selectedDate); // Using isToday from date-fns

                return (
                  <div
                    key={emp.id}
                    className="h-screen snap-start relative flex flex-col justify-between isolate"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    {/* Background Layer */}
                    <div className="absolute inset-0 -z-10">
                      {showNoActivityMessage ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary">
                          <Monitor size={40} className="opacity-20 mb-4" />
                          <span className="text-[12px] font-black uppercase tracking-widest text-center px-4">
                            No Activity on {format(selectedDate, 'MMM d')}
                          </span>
                        </div>
                      ) : showHistoricalMessage ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-card">
                          <span className="text-[12px] font-black uppercase tracking-widest text-center px-4">
                            Activity not available for {format(selectedDate, 'MMM d')}
                          </span>
                        </div>
                      ) : screenshot ? (
                        <img
                          src={
                            screenshot.url ||
                            screenshot.imageUrl ||
                            screenshot.activity?.cloudinaryUrl
                          }
                          alt={`Screenshot for ${emp.name}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Basic error handling for image loading
                            e.currentTarget.style.display = 'none'; // Hide broken image
                          }}
                        />
                      ) : null}
                    </div>

                    {/* Top-Left Overlay */}
                    <div className="p-4 absolute top-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2 pointer-events-auto">
                        {isToday(selectedDate) && !isHistoricalFallback && ( // Using isToday from date-fns
                          <div
                            className={`size-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}
                          />
                        )}
                        <span
                          className={cn(
                            'text-[11px] font-black uppercase tracking-widest backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1',
                            isHistoricalFallback
                              ? 'bg-orange-500/80'
                              : 'bg-black/50',
                          )}
                        >
                          {isHistoricalFallback && <History size={10} />}
                          {isHistoricalFallback
                            ? 'Last Active'
                            : isToday(selectedDate) // Using isToday from date-fns
                              ? isOnline
                                ? 'Live'
                                : 'Offline'
                              : format(selectedDate, 'MMM d')}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-widest backdrop-blur-md text-white px-2 py-0.5 rounded-full bg-black/50">
                          {format(timestamp, 'hh:mm:ss a')}
                        </span>
                      </div>
                    </div>

                    {/* Right-Side Overlay (Interaction Column) */}
                    <div className="p-4 absolute bottom-16 right-0 flex flex-col items-center gap-3 pointer-events-auto">
                      {' '}
                      {/* Pushed up to make space for bottom overlay */}
                      <div className="flex flex-col items-center gap-2">
                        {' '}
                        {/* Reduced gap for icons */}
                        {/* Profile Pic - Clickable to navigate to team page */}
                        <div
                          onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                          className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-all"
                        >
                          <img
                            src={getUserAvatar(emp)}
                            alt={emp.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        {/* Chat Icon - Clickable to open messages */}
                        <button
                          onClick={() => router.push(`/dashboard/messages/${emp.id}`)}
                          className="size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
                        >
                          <MessageCircle size={20} />
                        </button>
                      </div>
                      {/* Scroll Indicator - only show if there are more than 1 person and it's not the last person */}
                      {monitoredPersonnel.length > 1 &&
                        index < monitoredPersonnel.length - 1 && (
                          <div className="mt-2 animate-bounce">
                            {' '}
                            {/* Using standard Tailwind animate-bounce */}
                            <ChevronDown size={24} className="text-white/50" />
                          </div>
                        )}
                    </div>

                    {/* Bottom-Left Overlay (Caption/Summary) */}
                    <div className="p-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                      <div className="flex flex-col gap-1 pointer-events-auto">
                        {/* Employee Name */}
                        <span className="text-lg font-black uppercase tracking-tighter text-white">
                          {emp.name}
                        </span>

                        {/* AI Text Display Area */}
                        {isLoadingIntent ? (
                          <div className="mt-1">
                            <p className="text-sm font-bold text-white/90 tracking-wide">
                              What he's doing right now?:
                            </p>
                            <Shimmer className="h-16 w-full rounded-md" />{' '}
                            {/* Skeleton for AI text */}
                          </div>
                        ) : currentError ? (
                           <div className="mt-1">
                            <p className="text-sm font-bold text-red-500 tracking-wide">
                              Error Inferring Intent:
                            </p>
                            <p className="text-xs text-red-500">
                              {currentError}
                            </p>
                          </div>
                        ) : currentIntent ? (
                          <div className="mt-1">
                            <p className="text-sm font-bold text-white/90 tracking-wide">
                              What he's doing right now?:
                            </p>
                            <p className="text-xs text-white/80">
                              {currentIntent}
                            </p>
                          </div>
                        ) : (
                          // Fallback for no data, no error, and not loading
                          <div className="mt-1">
                            <p className="text-sm font-bold text-white/90 tracking-wide">
                              What he's doing right now?:
                            </p>
                            <p className="text-xs text-white/80">
                              {showNoActivityMessage ? "No activity to infer intent." : "Intent not available."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Desktop Grid View */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-8 custom-scrollbar">
            {' '}
            {/* Visible on medium screens and up */}
            {monitoredPersonnel.length === 0 ? (
              // No personnel state for desktop
              <div className="col-span-full flex flex-col items-center justify-center text-center space-y-4 h-full">
                <div className="size-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <User size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No personnel found</h3>
                <p className="text-muted-foreground max-w-xs">
                  Personnel using the Trac app or invited staff will appear
                  here.
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8"
                >
                  <UserPlus size={16} className="mr-2" /> Add Staff Member
                </Button>
              </div>
            ) : superviseLoading ? (
              // Loading state for desktop grid
              monitoredPersonnel.map((p) => (
                <Shimmer
                  key={p.id}
                  className="aspect-video w-full rounded-3xl"
                />
              ))
            ) : (
              // Personnel cards for desktop
              monitoredPersonnel.map((emp) => {
                const screenshot = latestScreenshots[emp.id];
                const isOnline =
                  isToday(selectedDate) && emp.heartbeat?.isCurrentlyRunning; // Using isToday from date-fns
                const isHistoricalFallback = screenshot?.isFallback;
                const timestamp = screenshot?.timestamp?.toDate
                  ? screenshot.timestamp.toDate()
                  : new Date();

                // Determine if AI intent is loading for THIS employee
                const isLoadingIntent = aiIntentLoading[emp.id];
                const currentIntent = inferredIntents[emp.id];
                const currentError = aiIntentErrors[emp.id];

                // Determine display messages based on data availability and date
                const showNoActivityMessage = !screenshot && isToday(selectedDate); // Using isToday from date-fns
                const showHistoricalMessage = !screenshot && !isToday(selectedDate); // Using isToday from date-fns


                return (
                  <div
                    key={emp.id}
                    className="group relative bg-card border-2 border-border rounded-[2rem] overflow-hidden isolate transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                      {showNoActivityMessage ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                          <Monitor size={32} className="opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                            No Activity on {format(selectedDate, 'MMM d')}
                          </span>
                        </div>
                      ) : showHistoricalMessage ? (
                         <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-card">
                          <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                            Activity not available for {format(selectedDate, 'MMM d')}
                          </span>
                        </div>
                      ) : screenshot ? (
                        <img
                          src={
                            screenshot.url ||
                            screenshot.imageUrl ||
                            screenshot.activity?.cloudinaryUrl
                          }
                          alt={`Screenshot for ${emp.name}`}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                          onClick={() =>
                            setSelectedScreenshot({
                              ...screenshot,
                              employeeName: emp.name,
                            })
                          }
                          onError={(e) => {
                            // Basic error handling for image loading
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}

                      {/* Badge Overlays */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        {isToday(selectedDate) && !isHistoricalFallback && ( // Using isToday from date-fns
                          <div
                            className={`size-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}
                          />
                        )}
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-widest backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1',
                            isHistoricalFallback
                              ? 'bg-orange-500/80'
                              : 'bg-black/50',
                          )}
                        >
                          {isHistoricalFallback && <History size={10} />}
                          {isHistoricalFallback
                            ? 'Last Active'
                            : isToday(selectedDate) // Using isToday from date-fns
                              ? isOnline
                                ? 'Live'
                                : 'Offline'
                              : format(selectedDate, 'MMM d')}
                        </span>
                      </div>

                      {screenshot && (
                        <button
                          onClick={() =>
                            setSelectedScreenshot({
                              ...screenshot,
                              employeeName: emp.name,
                            })
                          }
                          className="absolute bottom-4 right-4 size-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar - Clickable to navigate to team page */}
                        <div
                          onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                          className="size-10 rounded-full bg-secondary border border-border overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                        >
                          <img
                            src={getUserAvatar(emp)}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black tracking-tight truncate">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {screenshot
                              ? format(
                                  screenshot.timestamp?.toDate
                                    ? screenshot.timestamp.toDate()
                                    : new Date(),
                                  'hh:mm:ss a',
                                )
                              : '---'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-primary/5 shrink-0"
                        onClick={() => router.push(`/dashboard/team/${emp.id}`)}
                      >
                        View
                      </Button>
                    </div>

                    {/* AI Summary Display */}
                    <div className="p-5 flex flex-col gap-1">
                      {isLoadingIntent ? (
                        <div className="mt-1">
                          <p className="text-sm font-bold text-white/90 tracking-wide">
                            What he's doing right now?:
                          </p>
                          <Shimmer className="h-12 w-full rounded-md" />
                        </div>
                      ) : currentError ? (
                        <div className="mt-1">
                          <p className="text-sm font-bold text-red-500 tracking-wide">
                            Error Inferring Intent:
                          </p>
                          <p className="text-[10px] text-red-500 truncate">
                            {currentError}
                          </p>
                        </div>
                      ) : currentIntent ? (
                        <div className="mt-1">
                          <p className="text-sm font-bold text-white/90 tracking-wide">
                            What he's doing right now?:
                          </p>
                          <p className="text-[10px] text-white/80 truncate">
                            {currentIntent}
                          </p>
                        </div>
                      ) : (
                         <div className="mt-1">
                          <p className="text-sm font-bold text-white/90 tracking-wide">
                            What he's doing right now?:
                          </p>
                          <p className="text-[10px] text-white/80">
                            {showNoActivityMessage ? "No activity to infer intent." : "Intent not available."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Full Screen Screenshot Dialog (Remains for desktop interaction) */}
      <Dialog
        open={!!selectedScreenshot}
        onOpenChange={() => setSelectedScreenshot(null)}
      >
        <DialogContent className="max-w-[95vw] w-full p-0 border-none bg-black/95 overflow-hidden rounded-[2.5rem] shadow-2xl [&>button]:hidden">
          <div className="absolute top-0 left-0 right-0 p-8 z-50 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <Monitor size={24} />
              </div>
              <div>
                <h3 className="text-white text-xl font-black uppercase tracking-tighter leading-none mb-1">
                  {selectedScreenshot?.employeeName}
                </h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {selectedScreenshot &&
                    format(
                      selectedScreenshot.timestamp?.toDate
                        ? selectedScreenshot.timestamp.toDate()
                        : new Date(),
                      'hh:mm:ss a',
                    )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedScreenshot(null)}
              className="pointer-events-auto size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <div className="w-full h-full min-h-[80vh] flex items-center justify-center p-4">
            {selectedScreenshot && (
              <img
                src={
                  selectedScreenshot.url ||
                  selectedScreenshot.imageUrl ||
                  selectedScreenshot.activity?.cloudinaryUrl
                }
                alt="Enlarged screenshot"
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/5"
                onError={(e) => {
                  // Basic error handling for image loading
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InviteModal isOpen={showInviteModal} onOpenChange={setShowInviteModal} />
    </>
  );
}