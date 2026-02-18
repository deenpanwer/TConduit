"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, ChevronRight, CheckCircle2, Loader2, 
  Upload, Image as ImageIcon, Link as LinkIcon, Plus
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth"; // Import useAuth

const GOALS = [
  { id: "billing", label: "Billing & Invoicing" },
  { id: "productivity", label: "Team Productivity" },
  { id: "budgeting", label: "Project Budgeting" },
  { id: "payroll", label: "Payroll & Compliance" },
];

const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "small", label: "2 - 10 people" },
  { id: "medium", label: "11 - 50 people" },
  { id: "large", label: "50+ people" },
];

const WORKFLOWS = [
  { id: "client", label: "Client Projects" },
  { id: "internal", label: "Internal Ops" },
  { id: "product", label: "Product / R&D" },
  { id: "sales", label: "Sales & Marketing" },
];

const SHIFTS = [
  { id: "4", label: "4h", seconds: 14400 },
  { id: "6", label: "6h", seconds: 21600 },
  { id: "8", label: "8h", seconds: 28800 },
  { id: "9", label: "9h", seconds: 32400 },
  { id: "10", label: "10h", seconds: 36000 },
];

const DAYS = [
  { id: 1, label: "M" },
  { id: 2, label: "T" },
  { id: 3, label: "W" },
  { id: 4, label: "T" },
  { id: 5, label: "F" },
  { id: 6, label: "S" },
  { id: 0, label: "S" },
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
  
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshUserData } = useAuth(); // Destructure refreshUserData

  const [formData, setFormData] = useState({
    role: "",
    orgName: "",
    goal: "",
    teamSize: "",
    workflow: "",
    logoUrl: "",
    industry: "",
    shift: "8",
    workdays: [1, 2, 3, 4, 5],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        if (userData?.onboardingCompleted && router.pathname !== "/dashboard") {
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
  }, []);

  const handleFile = (file: File) => {
    // Removed type check to allow any file type
    
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

      if (!finalOrgId) {
        finalOrgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 14); // 14 Day Trial

        await setDoc(doc(db, "organizations", finalOrgId), {
          name: formData.orgName || "My Organization",
          ownerId: user.uid,
          logoUrl: formData.logoUrl || null,
          industry: formData.industry,
          goals: formData.goal,
          teamSize: formData.teamSize,
          workflow: formData.workflow,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
          subscriptionExpiry: trialExpiry,
          subscriptionStatus: "trialing",
          subscriptionExpiry: trialExpiry,
          subscriptionStatus: "trialing",
        });
      } else {
        await updateDoc(doc(db, "organizations", finalOrgId), {
          name: formData.orgName,
          industry: formData.industry,
          logoUrl: formData.logoUrl || null,
          goals: formData.goal,
          teamSize: formData.teamSize,
          workflow: formData.workflow,
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
        settings: {
          defaultShiftSeconds: SHIFTS.find(s => s.id === formData.shift)?.seconds || 28800,
          workdays: formData.workdays,
          timezone: formData.timezone
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      await refreshUserData(); // Call to refresh user data in context

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
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-12">
          <img src="/logo.svg" alt="Logo" className="w-12 h-12 dark:invert" />
        </div>

        <div className="bg-card border border-border/50 rounded-[2.5rem] shadow-2xl p-8 md:p-12 backdrop-blur-sm relative">
          {/* Progress Header */}
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
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Professional Profile</h1>
                  <p className="text-muted-foreground">Tell us about your role and industry.</p>
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
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Your Capacity</Label>
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
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Industry</Label>
                    <Input
                      placeholder="e.g. Technology, Healthcare"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="h-14 rounded-2xl px-6 bg-background/50"
                    />
                  </div>
                </div>

                <Button 
                  disabled={!formData.role || !formData.industry || !formData.orgName} 
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
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Objectives</h1>
                  <p className="text-muted-foreground">Select your primary goals for time tracking.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Primary Goal</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {GOALS.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setFormData({ ...formData, goal: g.id })}
                          className={cn(
                            "px-4 py-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest text-left transition-all flex items-center justify-between",
                            formData.goal === g.id ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {g.label}
                          {formData.goal === g.id && <CheckCircle2 size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Team Size</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Typical Workflow</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {WORKFLOWS.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setFormData({ ...formData, workflow: w.id })}
                          className={cn(
                            "px-2 py-3 rounded-xl border-2 text-[9px] font-bold uppercase tracking-tight transition-all text-center",
                            formData.workflow === w.id ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-transparent bg-secondary/50 hover:bg-secondary"
                          )}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-wide">
                    Back
                  </Button>
                  <Button 
                    disabled={!formData.goal || !formData.teamSize || !formData.workflow} 
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
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Operational Standards</h1>
                  <p className="text-muted-foreground">Define the baseline for your workspace.</p>
                </div>

                <div className="space-y-8">
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
                    <Label className="text-xs font-semibold uppercase tracking-wider ml-1">Weekly Schedule</Label>
                    <div className="flex justify-between gap-1">
                      {DAYS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            const newDays = formData.workdays.includes(d.id)
                              ? formData.workdays.filter(id => id !== d.id)
                              : [...formData.workdays, d.id].sort();
                            setFormData({ ...formData, workdays: newDays });
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-xl border-2 text-[10px] font-bold transition-all",
                            formData.workdays.includes(d.id) ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-secondary/50 text-muted-foreground"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="size-8 rounded-lg bg-background flex items-center justify-center border shadow-sm text-primary">
                        <Loader2 size={16} className={loading ? "animate-spin" : ""} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detected Zone</span>
                        <span className="text-[11px] font-bold text-foreground">{formData.timezone}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="text-emerald-500" size={20} />
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
                        isDragging && "border-solid border-primary bg-primary/10" // Visual feedback for dragging
                      )}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        // Removed accept="image/*"
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
    </div>
  );
}
