"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { ArrowRight, Loader2, Users, PlusCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerEntryPage() {
  const [view, setView] = useState<"selection" | "create" | "login">("selection");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    brandName: "",
    contactName: "",
    email: "",
    logo: "",
    headline: "MAKE YOUR\nTEAM MORE\nPRODUCTIVE.",
    subheadline: "See how your people work and help them be their best."
  });

  // Login Data
  const [loginEmail, setLoginEmail] = useState("");

  const generatedSlug = useMemo(() => {
    return formData.brandName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }, [formData.brandName]);

  const handleBecomePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const q = query(collection(db, "partners"), where("email", "==", formData.email.toLowerCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast.error("You already have a link with this email.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "partners"), {
        brandName: formData.brandName,
        contactName: formData.contactName,
        email: formData.email.toLowerCase(),
        slug: generatedSlug,
        logo: formData.logo || null,
        headline: formData.headline || "MAKE YOUR\nTEAM MORE\nPRODUCTIVE.",
        subheadline: formData.subheadline || "See how your people work and help them be their best.",
        createdAt: serverTimestamp(),
        status: "active"
      });

      toast.success(`Done! Your link is: heytracai.com/${generatedSlug}`);
      router.push(`/partner/dashboard?email=${formData.email.toLowerCase()}`);
    } catch (error: any) {
      console.error("Partner Creation Error:", error);
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const q = query(collection(db, "partners"), where("email", "==", loginEmail.toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("We couldn't find your email.");
        setLoading(false);
        return;
      }

      router.push(`/partner/dashboard?email=${loginEmail.toLowerCase()}`);
    } catch (error: any) {
      console.error("Partner Login Error:", error);
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-4xl relative z-10">
        <AnimatePresence mode="wait">
          {view === "selection" && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <button 
                onClick={() => setView("create")}
                className="group bg-card border-4 border-black dark:border-white p-12 rounded-[3rem] text-left shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] transition-all hover:-translate-y-2"
              >
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 border-2 border-primary/20">
                  <PlusCircle size={32} />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Start Now</h2>
                <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest leading-relaxed">
                  Get your own link and share it with others.
                </p>
                <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                  GO [→]
                </div>
              </button>

              <button 
                onClick={() => setView("login")}
                className="group bg-card border-4 border-black dark:border-white p-12 rounded-[3rem] text-left shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] transition-all hover:-translate-y-2"
              >
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center text-foreground mb-8 border-2 border-border">
                  <Users size={32} />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Login</h2>
                <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest leading-relaxed">
                  See who used your link and what they are doing.
                </p>
                <div className="mt-8 flex items-center gap-2 text-foreground font-black uppercase text-[10px] tracking-[0.2em]">
                  GO [→]
                </div>
              </button>
            </motion.div>
          )}          {view === "create" && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto w-full"
            >
              <Button variant="ghost" onClick={() => setView("selection")} className="mb-8 font-black uppercase text-[10px] tracking-widest p-0 hover:bg-transparent">
                <ArrowLeft size={14} className="mr-2" /> GO BACK
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Form Block */}
                <div className="lg:col-span-7 bg-card border-4 border-black dark:border-white p-8 md:p-10 rounded-[3.5rem] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)]">
                  <form onSubmit={handleBecomePartner} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Company Name</Label>
                      <Input 
                        required
                        placeholder="e.g. My Group" 
                        className="h-14 rounded-2xl px-6 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold" 
                        value={formData.brandName}
                        onChange={e => setFormData({...formData, brandName: e.target.value})}
                      />
                    </div>

                    <div className="p-4 bg-secondary/30 border-2 border-dashed border-border rounded-2xl flex items-center justify-between font-mono text-[10px] font-bold text-primary/60">
                      <span>heytracai.com/{generatedSlug || "____"}</span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Company Logo</Label>
                      <div className="flex items-center gap-4">
                        {formData.logo && (
                          <div className="relative size-16 rounded-xl border border-border overflow-hidden shrink-0">
                            <img src={formData.logo} className="w-full h-full object-cover" alt="Logo Preview" />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, logo: "" })}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 h-16 rounded-2xl cursor-pointer transition-all">
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            {formData.logo ? "Change Logo" : "Upload Logo (PNG/JPG)"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setFormData({ ...formData, logo: event.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Landing Page Headline</Label>
                      <textarea 
                        placeholder="MAKE YOUR&#10;TEAM MORE&#10;PRODUCTIVE." 
                        className="w-full min-h-[100px] rounded-2xl p-4 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold text-xs uppercase" 
                        value={formData.headline}
                        onChange={e => setFormData({...formData, headline: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Landing Page Subheadline</Label>
                      <textarea 
                        placeholder="See how your people work and help them be their best." 
                        className="w-full min-h-[80px] rounded-2xl p-4 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold text-xs" 
                        value={formData.subheadline}
                        onChange={e => setFormData({...formData, subheadline: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Your Name</Label>
                      <Input 
                        required
                        placeholder="Your Full Name" 
                        className="h-14 rounded-2xl px-6 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold" 
                        value={formData.contactName}
                        onChange={e => setFormData({...formData, contactName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                      <Input 
                        required
                        type="email"
                        placeholder="name@email.com" 
                        className="h-14 rounded-2xl px-6 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <Button 
                      disabled={loading}
                      className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "MAKE MY LINK"}
                    </Button>
                  </form>
                </div>

                {/* Right Interactive Preview Block */}
                <div className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col items-center gap-4">
                  <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] self-start ml-2">Live Landing Page Preview</p>
                  
                  <div className="w-full bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-6 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] relative flex flex-col justify-between aspect-[1/1.1] max-w-sm shrink-0">
                    <div className="flex justify-center mb-6 h-20 shrink-0">
                      {formData.logo ? (
                        <img src={formData.logo} alt={formData.brandName} className="max-h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]" />
                      ) : (
                        <div className="flex items-center justify-center text-xl font-black uppercase tracking-widest">{formData.brandName || "Company"}</div>
                      )}
                    </div>
                    
                    <h1 className="text-xl md:text-2xl font-black tracking-tighter mb-4 uppercase leading-[0.95] text-foreground shrink-0 whitespace-pre-line">
                      {formData.headline || "MAKE YOUR\nTEAM MORE\nPRODUCTIVE."}
                    </h1>

                    <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-6 max-w-xs mx-auto leading-tight shrink-0 whitespace-pre-line">
                      {formData.subheadline || "See how your people work and help them be their best."}
                    </p>

                    <div className="space-y-3 shrink-0">
                      <Button 
                        type="button"
                        className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 pointer-events-none"
                      >
                        START NOW
                      </Button>
                      
                      <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        Powered by TRAC AI
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "login" && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-md mx-auto w-full"
            >
              <Button variant="ghost" onClick={() => setView("selection")} className="mb-8 font-black uppercase text-[10px] tracking-widest p-0 hover:bg-transparent">
                <ArrowLeft size={14} className="mr-2" /> GO BACK
              </Button>

              <div className="bg-card border-4 border-black dark:border-white p-10 rounded-[3.5rem] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)]">
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Log In</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">See who used your link</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Email</Label>
                    <Input 
                      required
                      type="email"
                      placeholder="name@email.com" 
                      className="h-14 rounded-2xl px-6 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold" 
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <Button 
                    disabled={loading}
                    className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "GO TO MY PAGE"}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
