"use client";

import React, { useState, useRef } from "react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  sizeMb: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  downloadUrl?: string;
  error?: string;
}

interface PdfBatchUploaderProps {
  orgId: string;
  category?: string;
  requiresAck?: boolean;
  onComplete?: () => void;
}

export function PdfBatchUploader({ orgId, category = "Company Policy", requiresAck = true, onComplete }: PdfBatchUploaderProps) {
  const [fileList, setFileList] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming files from file picker or drop zone
  const handleFiles = (incomingFiles: File[]) => {
    const validPdfs = incomingFiles.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    
    if (validPdfs.length === 0) {
      toast.error("Please select valid PDF files.");
      return;
    }

    const newItems: UploadFileItem[] = validPdfs.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      sizeMb: (file.size / (1024 * 1024)).toFixed(2),
      progress: 0,
      status: "pending",
    }));

    setFileList((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeItem = (id: string) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  // Start Batch Upload
  const startBatchUpload = async () => {
    if (fileList.length === 0) {
      toast.error("No files selected.");
      return;
    }

    setIsProcessing(true);

    for (let i = 0; i < fileList.length; i++) {
      const item = fileList[i];
      if (item.status === "complete") continue;

      // Update status to uploading
      setFileList((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "uploading", progress: 5 } : it))
      );

      try {
        const cleanFileName = item.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `organizations/${orgId}/docs/${Date.now()}_${cleanFileName}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, item.file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setFileList((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, progress: Math.max(5, pct) } : it))
              );
            },
            (error) => {
              console.error("Storage upload error:", error);
              setFileList((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, status: "error", error: error.message } : it))
              );
              reject(error);
            },
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              // Clean title
              const docTitle = item.name.replace(/\.pdf$/i, "").replace(/_/g, " ");

              // Create document in general_docs
              await addDoc(collection(db, "organizations", orgId, "general_docs"), {
                title: docTitle,
                category: category,
                visibilityScope: "all",
                requiresAck: requiresAck,
                content: `Policy document: ${item.name}`,
                fileName: item.name,
                fileUrl: downloadUrl,
                acknowledgements: {},
                createdAt: serverTimestamp(),
              });

              setFileList((prev) =>
                prev.map((it) =>
                  it.id === item.id ? { ...it, status: "complete", progress: 100, downloadUrl } : it
                )
              );
              resolve();
            }
          );
        });
      } catch (err: any) {
        console.error("Batch item error:", err);
      }
    }

    setIsProcessing(false);
    toast.success("Batch PDF upload completed!");
    if (onComplete) onComplete();
  };

  const hasPending = fileList.some((f) => f.status === "pending");
  const allComplete = fileList.length > 0 && fileList.every((f) => f.status === "complete");

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-secondary/40 bg-card"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(Array.from(e.target.files));
            }
          }}
        />

        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Upload className="size-6" />
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-sm font-poppins">Drop Multiple Policy PDFs Here</h4>
          <p className="text-xs text-muted-foreground">Or click to browse from your device. Supports bulk files.</p>
        </div>

        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
          PDF Only • Up to 25MB per file
        </span>
      </div>

      {/* Selected File Queue List */}
      {fileList.length > 0 && (
        <div className="space-y-2 border border-border rounded-xl p-3 bg-secondary/20 max-h-60 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-border/50 text-[11px] font-bold text-muted-foreground">
            <span>Selected Files ({fileList.length})</span>
            {!isProcessing && (
              <button
                type="button"
                onClick={() => setFileList([])}
                className="text-destructive hover:underline text-[10px]"
              >
                Clear All
              </button>
            )}
          </div>

          {fileList.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs gap-3"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="size-4 text-primary shrink-0" />
                <span className="font-bold truncate text-foreground">{item.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">({item.sizeMb} MB)</span>
              </div>

              {/* Status / Progress Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status === "uploading" && (
                  <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold">
                    <Loader2 className="size-3 animate-spin" />
                    <span>{item.progress}%</span>
                  </div>
                )}

                {item.status === "complete" && (
                  <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                    <CheckCircle2 className="size-3.5" /> Uploaded
                  </span>
                )}

                {item.status === "error" && (
                  <span className="flex items-center gap-1 text-destructive text-[10px] font-bold">
                    <AlertCircle className="size-3.5" /> Failed
                  </span>
                )}

                {item.status === "pending" && !isProcessing && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {fileList.length > 0 && !allComplete && (
        <Button
          type="button"
          disabled={isProcessing || !hasPending}
          onClick={startBatchUpload}
          className="w-full rounded-xl font-bold gap-2 text-xs h-10 bg-primary text-primary-foreground"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Uploading Batch Documents...
            </>
          ) : (
            <>
              <Upload className="size-4" /> Upload & Publish {fileList.filter((f) => f.status === "pending").length} Files to Organization
            </>
          )}
        </Button>
      )}
    </div>
  );
}
