"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db, storage } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  Upload, Search, Eye, Paperclip, CheckCircle2, Settings, MoreVertical, 
  Trash2, Edit3, Shield, Globe, Lock, FileText, Check, Loader2, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrowseTemplatesModal } from "@/components/docs/BrowseTemplatesModal";

interface GeneralDoc {
  id: string;
  title: string;
  category: string;
  fileUrl?: string;
  fileName?: string;
  content?: string;
  visibilityScope: "all" | "dept" | "role";
  requiresAck: boolean;
  acknowledgements?: Record<string, { timestamp: any; userName: string }>;
  createdAt: any;
}

interface UploadingCard {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

export default function CompanyPoliciesPage() {
  const { userData } = useAuth();
  const orgId = userData?.ownedOrgId || userData?.orgId;

  const [docs, setDocs] = useState<GeneralDoc[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCards, setUploadingCards] = useState<UploadingCard[]>([]);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Policy State
  const [editingDoc, setEditingDoc] = useState<GeneralDoc | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Company Policy");
  const [editScope, setEditScope] = useState<"all" | "dept" | "role">("all");
  const [editReqAck, setEditReqAck] = useState(true);

  // View Acknowledgements Modal
  const [selectedDocForAck, setSelectedDocForAck] = useState<GeneralDoc | null>(null);

  // View PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>("");

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, "organizations", orgId, "general_docs"));
    const unsub = onSnapshot(q, (snap) => {
      const data: GeneralDoc[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as GeneralDoc));
      setDocs(data);
    });
    return () => unsub();
  }, [orgId]);

  // Direct Upload Handler (Bulk or Single)
  const handleFileUpload = async (files: File[]) => {
    const validPdfs = files.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (validPdfs.length === 0) {
      toast.error("Please drop or select valid PDF files.");
      return;
    }

    for (const file of validPdfs) {
      const tempId = Math.random().toString(36).substring(2, 9);
      const cleanName = file.name.replace(/\.pdf$/i, "").replace(/_/g, " ");

      // Add temporary uploading card
      setUploadingCards((prev) => [
        ...prev,
        { id: tempId, name: file.name, progress: 5, status: "uploading" },
      ]);

      try {
        const storageFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const storagePath = `organizations/${orgId}/docs/${storageFileName}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadingCards((prev) =>
              prev.map((c) => (c.id === tempId ? { ...c, progress: Math.max(5, pct) } : c))
            );
          },
          (error) => {
            console.error("Storage upload error:", error);
            toast.error(`Upload failed for ${file.name}`);
            setUploadingCards((prev) => prev.filter((c) => c.id !== tempId));
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Save to Firestore
            await addDoc(collection(db, "organizations", orgId!, "general_docs"), {
              title: cleanName,
              category: "Company Policy",
              visibilityScope: "all",
              requiresAck: true,
              content: `Policy document: ${file.name}`,
              fileName: file.name,
              fileUrl: downloadUrl,
              acknowledgements: {},
              createdAt: serverTimestamp(),
            });

            // Remove uploading card once saved
            setUploadingCards((prev) => prev.filter((c) => c.id !== tempId));
            toast.success(`Published policy: "${cleanName}"`);
          }
        );
      } catch (err: any) {
        console.error(err);
        setUploadingCards((prev) => prev.filter((c) => c.id !== tempId));
      }
    }
  };

  // Toggle Visibility Scope directly on Card
  const toggleDocVisibility = async (docId: string, currentScope: string) => {
    const scopes: Array<"all" | "dept" | "role"> = ["all", "dept", "role"];
    const nextIndex = (scopes.indexOf(currentScope as any) + 1) % scopes.length;
    const nextScope = scopes[nextIndex];

    try {
      await updateDoc(doc(db, "organizations", orgId!, "general_docs", docId), {
        visibilityScope: nextScope,
      });
      toast.success(`Visibility set to ${nextScope.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Failed to update visibility.");
    }
  };

  // Toggle Requires Ack directly on Card
  const toggleDocReqAck = async (docId: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, "organizations", orgId!, "general_docs", docId), {
        requiresAck: !currentVal,
      });
      toast.success(!currentVal ? "Tick Acknowledgment Required" : "Acknowledgment Optional");
    } catch (err: any) {
      toast.error("Failed to update requirement.");
    }
  };

  // Save Edit Changes
  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    try {
      await updateDoc(doc(db, "organizations", orgId!, "general_docs", editingDoc.id), {
        title: editTitle,
        category: editCategory,
        visibilityScope: editScope,
        requiresAck: editReqAck,
      });
      toast.success("Policy details saved.");
      setEditingDoc(null);
    } catch (err: any) {
      toast.error("Failed to save policy: " + err.message);
    }
  };

  // Delete Policy
  const handleDeleteDoc = async (docId: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to delete policy "${docTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, "organizations", orgId!, "general_docs", docId));
      toast.success("Policy deleted.");
    } catch (err: any) {
      toast.error("Failed to delete policy.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-background/50 custom-scrollbar">
      {/* Top Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black font-poppins tracking-tight uppercase">
            Company Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop PDF files to publish company policies and handbooks.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={() => setIsBrowseModalOpen(true)}
            variant="outline"
            className="rounded-xl text-xs font-bold gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Sparkles className="size-3.5" /> Browse Policy Templates
          </Button>

          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search policies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* SQUARED CARD GRID VIEW WITH DIRECT UPLOAD TILE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* TILE 1: DIRECT UPLOAD SQUARE TILE */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) handleFileUpload(Array.from(e.dataTransfer.files));
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "aspect-square rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group",
            isDragging
              ? "border-primary bg-primary/10 shadow-xl scale-[1.02]"
              : "border-border/80 hover:border-primary bg-card/60 hover:bg-card shadow-sm"
          )}
        >
          <input 
            type="file" 
            accept="application/pdf,.pdf" 
            multiple 
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
            className="hidden"
          />

          <div className="size-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center transition-transform group-hover:scale-110 mb-3">
            <Upload className="size-7" />
          </div>

          <h4 className="font-extrabold text-sm font-poppins">Upload Policy PDF</h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">
            Click or drag & drop single or bulk PDF files here
          </p>
          <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            + Add PDF
          </span>
        </div>

        {/* TEMPORARY UPLOADING CARDS WITH REALTIME PROGRESS BARS */}
        {uploadingCards.map((card) => (
          <Card key={card.id} className="aspect-square rounded-2xl border-border bg-card p-5 flex flex-col justify-between shadow-sm animate-pulse">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Uploading...
                </span>
              </div>
              <h3 className="font-bold text-sm truncate mt-2">{card.name}</h3>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Saving to Storage</span>
                <span>{card.progress}%</span>
              </div>
            </div>
          </Card>
        ))}

        {/* PUBLISHED POLICY SQUARED CARDS */}
        {docs.filter((d) => d.title.toLowerCase().includes(searchTerm.toLowerCase())).map((docItem) => {
          const ackCount = Object.keys(docItem.acknowledgements || {}).length;

          return (
            <Card key={docItem.id} className="aspect-square rounded-2xl border-border bg-card p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm group">
              {/* Header Info & Settings Dropdown */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-secondary text-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {docItem.category || "General"}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 rounded-lg hover:bg-secondary">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl text-xs font-semibold">
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingDoc(docItem);
                          setEditTitle(docItem.title);
                          setEditCategory(docItem.category || "Company Policy");
                          setEditScope(docItem.visibilityScope || "all");
                          setEditReqAck(docItem.requiresAck);
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Edit3 className="size-3.5 text-primary" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSelectedDocForAck(docItem)}
                        className="gap-2 cursor-pointer"
                      >
                        <Eye className="size-3.5 text-emerald-500" /> View Log ({ackCount})
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteDoc(docItem.id, docItem.title)}
                        className="gap-2 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" /> Delete Policy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-extrabold text-base line-clamp-2 mt-1 group-hover:text-primary transition-colors">
                  {docItem.title}
                </h3>

                {docItem.fileName && (
                  <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium truncate">
                    <Paperclip className="size-3 text-primary shrink-0" />
                    <span className="truncate">{docItem.fileName}</span>
                  </div>
                )}
              </div>

              {/* Controls & Actions inside Card */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                {/* Toggles Row */}
                <div className="flex items-center justify-between text-xs gap-2">
                  {/* Scope Button */}
                  <button 
                    onClick={() => toggleDocVisibility(docItem.id, docItem.visibilityScope || "all")}
                    title="Click to cycle visibility (All / Dept / Role)"
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 px-2 py-1 rounded-md transition-colors"
                  >
                    <Globe className="size-3 text-primary" />
                    {docItem.visibilityScope || "All Org"}
                  </button>

                  {/* Required Tick Switch */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground">Tick Req</span>
                    <Switch 
                      checked={docItem.requiresAck} 
                      onCheckedChange={() => toggleDocReqAck(docItem.id, docItem.requiresAck)}
                      className="scale-75"
                    />
                  </div>
                </div>

                {/* View PDF Button */}
                <Button 
                  onClick={() => {
                    if (docItem.fileUrl) {
                      setPreviewPdfUrl(docItem.fileUrl);
                      setPreviewPdfTitle(docItem.title);
                    } else {
                      toast.info("No PDF attached to this policy.");
                    }
                  }}
                  className="w-full rounded-xl text-xs font-bold gap-1.5 h-8 bg-secondary hover:bg-secondary/80 text-foreground"
                >
                  <Eye className="size-3.5 text-primary" /> View Document
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL 1: EDIT POLICY MODAL */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins font-black uppercase text-lg">Edit Policy Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold">Policy Title</Label>
              <Input 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company Policy">Company Policy</SelectItem>
                  <SelectItem value="IT & Security">IT & Security</SelectItem>
                  <SelectItem value="HR & Benefits">HR & Benefits</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border p-3 rounded-xl">
              <div>
                <Label className="text-xs font-bold">Require Tick Acknowledgement</Label>
                <p className="text-[10px] text-muted-foreground">Staff confirm reading with a check tick.</p>
              </div>
              <Switch checked={editReqAck} onCheckedChange={setEditReqAck} />
            </div>
            <Button onClick={handleSaveEdit} className="w-full rounded-xl font-bold">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ACKNOWLEDGEMENTS LOG MODAL */}
      <Dialog open={!!selectedDocForAck} onOpenChange={() => setSelectedDocForAck(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins font-black uppercase text-lg">
              Staff Acknowledgements ({Object.keys(selectedDocForAck?.acknowledgements || {}).length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-60 overflow-y-auto">
            {Object.entries(selectedDocForAck?.acknowledgements || {}).map(([uid, data]: any) => (
              <div key={uid} className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between text-xs font-medium">
                <div>
                  <div className="font-bold">{data.userName}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(data.timestamp).toLocaleString()}</div>
                </div>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
            ))}
            {Object.keys(selectedDocForAck?.acknowledgements || {}).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No staff acknowledgements logged yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: PDF PREVIEW MODAL */}
      <Dialog open={!!previewPdfUrl} onOpenChange={() => setPreviewPdfUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh] rounded-2xl p-6 flex flex-col">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="font-poppins font-black uppercase text-base flex items-center gap-2">
              <FileText className="size-4 text-primary" /> {previewPdfTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full mt-4 rounded-xl overflow-hidden bg-secondary">
            {previewPdfUrl && (
              <iframe 
                src={previewPdfUrl} 
                className="w-full h-full border-0" 
                title={previewPdfTitle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* BROWSE POLICY TEMPLATE LIBRARY MODAL */}
      <BrowseTemplatesModal 
        isOpen={isBrowseModalOpen} 
        onOpenChange={setIsBrowseModalOpen} 
        orgId={orgId || ""} 
      />
    </div>
  );
}
