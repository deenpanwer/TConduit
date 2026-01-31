"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, Briefcase, 
  ChevronRight, CheckCircle2, Loader2, Upload, X, Image as ImageIcon
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
  userId: string;
  orgId: string;
  initialOrgName?: string;
  onComplete: () => void;
}

export function OnboardingModal({ userId, orgId, initialOrgName, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    orgName: initialOrgName || "",
    role: "",
    industry: "",
    logoBase64: ""
  });

  const handleNext = () => setStep(2);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setFormData({ ...formData, logoBase64: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.orgName || !formData.role) return;
    setLoading(true);
    try {
      let finalOrgId = orgId;

      if (!finalOrgId) {
        finalOrgId = `org_${Math.random().toString(36).substr(2, 9)}`;
        await setDoc(doc(db, "organizations", finalOrgId), {
          name: formData.orgName,
          ownerId: userId,
          logoUrl: formData.logoBase64 || null,
          industry: formData.industry,
          inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, "organizations", finalOrgId), {
          name: formData.orgName,
          industry: formData.industry,
          logoUrl: formData.logoBase64 || null,
          onboardingCompleted: true,
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db, "users", userId), {
        role: formData.role,
        orgName: formData.orgName,
        ownedOrgId: finalOrgId,
        onboardingCompleted: true,
        updatedAt: serverTimestamp()
      });

      onComplete();
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
      >
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Identity Sync</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {step} of 2</span>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: "50%" }}
                    animate={{ width: `${(step / 2) * 100}%` }}
                    className="h-full bg-primary"
                />
            </div>
        </div>

        <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Organization Profile</h2>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Define your corporate environment.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Entity Name</Label>
                            <Input 
                                placeholder="e.g. Acme Corp"
                                value={formData.orgName}
                                onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                                className="h-12 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Your Capacity</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["Founder", "Operations", "HR", "Manager"].map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => setFormData({...formData, role: r})}
                                        className={cn(
                                            "px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                            formData.role === r ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-secondary/50"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Core Industry</Label>
                            <Input 
                                placeholder="e.g. Technology, Logistics"
                                value={formData.industry}
                                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                                className="h-12 rounded-xl font-bold"
                            />
                        </div>
                    </div>
                    <Button disabled={!formData.orgName || !formData.role} onClick={handleNext} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest">
                        Continue to Branding <ChevronRight className="ml-2" size={18} />
                    </Button>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Visual Identity</h2>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Upload your organization logo.</p>
                    </div>

                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files[0];
                            if (file) handleFile(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "relative aspect-video rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden",
                            isDragging ? "border-primary bg-primary/5 scale-[0.98]" : "border-border bg-secondary/30 hover:bg-secondary/50",
                            logoPreview ? "border-solid border-primary/20" : ""
                        )}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                            }}
                        />
                        
                        {logoPreview ? (
                            <>
                                <img src={logoPreview} className="absolute inset-0 w-full h-full object-contain p-8" alt="Logo preview" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setFormData({...formData, logoBase64: ""}); }}
                                    className="absolute top-4 right-4 size-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-colors border shadow-sm"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="size-16 bg-background rounded-2xl flex items-center justify-center shadow-sm border">
                                    <Upload className="text-muted-foreground" size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase tracking-widest">Click or Drag & Drop</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">SVG, PNG or JPG (Max 2MB)</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            disabled={loading} 
                            onClick={handleSubmit} 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                            {loading ? "Initializing..." : "Complete Setup"}
                        </Button>
                        <button 
                            onClick={() => setStep(1)} 
                            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to details
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}