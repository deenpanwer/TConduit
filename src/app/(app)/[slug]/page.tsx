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
            router.replace("/ems/signup");
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
          if (typeof window !== "undefined") {
            localStorage.setItem("trac_partner_slug", slug);
          }
        } catch (err) {
          console.error("Error:", err);
          router.replace("/ems/signup");
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
        className="w-full max-w-2xl bg-card border-4 md:border-[6px] border-black dark:border-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-6 md:p-10 text-center relative z-10 max-h-[90vh] flex flex-col justify-between"
      >
        <div className="flex justify-center mb-6 h-20 md:h-28 shrink-0">
          {partner.logo || partner.logoUrl ? (
            <img src={partner.logo || partner.logoUrl} alt={partner.brandName} className="max-h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]" />
          ) : (
            <div className="flex items-center justify-center text-2xl md:text-4xl font-black uppercase tracking-widest">{partner.brandName}</div>
          )}
        </div>
        
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4 uppercase leading-[0.95] text-foreground shrink-0 whitespace-pre-line">
          {partner.headline || "MAKE YOUR\nTEAM MORE\nPRODUCTIVE."}
        </h1>

        <p className="text-xs md:text-sm font-medium text-muted-foreground mb-6 max-w-sm mx-auto leading-tight shrink-0 whitespace-pre-line">
          {partner.subheadline || "See how your people work and help them be their best."}
        </p>

        <div className="space-y-4 shrink-0">
          <Button 
            onClick={() => router.push("/ems/signup")}
            className="w-full h-14 md:h-18 rounded-[1.25rem] text-lg md:text-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 group active:scale-95 transition-all"
          >
            START NOW
            <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform size-5 md:size-6" />
          </Button>
          
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Powered by TRAC AI
          </p>
        </div>
      </motion.div>
    </div>
  );
}