"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

const PICSUM_IMAGES = [
  "https://picsum.photos/id/10/1200/800",
  "https://picsum.photos/id/15/1200/800",
  "https://picsum.photos/id/16/1200/800",
  "https://picsum.photos/id/28/1200/800",
  "https://picsum.photos/id/29/1200/800"
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || "/ems";
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
      password: ""
    });
    
  const [partnerLogo, setPartnerLogo] = useState<string | null>(null);
  const [partnerHeadline, setPartnerHeadline] = useState<string | null>(null);
  const [partnerSubheadline, setPartnerSubheadline] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Force clear session on mount to prevent redirect loops
    fetch("/api/auth/session", { method: "DELETE" });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % PICSUM_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchPartnerLogo() {
      const partnerQuery = searchParams.get('partner') || searchParams.get('slug') || searchParams.get('partnerSlug');
      const partnerCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('trac_partner_slug='))
        ?.split('=')[1];
      const partnerLocal = typeof window !== "undefined" ? localStorage.getItem("trac_partner_slug") : null;

      const activeSlug = partnerQuery || partnerLocal || partnerCookie;
      if (!activeSlug) return;

      // Sync back to cookie and local storage
      document.cookie = `trac_partner_slug=${activeSlug}; path=/; max-age=2592000`;
      if (typeof window !== "undefined") {
        localStorage.setItem("trac_partner_slug", activeSlug);
      }

      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
        const q = query(collection(db, "partners"), where("slug", "==", activeSlug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const logo = data.logo || data.logoUrl;
          if (logo) {
            setPartnerLogo(logo);
          }
          if (data.headline) {
            setPartnerHeadline(data.headline);
          }
          if (data.subheadline) {
            setPartnerSubheadline(data.subheadline);
          }
        }
      } catch (err) {
        console.error("Error fetching partner logo:", err);
      }
    }
    fetchPartnerLogo();
  }, [searchParams]);
    
      const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const { db } = await import("@/lib/firebase");
      const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const partnerSlug = (document.cookie
          .split('; ')
          .find(row => row.startsWith('trac_partner_slug='))
          ?.split('=')[1]) || (typeof window !== "undefined" ? localStorage.getItem("trac_partner_slug") : null) || null;

        const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const orgName = `${user.displayName || 'Enterprise'}'s Org`; // Fallback name for organization
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 7);

        await setDoc(doc(db, "organizations", orgId), {
          name: orgName,
          ownerId: user.uid,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
          subscriptionStatus: "trialing",
          subscriptionExpiry: trialExpiry,
          partnerSlug: partnerSlug || null,
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL, // Will be null for email/password users, which is fine
          role: "owner",
          orgName: orgName,
          ownedOrgId: orgId,
          uid: user.uid,
          onboardingCompleted: false,
          partnerSlug: partnerSlug || null,
          createdAt: serverTimestamp()
        });

        // Background Attribution
        if (partnerSlug) {
          (async () => {
            try {
              const { query, where, limit, getDocs, collection } = await import("firebase/firestore");
              const partnerQ = query(collection(db, "partners"), where("slug", "==", partnerSlug), limit(1));
              const partnerSnap = await getDocs(partnerQ);
              if (!partnerSnap.empty) {
                const partnerDoc = partnerSnap.docs[0];
                await setDoc(doc(db, "partners", partnerDoc.id, "signups", orgId), {
                  orgName: orgName,
                  clientEmail: user.email,
                  createdAt: serverTimestamp(),
                });
              }
            } catch (e) {}
          })();
        }

        toast({ title: "Welcome", description: "Let's set up your workspace." });
        router.push(`/ems/onboarding${callbackUrl !== "/ems" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      } else {
        const userData = userDoc.data();
        if (!userData.onboardingCompleted) {
          router.push(`/ems/onboarding${callbackUrl !== "/ems" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
        } else {
          toast({ title: "Welcome back", description: "You have successfully signed in." });
          router.push(callbackUrl);
        }
      }
    } catch (error: any) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const { db } = await import("@/lib/firebase");
      const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const partnerSlug = (document.cookie
          .split('; ')
          .find(row => row.startsWith('trac_partner_slug='))
          ?.split('=')[1]) || (typeof window !== "undefined" ? localStorage.getItem("trac_partner_slug") : null) || null;

        const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const orgName = `${user.displayName || 'Enterprise'}'s Org`;
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 7);

        await setDoc(doc(db, "organizations", orgId), {
          name: orgName,
          ownerId: user.uid,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
          subscriptionStatus: "trialing",
          subscriptionExpiry: trialExpiry,
          partnerSlug: partnerSlug || null,
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL,
          role: "owner",
          orgName: orgName,
          ownedOrgId: orgId,
          uid: user.uid,
          onboardingCompleted: false,
          partnerSlug: partnerSlug || null,
          createdAt: serverTimestamp()
        });

        // Background Attribution
        if (partnerSlug) {
          (async () => {
            try {
              const { query, where, limit, getDocs, collection } = await import("firebase/firestore");
              const partnerQ = query(collection(db, "partners"), where("slug", "==", partnerSlug), limit(1));
              const partnerSnap = await getDocs(partnerQ);
              if (!partnerSnap.empty) {
                const partnerDoc = partnerSnap.docs[0];
                await setDoc(doc(db, "partners", partnerDoc.id, "signups", orgId), {
                  orgName: orgName,
                  clientEmail: user.email,
                  createdAt: serverTimestamp(),
                });
              }
            } catch (e) {}
          })();
        }
        
        toast({ title: "Welcome", description: "Let's set up your workspace." });
        router.push(`/ems/onboarding${callbackUrl !== "/ems" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      } else {
        const userData = userDoc.data();
        if (!userData.onboardingCompleted) {
          router.push(`/ems/onboarding${callbackUrl !== "/ems" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
        } else {
          toast({ title: "Welcome back", description: "You have successfully signed in." });
          router.push(callbackUrl);
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User intentionally closed the popup, do nothing and reset loading state
        console.log("Google sign-in popup closed by user.");
      } else {
        toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-background relative overflow-hidden font-poppins">
      <div className="absolute inset-0 lg:relative lg:w-1/2">
        {PICSUM_IMAGES.map((src, index) => (
          <motion.div
            key={src}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentImageIndex ? 1 : 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        {partnerLogo && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 flex items-center justify-center w-full max-w-[200px] lg:max-w-[320px] px-4">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src={partnerLogo}
              alt="Partner Logo"
              width={320}
              height={140}
              className="max-w-full max-h-[80px] lg:max-h-[140px] object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
            />
          </div>
        )}
        <div className="hidden lg:flex absolute inset-0 items-end p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold tracking-tight mb-4 whitespace-pre-line leading-tight">
              {partnerHeadline || "Welcome Back"}
            </h2>
            <p className="text-lg font-medium opacity-90 whitespace-pre-line leading-relaxed">
              {partnerSubheadline || "Access your dashboard to manage your engineering operations with precision and clarity."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 lg:bg-background lg:dark:bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-md lg:bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border/50"
        >
          <div className="flex flex-col space-y-2 text-center mb-10">
            <div className="flex justify-center mb-6">
               <img src="/special-triangle-black.svg" alt="Logo" width={56} height={56} className="w-14 h-14 block dark:hidden" />
               <img src="/special-triangle.svg" alt="Logo" width={56} height={56} className="w-14 h-14 hidden dark:block" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@company.com" 
                className="bg-background/50 border-border h-14 rounded-2xl px-5"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider">Password</Label>
                <Link href="/ems/forgot-password" disable-animation="true" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  className="bg-background/50 border-border h-14 rounded-2xl px-5 pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button disabled={loading} type="submit" className="w-full h-14 rounded-2xl font-bold tracking-wide shadow-xl shadow-primary/20">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase font-medium"><span className="bg-card px-3 text-muted-foreground tracking-wider">Or continue with</span></div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 rounded-2xl font-bold tracking-wide gap-3 border-2 border-border/50 hover:bg-secondary/50"
          >
            <img src="/google.svg" width={20} height={20} className="size-5" alt="Google" />
            Continue with Google
          </Button>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link 
                href={`/ems/signup${callbackUrl !== "/ems" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} 
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
