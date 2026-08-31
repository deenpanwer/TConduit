"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db, storage } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, where, doc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  Plus, Search, Layers, Users, Paperclip, Upload, Eye, CheckCircle2, 
  ChevronDown, ChevronUp, Edit3, Trash2, Check, AlertCircle, FileText, Info, Loader2, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { seedSamplePacket } from "@/lib/docs-templates";

interface PacketDocument {
  id: string;
  title: string;
  fileUrl?: string;
  fileName?: string;
  content?: string;
  requiresAck: boolean;
}

interface DocPacket {
  id: string;
  title: string;
  description: string;
  assignScope: "all" | "selected";
  assignedUserIds?: string[];
  requireAllDocsApproval: boolean;
  documents: PacketDocument[];
  createdAt: any;
}

export default function DocumentPacketsPage() {
  const { userData } = useAuth();
  const orgId = userData?.ownedOrgId || userData?.orgId;

  const [packets, setPackets] = useState<DocPacket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgStaff, setOrgStaff] = useState<any[]>([]);

  // Expanded Collapsible Packet Card IDs
  const [expandedPacketIds, setExpandedPacketIds] = useState<Record<string, boolean>>({});

  // Wide Create Packet Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [packetTitle, setPacketTitle] = useState("");
  const [packetDesc, setPacketDesc] = useState("");
  const [assignScope, setAssignScope] = useState<"all" | "selected">("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [requireAllApproval, setRequireAllApproval] = useState(true); // Default ON

  // Edit Doc Modal State inside Packet
  const [editingDocInfo, setEditingDocInfo] = useState<{ packetId: string; doc: PacketDocument } | null>(null);
  const [editDocTitle, setEditDocTitle] = useState("");
  const [editDocReqAck, setEditDocReqAck] = useState(true);

  // PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>("");

  const [draggingPacketId, setDraggingPacketId] = useState<string | null>(null);
  const [uploadingPacketMap, setUploadingPacketMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!orgId) return;
    const q = query(collection(db, "organizations", orgId, "doc_packets"));
    const unsub = onSnapshot(q, (snap) => {
      const data: DocPacket[] = [];
      snap.forEach((d) => {
        const item = { id: d.id, ...d.data() } as DocPacket;
        data.push(item);
      });
      setPackets(data);

      // Expand all by default
      const expMap: Record<string, boolean> = {};
      data.forEach(p => expMap[p.id] = true);
      setExpandedPacketIds(prev => ({ ...expMap, ...prev }));
    });

    async function fetchUsers() {
      try {
        const uQ = query(collection(db, "users"), where("orgId", "==", orgId));
        const uSnap = await getDocs(uQ);
        const users: any[] = [];
        uSnap.forEach((u) => users.push({ id: u.id, ...u.data() }));
        setOrgStaff(users);
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    }
    fetchUsers();

    return () => unsub();
  }, [orgId]);

  // Wide Modal: Create Packet
  const handleCreatePacket = async () => {
    if (!packetTitle.trim()) {
      toast.error("Please enter a packet title.");
      return;
    }
    try {
      await addDoc(collection(db, "organizations", orgId!, "doc_packets"), {
        title: packetTitle,
        description: packetDesc,
        assignScope,
        assignedUserIds: assignScope === "selected" ? selectedUserIds : [],
        requireAllDocsApproval: requireAllApproval,
        documents: [], // initially empty, uploaded directly via tile
        createdAt: serverTimestamp(),
      });
      toast.success("Document Packet created!");
      setIsCreateModalOpen(false);
      setPacketTitle("");
      setPacketDesc("");
      setSelectedUserIds([]);
    } catch (err: any) {
      toast.error("Failed to create packet: " + err.message);
    }
  };

  // Uploading Files Map per packet: packetId -> Array<{ id: string; name: string; progress: number; status: "uploading" | "complete" | "error" }>
  const [uploadingFilesMap, setUploadingFilesMap] = useState<
    Record<string, Array<{ id: string; name: string; progress: number; status: "uploading" | "complete" | "error" }>>
  >({});

  // Direct In-Card PDF Upload (Bulk or Single) to Packet
  const handlePacketFileUpload = async (packet: DocPacket, files: File[]) => {
    const validPdfs = files.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (validPdfs.length === 0) {
      toast.error("Please drop or select valid PDF files.");
      return;
    }

    const fileItems = validPdfs.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      progress: 0,
      status: "uploading" as const,
    }));

    setUploadingFilesMap((prev) => ({
      ...prev,
      [packet.id]: [...(prev[packet.id] || []), ...fileItems],
    }));

    const newDocs: PacketDocument[] = [...(packet.documents || [])];

    for (let i = 0; i < validPdfs.length; i++) {
      const file = validPdfs[i];
      const itemInfo = fileItems[i];

      try {
        const docId = Math.random().toString(36).substring(2, 9);
        const docTitle = file.name.replace(/\.pdf$/i, "").replace(/_/g, " ");
        const storageFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const storagePath = `organizations/${orgId}/doc_packets/${packet.id}/${storageFileName}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadingFilesMap((prev) => ({
                ...prev,
                [packet.id]: (prev[packet.id] || []).map((item) =>
                  item.id === itemInfo.id ? { ...item, progress: pct } : item
                ),
              }));
            },
            (err) => {
              setUploadingFilesMap((prev) => ({
                ...prev,
                [packet.id]: (prev[packet.id] || []).map((item) =>
                  item.id === itemInfo.id ? { ...item, status: "error" } : item
                ),
              }));
              reject(err);
            },
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              newDocs.push({
                id: docId,
                title: docTitle,
                fileName: file.name,
                fileUrl: downloadUrl,
                requiresAck: packet.requireAllDocsApproval ?? true,
              });

              setUploadingFilesMap((prev) => ({
                ...prev,
                [packet.id]: (prev[packet.id] || []).map((item) =>
                  item.id === itemInfo.id ? { ...item, progress: 100, status: "complete" } : item
                ),
              }));
              resolve();
            }
          );
        });
      } catch (err) {
        console.error("Packet doc upload error:", err);
      }
    }

    // Save updated docs list to Firestore
    try {
      await updateDoc(doc(db, "organizations", orgId!, "doc_packets", packet.id), {
        documents: newDocs,
      });
      toast.success(`Attached ${validPdfs.length} document(s) to "${packet.title}"`);
    } catch (err: any) {
      toast.error("Failed to update packet documents.");
    } finally {
      // Clear completed upload items after short delay
      setTimeout(() => {
        setUploadingFilesMap((prev) => {
          const next = { ...prev };
          delete next[packet.id];
          return next;
        });
      }, 1500);
    }
  };

  // Toggle Require Ack for specific document inside Packet
  const togglePacketDocAck = async (packet: DocPacket, docId: string, currentVal: boolean) => {
    const updatedDocs = packet.documents.map((d) =>
      d.id === docId ? { ...d, requiresAck: !currentVal } : d
    );
    try {
      await updateDoc(doc(db, "organizations", orgId!, "doc_packets", packet.id), {
        documents: updatedDocs,
      });
      toast.success(!currentVal ? "Required for acknowledgment" : "Acknowledgment optional");
    } catch (err: any) {
      toast.error("Failed to update document requirement.");
    }
  };

  // Save Edit Document in Packet
  const handleSaveDocEdit = async () => {
    if (!editingDocInfo) return;
    const { packetId, doc: targetDoc } = editingDocInfo;
    const packet = packets.find((p) => p.id === packetId);
    if (!packet) return;

    const updatedDocs = packet.documents.map((d) =>
      d.id === targetDoc.id
        ? { ...d, title: editDocTitle, requiresAck: editDocReqAck }
        : d
    );

    try {
      await updateDoc(doc(db, "organizations", orgId!, "doc_packets", packetId), {
        documents: updatedDocs,
      });
      toast.success("Document updated.");
      setEditingDocInfo(null);
    } catch (err: any) {
      toast.error("Failed to update document.");
    }
  };

  // Delete Doc from Packet
  const handleDeletePacketDoc = async (packet: DocPacket, docId: string) => {
    const updatedDocs = packet.documents.filter((d) => d.id !== docId);
    try {
      await updateDoc(doc(db, "organizations", orgId!, "doc_packets", packet.id), {
        documents: updatedDocs,
      });
      toast.success("Document removed from packet.");
    } catch (err: any) {
      toast.error("Failed to remove document.");
    }
  };

  // Delete Entire Packet
  const handleDeletePacket = async (packetId: string, title: string) => {
    if (!confirm(`Delete packet "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, "organizations", orgId!, "doc_packets", packetId));
      toast.success("Packet deleted.");
    } catch (err: any) {
      toast.error("Failed to delete packet.");
    }
  };

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-background/50 custom-scrollbar">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-2xl font-black font-poppins tracking-tight uppercase">
              Document Packets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bundle onboarding policies and approvals into assigned packets.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search packets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl h-9 text-xs"
            />
          </div>
        </div>

        {/* LONG WIDE BUTTON AT TOP OF TABLE/CARDS */}
        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="w-full py-6 rounded-2xl font-black text-sm uppercase tracking-wider gap-3 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
        >
          <Plus className="size-5" />
          Create New Document Packet
        </Button>

        {/* PACKET CARDS LIST */}
        <div className="space-y-6">
          {packets.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((packet) => {
            const isExpanded = expandedPacketIds[packet.id] ?? true;
            const isUploading = uploadingPacketMap[packet.id] ?? false;

            return (
              <Card key={packet.id} className="rounded-2xl border-border bg-card overflow-hidden shadow-sm hover:border-primary/40 transition-all">
                {/* PACKET HEADER BAR */}
                <div className="p-5 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black font-poppins">{packet.title}</h3>
                      {packet.assignScope === "all" ? (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          All Staff
                        </span>
                      ) : (
                        <span className="bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          {packet.assignedUserIds?.length || 0} Staff Selected
                        </span>
                      )}

                      {packet.requireAllDocsApproval && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          All Approval Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{packet.description || "Onboarding document package."}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedPacketIds(prev => ({ ...prev, [packet.id]: !isExpanded }))}
                      className="rounded-xl text-xs font-bold gap-1.5"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      {isExpanded ? "Collapse" : "Expand"} ({packet.documents?.length || 0})
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeletePacket(packet.id, packet.title)}
                      className="size-8 rounded-xl hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* EXPANDABLE CONTENT BODY */}
                {isExpanded && (
                  <CardContent className="p-6 space-y-6 bg-secondary/10">
                    
                    {/* IN-CARD DIRECT SQUARE UPLOAD TILE */}
                    <PacketSquareUploadTile 
                      packet={packet} 
                      uploadingFiles={uploadingFilesMap[packet.id] || []}
                      onUpload={(files) => handlePacketFileUpload(packet, files)} 
                    />

                    {/* COLLAPSIBLE VERTICAL DOCUMENT LIST */}
                    {packet.documents && packet.documents.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Attached Documents ({packet.documents.length})
                        </h4>

                        <div className="divide-y divide-border/60 bg-card rounded-2xl border border-border overflow-hidden">
                          {packet.documents.map((docItem, idx) => (
                            <div key={docItem.id || idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-secondary/40 transition-colors">
                              {/* Left Info */}
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="size-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs truncate">{docItem.title}</h5>
                                  {docItem.fileName && (
                                    <p className="text-[10px] text-muted-foreground truncate">{docItem.fileName}</p>
                                  )}
                                </div>
                              </div>

                              {/* Front Actions */}
                              <div className="flex items-center gap-3 shrink-0">
                                {/* Eye Icon Button (View PDF) */}
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => {
                                    if (docItem.fileUrl) {
                                      setPreviewPdfUrl(docItem.fileUrl);
                                      setPreviewPdfTitle(docItem.title);
                                    } else {
                                      toast.info("No PDF attached.");
                                    }
                                  }}
                                  className="rounded-xl text-xs font-bold gap-1 h-8"
                                >
                                  <Eye className="size-3.5 text-primary" /> View
                                </Button>

                                {/* Required Check Tick Toggle with Hover Tooltip */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 bg-secondary/80 px-2.5 py-1 rounded-xl">
                                      <span className="text-[10px] font-bold text-muted-foreground">Required</span>
                                      <Switch 
                                        checked={docItem.requiresAck} 
                                        onCheckedChange={() => togglePacketDocAck(packet, docItem.id, docItem.requiresAck)}
                                        className="scale-75"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="rounded-xl text-xs max-w-xs font-semibold">
                                    Specially required to be acknowledged by employee before completing packet.
                                  </TooltipContent>
                                </Tooltip>

                                {/* Edit Button */}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingDocInfo({ packetId: packet.id, doc: docItem });
                                    setEditDocTitle(docItem.title);
                                    setEditDocReqAck(docItem.requiresAck);
                                  }}
                                  className="size-8 rounded-lg hover:bg-secondary"
                                >
                                  <Edit3 className="size-3.5 text-muted-foreground" />
                                </Button>

                                {/* Delete Doc Button */}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeletePacketDoc(packet, docItem.id)}
                                  className="size-8 rounded-lg hover:bg-rose-500/10 text-rose-500"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {packets.length === 0 && (
            <div className="p-12 text-center border border-dashed rounded-2xl bg-card/40 space-y-3">
              <h4 className="font-bold text-sm">No Document Packets Created</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Click the wide button above to create your first document packet.
              </p>
            </div>
          )}
        </div>

        {/* WIDE MODAL: CREATE PACKET */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-poppins font-black uppercase text-xl">Create Document Packet</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div>
                <Label className="text-xs font-bold">Packet Title</Label>
                <Input 
                  placeholder="e.g. Employee Onboarding & Initial Approvals 2026" 
                  value={packetTitle} 
                  onChange={(e) => setPacketTitle(e.target.value)}
                  className="mt-1 rounded-xl font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Description / Purpose</Label>
                <Input 
                  placeholder="e.g. First time approval forms and employee handbook." 
                  value={packetDesc} 
                  onChange={(e) => setPacketDesc(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>

              {/* Assignment Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold">Assign Scope</Label>
                  <Select value={assignScope} onValueChange={(val: any) => setAssignScope(val)}>
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Auto-Assign to All Org Staff</SelectItem>
                      <SelectItem value="selected">Select Specific Employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assignScope === "selected" && (
                  <div>
                    <Label className="text-xs font-bold">Select Staff ({selectedUserIds.length})</Label>
                    <div className="mt-1 max-h-32 overflow-y-auto border rounded-xl p-2 space-y-1 bg-secondary/30">
                      {orgStaff.map((u) => (
                        <label key={u.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1 rounded hover:bg-secondary">
                          <input 
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                              else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                            }}
                            className="rounded"
                          />
                          <span>{u.name || u.displayName || u.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Require All Docs Approval Toggle (DEFAULT ON) */}
              <div className="flex items-center justify-between border p-4 rounded-xl bg-secondary/30">
                <div>
                  <Label className="text-xs font-black uppercase tracking-wider text-primary">
                    Require All Docs Approval
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Automatically sets all added documents to required tick acknowledgment.
                  </p>
                </div>
                <Switch checked={requireAllApproval} onCheckedChange={setRequireAllApproval} />
              </div>

              <Button onClick={handleCreatePacket} className="w-full py-5 rounded-xl font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                Save Packet Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL: EDIT PACKET DOCUMENT */}
        <Dialog open={!!editingDocInfo} onOpenChange={() => setEditingDocInfo(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-poppins font-black uppercase text-lg">Edit Document Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold">Document Title</Label>
                <Input 
                  value={editDocTitle} 
                  onChange={(e) => setEditDocTitle(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between border p-3 rounded-xl">
                <div>
                  <Label className="text-xs font-bold">Require Tick Acknowledgment</Label>
                  <p className="text-[10px] text-muted-foreground">Employee must tick to complete step.</p>
                </div>
                <Switch checked={editDocReqAck} onCheckedChange={setEditDocReqAck} />
              </div>

              <Button onClick={handleSaveDocEdit} className="w-full rounded-xl font-bold">
                Save Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL: PDF PREVIEW */}
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
      </div>
    </TooltipProvider>
  );
}

// IN-CARD SQUARE UPLOAD TILE COMPONENT FOR PACKETS
function PacketSquareUploadTile({ 
  packet, 
  uploadingFiles, 
  onUpload 
}: { 
  packet: DocPacket; 
  uploadingFiles: Array<{ id: string; name: string; progress: number; status: "uploading" | "complete" | "error" }>; 
  onUpload: (files: File[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) onUpload(Array.from(e.dataTransfer.files));
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
          isDragging
            ? "border-primary bg-primary/10 shadow-lg scale-[1.01]"
            : "border-border/80 hover:border-primary bg-card hover:bg-secondary/30"
        )}
      >
        <input 
          type="file" 
          accept="application/pdf,.pdf" 
          multiple 
          ref={inputRef}
          onChange={(e) => onUpload(Array.from(e.target.files || []))}
          className="hidden"
        />

        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Upload className="size-6" />
        </div>
        <div>
          <h5 className="font-extrabold text-xs font-poppins">Add PDF Documents to Packet</h5>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Click or drag & drop single or bulk PDF files here to attach to "{packet.title}"
          </p>
        </div>
      </div>

      {/* INDIVIDUAL PROGRESS CARDS PER FILE */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 pt-2">
          {uploadingFiles.map((fileItem) => (
            <div key={fileItem.id} className="p-3.5 rounded-xl border border-border bg-card space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="font-bold truncate text-foreground">{fileItem.name}</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                  {fileItem.status === "complete" ? (
                    <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Complete
                    </span>
                  ) : fileItem.status === "error" ? (
                    <span className="text-rose-500">Error</span>
                  ) : (
                    <span className="text-primary font-bold">Uploading ({fileItem.progress}%)</span>
                  )}
                </span>
              </div>

              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    fileItem.status === "complete" ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${fileItem.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
