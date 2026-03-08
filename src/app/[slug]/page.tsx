"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import posthog from "posthog-js";
import { motion } from "framer-motion";

export default function PartnerLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      async function fetchPartner() {
        if (!slug) return;
        try {
          const q = query(collection(db, "partners"), where("slug", "==", slug), limit(1));
          const snap = await getDocs(q);
  
          if (snap.empty) {
            router.replace("/dashboard/signup");
            return;
          }
  
          const data = snap.docs[0].data();
          setPartner(data);
  
          // --- PostHog Attribution Stamp ---
          try {
            if (typeof window !== "undefined" && posthog) {
              if (typeof posthog.register === 'function') {
                posthog.register({
                  partner_slug: slug,
                  partner_name: data.brandName,
                  entry_source: 'partner_link'
                });
              }
              if (posthog.people && typeof posthog.people.set === 'function') {
                posthog.people.set({
                  partner_slug: slug,
                  partner_name: data.brandName
                });
              }
              if (typeof posthog.capture === 'function') {
                posthog.capture('partner_landing_view', {
                  partner_slug: slug,
                  brand: data.brandName
                });
              }
            }
          } catch (phError) {
            console.warn("PostHog skipped:", phError);
          }
  
          document.cookie = `trac_partner_slug=${slug}; path=/; max-age=2592000`;
        } catch (err) {
          console.error("Error:", err);
          router.replace("/dashboard/signup");
        } finally {
          setLoading(false);
        }
      }
      fetchPartner();
    }, [slug, router]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!partner) return null;
  
  return (
    <div className="h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.04),transparent)] pointer-events-none" />
  
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-card border-[4px] md:border-[6px] border-black dark:border-white rounded-[2.5rem] md:rounded-[4rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] md:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] md:dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,1)] p-8 md:p-16 text-center relative z-10"
      >
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Logo" className="w-12 h-12 md:w-20 md:h-20 dark:invert" />        </div>

        <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-foreground mb-6 md:mb-8 flex items-baseline justify-center gap-1.5">
          TRAC AI SUBSIDIARY OF {partner.brandName}
        </h2>
        
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 md:mb-8 uppercase leading-[0.9] text-foreground">
          MAKE YOUR <br/> TEAM MORE <br/> PRODUCTIVE.
        </h1>

        <p className="text-base md:text-xl font-medium text-muted-foreground mb-8 md:mb-12 max-w-md mx-auto leading-tight">
          See how your people work <br className="hidden sm:block"/> and help them be their best.
        </p>

        <Button 
          onClick={() => router.push("/dashboard/signup")}
          className="w-full h-20 md:h-24 rounded-[1.5rem] md:rounded-[2rem] text-xl md:text-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 group active:scale-95 transition-all"
        >
          START NOW
          <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform size-6 md:size-8" />
        </Button>
      </motion.div>
    </div>
  );
}