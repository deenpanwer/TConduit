"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CheckCircle2, ShieldCheck, ArrowRight, Loader2, KeyRound, Building, User, Mail, Lock, Shield, Award, LockKeyhole, Eye, EyeOff } from "lucide-react";

const PICSUM_IMAGES = [
  "https://picsum.photos/id/10/1920/1080",
  "https://picsum.photos/id/15/1920/1080",
  "https://picsum.photos/id/16/1920/1080",
  "https://picsum.photos/id/28/1920/1080",
  "https://picsum.photos/id/29/1920/1080"
];

function RedeemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);


  // Form fields
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const codeParam = searchParams.get("code") || searchParams.get("redemption_code") || searchParams.get("key");
    if (codeParam) {
      setCode(codeParam.trim().toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % PICSUM_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter your AppSumo redemption code.",
        variant: "destructive"
      });
      return;
    }

    if (!fullName || !email || !password || !orgName) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields to create your account.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      await updateProfile(user, { displayName: fullName });
      const activeUserId = user.uid;

      // 2. Initialize User Doc in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName: fullName,
        fullName,
        orgName,
        role: "owner",
        createdAt: serverTimestamp(),
        appsumoRedeemed: true
      });

      // 3. Call AppSumo Redeem Backend API
      const res = await fetch("/api/appsumo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          userId: activeUserId,
          orgName: orgName || "My Organization"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to redeem AppSumo code.");
      }

      toast({
        title: "Success! 🎉",
        description: data.message || "Your AppSumo code has been successfully activated!"
      });

      // 4. Redirect straight to EMS Onboarding
      router.push("/ems/onboarding");

    } catch (err: any) {
      console.error("Redemption error:", err);
      toast({
        title: "Redemption Failed",
        description: err.message || "Failed to process code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans relative">
      {/* Background Smooth Ken Burns Zooming Picsum Carousel */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-900">
        {PICSUM_IMAGES.map((src, idx) => (
          <motion.img
            key={src}
            src={src}
            alt="Background scenery"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: idx === currentImageIndex ? 0.75 : 0,
              scale: idx === currentImageIndex ? 1.18 : 1
            }}
            transition={{ 
              opacity: { duration: 2.2, ease: "easeInOut" },
              scale: { duration: 8, ease: "linear" }
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ))}
        <div className="absolute inset-0 bg-slate-950/20 backdrop-brightness-95" />
      </div>




      {/* Header */}

      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <img src="/special-triangle-black.svg" alt="Trac AI Logo" className="w-8 h-8" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900">Trac AI</span>
          <span className="text-slate-300 text-sm font-medium">|</span>
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200/80">
            <img src="/appsumo-light.png" alt="AppSumo" className="h-3.5 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            AppSumo Partner Offer
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl"
          >

            {/* Header Title (Without Ticket Icon) */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Redeem Your AppSumo Deal
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                Enter your details and redemption code to get started with Trac AI.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRedeem} className="space-y-4">
              {/* AppSumo Code Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" /> AppSumo Redemption Code
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="AS-TRAC-XXXXX-XXXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="bg-slate-50 border-amber-300/80 text-amber-900 font-mono tracking-widest font-extrabold placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-400/20 text-center h-12 text-base rounded-xl shadow-xs"
                  />
                  {code.startsWith("AS-TRAC") && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Organization / Company Name
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Account Email
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl text-sm pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base rounded-xl shadow-md transition-all duration-200 mt-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Redeem Code & Start Onboarding <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Compliance Logos & Trust Note */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-center gap-6 opacity-75">
                <div className="flex items-center gap-1.5">
                  <img src="/compliance/gdpr.png" alt="GDPR" className="h-7 w-auto object-contain" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">GDPR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src="/compliance/hipaa.png" alt="HIPAA" className="h-5 w-auto object-contain" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">HIPAA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src="/compliance/LGPD-CCPA.png" alt="CCPA" className="h-6 w-auto object-contain" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">CCPA</span>
                </div>
              </div>

              {/* Guarantee text */}
              <div className="flex items-center justify-center text-slate-500 text-xs text-center leading-tight max-w-md mx-auto">
                <span>AppSumo 60-day money-back guarantee & zero credit card required</span>
              </div>

            </div>
          </motion.div>
        </div>
      </main>


      {/* Official Legal & AppSumo Footer (Without Logo) */}
      <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-md py-6 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs font-medium">
          <div>
            &copy; {new Date().getFullYear()} TRAC AI LLC. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-600">
            <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cancellation-refund-policy" className="hover:text-slate-900 transition-colors">
              Refund Policy
            </Link>
            <Link href="/legal" className="hover:text-slate-900 transition-colors">
              Legal
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
              Powered for AppSumo Community
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppSumoRedeemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <RedeemContent />
    </Suspense>
  );
}

