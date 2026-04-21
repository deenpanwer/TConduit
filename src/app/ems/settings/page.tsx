'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { cn, getUserAvatar } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/ems/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeam } from '@/hooks/use-team';
import { InviteModal } from '@/components/ems/InviteModal';
import { SubscriptionBadge } from '@/components/ems/SubscriptionBadge';
import { IntelligenceModal } from '@/components/ems/IntelligenceModal';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, User, Building2, Ticket, 
  Check, Copy, Moon, Sun, Menu, X, ArrowLeft,
  Clock, Calendar, Save, Fingerprint, Loader2, BrainCircuit, ShieldCheck, Zap, Ban, ArrowRight, Users, Bell, MapPin, Pencil, MessageSquare, ClipboardList, Volume2, VolumeX,
  Globe, Sparkles, Trash2, Eye
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { z } from 'zod';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimezoneSelect, { type ITimezone, allTimezones } from 'react-timezone-select';
import { useSidebar } from '@/hooks/use-sidebar';


const SHIFTS = [
  { id: '4', label: '4h', seconds: 14400 },
  { id: '6', label: '6h', seconds: 21600 },
  { id: '8', label: '8h', seconds: 28800 },
  { id: '9', label: '9h', seconds: 32400 },
  { id: '10', label: '10h', seconds: 36000 },
];

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];


