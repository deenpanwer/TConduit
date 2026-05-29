"use client";

import React, { useState, useRef } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, File, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium: boolean;
  onUpload: (file: File, onProgress: (progress: number) => void) => Promise<string>;
  onUploadSuccess: (url: string, file: File) => void;
}

export function UploadModal({ 
  isOpen, 
  onOpenChange, 
  isPremium, 
  onUpload, 
  onUploadSuccess 
}: UploadModalProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Freemium sizing limits
  const maxLimitMB = isPremium ? 250 : 10;
  const maxLimitBytes = maxLimitMB * 1024 * 1024;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > maxLimitBytes) {
      const errMsg = `File size exceeds the limit of ${maxLimitMB}MB. ${
        !isPremium ? "Upgrade to premium for up to 250MB per file!" : ""
      }`;
      setError(errMsg);
      toast({
        title: "File Size Exceeded",
        description: errMsg,
        variant: "destructive",
      });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setStatus("idle");
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setUploadProgress(0);
    setError(null);

    try {
      const downloadURL = await onUpload(selectedFile, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setStatus("success");
      onUploadSuccess(downloadURL, selectedFile);
      setTimeout(() => {
        handleReset();
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      console.error("Upload failed in UploadModal:", err);
      setError(err.message || "Failed to upload file");
      setStatus("idle");
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    setError(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (status !== "uploading") {
        onOpenChange(open);
        if (!open) handleReset();
      }
    }}>
      <DialogContent className="sm:max-w-[440px] bg-card/60 backdrop-blur-2xl border border-border/40 shadow-2xl p-6 rounded-3xl gap-5 overflow-hidden select-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            Upload File
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-0.5">
            Drag and drop your attachment or browse local files.
          </DialogDescription>
        </DialogHeader>

        {/* Drag Zone Area */}
        <div className="space-y-4 my-1">
          {status === "idle" && !selectedFile && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300",
                dragActive 
                  ? "border-primary bg-primary/5 scale-98" 
                  : "border-border/30 hover:border-primary/50 hover:bg-secondary/20"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="p-3.5 rounded-2xl bg-secondary/40 text-muted-foreground transition-all group-hover:scale-105">
                <UploadCloud className="h-6.5 w-6.5 text-muted-foreground/60" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-foreground">Drag & drop files here</p>
                <p className="text-[10px] text-muted-foreground font-semibold">or click to browse local files</p>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-secondary text-[8.5px] font-semibold text-muted-foreground/80 uppercase tracking-wider mt-1">
                {isPremium ? "Premium (250MB limit)" : "Free (10MB limit)"}
              </div>
            </div>
          )}

          {/* Selected File Overview card */}
          {selectedFile && status !== "success" && (
            <div className="p-4 border border-border/20 rounded-2xl bg-secondary/15 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <File className="h-5 w-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold truncate leading-snug">{selectedFile.name}</p>
                  <p className="text-[9.5px] font-bold text-muted-foreground/75 mt-0.5 leading-none font-mono">
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
              {status !== "uploading" && (
                <button 
                  onClick={handleReset}
                  className="p-1 rounded-full hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
          )}

          {/* Progress bar loader */}
          {status === "uploading" && uploadProgress !== null && (
            <div className="space-y-2 p-1 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 rounded-full" />
            </div>
          )}

          {/* Success screen */}
          {status === "success" && (
            <div className="flex flex-col items-center justify-center p-6 gap-3 text-center animate-in zoom-in-95 duration-300">
              <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Upload Complete!</p>
                <p className="text-[10px] text-muted-foreground font-semibold">Shared attachment successfully.</p>
              </div>
            </div>
          )}

          {/* Sizing warning banner */}
          {error && (
            <div className="p-3 border border-destructive/20 bg-destructive/10 rounded-2xl flex gap-3 text-destructive animate-in slide-in-from-bottom-2 duration-300">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold">Size Limit Violation</p>
                <p className="text-[10px] leading-relaxed font-semibold opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {status !== "success" && (
          <DialogFooter className="sm:justify-end gap-2 border-t border-border/20 pt-4 shrink-0">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold"
              disabled={status === "uploading"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || status === "uploading"}
              className="rounded-xl text-xs font-bold px-6 shadow-lg shadow-primary/10 transition-transform active:scale-95"
            >
              {status === "uploading" ? "Uploading..." : "Upload & Send"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
