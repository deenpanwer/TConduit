"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
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
  Lock, ArrowUpRight, ShieldCheck, Mail, MonitorPlay, Clock, Calendar, Globe
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
  const [scopes, setScopes] = useState({
    ems: true,
    crm: true,
    tasks: true,
  });
  const [isAdding, setIsAdding] = useState(false);

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

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      const shareCollectionRef = collection(db, "organizations", orgId, "client_shares");
      const newShareDoc = doc(shareCollectionRef);
      const shareId = newShareDoc.id;

      const batch = writeBatch(db);

      // Create Client Share Doc (Branding & metadata)
      const shareData = {
        id: shareId,
        orgId,
        clientEmail: emailToRegister,
        allowedScopes: activeScopes,
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

      // Create Client Email Doc (Fast lookup for security rules)
      const emailDocRef = doc(db, "organizations", orgId, "client_emails", emailToRegister);
      batch.set(emailDocRef, {
        shareId,
        allowedScopes: activeScopes,
        createdAt: serverTimestamp()
      });

      await batch.commit();

      toast({
        title: "Client Portal Created",
        description: `Access link generated for ${emailToRegister}.`
      });
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  // 3. Revoke Client Share
  const handleRevokeShare = async (share: any) => {
    try {
      const batch = writeBatch(db);
      const shareRef = doc(db, "organizations", orgId, "client_shares", share.id);
      const emailRef = doc(db, "organizations", orgId, "client_emails", share.clientEmail);

      batch.delete(shareRef);
      batch.delete(emailRef);
      await batch.commit();

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
      const shareRef = doc(db, "organizations", orgId, "client_shares", selectedShare.id);
      await setDoc(shareRef, { branding }, { merge: true });
      toast({
        title: "Branding Saved",
        description: "Visual settings successfully updated for this client link."
      });
      setBrandingModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
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
      {/* Command Center Title / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Client Shares</span>
            <Globe className="size-4 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black tracking-tight">{clientShares.length}</span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">White-labeled portals active</p>
          </div>
        </div>

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

        <div className="bg-card border-2 border-primary/20 bg-primary/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Branding Prefills</span>
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-sm font-bold uppercase tracking-tight text-foreground flex items-center gap-1.5">
              Logo prefilled <Check className="size-4 text-primary" />
            </span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">Configured from {orgData?.name}</p>
          </div>
        </div>
      </div>

      {/* Add Client Share Form */}
      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
          <Plus size={16} className="text-primary" /> Create New Client Share
        </h3>
        
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
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="pl-10 rounded-xl py-5 border-border bg-secondary/10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isAdding || !newEmail}
              className="rounded-xl px-6 py-5 font-bold uppercase tracking-widest text-[10px] gap-2 shadow-sm bg-primary text-primary-foreground shrink-0 h-10 align-bottom"
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
      <section className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="text-sm font-black uppercase tracking-widest mb-6">Client Access Directory</h3>

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
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Scopes Enabled</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {clientShares.map((share) => (
                  <tr key={share.id} className="group">
                    <td className="py-4 text-xs font-bold font-mono text-foreground truncate max-w-[200px]">{share.clientEmail}</td>
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
                          onClick={() => copyLink(share.id)} 
                          title="Copy Link"
                          className="h-8 w-8 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all"
                        >
                          {copiedId === share.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openBrandingModal(share)}
                          title="Portal Branding Config"
                          className="h-8 w-8 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all"
                        >
                          <Settings size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
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
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRevokeShare(share)}
                          title="Revoke All Access"
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/25 transition-all"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 1. Branding Config Modal */}
      <Dialog open={brandingModalOpen} onOpenChange={setBrandingModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tighter">Customize Client Branding</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground">
              Define the visual landing page layout for {selectedShare?.clientEmail}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Branding Logo URL</Label>
                <Input 
                  placeholder="https://example.com/logo.png"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="rounded-xl border-border bg-secondary/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Custom Button Text</Label>
                <Input 
                  value={branding.buttonText}
                  onChange={(e) => setBranding(prev => ({ ...prev, buttonText: e.target.value }))}
                  className="rounded-xl border-border bg-secondary/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Portal Welcome Title</Label>
              <Input 
                value={branding.titleText}
                onChange={(e) => setBranding(prev => ({ ...prev, titleText: e.target.value }))}
                className="rounded-xl border-border bg-secondary/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Landing Page Description</Label>
              <Input 
                value={branding.descriptionText}
                onChange={(e) => setBranding(prev => ({ ...prev, descriptionText: e.target.value }))}
                className="rounded-xl border-border bg-secondary/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Access Success Note</Label>
              <Input 
                value={branding.welcomeMessage}
                onChange={(e) => setBranding(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                className="rounded-xl border-border bg-secondary/10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-wider" onClick={() => setBrandingModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold uppercase text-[10px] tracking-wider bg-primary text-primary-foreground" onClick={saveBranding} disabled={isSavingBranding}>
              {isSavingBranding ? <Loader2 className="size-3 animate-spin" /> : "Save branding settings"}
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
