'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { cn, getUserAvatar } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeam } from '@/hooks/use-team';
import { InviteModal } from '@/components/dashboard/InviteModal';
import { SubscriptionBadge } from '@/components/dashboard/SubscriptionBadge';
import { IntelligenceModal } from '@/components/dashboard/IntelligenceModal';
import { 
  LogOut, User, Building2, Ticket, 
  Check, Copy, Moon, Sun, Menu, X, ArrowLeft,
  Clock, Calendar, Save, Fingerprint, Loader2, BrainCircuit, ShieldCheck, Zap, Ban, ArrowRight, Users, Bell, MapPin, Pencil
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
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

  const [settings, setSettings] = useState({
    defaultShiftSeconds: 28800,
    offDays: ['Sun'],
    timeFormat: '24 hour',
    dateFormat: 'mm/dd/yyyy',
    startOfWeek: 'Sunday',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone as any || 'UTC',
    reportTime: '14:00'
  });

  useEffect(() => {
    if (userData?.settings) {
        setSettings(prev => ({...prev, ...userData.settings}));
    }
  }, [userData]);

  useEffect(() => {
    async function fetchOrg() {
      if (userData?.ownedOrgId || userData?.orgId) {
        const targetOrgId = userData?.ownedOrgId || userData?.orgId;
        const orgDoc = await getDoc(doc(db, 'organizations', targetOrgId));
        if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            setOrgData(orgData);
            if(orgData.settings){
                setSettings(prev => ({...prev, ...orgData.settings, timeZone: orgData.settings.timeZone || prev.timeZone}));
            }
        }
      }
    }
    fetchOrg();
  }, [userData]);

  useEffect(() => {
    if(typeof window !== 'undefined' && window.Notification) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear session cookie explicitly
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/dashboard/login');
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
      router.push('/dashboard/signup'); // Redirect to signup to create a new org
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
        <header className='h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30'>
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

        <div className='flex-1 overflow-y-auto p-8 custom-scrollbar'>
          <div className='max-w-3xl mx-auto space-y-8'>
            
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

             {/* Web Push Notifications Section */}
            <section className='bg-card border border-border rounded-3xl p-8 shadow-sm'>
                <div className='flex items-center gap-4 mb-6'>
                    <div className='size-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500'>
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className='text-lg font-black uppercase tracking-tighter'>Notifications</h3>
                        <p className='text-xs font-medium text-muted-foreground uppercase tracking-tight'>Manage your web push notification settings</p>
                    </div>
                </div>
                <div className='p-6 rounded-2xl bg-secondary/30 border-2 border-dashed border-border'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-bold'>Browser Notifications</p>
                            <p className='text-xs text-muted-foreground'>Receive real-time alerts and updates.</p>
                        </div>
                        {notificationPermission === 'granted' ? (
                            <div className='flex items-center gap-2 text-green-500 font-bold text-sm'>
                                <Check size={16} />
                                <span>Permission Granted</span>
                            </div>
                        ) : (
                            <Button onClick={handleNotificationPermission} disabled={notificationPermission === 'denied'}>
                                {notificationPermission === 'denied' ? 'Permission Denied' : 'Enable Notifications'}
                            </Button>
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

            {/* Danger Zone */}
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

          </div>
        </div>
      </main>
    </>
  );
}