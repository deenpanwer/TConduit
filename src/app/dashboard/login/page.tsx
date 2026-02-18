"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    // Force clear session on mount to prevent redirect loops
    fetch("/api/auth/session", { method: "DELETE" });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const { db } = await import("@/lib/firebase");
      const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const orgName = `${user.displayName || 'Enterprise'}'s Org`; // Fallback name

        await setDoc(doc(db, "organizations", orgId), {
          name: orgName,
          ownerId: user.uid,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL, // Will be null for email/password, but safe to include
          role: "owner",
          orgName: orgName,
          ownedOrgId: orgId,
          uid: user.uid,
          onboardingCompleted: false,
          createdAt: serverTimestamp()
        });

        toast({ title: "Welcome", description: "Let's set up your workspace." });
        router.push("/dashboard/onboarding");
      } else {
        const userData = userDoc.data();
        if (!userData.onboardingCompleted) {
          router.push("/dashboard/onboarding");
        } else {
          toast({ title: "Welcome back", description: "You have successfully signed in." });
          router.push("/dashboard");
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
        const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const orgName = `${user.displayName || 'Enterprise'}'s Org`;

        await setDoc(doc(db, "organizations", orgId), {
          name: orgName,
          ownerId: user.uid,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
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
          createdAt: serverTimestamp()
        });
        
        toast({ title: "Welcome", description: "Let's set up your workspace." });
        router.push("/dashboard/onboarding");
      } else {
        const userData = userDoc.data();
        if (!userData.onboardingCompleted) {
          router.push("/dashboard/onboarding");
        } else {
          toast({ title: "Welcome back", description: "You have successfully signed in." });
          router.push("/dashboard");
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
    <div className="flex min-h-screen bg-background relative overflow-hidden font-poppins">
      <div className="absolute inset-0 lg:relative lg:w-1/2">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2000')",
          }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] lg:bg-black/20" />
        <div className="hidden lg:flex absolute inset-0 items-end p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Welcome Back</h2>
            <p className="text-lg font-medium opacity-90">
              Access your dashboard to manage your engineering operations with precision and clarity.
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
               <img src="/logo.svg" alt="Logo" className="w-14 h-14 dark:invert" />
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
                <Link href="/dashboard/forgot-password" disable-animation="true" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
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
            <img src="/google.svg" className="size-5" alt="Google" />
            Continue with Google
          </Button>

          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/dashboard/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
