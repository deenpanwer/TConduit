"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function InviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const inviteCode = params.inviteCode as string;

  const [loadingOrg, setLoadingOrg] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchOrgByInviteCode() {
      try {
        const res = await fetch(`/api/invite/verify?code=${encodeURIComponent(inviteCode)}`);
        if (!res.ok) {
          throw new Error("Failed response from verification API");
        }
        const data = await res.json();
        if (!data.valid) {
          toast({ title: "Invalid Invitation", description: "This invitation link is invalid or has expired.", variant: "destructive" });
          setLoadingOrg(false);
          return;
        }
        setOrg(data.org);
      } catch (err: any) {
        console.error("Error fetching org by invite code:", err);
        toast({ title: "Error", description: "Failed to verify invitation. Please try again.", variant: "destructive" });
      } finally {
        setLoadingOrg(false);
      }
    }
    if (inviteCode) {
      fetchOrgByInviteCode();
    }
  }, [inviteCode, toast]);

  const handleRegisterManager = async (user: any, name: string) => {
    if (!org) return;
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: name || user.displayName || user.email.split("@")[0],
      photoUrl: user.photoURL || null,
      role: "Manager",
      orgId: org.id,
      orgName: org.name,
      active: true,                         // Active flag
      accessLocked: false,                  // Standard default
      onboardingCompleted: true,
      employeeOnboardingV1Complete: true,
      autoTrackApps: [],
      autoTrackOnboardingComplete: false,
      blurScreenshots: false,
      disableScreenshots: false,
      webBlockerEnabled: false,
      enableManualTimeTracking: false,
      orgStatus: 'active',                  // Org status active
      screenshotInterval: 5,                // Standard screenshot interval
      shiftSyncInterval: 1,                 // Sync settings
      onboardingProfile: { 
        inviteCode: inviteCode 
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    toast({ title: "Invite Accepted!", description: `Welcome to ${org.name} as a Manager!` });
    
    // Clear cookies & localstorage if tracking slug
    if (typeof window !== "undefined") {
      localStorage.removeItem("trac_partner_slug");
    }
    
    startTransition(() => {
      router.push("/ems");
    });
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({ title: "Required fields missing", description: "Please fill in all details.", variant: "destructive" });
      return;
    }
    setLoadingAuth(true);
    try {
      const creds = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(creds.user, { displayName: formData.fullName });
      await handleRegisterManager(creds.user, formData.fullName);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Signup Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoadingAuth(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleRegisterManager(result.user, result.user.displayName || "");
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error(err);
        toast({ title: "Google Auth Failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  if (loadingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f12]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f12] p-4 text-center">
        <div className="max-w-md bg-[#161923]/60 backdrop-blur-xl border border-white/[0.06] p-8 rounded-3xl space-y-6 shadow-2xl">
          <h2 className="text-xl font-bold uppercase tracking-wider text-destructive">Invalid Link</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            This invitation link is invalid, expired, or incorrect. Please ask your administrator for a new manager invite link.
          </p>
          <Button onClick={() => router.push("/ems/login")} className="rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white px-6 py-2">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const BACKGROUND_IMAGES = [
    "https://picsum.photos/id/180/1200/800",
    "https://picsum.photos/id/370/1200/800",
    "https://picsum.photos/id/668/1200/800"
  ];

  return (
    <main className="flex min-h-screen bg-[#0d0f12] relative overflow-hidden font-sans">
      {/* Left Banner Area with looping Picsum background images */}
      <div className="hidden lg:flex w-1/2 p-16 text-white flex-col justify-between relative overflow-hidden">
        {/* Background Images Layer */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={bgIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})` }}
            />
          </AnimatePresence>
          {/* Overlay gradient to blend nicely with the dark background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-[#0d0f12]/80 to-[#0d0f12]/95" />
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-8 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <img src="/special-triangle.svg" alt="Trac Logo" className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-blue-400">Trac EMS</span>
        </div>

        {/* Brand Slogan */}
        <div className="max-w-lg space-y-6 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-slate-100">
            Powering high-performance remote teams.
          </h1>
          <p className="text-sm text-slate-400 font-normal leading-relaxed max-w-md">
            Consolidate your operations, track shifts, audit workforce productivity, and manage administrative settings in one centralized workspace.
          </p>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 relative z-10" />
      </div>

      {/* Right Form Acceptance Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-gradient-to-tr from-[#0a0b0d] to-[#12141c]">
        {/* Soft decorative light leak */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[440px] bg-[#161923]/60 backdrop-blur-xl border border-white/[0.06] p-8 sm:p-10 rounded-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] flex flex-col relative z-20">
          {/* Top Invitation Badge */}
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Security Clearance</p>
              <h2 className="text-sm font-semibold text-slate-200">Manager Invitation</h2>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showSignup ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-100">
                    You've been invited to join
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Set up your secure administrative credentials to connect with this workspace.
                  </p>
                </div>

                {/* Organization card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Workspace</span>
                      <h4 className="text-lg font-semibold text-slate-200 tracking-tight mt-0.5">{org.name}</h4>
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <p className="text-[11px] text-slate-500">
                    Accepting this invitation grants you access to manager dashboards, workforce analytics, and payroll schedules.
                  </p>
                </div>

                <Button
                  onClick={() => setShowSignup(true)}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-medium text-xs tracking-wider uppercase shadow-lg shadow-blue-600/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Accept Invitation
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-slate-100">Create Account</h3>
                  <p className="text-xs text-slate-400">Complete your profile to secure your account.</p>
                </div>

                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className="bg-white/[0.03] border-white/[0.08] focus:border-blue-500/50 h-11 rounded-xl px-4 text-sm text-slate-200 placeholder-slate-600"
                      required
                      disabled={loadingAuth || isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="bg-white/[0.03] border-white/[0.08] focus:border-blue-500/50 h-11 rounded-xl px-4 text-sm text-slate-200 placeholder-slate-600"
                      required
                      disabled={loadingAuth || isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="bg-white/[0.03] border-white/[0.08] focus:border-blue-500/50 h-11 rounded-xl px-4 text-sm text-slate-200 placeholder-slate-600 pr-10"
                        required
                        disabled={loadingAuth || isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        disabled={loadingAuth || isPending}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    disabled={loadingAuth || isPending}
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-medium text-xs tracking-wider uppercase shadow-lg shadow-blue-600/15 mt-3 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loadingAuth || isPending ? <Loader2 className="animate-spin size-4 mx-auto" /> : "Register Manager"}
                  </Button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Or continue with</span>
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={loadingAuth || isPending}
                  className="w-full h-11 rounded-xl font-medium text-xs tracking-wider uppercase gap-2.5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.01] text-slate-300"
                >
                  <img src="/google.svg" width={16} height={16} className="size-4" alt="Google" />
                  Google
                </Button>

                <div className="text-center">
                  <button
                    onClick={() => setShowSignup(false)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
                    disabled={loadingAuth || isPending}
                  >
                    Go Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
