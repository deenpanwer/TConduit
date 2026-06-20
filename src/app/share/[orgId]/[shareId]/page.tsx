"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithCustomToken } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import posthog from "posthog-js";

export default function ClientLandingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const orgId = params.orgId as string;
  const shareId = params.shareId as string;

  const [branding, setBranding] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch Portal Branding Configurations
  useEffect(() => {
    if (!orgId || !shareId) return;

    async function loadBranding() {
      try {
        const docRef = doc(db, "organizations", orgId, "client_shares", shareId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBranding(snap.data().branding || {});
        } else {
          toast({
            title: "Portal Expired",
            description: "This secure link is invalid or has been revoked.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Error loading branding:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [orgId, shareId]);

  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setVerifying(true);
    const targetEmail = email.trim().toLowerCase();

    try {
      // 1. Verify email against backend
      const res = await fetch("/api/client/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, orgId, shareId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // 2. Sign in with Custom Token
      const userCredential = await signInWithCustomToken(auth, data.token);

      // 3. Track client session in PostHog
      posthog.identify(`client_${targetEmail}`, {
        email: targetEmail,
        is_client: true,
        client_email: targetEmail,
        client_org_id: orgId,
        client_share_id: shareId,
      });

      // 4. Redirect to portal
      setSuccess(true);
      toast({
        title: "Access Approved",
        description: branding?.welcomeMessage || "Welcome! Loading your project files...",
      });

      setTimeout(() => {
        router.push(`/share/${orgId}/${shareId}/portal`);
      }, 1500);

    } catch (err: any) {
      toast({
        title: "Access Denied",
        description: err.message || "Unauthorized access.",
        variant: "destructive"
      });
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">SECURE CONNECTION ESTABLISHED...</p>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
        <ShieldCheck className="size-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-xl font-black uppercase tracking-tighter">Deactivated Portal</h2>
        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-tight">
          This portal has been deactivated or the organization has disabled sharing.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary/20">
      {/* Background glow styling */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-card/65 backdrop-blur-2xl border border-border/80 rounded-3xl p-8 shadow-2xl relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Organization / Client Logo */}
        <div className="flex flex-col items-center text-center">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt="Brand Logo" 
              className="h-12 w-auto object-contain mb-4 dark:invert" 
            />
          ) : (
            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <ShieldCheck size={28} />
            </div>
          )}

          <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight font-poppins">
            {branding.titleText}
          </h2>
          <p className="text-xs font-medium text-muted-foreground mt-3 leading-relaxed">
            {branding.descriptionText}
          </p>
        </div>

        {/* Verification Form */}
        {success ? (
          <div className="flex flex-col items-center text-center py-6 space-y-3 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Access approved. Redirecting...</span>
          </div>
        ) : (
          <form onSubmit={handleVerifyAccess} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Authorized Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="email"
                  type="email"
                  placeholder="client@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl py-5 border-border bg-secondary/15 focus:ring-primary focus:border-primary transition-all font-mono text-xs"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={verifying || !email}
              className="w-full rounded-xl py-6 font-bold uppercase tracking-widest text-xs gap-2 shadow-md bg-primary text-primary-foreground hover:opacity-95 transition-all active:scale-98"
            >
              {verifying ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Verifying Access...
                </>
              ) : (
                <>
                  {branding.buttonText} <ArrowRight size={14} />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Secure badge footer */}
        <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          <ShieldCheck size={12} className="text-green-500" /> Secure 256-bit encrypted access portal
        </div>
      </div>
    </div>
  );
}
