"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, ChevronRight, CheckCircle2, Loader2, 
  Upload, Image as ImageIcon, Link as LinkIcon, Plus, MapPin, Phone, Pencil, User,
  ShoppingCart, ListTodo, Users, LayoutDashboard
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, setDoc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import TimezoneSelect, { type ITimezone, allTimezones } from 'react-timezone-select';


const TEAM_SIZES = [
  { id: "1", label: "1 (Just me)" },
  { id: "2-10", label: "2 - 10" },
  { id: "11-50", label: "11 - 50" },
  { id: "51-200", label: "51 - 200" },
  { id: "201-500", label: "201 - 500" },
  { id: "501+", label: "501+" },
];

const REPORTING_PLATFORMS = [
  { id: "dashboard", label: "Trac Dashboard" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "slack", label: "Slack" },
  { id: "notifications", label: "App Notifications" },
  { id: "others", label: "Others" },
];

const SHIFTS = [
  { id: "4", label: "4h", seconds: 14400 },
  { id: "6", label: "6h", seconds: 21600 },
  { id: "8", label: "8h", seconds: 28800 },
  { id: "9", label: "9h", seconds: 32400 },
  { id: "10", label: "10h", seconds: 36000 },
];

const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

const AVAILABLE_MODULES = [
  { id: "ems", label: "Employee Productivity", path: "/ems", icon: LayoutDashboard, description: "Monitor performance & activity" },
  { id: "pos", label: "POS", path: "/pos/dashboard", icon: ShoppingCart, description: "Sales & inventory management" },
  { id: "tasks", label: "Tasks", path: "/tasks", icon: ListTodo, description: "Project & task management" },
  { id: "crm", label: "CRM", path: "/crm", icon: Users, description: "Client & lead management" },
];

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [orgData, setOrgData] = useState<any>(null);
  const [logoMode, setLogoMode] = useState<"upload" | "url">("upload");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || "/ems";
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    role: "",
    orgName: "",
    teamSize: "",
    reportingPlatforms: ["dashboard"] as string[],
    otherPlatform: "",
    logoUrl: "",
    motivation: "",
    whatsapp: "",
    inviteCode: "",
    shift: "8",
    workdays: [1, 2, 3, 4, 5],
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone as any) || "UTC",
    modulePriorities: [] as string[]
  });

  // Handle Initial Redirects and Org Fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = userDoc.data();
        setUserData(data);

        // Compatibility with Electron app field name 'employeeOnboardingV1Complete'
        if (data?.onboardingCompleted || data?.employeeOnboardingV1Complete) {
          const topPriorityModuleId = data?.modulePriorities?.[0];
          const topPriorityModule = AVAILABLE_MODULES.find(m => m.id === topPriorityModuleId);
          const finalUrl = topPriorityModule?.path || callbackUrl;
          
          // Prevent infinite redirect loop
          if (finalUrl === "/ems/onboarding") {
            router.push("/ems");
          } else {
            router.push(finalUrl);
          }
          return;
        }

        if (data?.role) {
          setFormData(prev => ({ ...prev, role: data.role }));
        }

        if (data?.ownedOrgId) {
          const orgDoc = await getDoc(doc(db, "organizations", data.ownedOrgId));
          const oData = orgDoc.data();
          setOrgData({ id: data.ownedOrgId, ...oData });
          if (oData?.name) {
            setFormData(prev => ({ ...prev, orgName: oData.name }));
          }
        } else if (data?.orgId) {
          const orgDoc = await getDoc(doc(db, "organizations", data.orgId));
          const oData = orgDoc.data();
          setOrgData({ id: data.orgId, ...oData });
          // If already linked to an org (e.g. Electron), start at Step 2
          if (data.role !== 'owner') {
            setStep(2);
          }
        }
        setAuthLoading(false);
      } else {
        router.push("/ems/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setFormData({ ...formData, logoUrl: base64String });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleJoinOrg = async () => {
    if (!formData.inviteCode) return;
    setLoading(true);
    try {
      const q = query(collection(db, "organizations"), where("inviteCode", "==", formData.inviteCode), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        throw new Error("Invalid invite code. Please check and try again.");
      }

      const targetOrg = snap.docs[0];
      const targetOrgData = targetOrg.data();

      await updateDoc(doc(db, "users", user.uid), {
        orgId: targetOrg.id,
        orgName: targetOrgData.name,
        role: "employee",
        updatedAt: serverTimestamp()
      });

      setOrgData({ id: targetOrg.id, ...targetOrgData });
      setFormData(prev => ({ ...prev, role: "employee", orgName: targetOrgData.name }));
      setStep(2);
      toast({ title: "Joined Organization", description: `You have successfully joined ${targetOrgData.name}.` });
    } catch (error: any) {
      toast({ title: "Join failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const offDays = DAYS.filter(d => !formData.workdays.includes(d.id)).map(d => d.label);
      const isOwner = formData.role === 'owner' || formData.role === 'Founder' || formData.role === 'Manager' || formData.role === 'Ops' || formData.role === 'HR';

      const partnerSlug = document.cookie
        .split('; ')
        .find(row => row.startsWith('trac_partner_slug='))
        ?.split('=')[1] || userData?.partnerSlug || null;
      
      const defaultShiftSeconds = SHIFTS.find(s => s.id === formData.shift)?.seconds || 28800;
      const timezone = typeof formData.timezone === 'string' ? formData.timezone : (formData.timezone as any).value;
      
      const orgSettings = {
          defaultShiftSeconds: defaultShiftSeconds,
          offDays: offDays,
          timeFormat: "24 hour",
          dateFormat: "mm/dd/yyyy",
          startOfWeek: "Sunday",
          reportTime: "14:00",
          timezone: timezone
      };

      const topPriorityModuleId = formData.modulePriorities[0] || 'ems';
      const topPriorityModule = AVAILABLE_MODULES.find(m => m.id === topPriorityModuleId);
      const finalCallbackUrl = topPriorityModule?.path || callbackUrl;

      if (isOwner) {
        let finalOrgId = orgData?.id;
        if (!finalOrgId) {
          finalOrgId = `org_${Math.random().toString(36).substr(2, 9)}`;
          const trialExpiry = new Date();
          trialExpiry.setDate(trialExpiry.getDate() + 7);

          await setDoc(doc(db, "organizations", finalOrgId), {
            name: formData.orgName || "My Organization",
            ownerId: user.uid,
            logoUrl: formData.logoUrl || null,
            teamSize: formData.teamSize,
            reportingPlatforms: formData.reportingPlatforms,
            otherPlatform: formData.otherPlatform || null,
            whatsapp: formData.whatsapp,
            motivation: formData.motivation,
            inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
            subscriptionExpiry: trialExpiry,
            subscriptionStatus: "trialing",
            partnerSlug: partnerSlug,
            createdAt: serverTimestamp(),
            settings: orgSettings,
            selectedModules: formData.modulePriorities, // Boss instructions: rank modules
            modulePriorities: formData.modulePriorities
          });

          // Attribution
          if (partnerSlug) {
            (async () => {
              try {
                const partnerQ = query(collection(db, "partners"), where("slug", "==", partnerSlug), limit(1));
                const partnerSnap = await getDocs(partnerQ);
                if (!partnerSnap.empty) {
                  const partnerDoc = partnerSnap.docs[0];
                  await setDoc(doc(db, "partners", partnerDoc.id, "signups", finalOrgId), {
                    orgName: formData.orgName || "My Organization",
                    clientEmail: user.email,
                    createdAt: serverTimestamp(),
                  });
                }
              } catch (e) {}
            })();
          }
        } else {
          await updateDoc(doc(db, "organizations", finalOrgId), {
            name: formData.orgName,
            logoUrl: formData.logoUrl || null,
            teamSize: formData.teamSize,
            reportingPlatforms: formData.reportingPlatforms,
            otherPlatform: formData.otherPlatform || null,
            whatsapp: formData.whatsapp,
            motivation: formData.motivation,
            onboardingCompleted: true,
            settings: orgSettings, 
            selectedModules: formData.modulePriorities,
            modulePriorities: formData.modulePriorities,
            updatedAt: serverTimestamp()
          });
        }

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || "User",
          photoUrl: user.photoURL || null,
          role: formData.role || "owner",
          orgName: formData.orgName,
          ownedOrgId: finalOrgId,
          onboardingCompleted: true,
          whatsapp: formData.whatsapp,
          partnerSlug: partnerSlug,
          modulePriorities: formData.modulePriorities,
          settings: { 
            defaultShiftSeconds: defaultShiftSeconds,
            offDays: offDays,
            timezone: timezone,
            timeFormat: orgSettings.timeFormat,
            dateFormat: orgSettings.dateFormat,
            startOfWeek: orgSettings.startOfWeek,
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        // Employee Submit
        await updateDoc(doc(db, "users", user.uid), {
          role: formData.role, 
          onboardingCompleted: true,
          whatsapp: formData.whatsapp,
          modulePriorities: formData.modulePriorities,
          settings: {
            defaultShiftSeconds: SHIFTS.find(s => s.id === formData.shift)?.seconds || 28800,
            offDays: offDays,
            timezone: typeof formData.timezone === 'string' ? formData.timezone : (formData.timezone as any).value
          },
          updatedAt: serverTimestamp()
        });
      }

      await refreshUserData();
      toast({ title: "Configuration complete", description: "Welcome to your new workspace." });
      
      const routingUrl = finalCallbackUrl.startsWith('/crm') 
        ? `/crm/onboarding?callbackUrl=${finalCallbackUrl}` 
        : finalCallbackUrl;
        
      router.push(routingUrl);
    } catch (error: any) {
      toast({ title: "Setup failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role Selection Step (if no role yet)
  if (!formData.role && step === 1) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="w-full max-w-2xl bg-card border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center backdrop-blur-sm">
          <div className="flex justify-center mb-8">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12 dark:invert" />
          </div>
          <h1 className="text-3xl font-bold mb-4 uppercase tracking-tight">How will you be using Trac?</h1>
          <p className="text-muted-foreground mb-8">Choose your role to customize your setup experience.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => { setFormData({...formData, role: 'owner'}); }}
              className="p-8 rounded-[2rem] border-4 border-transparent bg-secondary/30 hover:bg-secondary/50 hover:border-primary transition-all group"
            >
              <Building2 size={48} className="mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-black uppercase tracking-widest mb-2">Employer</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">I want to manage my team and operations.</p>
            </button>
            <button 
              onClick={() => { setFormData({...formData, role: 'employee'}); }}
              className="p-8 rounded-[2rem] border-4 border-transparent bg-secondary/30 hover:bg-secondary/50 hover:border-primary transition-all group"
            >
              <User size={48} className="mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-black uppercase tracking-widest mb-2">Employee</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">I'm joining an existing organization.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = formData.role === 'owner' || formData.role === 'Founder' || formData.role === 'Manager' || formData.role === 'Ops' || formData.role === 'HR';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-12">
          <img src="/logo.svg" alt="Logo" className="w-12 h-12 dark:invert" />
        </div>

        <div className="bg-card border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-12 backdrop-blur-sm relative">
          <div className="flex items-center justify-between mb-10">
            <div className="flex gap-2">
              {(isOwner ? [1, 2, 3, 4, 5] : (userData?.orgId ? [1, 2, 3] : [1, 2, 3, 4])).map((i) => {
                const isActive = isOwner ? step === i : (userData?.orgId ? step === i + 1 : step === i);
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      isActive ? "w-8 bg-primary" : "w-4 bg-secondary"
                    )} 
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Step {isOwner ? step : (userData?.orgId ? step - 1 : step)} of {isOwner ? 5 : (userData?.orgId ? 3 : 4)}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* EMPLOYEE STEP 1: Join Organization */}
            {!isOwner && step === 1 && (
              <motion.div
                key="empStep1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Join Organization</h1>
                  <p className="text-muted-foreground">Enter the invite code provided by your employer.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Invite Code</Label>
                    <Input
                      placeholder="e.g. 123456"
                      value={formData.inviteCode}
                      onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                      className="h-14 rounded-2xl px-6 bg-background/50 text-center text-2xl font-black tracking-[0.3em]"
                      maxLength={6}
                    />
                  </div>
                </div>

                <Button 
                  disabled={formData.inviteCode.length < 6 || loading} 
                  onClick={handleJoinOrg} 
                  className="w-full h-14 rounded-2xl font-bold uppercase tracking-wide group"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify Code"}
                  {!loading && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
                </Button>
              </motion.div>
            )}

            {/* PERSONAL DETAILS: Step 1 (Owner) or Step 2 (Employee) */}
            {((isOwner && step === 1) || (!isOwner && step === 2)) && (
              <motion.div
                key="personalDetails"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">
                    {isOwner ? "Welcome" : "Personal Details"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isOwner ? "Let's start with your organization details." : "Tell us a bit about yourself."}
                  </p>
                </div>

                <div className="space-y-6">
                  {isOwner && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Organization Name</Label>
                      <Input
                        placeholder="e.g. Acme Corp"
                        value={formData.orgName}
                        onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                        className="h-14 rounded-2xl px-6 bg-background/50"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Your Role</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(isOwner ? ["Founder", "Manager", "Ops", "HR"] : ["Engineer", "Design", "Support", "Marketing"]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setFormData({ ...formData, role: r })}
                          className={cn(
                            "px-4 py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                            formData.role === r ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1 flex items-center gap-2">
                      <Phone size={14} className="text-primary" /> WhatsApp Number
                    </Label>
                    <div className="phone-input-container">
                      <PhoneInput
                        international
                        defaultCountry="PK"
                        value={formData.whatsapp}
                        onChange={(value) => setFormData({ ...formData, whatsapp: value || "" })}
                        className="flex h-14 w-full rounded-2xl border border-input bg-background/50 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isOwner && !userData?.orgId && (
                    <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold uppercase">
                      Back
                    </Button>
                  )}
                  <Button 
                    disabled={!formData.role || (isOwner && !formData.orgName) || !formData.whatsapp} 
                    onClick={handleNext} 
                    className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wide group"
                  >
                    Continue
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* OWNER CONTEXT: Step 2 (Owner Only) */}
            {isOwner && step === 2 && (
              <motion.div
                key="ownerContext"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Organization Context</h1>
                  <p className="text-muted-foreground">Tell us more about how you operate.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Team Size</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TEAM_SIZES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFormData({ ...formData, teamSize: t.id })}
                          className={cn(
                            "px-2 py-3 rounded-xl border-2 text-[9px] font-bold uppercase tracking-tight transition-all",
                            formData.teamSize === t.id ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Reporting Platforms</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {REPORTING_PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const isSelected = formData.reportingPlatforms.includes(p.id);
                            const newPlatforms = isSelected
                              ? formData.reportingPlatforms.filter((id) => id !== p.id)
                              : [...formData.reportingPlatforms, p.id];
                            setFormData({ ...formData, reportingPlatforms: newPlatforms });
                          }}
                          className={cn(
                            "px-2 py-3 rounded-xl border-2 text-[9px] font-bold uppercase tracking-tight transition-all",
                            formData.reportingPlatforms.includes(p.id) ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {formData.reportingPlatforms.includes("others") && (
                      <Input
                        placeholder="Please specify other platforms"
                        value={formData.otherPlatform}
                        onChange={(e) => setFormData({ ...formData, otherPlatform: e.target.value })}
                        className="h-12 rounded-xl px-4 bg-background/50 mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                      <Label className="text-xs font-semibold tracking-wider">What problem made you look for employee monitoring / tracking software?</Label>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">(Optional)</span>
                    </div>
                    <Textarea
                      placeholder="Tell us what led you here."
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      className="min-h-[120px] rounded-2xl p-6 bg-background/50 resize-none border-border/50"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide">
                    Back
                  </Button>
                  <Button 
                    disabled={
                      !formData.teamSize || 
                      formData.reportingPlatforms.length === 0 || 
                      (formData.reportingPlatforms.includes("others") && !formData.otherPlatform.trim())
                    } 
                    onClick={handleNext} 
                    className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wide group"
                  >
                    Continue
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* OPERATIONS: Step 3 (Both Owner and Employee) */}
            {step === 3 && (
              <motion.div
                key="operations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Operations</h1>
                  <p className="text-muted-foreground">Define your workspace standards.</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1 flex items-center gap-2">
                      <MapPin size={14} className="text-primary" /> Location & Timezone
                    </Label>
                    
                    {isEditingTimezone ? (
                      <div className="relative">
                        <TimezoneSelect
                          timezones={
                            // Prioritize the current timezone at the top of the list
                            (() => {
                                const currentTzValue = typeof formData.timezone === 'string' ? formData.timezone : (formData.timezone as any).value;
                                const currentTz = allTimezones[currentTzValue];
                                if (currentTz) {
                                    const reorderedTimezones = { [currentTzValue]: currentTz, ...allTimezones };
                                    return reorderedTimezones;
                                }
                                return allTimezones;
                            })()
                          }
                          value={formData.timezone}
                          onChange={(tz) => {
                            setFormData({ ...formData, timezone: tz });
                            setIsEditingTimezone(false);
                          }}
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              height: '56px',
                              borderRadius: '1rem',
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border)/0.5)',
                              boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
                              '&:hover': {
                                borderColor: 'hsl(var(--primary))',
                              },
                              paddingLeft: '1rem',
                              color: 'hsl(var(--foreground))',
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: 'hsl(var(--foreground))',
                            }),
                            input: (base) => ({
                              ...base,
                              color: 'hsl(var(--foreground))',
                            }),
                            placeholder: (base) => ({
                              ...base,
                              color: 'hsl(var(--muted-foreground))',
                            }),
                            menu: (base) => ({
                              ...base,
                              borderRadius: '1rem',
                              overflow: 'hidden',
                              zIndex: 50,
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border)/0.5)',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected 
                                ? 'hsl(var(--primary))' 
                                : state.isFocused 
                                ? 'hsl(var(--secondary))' 
                                : 'hsl(var(--card))',
                              color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                              '&:hover': {
                                backgroundColor: 'hsl(var(--secondary))',
                                color: 'hsl(var(--foreground))',
                              },
                            }),
                            dropdownIndicator: (base) => ({
                              ...base,
                              color: 'hsl(var(--muted-foreground))',
                              '&:hover': {
                                color: 'hsl(var(--foreground))',
                              },
                            }),
                            indicatorSeparator: (base) => ({
                              ...base,
                              backgroundColor: 'hsl(var(--border))',
                            }),
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="size-8 rounded-lg bg-background flex items-center justify-center border shadow-sm text-primary">
                            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detected Zone</span>
                            <span className="text-[11px] font-bold text-foreground">
                              {typeof formData.timezone === 'string' ? formData.timezone : formData.timezone.value}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsEditingTimezone(true)}
                            className="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-primary"
                          >
                            <Pencil size={18} />
                          </button>
                          <CheckCircle2 className="text-emerald-500" size={20} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Standard Workday</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {SHIFTS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setFormData({ ...formData, shift: s.id })}
                          className={cn(
                            "py-4 rounded-2xl border-2 text-[10px] font-bold uppercase transition-all",
                            formData.shift === s.id ? "border-primary bg-primary/5 text-primary shadow-lg" : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Weekly Schedule (Workdays)</Label>
                    <div className="flex justify-between gap-1">
                      {DAYS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            const newWorkdays = formData.workdays.includes(d.id)
                              ? formData.workdays.filter(id => id !== d.id)
                              : [...formData.workdays, d.id].sort();
                            setFormData({ ...formData, workdays: newWorkdays });
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-xl border-2 text-[10px] font-bold transition-all",
                            formData.workdays.includes(d.id) ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-transparent bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center mt-2">Unselected days will be marked as holidays.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide">
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wide group"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Continue"}
                    {!loading && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* MODULE RANKING: Step 4 (Both) */}
            {step === 4 && (
              <motion.div
                key="moduleRanking"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Prioritize Modules</h1>
                  <p className="text-muted-foreground">Select modules in order of priority for your workspace.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {AVAILABLE_MODULES.map((m) => {
                      const priorityIndex = formData.modulePriorities.indexOf(m.id);
                      const isSelected = priorityIndex !== -1;
                      const Icon = m.icon;

                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            const newPriorities = isSelected
                              ? formData.modulePriorities.filter(id => id !== m.id)
                              : [...formData.modulePriorities, m.id];
                            setFormData({ ...formData, modulePriorities: newPriorities });
                          }}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                              : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          <div className={cn(
                            "size-12 rounded-xl flex items-center justify-center transition-all",
                            isSelected ? "bg-primary text-white" : "bg-background text-muted-foreground group-hover:text-primary"
                          )}>
                            <Icon size={24} />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-sm font-black uppercase tracking-tight">{m.label}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase">{m.description}</p>
                          </div>

                          {isSelected && (
                            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs">
                              {priorityIndex + 1}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {formData.modulePriorities.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 mt-4">
                      <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                      <p className="text-[11px] text-emerald-600 font-bold uppercase leading-tight">
                        You will be redirected to <span className="underline">{AVAILABLE_MODULES.find(m => m.id === formData.modulePriorities[0])?.label}</span> after setup.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide">
                    Back
                  </Button>
                  <Button 
                    disabled={formData.modulePriorities.length === 0 || loading} 
                    onClick={isOwner ? handleNext : handleSubmit} 
                    className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wide group"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (isOwner ? "Continue" : "Finish Setup")}
                    {!loading && isOwner && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* BRANDING: Step 5 (Owner Only) */}
            {isOwner && step === 5 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Visual Branding</h1>
                  <p className="text-muted-foreground">Add your organization logo (Optional).</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl">
                    <button 
                      onClick={() => setLogoMode("upload")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        logoMode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Upload size={14} /> File Upload
                    </button>
                    <button 
                      onClick={() => setLogoMode("url")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        logoMode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LinkIcon size={14} /> Image URL
                    </button>
                  </div>

                  {logoMode === "upload" ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFile(file);
                      }}
                      className={cn(
                        "relative aspect-video rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden",
                        logoPreview ? "border-solid border-primary/20 bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/50",
                        isDragging && "border-solid border-primary bg-primary/10"
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file);
                        }}
                      />
                      
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                           <Loader2 className="animate-spin text-primary" size={32} />
                           <p className="text-[10px] font-bold uppercase tracking-widest">Processing...</p>
                        </div>
                      ) : logoPreview ? (
                        <div className="relative group w-full h-full flex items-center justify-center p-6">
                          <img src={logoPreview} className="max-h-full max-w-full object-contain" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Plus className="text-white rotate-45" size={32} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="size-14 bg-background rounded-2xl flex items-center justify-center shadow-sm border">
                            <ImageIcon className="text-muted-foreground" size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-widest">Drop logo here</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Drag & Drop or Click to Upload</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Logo URL</Label>
                      <Input
                        placeholder="https://company.com/logo.png"
                        value={formData.logoUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, logoUrl: e.target.value });
                          setLogoPreview(e.target.value);
                        }}
                        className="h-14 rounded-2xl px-6 bg-background/50"
                      />
                      {logoPreview && (
                        <div className="mt-4 aspect-video rounded-2xl border bg-secondary/30 flex items-center justify-center p-6 overflow-hidden">
                           <img 
                              src={logoPreview} 
                              alt="URL Preview" 
                              className="max-h-full max-w-full object-contain"
                              onError={() => setLogoPreview(null)}
                           />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide">
                    Back
                  </Button>
                  <Button 
                    disabled={loading} 
                    onClick={handleSubmit} 
                    className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wide"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="mr-2" size={18} />
                    )}
                    {loading ? "Completing..." : "Finish Setup"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          Professional Performance Monitoring • v1.0
        </p>
      </div>

      <style jsx global>{`
        .phone-input-container .PhoneInputInput {
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.875rem;
          color: inherit;
        }
        .phone-input-container .PhoneInputCountry {
          margin-right: 0.5rem;
        }
        .phone-input-container .PhoneInputCountrySelect {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}