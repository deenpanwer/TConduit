"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, ChevronRight, CheckCircle2, Loader2, 
  Upload, Image as ImageIcon, Link as LinkIcon, Plus, MapPin, Phone, Pencil
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
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

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orgData, setOrgData] = useState<any>(null);
  const [logoMode, setLogoMode] = useState<"upload" | "url">("upload");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingTimezone, setIsEditingTimezone] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    role: "",
    orgName: "",
    teamSize: "",
    logoUrl: "",
    motivation: "",
    whatsapp: "",
    shift: "8",
    workdays: [1, 2, 3, 4, 5], // User selects workdays
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone as any) || "UTC"
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        if (userData?.onboardingCompleted) {
          router.push("/dashboard");
          return;
        }
        
        if (userData?.ownedOrgId) {
            const orgDoc = await getDoc(doc(db, "organizations", userData.ownedOrgId));
            const data = orgDoc.data();
            setOrgData({ id: userData.ownedOrgId, ...data });
            if (data?.name) {
              setFormData(prev => ({ ...prev, orgName: data.name }));
            }
        }
        setAuthLoading(false);
      } else {
        router.push("/dashboard/login");
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

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let finalOrgId = orgData?.id;
      const offDays = DAYS.filter(d => !formData.workdays.includes(d.id)).map(d => d.label);

      if (!finalOrgId) {
        finalOrgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 14);

        await setDoc(doc(db, "organizations", finalOrgId), {
          name: formData.orgName || "My Organization",
          ownerId: user.uid,
          logoUrl: formData.logoUrl || null,
          teamSize: formData.teamSize,
          whatsapp: formData.whatsapp,
          motivation: formData.motivation,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
          subscriptionExpiry: trialExpiry,
          subscriptionStatus: "trialing",
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, "organizations", finalOrgId), {
          name: formData.orgName,
          logoUrl: formData.logoUrl || null,
          teamSize: formData.teamSize,
          whatsapp: formData.whatsapp,
          motivation: formData.motivation,
          onboardingCompleted: true,
          updatedAt: serverTimestamp()
        });
      }

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || "User",
        photoUrl: user.photoURL || null,
        role: formData.role,
        orgName: formData.orgName,
        ownedOrgId: finalOrgId,
        onboardingCompleted: true,
        whatsapp: formData.whatsapp,
        settings: {
          defaultShiftSeconds: SHIFTS.find(s => s.id === formData.shift)?.seconds || 28800,
          offDays: offDays,
          timezone: typeof formData.timezone === 'string' ? formData.timezone : (formData.timezone as any).value
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      await refreshUserData();
      toast({ title: "Configuration complete", description: "Welcome to your new workspace." });
      router.push("/dashboard");
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
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    step === i ? "w-8 bg-primary" : "w-4 bg-secondary"
                  )} 
                />
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Step {step} of 4
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome</h1>
                  <p className="text-muted-foreground">Let's start with your basic details.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Organization Name</Label>
                    <Input
                      placeholder="e.g. Acme Corp"
                      value={formData.orgName}
                      onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                      className="h-14 rounded-2xl px-6 bg-background/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Your Role</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Founder", "Manager", "Ops", "HR"].map((r) => (
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
                        className="flex h-14 w-full rounded-2xl border border-input bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  disabled={!formData.role || !formData.orgName || !formData.whatsapp} 
                  onClick={handleNext} 
                  className="w-full h-14 rounded-2xl font-bold uppercase tracking-wide group"
                >
                  Continue
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Organization Context</h1>
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
                    disabled={!formData.teamSize} 
                    onClick={handleNext} 
                    className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wide group"
                  >
                    Continue
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Operations</h1>
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
                                                        // Background based on image: A darker background, potentially card or secondary
                                                        backgroundColor: 'hsl(var(--card))', // Assuming card or a slightly darker background
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
                                                        // Background based on image: A darker card-like background
                                                        backgroundColor: 'hsl(var(--card))',
                                                        borderColor: 'hsl(var(--border)/0.5)',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Example shadow
                                                      }),
                                                      option: (base, state) => ({
                                                        ...base,
                                                        backgroundColor: state.isSelected 
                                                          ? 'hsl(var(--primary))' 
                                                          : state.isFocused 
                                                          ? 'hsl(var(--secondary))' 
                                                          : 'hsl(var(--card))', // Default option background
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
                                                    }}                        />
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
                  >
                    Continue
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Visual Branding</h1>
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
