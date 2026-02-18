"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User } from "lucide-react";



export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    orgName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    fetch("/api/auth/session", { method: "DELETE" });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgName || !formData.email || !formData.password || !formData.fullName) {
      toast({ title: "Required fields missing", description: "Please fill in all the details to create your account.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.fullName });

      const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;

      // 1. Create Organization
      await setDoc(doc(db, "organizations", orgId), {
        name: formData.orgName,
        ownerId: user.uid,
        inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
        createdAt: serverTimestamp()
      });

      // 2. Create User Profile WITH ownedOrgId
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: formData.fullName,
        role: "owner",
        orgName: formData.orgName,
        ownedOrgId: orgId,
        uid: user.uid,
        onboardingCompleted: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Account created", description: "Your organization has been set up successfully." });
      router.push("/dashboard/onboarding");
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        const orgName = formData.orgName || `${user.displayName || 'Enterprise'}'s Org`;

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
      }

      router.push("/dashboard/onboarding");
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User intentionally closed the popup, do nothing and reset loading state
        console.log("Google sign-up popup closed by user.");
      } else {
        toast({ title: "Google signup failed", description: error.message, variant: "destructive" });
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
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2000')" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] lg:bg-black/20" />
        <div className="hidden lg:flex absolute inset-0 items-end p-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Join the Platform</h2>
            <p className="text-lg font-medium opacity-90">
              Everything you need to manage your engineering teams and operations in one unified workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 lg:bg-background lg:dark:bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-md lg:bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border/50"
        >
          <div className="flex flex-col space-y-2 text-center mb-8">
            <div className="flex justify-center mb-4">
               <img src="/logo.svg" alt="Logo" className="w-12 h-12 dark:invert" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Set up your organization and start collaborating
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider ml-1">Full Name</Label>
              <Input 
                id="fullName" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="John Doe" 
                className="bg-background/50 border-border h-12 rounded-xl px-5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orgName" className="text-xs font-semibold uppercase tracking-wider ml-1">Organization Name</Label>
              <Input 
                id="orgName" 
                value={formData.orgName}
                onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                placeholder="Company Name" 
                className="bg-background/50 border-border h-12 rounded-xl px-5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com" 
                className="bg-background/50 border-border h-12 rounded-xl px-5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider ml-1">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  className="bg-background/50 border-border h-12 rounded-xl px-5 pr-12"
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
            <Button disabled={loading} type="submit" className="w-full h-14 rounded-2xl font-bold uppercase tracking-wide shadow-xl shadow-primary/20">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase font-medium">
              <span className="bg-card px-3 text-muted-foreground tracking-wider">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold uppercase tracking-wide gap-3 border-2 border-border/50 hover:bg-secondary/50"
          >
            <img src="/google.svg" className="size-5" alt="Google" />
            Continue with Google
          </Button>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/dashboard/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
