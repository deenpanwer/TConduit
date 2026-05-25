"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, FileText, CheckCircle2, Award, Briefcase, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  existingContext?: any;
  onSuccess: (context: any) => void;
}

// Dynamically inject official PDF.js scripts on-demand to perform client-side PDF parsing
const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(pdfjs);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export function UploadResumeModal({ isOpen, onClose, employeeId, employeeName, existingContext, onSuccess }: UploadResumeModalProps) {
  const { userData } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize modal state with existing profile database context on open
  useEffect(() => {
    if (isOpen) {
      if (existingContext) {
        setAnalysisResult(existingContext);
      } else {
        setAnalysisResult(null);
        setFile(null);
      }
    }
  }, [isOpen, existingContext]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    setFile(null);
    setIsAnalyzing(false);
    onClose();
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setFile(null);
  };

  const sendToApi = async (base64Data: string, mimeType: string) => {
    try {
      const response = await fetch('/api/employee/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base64File: base64Data, 
          mimeType,
          employeeId,
          employeeName,
          uploaderEmail: userData?.email || userData?.userName || "unknown-uploader",
          uploaderName: userData?.name || userData?.displayName || "Admin User"
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const resumeContext = {
          brief: data.brief,
          skills: data.skills,
          experience: data.experience,
          analyzedAt: new Date().toISOString(),
          analyzedBy: {
            email: userData?.email || "unknown",
            name: userData?.name || "System"
          }
        };

        toast.success("Resume analyzed successfully!");
        setAnalysisResult(resumeContext); // Lock result to screen inside modal
        onSuccess(resumeContext); // Notify parent component
      } else {
        throw new Error(data.error || "Failed to analyze resume");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processPdfFile = async (pdfFile: File) => {
    try {
      // 1. Fetch lightweight official PDF.js dynamically
      const pdfjs = await loadPdfJs();
      
      // 2. Read uploaded PDF into ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // 3. Initialize PDF document
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = "";
      // Extract textual items up to 3 pages (covers almost all resumes)
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      
      if (fullText.trim().length > 100) {
        // Searchable PDF: Base64 encode clean text stream and transmit as plain text
        const base64Text = btoa(unescape(encodeURIComponent(fullText.trim())));
        await sendToApi(base64Text, "text/plain");
      } else {
        // Scanned PDF (pure image snapshot): Render first page onto offscreen canvas
        const page = await pdf.getPage(1);
        const canvas = document.createElement("canvas");
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: canvas.getContext("2d")!,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75).split(',')[1];
        await sendToApi(compressedBase64, "image/jpeg");
      }
    } catch (e: any) {
      console.error("Client-side PDF.js parse failed, running fallback base64 transfer:", e);
      // Fallback: send raw base64 binary directly (cleaned up server-side)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (!result) return;
        const base64Data = result.split(',')[1];
        await sendToApi(base64Data, pdfFile.type);
      };
      reader.readAsDataURL(pdfFile);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      if (file.type === "application/pdf") {
        await processPdfFile(file);
      } else if (file.type.startsWith("image/")) {
        // Compress images on client-side canvas before uploading to reduce file sizes drastically
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            
            const MAX_SIZE = 1600;
            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              } else {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75).split(',')[1];
            await sendToApi(compressedBase64, "image/jpeg");
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // Other formats: standard base64 directly
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = e.target?.result as string;
          if (!result) return;
          const base64Data = result.split(',')[1];
          await sendToApi(base64Data, file.type);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during analysis");
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8 border-border/50 bg-background/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <FileText size={20} />
            </div>
            {analysisResult ? "Extracted Context" : "Upload Resume"}
          </DialogTitle>
          <DialogDescription className="font-bold uppercase tracking-widest text-[10px] opacity-60">
            {analysisResult 
              ? `AI analysis summary generated for ${employeeName}`
              : `AI-powered resume analysis for automated professional context generation.`
            }
          </DialogDescription>
        </DialogHeader>

        {analysisResult ? (
          // Analysis Complete View: Shows parsed candidate summary, skills, and experience
          <div className="mt-6 space-y-6">
            <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Candidate Summary</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                {analysisResult.brief}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-secondary/5 border border-border/30 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase size={16} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Experience</span>
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {analysisResult.experience} <span className="text-xs font-bold text-muted-foreground uppercase">Years</span>
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-secondary/5 border border-border/30 space-y-3 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award size={16} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Verified At</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  {new Date(analysisResult.analyzedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-secondary/5 border border-border/30 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Extracted Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.skills && analysisResult.skills.length > 0 ? (
                  analysisResult.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-secondary/20 hover:bg-secondary/30">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs font-bold text-muted-foreground italic">No skills extracted.</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <Button 
                variant="ghost"
                onClick={handleResetAnalysis}
                className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
              >
                <RefreshCw size={14} /> Re-upload Resume
              </Button>
              <Button 
                onClick={handleClose}
                className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              >
                Okay, Got It
              </Button>
            </div>
          </div>
        ) : (
          // Upload View
          <div className="mt-6 space-y-6">
            {!file ? (
              <div 
                className="border-2 border-dashed border-border/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/10 hover:border-emerald-500/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="size-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4 text-emerald-500 shadow-inner">
                  <UploadCloud size={32} />
                </div>
                <p className="font-black uppercase tracking-widest text-sm mb-2">Drag & Drop or Click</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                  Supports PDF, JPG, PNG
                </p>
              </div>
            ) : (
              <div className="border border-border/50 rounded-3xl p-6 bg-secondary/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-black uppercase tracking-widest"
                  onClick={() => setFile(null)}
                  disabled={isAnalyzing}
                >
                  Change
                </Button>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png" 
              onChange={handleFileChange}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="ghost" onClick={handleClose} disabled={isAnalyzing} className="rounded-xl font-black uppercase text-[10px] tracking-widest">
                Cancel
              </Button>
              <Button 
                onClick={handleUploadAndAnalyze} 
                disabled={!file || isAnalyzing}
                className="rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              >
                {isAnalyzing && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isAnalyzing ? "Analyzing Resume..." : "Upload & Analyze"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