export default function SettingsPage() {
  const { user, userData, refreshUserData } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [orgData, setOrgData] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);
  const [selectedUserForIntelligence, setSelectedUserForIntelligence] = useState<{id: string, name: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOrgId, setCopiedOrgId] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  const [isSaving, setIsSaving] = useState(false);
  const { employees, loading: teamLoading } = useTeam();
  const { setIsMobileOpen } = useSidebar();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- ORGANIZATION CONTEXT STATE ---
  const [orgUrl, setOrgUrl] = useState('');
  const [generatedContext, setGeneratedContext] = useState<string | null>(null);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);

  const urlSchema = z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)" });

  const handleGenerateContext = async () => {
    try {
      urlSchema.parse(orgUrl);
    } catch (e: any) {
      toast({ title: "Invalid URL", description: e.errors[0].message, variant: "destructive" });
      return;
    }

    setIsGeneratingContext(true);
    setGeneratedContext(null);
    setShowContextPreview(false);

    try {
      const res = await fetch('/api/org/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: orgUrl }),
      });

      if (!res.ok) throw new Error('Failed to generate context');
      
      const data = await res.json();
      setGeneratedContext(data.context);
      setShowContextPreview(true);
      toast({ title: "Context Generated", description: "Strategic organizational context is ready for review." });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingContext(false);
    }
  };

  const handleSaveContext = async () => {
    if (!user || !generatedContext || !orgData) return;
    setIsSavingContext(true);
    try {
      const targetOrgId = userData.ownedOrgId || userData.orgId;
      const orgRef = doc(db, 'organizations', targetOrgId);
      await updateDoc(orgRef, {
        aiContext: generatedContext,
        updatedAt: serverTimestamp()
      });
      setOrgData((prev: any) => ({ ...prev, aiContext: generatedContext }));
      setGeneratedContext(null);
      setShowContextPreview(false);
      toast({ title: "Context Saved", description: "Organizational intelligence updated successfully." });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingContext(false);
    }
  };

  const [settings, setSettings] = useState({
    defaultShiftSeconds: 28800,
    offDays: ['Sun'],
    timeFormat: '24 hour',
    dateFormat: 'mm/dd/yyyy',
    startOfWeek: 'Sunday',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone as any || 'UTC',
    reportTime: '14:00'
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    globalMute: false,
    categories: {
      shifts: true,
      tasks: true,
      chats: true
    },
    mutedEmployees: [] as string[]
  });

  useEffect(() => {
    if (userData?.settings) {
        setSettings(prev => ({...prev, ...userData.settings}));
    }
    if (userData?.notificationPreferences) {
      setNotificationPreferences(prev => ({
        ...prev, 
        ...userData.notificationPreferences,
        categories: {
          ...prev.categories,
          ...userData.notificationPreferences.categories
        },
        mutedEmployees: userData.notificationPreferences.mutedEmployees || []
      }));
    }
  }, [userData]);

  useEffect(() => {
    async function fetchOrg() {
      if (userData?.ownedOrgId || userData?.orgId) {
        const targetOrgId = userData?.ownedOrgId || userData?.orgId;
        const orgDoc = await getDoc(doc(db, 'organizations', targetOrgId));
        if (orgDoc.exists()) {
            const data = orgDoc.data() as any;
            const orgDataObj = { id: orgDoc.id, ...data };
            setOrgData(orgDataObj);
            if(data.settings){
                setSettings(prev => ({...prev, ...data.settings, timeZone: data.settings.timeZone || prev.timeZone}));
            }
        }
      }
    }
    fetchOrg();
  }, [userData]);

  useEffect(() => {
    if(typeof window !== 'undefined') {
      if (window.Notification) {
        setNotificationPermission(Notification.permission);
      }
      
      // PWA Detection
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsStandalone(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear session cookie explicitly
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/ems/login');
      toast({ title: 'Signed out', description: 'You have been successfully logged out.' });
    } catch (error: any) {
      toast({ title: 'Logout failed', description: error.message, variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string, isOrgId = false) => {
    navigator.clipboard.writeText(text);
    if (isOrgId) {
        setCopiedOrgId(true);
        setTimeout(() => setCopiedOrgId(false), 2000);
    } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    toast({ title: 'Copied!', description: `${isOrgId ? 'Organization ID' : 'Invite code'} copied to clipboard.` });
  };

  const saveSettings = async () => {
    if (!user || !orgData) return;
    setIsSaving(true);
    try {
      const timezoneValue = typeof settings.timeZone === 'string' ? settings.timeZone : (settings.timeZone as any).value;

      const orgRef = doc(db, 'organizations', userData.ownedOrgId || userData.orgId);
      await updateDoc(orgRef, {
        'settings.defaultShiftSeconds': settings.defaultShiftSeconds,
        'settings.offDays': settings.offDays,
        'settings.timeFormat': settings.timeFormat,
        'settings.dateFormat': settings.dateFormat,
        'settings.startOfWeek': settings.startOfWeek,
        'settings.timeZone': timezoneValue,
        'settings.reportTime': settings.reportTime,
        updatedAt: serverTimestamp()
      });

      // Also save to user doc for their individual experience
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
         'settings.timeFormat': settings.timeFormat,
         'settings.dateFormat': settings.dateFormat,
         'settings.startOfWeek': settings.startOfWeek,
         'settings.timeZone': timezoneValue,
         'notificationPreferences': notificationPreferences,
      });

      await refreshUserData(); // Refresh user data to get latest settings
      toast({ title: 'Settings Saved', description: 'Organization and user defaults have been updated.' });
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };


  const toggleDay = (dayLabel: string) => {
    setSettings(prev => {
      const isOff = prev.offDays.includes(dayLabel);
      return {
        ...prev,
        offDays: isOff 
          ? prev.offDays.filter(d => d !== dayLabel) 
          : [...prev.offDays, dayLabel]
      };
    });
  };

  const handleDeleteOrganization = async () => {
    if (!user || !userData?.ownedOrgId) {
      toast({ title: 'Error', description: 'No organization to delete.', variant: 'destructive' });
      return;
    }

    setLoading(true); // Assuming a loading state exists or needs to be added
    try {
      const orgRef = doc(db, 'organizations', userData.ownedOrgId);
      const userRef = doc(db, 'users', user.uid);

      // Soft delete the organization
      await updateDoc(orgRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      // Update the owner's user document
      await updateDoc(userRef, {
        ownedOrgId: null,
        orgId: null, // Also clear if they were referenced as an employee somewhere
        onboardingCompleted: false, // Force re-onboarding for a new org
        orgDeleted: true, // Custom flag to indicate old org was deleted
      });

      // Clear the session and redirect
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      
      toast({ title: 'Organization Deleted', description: 'Your organization has been archived. You have been logged out.', variant: 'default' });
      router.push('/ems/signup'); // Redirect to signup to create a new org
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false); // Assuming a loading state exists
    }
  };

  const handleNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({ title: 'Notifications enabled!', description: 'You will now receive web push notifications.' });
      } else {
        toast({ title: 'Notifications denied', description: 'You can enable notifications in your browser settings.', variant: 'destructive' });
      }
    });
  };


  return (
    <>
      <InviteModal 
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      <IntelligenceModal 
        isOpen={showIntelligenceModal}
        onOpenChange={setShowIntelligenceModal}
        userId={selectedUserForIntelligence?.id || ''}
        userName={selectedUserForIntelligence?.name || ''}
      />

      <main className='flex-1 flex flex-col overflow-hidden relative'>
        <header className='h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setIsMobileOpen(true)}>
              <Menu />
            </Button>
            <Button variant='ghost' size='icon' onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </Button>
            <h2 className='font-black uppercase tracking-widest text-sm'>Account Settings</h2>
          </div>
          
          <div className='flex items-center gap-4'>
            <SubscriptionBadge orgData={orgData} userData={userData} />
            <Button 
                variant='ghost' 
                size='icon' 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <Button variant='destructive' size='sm' onClick={handleLogout} className='rounded-xl font-black uppercase tracking-widest text-[10px]'>
                <LogOut size={14} className='mr-2' />
                Logout
            </Button>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar'>
          <div className="w-full h-48 md:h-64 lg:h-72 rounded-3xl overflow-hidden relative shadow-lg">
            <img
              src={`https://picsum.photos/seed/${userData?.orgName || 'org-trac'}/1600/400`}
              alt="Organization Cover"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-4 md:px-8 z-10 relative mb-12">
            <div className="flex-shrink-0">
              <div className="h-28 w-28 md:h-40 md:w-40 border-4 border-background rounded-[2.5rem] shadow-xl bg-muted overflow-hidden flex items-center justify-center">
                {orgData?.logoUrl ? (
                    <img 
                        src={orgData.logoUrl} 
                        alt={userData?.orgName} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-blue-500/10 flex items-center justify-center text-blue-500 relative">
                        <Building2 size={64} className="opacity-40" />
                    </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:ml-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">{userData?.orgName || 'Your Organization'}</h1>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Badge className="bg-blue-500 hover:bg-blue-600 rounded-lg uppercase font-black tracking-widest text-[9px]">Official Command</Badge>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">{userData?.role || 'Admin'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <Button onClick={saveSettings} disabled={isSaving} size="lg" className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-xl shadow-primary/20">
                    {isSaving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
                    Sync Settings
                  </Button>
                </div>
            </div>
          </div>

          <Tabs defaultValue="identity" className="w-full space-y-8">
            <TabsList className="w-full h-auto p-1 bg-secondary/50 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-1">
              <TabsTrigger value="identity" className="rounded-xl py-2.5 font-black uppercase tracking-widest text-[10px]">Identity</TabsTrigger>
              <TabsTrigger value="company" className="rounded-xl py-2.5 font-black uppercase tracking-widest text-[10px]">Company</TabsTrigger>
              <TabsTrigger value="intelligence" className="rounded-xl py-2.5 font-black uppercase tracking-widest text-[10px]">Intelligence</TabsTrigger>
              <TabsTrigger value="dispatcher" className="rounded-xl py-2.5 font-black uppercase tracking-widest text-[10px]">Notification Settings</TabsTrigger>
              <TabsTrigger value="operations" className="rounded-xl py-2.5 font-black uppercase tracking-widest text-[10px]">Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-8">
                {/* Profile Section */}
                <section className='bg-card border border-border rounded-3xl p-8 shadow-sm'>
                    <div className='flex items-center gap-4 mb-8'>
                        <div className='size-16 rounded-2xl overflow-hidden border border-border bg-secondary shadow-inner'>
                            <img 
                                src={getUserAvatar(userData)}
                                alt='User Avatar'
                                className='w-full h-full object-cover'
                            />
                        </div>
                        <div>
                            <h3 className='text-lg font-black uppercase tracking-tighter'>{userData?.name || 'Your Profile'}</h3>
                            <p className='text-xs font-medium text-muted-foreground uppercase tracking-tight'>Personal account details</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-2'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Email Address</Label>
                            <Input value={user?.email || ''} disabled className='bg-secondary/50 h-12 rounded-xl font-bold' />
                        </div>
                        <div className='space-y-2'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Account Role</Label>
                            <Input value={userData?.role || 'Organization Owner'} disabled className='bg-secondary/50 h-12 rounded-xl font-bold' />
                        </div>
                    </div>
                </section>

                {/* Termination Protocol (Moved from Advanced) */}
                <section className='p-8 border-2 border-destructive/10 rounded-3xl bg-destructive/5'>
                     <h3 className='text-sm font-black uppercase tracking-widest text-destructive mb-2'>Danger Zone</h3>
                     <p className='text-xs font-medium text-muted-foreground mb-6'>Permanently delete your organization and all associated employee data.</p>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant='destructive' className='rounded-xl font-black uppercase tracking-widest text-[10px]'>
                                Delete Organization
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will archive your organization's data, but you will no longer have access to it. You will be logged out and will need to create a new organization to continue using the app.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteOrganization}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                </section>
            </TabsContent>

            <TabsContent value="company" className="space-y-8">
                {/* Organization Section */}
                <section className='bg-card border border-border rounded-3xl p-8 shadow-sm'>
                    <div className='flex items-center gap-4 mb-8'>
                        <div className='size-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500'>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className='text-lg font-black uppercase tracking-tighter'>Organization</h3>
                            <p className='text-xs font-medium text-muted-foreground uppercase tracking-tight'>Company & Team management</p>
                        </div>
                    </div>

                    <div className='space-y-6'>
                        <div className='space-y-2'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Organization Name</Label>
                            <Input value={userData?.orgName || ''} readOnly className='h-12 rounded-xl font-bold' />
                        </div>

                        <div className='p-6 rounded-2xl bg-secondary/30 border-2 border-dashed border-border'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className='size-10 bg-background rounded-xl flex items-center justify-center border shadow-sm'>
                                        <Ticket size={20} className='text-primary' />
                                    </div>
                                    <div>
                                        <p className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>Team Invite Code</p>
                                        <p className='text-xl font-black tracking-[0.2em]'>{orgData?.inviteCode || '------'}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant='outline' 
                                    size='sm' 
                                    onClick={() => copyToClipboard(orgData?.inviteCode || '')}
                                    className='rounded-xl font-black uppercase tracking-widest text-[10px]'
                                >
                                    {copied ? <Check size={14} className='mr-2' /> : <Copy size={14} className='mr-2' />}
                                    {copied ? 'Copied' : 'Copy Code'}
                                </Button>
                            </div>
                            <p className='mt-4 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed'>
                                Share this code with your employees. They can enter it in the Trac Diary app to link their profile to your organization.
                            </p>
                        </div>

                        <div className='p-6 rounded-2xl bg-secondary/30 border-2 border-dashed border-border'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-4'>
                                    <div className='size-10 bg-background rounded-xl flex items-center justify-center border shadow-sm text-muted-foreground'>
                                        <Fingerprint size={20} />
                                    </div>
                                    <div>
                                        <p className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>Organization ID</p>
                                        <p className='text-xs font-bold tracking-tight text-muted-foreground'>{userData?.ownedOrgId || userData?.orgId || '------'}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant='ghost' 
                                    size='sm' 
                                    onClick={() => copyToClipboard(userData?.ownedOrgId || userData?.orgId || '', true)}
                                    className='rounded-xl font-black uppercase tracking-widest text-[10px] h-8'
                                >
                                    {copiedOrgId ? <Check size={12} className='mr-2 text-green-500' /> : <Copy size={12} className='mr-2' />}
                                    {copiedOrgId ? 'Copied' : 'Copy ID'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </TabsContent>

            <TabsContent value="intelligence" className="space-y-8">
                {/* Organization Context (AI Intelligence) Section */}
                <section className='bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group'>
                    <div className='absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity'>
                        <Globe size={120} />
                    </div>
                    
                    <div className='space-y-8 relative z-10'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                            <div className='space-y-2'>
                                <div className='flex items-center gap-4'>
                                    <div className='size-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 border-2 border-purple-500/20 shadow-inner'>
                                        <Sparkles size={32} />
                                    </div>
                                    <div>
                                        <h3 className='text-2xl font-black uppercase tracking-tighter'>Organization Context</h3>
                                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>High-Density Workforce Intelligence</p>
                                    </div>
                                </div>
                                <p className='text-sm font-bold leading-relaxed max-w-xl text-muted-foreground'>
                                    Train the Trac AI on your company's mission, products, and culture by analyzing your website. This context helps the AI provide deeper insights into employee work.
                                </p>
                            </div>
                        </div>

                        <div className='space-y-6'>
                            <div className='space-y-3'>
                                <Label className='text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2'>
                                    <Globe size={14} className='text-primary' /> Website URL for Analysis
                                </Label>
                                <div className='flex gap-3'>
                                    <Input 
                                        placeholder='https://your-company.com'
                                        value={orgUrl}
                                        onChange={(e) => setOrgUrl(e.target.value)}
                                        className='h-12 rounded-xl font-bold bg-background'
                                    />
                                    <Button 
                                        onClick={handleGenerateContext}
                                        disabled={isGeneratingContext || !orgUrl}
                                        className='bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] transition-all active:translate-y-[1px]'
                                    >
                                        {isGeneratingContext ? <Loader2 size={16} className='animate-spin' /> : <Sparkles size={16} className='mr-2' />}
                                        {isGeneratingContext ? 'Analyzing...' : 'Generate Context'}
                                    </Button>
                                </div>
                            </div>

                            {/* Current/Generated Context Display */}
                            {(orgData?.aiContext || generatedContext) && (
                                <div className='space-y-4'>
                                    <div className='flex items-center justify-between'>
                                        <h4 className='text-xs font-black uppercase tracking-widest flex items-center gap-2'>
                                            {generatedContext ? <Eye size={14} /> : <ShieldCheck size={14} />}
                                            {generatedContext ? 'Preview New Intelligence' : 'Active Organizational Context'}
                                        </h4>
                                        {generatedContext && (
                                            <div className='flex gap-2'>
                                                <Button 
                                                    variant='ghost' 
                                                    size='sm' 
                                                    onClick={() => { setGeneratedContext(null); setShowContextPreview(false); }}
                                                    className='text-destructive hover:bg-destructive/10 rounded-xl font-black uppercase tracking-widest text-[10px]'
                                                >
                                                    <Trash2 size={14} className='mr-2' /> Discard
                                                </Button>
                                                <Button 
                                                    size='sm' 
                                                    onClick={handleSaveContext}
                                                    disabled={isSavingContext}
                                                    className='bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px]'
                                                >
                                                    {isSavingContext ? <Loader2 size={14} className='animate-spin mr-2' /> : <Save size={14} className='mr-2' />}
                                                    Save Intelligence
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className='p-8 rounded-[2rem] bg-secondary/30 border-2 border-border max-h-[500px] overflow-y-auto custom-scrollbar prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter'>
                                        <ReactMarkdown>
                                            {generatedContext || orgData?.aiContext || ""}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            
                            {!orgData?.aiContext && !generatedContext && (
                                <div className='py-12 text-center bg-secondary/10 rounded-[2rem] border-2 border-dashed border-border'>
                                    <BrainCircuit className='size-12 mx-auto mb-4 text-muted-foreground/30' />
                                    <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>AI Context not yet established</p>
                                    <p className='text-[10px] text-muted-foreground/60 mt-1 uppercase'>Enter your website URL above to build your organizational identity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Tracking Intelligence Section (User Specific) */}
                <section className='bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group'>
                    <div className='absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity'>
                        <BrainCircuit size={120} />
                    </div>
                    
                    <div className='space-y-8 relative z-10'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                            <div className='space-y-2'>
                                <div className='flex items-center gap-4'>
                                    <div className='size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner'>
                                        <ShieldCheck size={32} />
                                    </div>
                                    <div>
                                        <h3 className='text-2xl font-black uppercase tracking-tighter'>Tracking Intelligence</h3>
                                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Employee-Specific Work Rules</p>
                                    </div>
                                </div>
                                <p className='text-sm font-bold leading-relaxed max-w-xl text-muted-foreground'>
                                    Set custom 'Work Powerhouses' and 'Focus Killers' for each team member to refine their productivity reports.
                                </p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 gap-3'>
                            {employees.map((emp: any) => (
                                <div 
                                    key={emp.id} 
                                    className='flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border-2 border-transparent hover:border-black dark:hover:border-white transition-all group/item'
                                >
                                    <div className='flex items-center gap-4'>
                                        <div className='size-10 rounded-full overflow-hidden border-2 border-border'>
                                            <img src={getUserAvatar(emp)} alt={emp.name} className='w-full h-full object-cover' />
                                        </div>
                                        <div>
                                            <p className='text-sm font-black uppercase tracking-tight'>{emp.name}</p>
                                            <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>{emp.role || 'Staff'}</p>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        variant='outline'
                                        onClick={() => {
                                            setSelectedUserForIntelligence({ id: emp.id, name: emp.name });
                                            setShowIntelligenceModal(true);
                                        }}
                                        className='bg-background border-2 border-black dark:border-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] transition-all active:translate-y-[1px]'
                                    >
                                        Configure
                                    </Button>
                                </div>
                            ))}
                            {employees.length === 0 && (
                                <div className='text-center py-12 bg-secondary/20 rounded-3xl border-2 border-dashed border-border'>
                                    <Users className='size-12 mx-auto mb-4 text-muted-foreground/30' />
                                    <p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>No staff members found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </TabsContent>

            <TabsContent value="dispatcher" className="space-y-8">
                 {/* Notification Preferences Section */}
                <section className='bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group'>
                    <div className='absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity'>
                        <Bell size={120} />
                    </div>
                    
                    <div className='space-y-8 relative z-10'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                            <div className='space-y-2'>
                                <div className='flex items-center gap-4'>
                                    <div className='size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner'>
                                        <Bell size={32} />
                                    </div>
                                    <div>
                                        <h3 className='text-2xl font-black uppercase tracking-tighter'>Notification Preferences</h3>
                                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Dispatcher Management & Mute Controls</p>
                                    </div>
                                </div>
                                <p className='text-sm font-bold leading-relaxed max-w-xl text-muted-foreground'>
                                    Control how and when you receive real-time alerts from the Traconomics Dispatcher.
                                </p>
                            </div>
                            <Button 
                                onClick={saveSettings} 
                                disabled={isSaving}
                                className='bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-[-2px] transition-all active:translate-y-[1px]'
                            >
                                {isSaving ? <Loader2 className='size-3 mr-2 animate-spin' /> : <Save className='size-3 mr-2' />}
                                Sync Preferences
                            </Button>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {/* Global Control */}
                            <div className='p-6 rounded-[2rem] bg-secondary/30 border-2 border-border space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <Zap className='text-primary' size={20} />
                                        <h4 className='text-sm font-black uppercase tracking-tight'>Global Master Switch</h4>
                                    </div>
                                    <Switch 
                                        checked={!notificationPreferences.globalMute}
                                        onCheckedChange={(checked) => setNotificationPreferences(prev => ({...prev, globalMute: !checked}))}
                                    />
                                </div>
                                <p className='text-xs font-medium text-muted-foreground leading-tight'>
                                    When active, the system will process all incoming reports based on your category filters. Muting this disables all dispatcher traffic.
                                </p>
                                
                                <div className='pt-4 border-t border-border/50 space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>Browser Sync</span>
                                        {notificationPermission === 'granted' ? (
                                            <div className='flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase'>
                                                <Check size={12} />
                                                <span>Active</span>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handleNotificationPermission}
                                                className='text-[10px] font-black uppercase text-primary hover:underline'
                                            >
                                                Enable Push
                                            </button>
                                        )}
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>App Installation</span>
                                        {isStandalone ? (
                                            <div className='flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase'>
                                                <Check size={12} />
                                                <span>Active</span>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handlePWAInstall}
                                                disabled={!deferredPrompt}
                                                className={cn(
                                                    'text-[10px] font-black uppercase tracking-widest',
                                                    deferredPrompt ? 'text-primary hover:underline' : 'text-muted-foreground cursor-not-allowed opacity-50'
                                                )}
                                            >
                                                {deferredPrompt ? 'Add to Screen' : 'Standalone'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category Filters */}
                            <div className='p-6 rounded-[2rem] bg-secondary/30 border-2 border-border space-y-4'>
                                <div className='flex items-center gap-3'>
                                    <ShieldCheck className='text-primary' size={20} />
                                    <h4 className='text-sm font-black uppercase tracking-tight'>Category Intelligence</h4>
                                </div>
                                
                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/50'>
                                        <div className='flex items-center gap-3'>
                                            <Clock size={16} className='text-muted-foreground' />
                                            <span className='text-[10px] font-black uppercase tracking-widest'>Shifts & Claims</span>
                                        </div>
                                        <Switch 
                                            checked={notificationPreferences.categories.shifts}
                                            onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                                                ...prev, 
                                                categories: { ...prev.categories, shifts: checked }
                                            }))}
                                        />
                                    </div>
                                    <div className='flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/50'>
                                        <div className='flex items-center gap-3'>
                                            <ClipboardList size={16} className='text-muted-foreground' />
                                            <span className='text-[10px] font-black uppercase tracking-widest'>Task Activities</span>
                                        </div>
                                        <Switch 
                                            checked={notificationPreferences.categories.tasks}
                                            onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                                                ...prev, 
                                                categories: { ...prev.categories, tasks: checked }
                                            }))}
                                        />
                                    </div>
                                    <div className='flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/50'>
                                        <div className='flex items-center gap-3'>
                                            <MessageSquare size={16} className='text-muted-foreground' />
                                            <span className='text-[10px] font-black uppercase tracking-widest'>Messenger Traffic</span>
                                        </div>
                                        <Switch 
                                            checked={notificationPreferences.categories.chats}
                                            onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                                                ...prev, 
                                                categories: { ...prev.categories, chats: checked }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Muted Employees Cluster */}
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <Users className='text-primary' size={20} />
                                    <h4 className='text-sm font-black uppercase tracking-tight'>Personnel Mute List</h4>
                                </div>
                                <span className='text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest'>
                                    {notificationPreferences.mutedEmployees.length} Muted
                                </span>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                                {employees.map((emp: any) => {
                                    const isMuted = notificationPreferences.mutedEmployees.includes(emp.id);
                                    return (
                                        <div 
                                            key={emp.id} 
                                            className='flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:bg-secondary/40 transition-all'
                                        >
                                            <div className='flex items-center gap-3'>
                                                <div className='size-8 rounded-full overflow-hidden border border-border bg-muted'>
                                                    <img src={getUserAvatar(emp)} alt={emp.name} className='w-full h-full object-cover' />
                                                </div>
                                                <div className='min-w-0'>
                                                    <p className='text-[10px] font-black uppercase truncate max-w-[100px]'>{emp.name}</p>
                                                    <p className='text-[8px] font-bold text-muted-foreground uppercase'>{emp.role || 'Staff'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setNotificationPreferences(prev => {
                                                        const alreadyMuted = prev.mutedEmployees.includes(emp.id);
                                                        return {
                                                            ...prev,
                                                            mutedEmployees: alreadyMuted 
                                                                ? prev.mutedEmployees.filter(id => id !== emp.id)
                                                                : [...prev.mutedEmployees, emp.id]
                                                        };
                                                    });
                                                }}
                                                className={cn(
                                                    'p-2 rounded-xl border transition-all',
                                                    isMuted 
                                                        ? 'bg-destructive/10 text-destructive border-destructive/20' 
                                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                )}
                                            >
                                                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                            </button>
                                        </div>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <div className='col-span-full py-8 text-center bg-secondary/10 rounded-3xl border-2 border-dashed border-border'>
                                        <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>No employees found to manage</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </TabsContent>

            <TabsContent value="operations" className="space-y-8">
                {/* Operations Section */}
                <section className='bg-card border border-border rounded-3xl p-8 shadow-sm'>
                    <div className='flex items-center justify-between mb-8'>
                        <div className='flex items-center gap-4'>
                            <div className='size-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500'>
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className='text-lg font-black uppercase tracking-tighter'>Operations</h3>
                                <p className='text-xs font-medium text-muted-foreground uppercase tracking-tight'>Organization Defaults</p>
                            </div>
                        </div>
                        <Button 
                            onClick={saveSettings} 
                            disabled={isSaving}
                            className='rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20'
                        >
                            {isSaving ? <Loader2 className='size-3 mr-2 animate-spin' /> : <Save className='size-3 mr-2' />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>

                    <div className='space-y-8'>
                         {/* Time & Date Formatting */}
                        <div className='space-y-4'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Time & Date Preferences</Label>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Start of calendar week</Label>
                                    <Select value={settings.startOfWeek} onValueChange={(value) => setSettings(prev => ({...prev, startOfWeek: value}))}>
                                        <SelectTrigger className='h-12 rounded-xl font-bold'><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='Sunday'>Sunday</SelectItem>
                                            <SelectItem value='Monday'>Monday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Time format</Label>
                                    <Select value={settings.timeFormat} onValueChange={(value) => setSettings(prev => ({...prev, timeFormat: value}))}>
                                        <SelectTrigger className='h-12 rounded-xl font-bold'><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='24 hour'>24 hour</SelectItem>
                                            <SelectItem value='12 hour'>12 hour</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Date format</Label>
                                    <Select value={settings.dateFormat} onValueChange={(value) => setSettings(prev => ({...prev, dateFormat: value}))}>
                                        <SelectTrigger className='h-12 rounded-xl font-bold'><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='mm/dd/yyyy'>mm/dd/yyyy</SelectItem>
                                            <SelectItem value='dd/mm/yyyy'>dd/mm/yyyy</SelectItem>
                                            <SelectItem value='yyyy/mm/dd'>yyyy/mm/dd</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-3'>
                                    <Label className='text-xs font-semibold uppercase tracking-wider ml-1 flex items-center gap-2'>
                                      <MapPin size={14} className='text-primary' /> Timezone
                                    </Label>
                                    {isEditingTimezone ? (
                                      <div className='relative'>
                                        <TimezoneSelect
                                          timezones={(() => {
                                            const currentTzValue = typeof settings.timeZone === 'string' ? settings.timeZone : (settings.timeZone as any).value;
                                            const currentTz = allTimezones[currentTzValue];
                                            if (currentTz) {
                                              const reorderedTimezones = { [currentTzValue]: currentTz, ...allTimezones };
                                              return reorderedTimezones;
                                            }
                                            return allTimezones;
                                          })()}
                                          value={settings.timeZone}
                                          onChange={(tz) => {
                                            setSettings({ ...settings, timeZone: tz });
                                            setIsEditingTimezone(false);
                                          }}
                                          styles={{
                                            control: (base) => ({ ...base, height: '56px', borderRadius: '1rem', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border)/0.5)', paddingLeft: '1rem' }),
                                            menu: (base) => ({ ...base, borderRadius: '1rem', zIndex: 50, backgroundColor: 'hsl(var(--card))' }),
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div 
                                        className='p-4 h-12 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between cursor-pointer'
                                        onClick={() => setIsEditingTimezone(true)} 
                                        >
                                        <span className='text-sm font-bold'>
                                            {typeof settings.timeZone === 'string' ? settings.timeZone : settings.timeZone.value}
                                        </span>
                                        <Pencil size={16} className='text-muted-foreground' />
                                      </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1'>Reports Time</Label>
                            <p className='text-xs text-muted-foreground'>Set the default time for daily report notifications.</p>
                            <Input type='time' className='h-12 rounded-xl font-bold' value={settings.reportTime} onChange={(e) => setSettings(prev => ({...prev, reportTime: e.target.value}))}/>
                        </div>

                        <div className='space-y-4'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2'>
                                Default Shift Duration
                            </Label>
                            <div className='grid grid-cols-5 gap-2'>
                                {SHIFTS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSettings({ ...settings, defaultShiftSeconds: s.seconds })}
                                        className={cn(
                                            'py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all',
                                            settings.defaultShiftSeconds === s.seconds 
                                                ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                                                : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <Label className='text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2'>
                                Weekly Off-Days
                            </Label>
                            <div className='flex justify-between gap-1'>
                                {DAYS.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => toggleDay(d.label)}
                                        className={cn(
                                            'flex-1 py-3 rounded-xl border-2 text-[10px] font-black transition-all',
                                            settings.offDays.includes(d.label) 
                                                ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                                                : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <p className='text-[9px] text-muted-foreground uppercase tracking-widest text-center'>Selected days are marked as non-working holidays.</p>
                        </div>
                    </div>
                </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}