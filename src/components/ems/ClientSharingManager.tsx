"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, serverTimestamp 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, Check, Settings, BarChart2, Trash2, Plus, Loader2, Sparkles, 
  Lock, ArrowUpRight, ArrowRight, Pencil, ShieldCheck, Mail, MonitorPlay, Clock, Calendar, Globe, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ClientSharingManagerProps {
  orgId: string;
  isPremium: boolean;
  orgData: any;
}

export function ClientSharingManager({ orgId, isPremium, orgData }: ClientSharingManagerProps) {
  const { toast } = useToast();
  const [clientShares, setClientShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newEmail, setNewEmail] = useState("");
  const [scopes, setScopes] = useState({ ems: true, crm: true, tasks: true });
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals / Modals State
  const [selectedShare, setSelectedShare] = useState<any>(null);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  // Branding Editor State
  const [branding, setBranding] = useState({
    logoUrl: "",
    titleText: "",
    descriptionText: "",
    buttonText: "",
    welcomeMessage: "",
  });
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Analytics Player State
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(false);

  // 1. Subscribe to Client Shares
  useEffect(() => {
    if (!orgId || !isPremium) {
      setLoading(false);
      return;
    }

    const sharesCollection = collection(db, "organizations", orgId, "client_shares");
    const unsubscribe = onSnapshot(sharesCollection, (snapshot) => {
      const shares = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientShares(shares);
      setLoading(false);
    }, (error) => {
      console.error("Error loading client shares:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orgId, isPremium]);

  // 2. Add New Client Share
  const handleAddClientShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const emailToRegister = newEmail.trim().toLowerCase();
    const activeScopes = Object.entries(scopes)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);

    if (clientShares.length >= 3) {
      toast({
        title: "Limit Reached",
        description: "Maximum limit of 3 active client shares reached. Please remove an existing client link to generate a new one.",
        variant: "destructive"
      });
      return;
    }

    if (activeScopes.length === 0) {
      toast({
        title: "Invalid Access Scopes",
        description: "Please select at least one access scope (EMS, CRM, or Tasks).",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/client/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          clientEmail: emailToRegister,
          allowedScopes: activeScopes,
          branding: {
            logoUrl: orgData?.logoUrl || "",
            titleText: `Welcome to the ${orgData?.name || "Company"} Client Portal`,
            descriptionText: "Enter your email address below to securely access your tasks, projects, and contact updates.",
            buttonText: "Access Portal",
            welcomeMessage: "Access granted! Fetching project files..."
          }
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        console.warn("Server API creation notice, attempting client-side fallback:", resData.error);
        const shareCollectionRef = collection(db, "organizations", orgId, "client_shares");
        const newShareDoc = doc(shareCollectionRef);
        const shareId = newShareDoc.id;

        const batch = writeBatch(db);

        const shareData = {
          id: shareId,
          orgId,
          clientEmail: emailToRegister,
          allowedScopes: activeScopes,
          isCustomBranded: false,
          createdAt: serverTimestamp(),
          branding: {
            logoUrl: orgData?.logoUrl || "",
            titleText: `Welcome to the ${orgData?.name || "Company"} Client Portal`,
            descriptionText: "Enter your email address below to securely access your tasks, projects, and contact updates.",
            buttonText: "Access Portal",
            welcomeMessage: "Access granted! Fetching project files..."
          }
        };
        batch.set(newShareDoc, shareData);

        const emailDocRef = doc(db, "organizations", orgId, "client_emails", emailToRegister);
        batch.set(emailDocRef, {
          shareId,
          allowedScopes: activeScopes,
          createdAt: serverTimestamp()
        });

        await batch.commit();
      }

      toast({
        title: "Client Portal Created",
        description: `Access link generated for ${emailToRegister}.`
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not register client portal.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  // 3. Revoke Client Share
  const handleRevokeShare = async (share: any) => {
    try {
      const res = await fetch("/api/client/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          shareId: share.id,
          clientEmail: share.clientEmail
        })
      });

      if (!res.ok) {
        const batch = writeBatch(db);
        const shareRef = doc(db, "organizations", orgId, "client_shares", share.id);
        const emailRef = doc(db, "organizations", orgId, "client_emails", share.clientEmail);

        batch.delete(shareRef);
        batch.delete(emailRef);
        await batch.commit();
      }

      toast({
        title: "Access Revoked",
        description: `Portal deactivated for ${share.clientEmail}.`
      });
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 4. Open Branding Modal
  const openBrandingModal = (share: any) => {
    setSelectedShare(share);
    setBranding({
      logoUrl: share.branding?.logoUrl || orgData?.logoUrl || "",
      titleText: share.branding?.titleText || `Welcome to the ${orgData?.name || "Company"} Portal`,
      descriptionText: share.branding?.descriptionText || "Enter your email to securely access your project updates.",
      buttonText: share.branding?.buttonText || "Access Portal",
      welcomeMessage: share.branding?.welcomeMessage || "Access granted!",
    });
    setBrandingModalOpen(true);
  };

  // 5. Save Branding
  const saveBranding = async () => {
    if (!selectedShare) return;
    setIsSavingBranding(true);

    try {
      const res = await fetch("/api/client/update-branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          shareId: selectedShare.id,
          branding
        })
      });

      if (!res.ok) {
        const shareRef = doc(db, "organizations", orgId, "client_shares", selectedShare.id);
        await setDoc(shareRef, { branding, isCustomBranded: true }, { merge: true });
      }

      toast({
        title: "Branding Saved",
        description: "Visual settings successfully updated for this client link."
      });
      setBrandingModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save branding settings.",
        variant: "destructive"
      });
    } finally {
      setIsSavingBranding(false);
    }
  };

  // 6. Open Analytics Recordings
  const openAnalytics = async (share: any) => {
    setSelectedShare(share);
    setRecordings([]);
    setSelectedRecording(null);
    setEmbedUrl(null);
    setAnalyticsModalOpen(true);
    setLoadingRecordings(true);

    try {
      const res = await fetch(`/api/client/recordings?email=${encodeURIComponent(share.clientEmail)}`);
      const data = await res.json();
      if (data.results) {
        setRecordings(data.results);
      } else if (data.error) {
        console.error("PostHog API Error:", data.error);
      }
    } catch (error) {
      console.error("Failed to load interaction recordings:", error);
    } finally {
      setLoadingRecordings(false);
    }
  };

  // 7. Load Embedded Playback
  const playRecording = async (rec: any) => {
    setSelectedRecording(rec);
    setLoadingEmbed(true);
    setEmbedUrl(null);

    try {
      const res = await fetch(`/api/client/recordings?recordingId=${rec.id}`);
      const data = await res.json();
      if (res.ok && data.embedUrl) {
        setEmbedUrl(data.embedUrl);
      } else {
        toast({
          title: "Player Load Error",
          description: data.error || "Access Denied by PostHog",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not establish connection with playback servers.",
        variant: "destructive"
      });
    } finally {
      setLoadingEmbed(false);
    }
  };

  const copyLink = (shareId: string) => {
    const portalUrl = `${window.location.origin}/share/${orgId}/${shareId}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedId(shareId);
    toast({
      title: "Link Copied",
      description: "Portal link copied to clipboard."
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Upsell state for non-premium accounts
  if (!isPremium) {
    return (
      <section className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-12">
        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 animate-pulse">
          <Lock size={32} />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Unlock Client Sharing</h3>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          This is a Premium plan feature
        </p>
        <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
          Securely share your real-time project tasks, CRM documents, and team directory cards directly with clients. Features customizable logos, white-labeled landing pages, and interactive analytics.
        </p>
        <Button className="rounded-xl px-8 py-6 font-bold uppercase tracking-widest text-xs gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 bg-primary text-primary-foreground">
          <Sparkles size={16} /> Upgrade to Premium
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Client Shares</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight">{clientShares.length}</span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">Client portals active</p>
          </div>
        </div>

        {/* 
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Access Scopes</span>
            <ShieldCheck className="size-4 text-green-500" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight">
              {clientShares.reduce((acc, curr) => acc + (curr.allowedScopes?.length || 0), 0)}
            </span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">Configured modules</p>
          </div>
        </div>
        */}

        <div className="bg-card border-2 border-primary/20 bg-primary/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Branding Defaults</span>
          </div>
          <div className="mt-4">
            {orgData?.logoUrl ? (
              <>
                <span className="text-sm font-bold uppercase tracking-tight text-foreground flex items-center gap-1.5">
                  Logo Configured <Check className="size-4 text-primary" />
                </span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">Default logo active</p>
              </>
            ) : (
              <>
                <span className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  No Default Logo Uploaded
                </span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">Upload logo in Company tab</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Share Form */}
      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={16} className="text-primary" /> Create New Client Share
          </h3>
          <Badge 
            variant={clientShares.length >= 3 ? "destructive" : "secondary"} 
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg"
          >
            {clientShares.length} / 3 Shares Used
          </Badge>
        </div>

        {clientShares.length >= 3 && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-3">
            <ShieldCheck size={18} className="shrink-0" />
            <span>Maximum limit reached (3/3 active client shares). Remove an existing client link below to free up a slot.</span>
          </div>
        )}
        
        <form onSubmit={handleAddClientShare} className="space-y-6 max-w-3xl">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1 space-y-2">
              <Label htmlFor="clientEmail" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Client Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="clientEmail"
                  type="email"
                  placeholder="client@company.com"
                  value={newEmail}
                  disabled={clientShares.length >= 3}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="pl-10 rounded-xl py-5 border-border bg-secondary/10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isAdding || !newEmail || clientShares.length >= 3}
              className="rounded-xl px-6 py-5 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-sm bg-primary text-primary-foreground shrink-0 h-10 align-bottom disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="size-3 animate-spin" /> : <Plus size={14} />} Generate Access Link
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Allowed Scope Controls</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide">EMS (Personnel)</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Read Team Cards</span>
                </div>
                <Switch 
                  checked={scopes.ems}
                  onCheckedChange={(checked) => setScopes(prev => ({ ...prev, ems: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide">CRM (Invoices/Deals)</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Read Project Accounts</span>
                </div>
                <Switch 
                  checked={scopes.crm}
                  onCheckedChange={(checked) => setScopes(prev => ({ ...prev, crm: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-secondary/20 rounded-xl border border-border/50">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide">Tasks Board</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Read Shared Tasks</span>
                </div>
                <Switch 
                  checked={scopes.tasks}
                  onCheckedChange={(checked) => setScopes(prev => ({ ...prev, tasks: checked }))}
                />
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Directory Table */}
      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Client Access</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest w-fit">
            {clientShares.length} of 3 Slots Active
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : clientShares.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs uppercase tracking-wider font-bold">No active client shares found</p>
            <p className="text-[10px] mt-1 uppercase tracking-tight">Generate a link above to share portal data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Client Email</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Dedicated Client Login Link</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Scopes Enabled</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {clientShares.map((share) => {
                  const isBrandingConfigured = Boolean(share.isCustomBranded === true || share.branding?.isCustom === true);
                  const clientLoginUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${orgId}/${share.id}`;

                  return (
                    <tr key={share.id} className="group">
                      <td className="py-4 text-xs font-bold font-mono text-foreground truncate max-w-[180px]">{share.clientEmail}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 max-w-[340px]">
                          <span 
                            className="font-mono text-xs text-muted-foreground truncate max-w-[260px] select-all bg-secondary/30 px-2.5 py-1 rounded-lg border border-border/40"
                            title="Client Portal Access Link (Copy-only)"
                          >
                            {clientLoginUrl}
                          </span>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => copyLink(share.id)}
                            title="Copy Client Access Link"
                            className={cn(
                              "h-7 w-7 rounded-lg transition-all shrink-0 border",
                              copiedId === share.id 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 scale-110" 
                                : "hover:bg-secondary text-muted-foreground hover:text-primary border-transparent hover:border-border"
                            )}
                          >
                            {copiedId === share.id ? (
                              <Check size={13} className="text-emerald-500 animate-in zoom-in" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {share.allowedScopes?.map((scope: string) => (
                            <Badge 
                              key={scope} 
                              variant="secondary" 
                              className="text-[8px] font-black uppercase tracking-widest py-0.5 rounded-md bg-secondary/80 border"
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openBrandingModal(share)}
                            title={isBrandingConfigured ? "Custom Branding Configured (Click to edit)" : "Portal Branding Config"}
                            className={cn(
                              "h-8 w-8 rounded-lg border transition-all relative",
                              isBrandingConfigured 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white" 
                                : "hover:bg-secondary text-muted-foreground hover:text-primary border-transparent hover:border-border"
                            )}
                          >
                            <Settings size={14} className={isBrandingConfigured ? "text-emerald-500 hover:text-white" : "text-muted-foreground group-hover:text-primary"} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openAnalytics(share)}
                            title="Client Analytics Recordings"
                            className="h-8 w-8 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all"
                          >
                            <BarChart2 size={14} className="text-muted-foreground group-hover:text-green-500 transition-colors" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeShare(share)}
                            title="Remove Client & Revoke Link"
                            className="h-8 px-3 rounded-xl border-destructive/30 bg-destructive/5 hover:bg-destructive text-destructive hover:text-white transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ml-2"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 1. Branding Config Modal - Spacious 2-Column Live Preview Builder */}
      <Dialog open={brandingModalOpen} onOpenChange={setBrandingModalOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border-border bg-card/95 backdrop-blur-2xl p-6 md:p-8">
          <DialogHeader className="mb-4 pb-4 border-b border-border/50">
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">
                Onboarding Builder
              </DialogTitle>
              <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground mt-0.5">
                Client Onboarding for <span className="text-primary font-mono font-bold">{selectedShare?.clientEmail}</span>
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2">
            {/* Left Column: Roomy Form Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Branding Logo</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/logo.png"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="rounded-xl border-border bg-secondary/15 h-11 text-xs font-medium"
                  />
                  <label 
                    htmlFor="branding-logo-file"
                    className="px-4 py-2.5 rounded-xl bg-secondary border border-border hover:bg-secondary/80 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Pencil size={12} />
                    <span>Upload</span>
                  </label>
                  <input 
                    id="branding-logo-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setBranding(prev => ({ ...prev, logoUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Portal Welcome Title</Label>
                <Input 
                  placeholder="e.g. Welcome to the Acme Corp Client Portal"
                  value={branding.titleText}
                  onChange={(e) => setBranding(prev => ({ ...prev, titleText: e.target.value }))}
                  className="rounded-xl border-border bg-secondary/15 h-12 text-sm font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Landing Page Description & Onboarding Note</Label>
                <textarea 
                  placeholder="Enter onboarding instructions or welcome details for your client..."
                  value={branding.descriptionText}
                  onChange={(e) => setBranding(prev => ({ ...prev, descriptionText: e.target.value }))}
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-border bg-secondary/15 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 custom-scrollbar resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Custom Button CTA Text</Label>
                  <Input 
                    placeholder="Access Portal"
                    value={branding.buttonText}
                    onChange={(e) => setBranding(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="rounded-xl border-border bg-secondary/15 h-11 text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Success Welcome Toast Note</Label>
                  <Input 
                    placeholder="Access granted! Loading project files..."
                    value={branding.welcomeMessage}
                    onChange={(e) => setBranding(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    className="rounded-xl border-border bg-secondary/15 h-11 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Real-Time Interactive Live Portal Preview */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                <span>Client Onboarding Screen Mockup</span>
              </div>

              <div className="flex-1 bg-background border-2 border-border/80 rounded-3xl p-6 shadow-inner flex flex-col justify-center items-center relative overflow-hidden min-h-[360px]">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                {/* Simulated Portal Card */}
                <div className="w-full max-w-sm bg-card border border-border/80 rounded-2xl p-6 shadow-xl relative z-10 space-y-6 text-center">
                  <div className="flex flex-col items-center">
                    {branding.logoUrl ? (
                      <img 
                        src={branding.logoUrl} 
                        alt="Logo Preview" 
                        className="h-10 w-auto object-contain mb-3 dark:invert" 
                      />
                    ) : (
                      <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
                        <ShieldCheck size={22} />
                      </div>
                    )}

                    <h4 className="text-lg font-black uppercase tracking-tight leading-snug">
                      {branding.titleText || `Welcome to the ${orgData?.name || "Company"} Portal`}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      {branding.descriptionText || "Enter your email address below to securely access your tasks and updates."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Authorized Email</span>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input 
                          readOnly 
                          value={selectedShare?.clientEmail || "client@company.com"} 
                          className="pl-9 h-9 text-[11px] font-mono rounded-lg bg-secondary/30 border-border" 
                        />
                      </div>
                    </div>

                    <Button className="w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground pointer-events-none">
                      {branding.buttonText || "Access Portal"} <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-border/50">
            <Button variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-wider" onClick={() => setBrandingModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold uppercase text-[10px] tracking-wider bg-primary text-primary-foreground px-6" onClick={saveBranding} disabled={isSavingBranding}>
              {isSavingBranding ? <Loader2 className="size-3 animate-spin" /> : "Save Branding Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Analytics Recordings Modal */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="max-w-4xl rounded-3xl border-border bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tighter">Client Session Recordings</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground">
              Review how client {selectedShare?.clientEmail} interacted with the portal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-4">
            {/* List */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Interaction logs</span>
              {loadingRecordings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : recordings.length === 0 ? (
                <p className="text-[10px] uppercase font-bold text-muted-foreground py-6 text-center">No active sessions tracked.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {recordings.map((rec) => (
                    <button 
                      key={rec.id}
                      onClick={() => playRecording(rec)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        selectedRecording?.id === rec.id ? "bg-primary/10 border-primary/45" : "bg-secondary/15 border-border hover:bg-secondary/30"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                          <MonitorPlay size={12} className="text-primary shrink-0" />
                          <span className="truncate">Session {rec.id.substring(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground uppercase mt-1">
                          <span className="flex items-center gap-0.5"><Clock size={10} /> {(rec.active_seconds / 60).toFixed(1)}m</span>
                          <span className="flex items-center gap-0.5"><Calendar size={10} /> {new Date(rec.start_time).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Embedded Player */}
            <div className="lg:col-span-3 bg-secondary/10 border rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center relative">
              {loadingEmbed ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Loading video...</span>
                </div>
              ) : embedUrl ? (
                <iframe 
                  src={embedUrl}
                  className="w-full h-full min-h-[400px] border-none"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <MonitorPlay className="size-10 text-muted-foreground/35 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Active Recording Selected</p>
                  <p className="text-[9px] mt-0.5 uppercase tracking-tight max-w-[220px] mx-auto">Click one of the logs on the left to inspect customer workflow.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
