"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { 
  Users, Play, ExternalLink, Copy, Check, 
  Loader2, ArrowLeft, LayoutDashboard, MousePointer2, Clock, Calendar, X, MonitorPlay
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function PartnerDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  
  const [partner, setPartner] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingRecordings, setFetchingRecordings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Interaction Viewer State
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Branding Custom Text State
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [savingText, setSavingText] = useState(false);

  useEffect(() => {
    if (partner) {
      setHeadline(partner.headline || "MAKE YOUR\nTEAM MORE\nPRODUCTIVE.");
      setSubheadline(partner.subheadline || "See how your people work and help them be their best.");
    }
  }, [partner]);

  const saveTextBranding = async () => {
    setSavingText(true);
    try {
      const res = await fetch("/api/partner/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerId: partner.id,
          updates: { headline, subheadline }
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }
      toast.success("Branding text updated successfully!");
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setSavingText(false);
    }
  };

  useEffect(() => {
    if (!email) {
      router.replace("/partner");
      return;
    }

    const q = query(collection(db, "partners"), where("email", "==", email.toLowerCase()), limit(1));
    const unsubPartner = onSnapshot(q, (snap) => {
      if (snap.empty) {
        router.replace("/partner");
        return;
      }
      const pData: any = { id: snap.docs[0].id, ...snap.docs[0].data() };
      setPartner(pData);
      
      // 2. Fetch Attributed Clients (From Partner's private ledger)
      const clientsQ = collection(db, "partners", pData.id, "signups");
      const unsubClients = onSnapshot(clientsQ, (clientSnap) => {
        setClients(clientSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      fetchRecordings(pData.slug);

      setLoading(false);
      return () => unsubClients();
    });

    return () => unsubPartner();
  }, [email, router]);

  const fetchRecordings = async (slug: string) => {
    setFetchingRecordings(true);
    try {
      const res = await fetch(`/api/partner/recordings?slug=${slug}`);
      const data = await res.json();
      if (data.results) {
        setRecordings(data.results);
      } else if (data.error) {
        console.error("PostHog API Error:", data);
        toast.error(`Sync Issue: ${data.error}`);
      }
    } catch (err) {
      console.error("Fetch Execution Error:", err);
      toast.error("Could not reach the sync server.");
    } finally {
      setFetchingRecordings(false);
    }
  };

  const handleWatchInteraction = async (rec: any) => {
    setSelectedRecording(rec);
    setLoadingEmbed(true);
    setEmbedUrl(null);
    setEmbedError(null);
    try {
      const res = await fetch(`/api/partner/recordings?recordingId=${rec.id}`);
      const data = await res.json();
      if (res.ok && data.embedUrl) {
        setEmbedUrl(data.embedUrl);
      } else {
        setEmbedError(data.details || data.error || "Access Denied");
      }
    } catch (err) {
      setEmbedError("Connection failed");
    } finally {
      setLoadingEmbed(false);
    }
  };

  const copyMagicLink = () => {
    const link = `${window.location.origin}/${partner.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground text-center">CHECKING YOUR PAGE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.push("/partner")} className="rounded-xl border-2 h-10 w-10 shrink-0 transition-all active:scale-90 shadow-sm">
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-[0.9] font-poppins truncate">
                TRAC AI SUBSIDIARY OF {partner.brandName}
              </h1>
              <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 truncate">
                Partner: {partner.contactName}
              </p>
            </div>
          </div>
          
           <div className="flex items-center gap-4 shrink-0">
              <div className="h-8 max-w-[120px] overflow-hidden shrink-0 flex items-center">
                {partner.logo || partner.logoUrl ? (
                  <img 
                    src={partner.logo || partner.logoUrl} 
                    alt="Logo" 
                    className="max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" 
                  />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${partner.email || 'partner'}`} 
                    alt="Avatar" 
                    className="size-8 md:size-10 rounded-full border-2 border-border object-cover" 
                  />
                )}
              </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-12 pb-32">
        
        {/* REFERRAL LINK: CHUNKY BLOCK */}
        <section className="bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <ExternalLink size={120} />
            </div>
            
            <div className="relative z-10">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-3">
                    <div className="h-px w-8 bg-muted-foreground/30" />
                    Your Referral Link
                </h2>
                
                <div className="flex flex-col md:flex-row items-stretch gap-4">
                    <div className="flex-1 bg-secondary/50 rounded-2xl border-2 border-dashed border-border px-8 py-6 flex items-center font-mono text-lg font-bold tracking-tight text-primary truncate">
                        {window.location.origin}/{partner.slug}
                    </div>
                    <Button 
                        onClick={copyMagicLink}
                        className="h-auto py-6 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        {copied ? <Check size={20} className="mr-3" /> : <Copy size={20} className="mr-3" />}
                        {copied ? "COPIED" : "COPY LINK"}
                    </Button>
                </div>

                <p className="mt-6 text-[11px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wide opacity-60">
                    Our Promise: Any users who come with this link are yours to earn money from. Our system tracks them the moment they land.
                </p>
            </div>
        </section>

        {/* BRANDING SETTINGS: UPLOAD LOGO */}
        <section className="bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-3">
              <div className="h-px w-8 bg-muted-foreground/30" />
              Company Branding Settings
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
            {/* Form Fields Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Logo Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-secondary/20 rounded-2xl border border-border">
                <div className="size-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-background shrink-0 p-2">
                  {partner.logo || partner.logoUrl ? (
                    <img src={partner.logo || partner.logoUrl} className="max-w-full max-h-full object-contain" alt="Company Logo" />
                  ) : (
                    <div className="text-[9px] font-black uppercase text-muted-foreground/40 text-center">No Logo</div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Partner Brand Logo</p>
                  <div className="flex items-center gap-2">
                    <label className="h-10 px-4 rounded-xl border hover:bg-secondary transition-all flex items-center justify-center cursor-pointer text-[10px] font-black uppercase tracking-wider bg-background border-border shrink-0">
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const base64 = event.target?.result as string;
                              try {
                                const res = await fetch("/api/partner/update", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ partnerId: partner.id, updates: { logo: base64 } }),
                                });
                                if (!res.ok) throw new Error("Upload failed");
                                toast.success("Logo updated successfully!");
                              } catch (err: any) {
                                toast.error("Upload failed");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {(partner.logo || partner.logoUrl) && (
                      <Button 
                        variant="ghost" 
                        className="h-10 px-4 rounded-xl hover:bg-destructive/10 hover:text-destructive text-[10px] font-black uppercase tracking-wider text-muted-foreground border border-transparent"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/partner/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ partnerId: partner.id, updates: { logo: null, logoUrl: null } }),
                            });
                            if (!res.ok) throw new Error("Removal failed");
                            toast.success("Logo removed!");
                          } catch (err: any) {
                            toast.error("Removal failed");
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Landing Page Headline</label>
                  <textarea 
                    placeholder="MAKE YOUR&#10;TEAM MORE&#10;PRODUCTIVE." 
                    className="w-full min-h-[80px] rounded-xl p-4 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold text-xs uppercase" 
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Landing Page Subheadline</label>
                  <textarea 
                    placeholder="See how your people work and help them be their best." 
                    className="w-full min-h-[80px] rounded-xl p-4 bg-background border-2 border-border focus:border-black dark:focus:border-white transition-all font-bold text-xs" 
                    value={subheadline}
                    onChange={e => setSubheadline(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={saveTextBranding} 
                  disabled={savingText}
                  className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  {savingText ? "Saving Changes..." : "Save Branding Text"}
                </Button>
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 flex flex-col items-center gap-4">
              <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] self-start ml-2">Live Landing Page Preview</p>
              
              <div className="w-full bg-card border-4 border-black dark:border-white rounded-[2.5rem] p-6 text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] relative flex flex-col justify-between aspect-[1/1.1] max-w-sm shrink-0">
                <div className="flex justify-center mb-6 h-20 shrink-0">
                  {partner.logo || partner.logoUrl ? (
                    <img src={partner.logo || partner.logoUrl} alt={partner.brandName} className="max-h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]" />
                  ) : (
                    <div className="flex items-center justify-center text-xl font-black uppercase tracking-widest">{partner.brandName}</div>
                  )}
                </div>
                
                <h1 className="text-xl md:text-2xl font-black tracking-tighter mb-4 uppercase leading-[0.95] text-foreground shrink-0 whitespace-pre-line">
                  {headline}
                </h1>

                <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-6 max-w-xs mx-auto leading-tight shrink-0 whitespace-pre-line">
                  {subheadline}
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
        </section>

        {/* RECENT CONVERSIONS */}
        {clients.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Recent Conversions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div key={client.id} className="bg-card border-2 border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-secondary overflow-hidden border-2 border-emerald-500/20 shadow-inner shrink-0">
                      <img 
                        src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${client.clientEmail}`} 
                        alt="Client Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight truncate">{client.orgName}</p>
                      <p className="text-[10px] font-bold text-muted-foreground truncate">{client.clientEmail}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/70 uppercase mt-4">
                    Joined {client.createdAt?.toDate ? formatDistanceToNow(client.createdAt.toDate(), { addSuffix: true }) : "recently"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sessions Feed */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Visitor List</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-3 italic">People who used your link</p>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchRecordings(partner.slug)} 
                disabled={fetchingRecordings} 
                className="text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl border-2 hover:bg-secondary transition-all"
            >
                {fetchingRecordings ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                Update Feed
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recordings.length === 0 && !fetchingRecordings && (
                <div className="py-24 bg-secondary/20 border-4 border-dashed border-border rounded-[4rem] text-center">
                    <Clock className="size-16 mx-auto mb-6 text-muted-foreground/20" />
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Waiting for first visitor...</p>
                </div>
            )}

            {recordings.map((rec, idx) => {
              // Try to find if this visitor is one of our converted clients
              const visitorEmail = rec.person?.properties?.email;
              const visitorName = rec.person?.properties?.name || rec.person?.properties?.displayName;
              const isConverted = clients.some(c => c.clientEmail === visitorEmail);
              
              const activeSeconds = rec.active_seconds || 0;
              const mins = Math.floor(activeSeconds / 60);
              const secs = activeSeconds % 60;
              const durationFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  key={rec.id} 
                  className={cn(
                    "bg-card border-2 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between transition-all group hover:shadow-xl hover:shadow-primary/5 gap-6",
                    isConverted ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-border hover:border-black dark:hover:border-white"
                  )}
                >
                  <div className="flex items-center gap-6 md:gap-8 min-w-0 flex-1">
                    <div className={cn(
                      "size-12 md:size-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner shrink-0 overflow-hidden border-2",
                      visitorEmail 
                        ? "border-primary/20 bg-secondary" 
                        : "bg-secondary text-muted-foreground/30 border-transparent"
                    )}>
                      {visitorEmail ? (
                        <img 
                          src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${visitorEmail}`} 
                          alt="Visitor"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MonitorPlay className="size-6 md:size-8 opacity-20" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2">
                          <span className={cn(
                            "text-base md:text-lg font-black uppercase tracking-tight truncate max-w-[200px] md:max-w-none",
                            visitorEmail ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {visitorEmail || "Anonymous Visitor"}
                          </span>
                          <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <Clock size={12} className="text-primary" /> {durationFormatted} Active
                          </div>
                      </div>
                      <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-[11px] font-bold text-muted-foreground/80 uppercase tracking-[0.2em] truncate">
                          <span className="flex items-center gap-2 shrink-0"><Calendar size={12} /> {formatDistanceToNow(new Date(rec.start_time), { addSuffix: true })}</span>
                          <span className="size-1 bg-border rounded-full hidden md:block shrink-0" />
                          <span className="truncate">{visitorName || (visitorEmail ? "Identified User" : "Unidentified Session")}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                      onClick={() => handleWatchInteraction(rec)}
                      className={cn(
                        "w-full md:w-auto rounded-xl border-2 font-black uppercase text-[10px] tracking-widest h-12 px-8 transition-all hover:translate-y-[-2px] active:translate-y-[1px]",
                        isConverted ? "border-emerald-500/50 hover:bg-emerald-500 hover:text-white" : ""
                      )}
                  >
                      <Play size={16} className="mr-3 fill-current" /> Watch Video
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* INTEGRATED INTERACTION VIEWER DIALOG */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] p-0 border-4 border-black dark:border-white bg-black overflow-hidden rounded-[3rem] shadow-2xl flex flex-col [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Watch Interaction</DialogTitle>
            <DialogDescription>
              Viewing stream for visitor {selectedRecording?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="h-20 bg-card border-b-4 border-black dark:border-white flex items-center justify-between px-10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <MonitorPlay size={20} />
                </div>
                <div>
                    <h3 className="font-black uppercase tracking-tighter leading-none text-lg">Watch Interaction</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Visitor ID: {selectedRecording?.id?.slice(0,8)}...</p>
                </div>
            </div>
            
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedRecording(null)}
                className="size-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all"
            >
                <X size={24} />
            </Button>
          </div>

          <div className="flex-1 bg-zinc-900 relative group/stream">
            {loadingEmbed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-12 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Loading Video...</p>
                </div>
            ) : embedUrl ? (
                <iframe 
                    src={embedUrl}
                    className="w-full h-full border-none"
                    allow="autoplay; fullscreen"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 p-8 text-center">
                    <p className="font-black uppercase tracking-widest mb-4">Video Restricted</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground max-w-sm">
                        Our security protocol requires a direct connection for this stream.
                    </p>
                </div>
            )}
          </div>
          
          <div className="h-14 bg-secondary/30 flex items-center px-10 border-t border-border">
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Private Video • Powered by TRAC AI</p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function PartnerDashboard() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="size-12 animate-spin text-primary" />
        </div>
    }>
      <PartnerDashboardContent />
    </Suspense>
  );
}
