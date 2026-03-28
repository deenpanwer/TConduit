"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCRM, CRMEntity, FieldConfig } from "@/hooks/use-crm";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Calendar, DollarSign, Mail, Phone, 
  Building2, Clock, History, Edit3, Trash2, 
  ArrowLeft, AlertCircle, User, StickyNote, 
  PhoneCall, ArrowRightLeft, Globe, MapPin, Briefcase,
  FileText, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { InlineEdit } from "@/components/dashboard/crm/InlineEdit";
import { ActivityTimeline } from "@/components/dashboard/crm/ActivityTimeline";
import { LogCallForm } from "@/components/dashboard/crm/forms/LogCallForm";
import { AddNoteForm } from "@/components/dashboard/crm/forms/AddNoteForm";
import { NotePreviewModal } from "@/components/dashboard/crm/NotePreviewModal";
import { CallPreviewModal } from "@/components/dashboard/crm/CallPreviewModal";
import { cn } from "@/lib/utils";

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const { leads, notes, calls, updateEntityField, addActivity, deleteEntity, config, addEntity, loading } = useCRM();
  const [activeModal, setActiveModal] = useState<'call' | 'note' | 'convert' | null>(null);
  const [selectedNote, setSelectedNote] = useState<CRMEntity | null>(null);
  const [selectedCall, setSelectedCall] = useState<CRMEntity | null>(null);
  const [isNotePreviewOpen, setIsNotePreviewOpen] = useState(false);
  const [isCallPreviewOpen, setIsCallPreviewOpen] = useState(false);

  const lead = useMemo(() => leads.find(l => l.id === id), [leads, id]);
  const linkedNotes = useMemo(() => notes.filter(n => n.data.entityId === id), [notes, id]);
  const linkedCalls = useMemo(() => calls.filter(c => c.data.related_to === lead?.name), [calls, lead?.name]);
  const module = config.modules.leads;

  // If loading is true and lead is not yet found, show a loading indicator
  if (loading && !lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center mb-4 animate-pulse">
          <Briefcase className="text-muted-foreground" size={32} /> {/* You can use any relevant icon here */}
        </div>
        <h2 className="text-xl font-bold">Loading Lead...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we fetch the lead details.</p>
      </div>
    );
  }

  // If loading is false AND lead is not found, then show the 404 message
  if (!lead) { 
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center mb-4">
          <AlertCircle className="text-muted-foreground" size={32} />
        </div>
        <h2 className="text-xl font-bold">Lead not found</h2>
        <p className="text-muted-foreground text-sm">
          The lead you are looking for could not be found or has been deleted.
        </p>
        <Button variant="outline" className="mt-6 rounded-xl" onClick={() => router.push("/dashboard/crm/leads")}>
          <ArrowLeft size={16} className="mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Soft-delete this lead?")) {
      await deleteEntity(lead.id);
      toast.success("Lead soft-deleted.");
      router.push("/dashboard/crm/leads");
    }
  };

  const handleLogCall = async (data: any) => {
    // 1. Create the Call Entity
    await addEntity('call', data);

    // 2. Add to lead's activity history
    await addActivity(lead.id, {
      type: 'Call',
      content: `Call Logged: ${data.type} interaction. Status: ${data.status}. Duration: ${data.duration}s.`,
      details: data
    });
    toast.success("Call logged and linked.");
    setActiveModal(null);
  };

  const handleAddNote = async (data: any) => {
    const noteId = await addEntity('note', {
      name: `Note for ${lead.name}`, // Set a default name or use lead's name
      content: data.content,
      relatedTo: lead.name,      // Associate note with lead name
      entityId: lead.id,        // Associate note with lead ID
      entityType: 'lead'        // Specify the entity type
    });
    
    if (noteId) {
      await addActivity(lead.id, { 
        type: 'Note', 
        content: `Added a business note: "${data.content.substring(0, 50)}..."` 
      });
      toast.success("Note saved and linked.");
      setActiveModal(null);
    } else {
      toast.error("Failed to save note.");
    }
  };

  const statusField = module.fields.find(f => f.key === 'status');
  const currentStatus = statusField?.options?.find(o => o.value === lead.data.status);

  return (
    <div className="flex flex-col h-full bg-background/50">
      <NotePreviewModal 
        note={selectedNote} 
        isOpen={isNotePreviewOpen} 
        onOpenChange={setIsNotePreviewOpen} 
      />
      <CallPreviewModal
        call={selectedCall}
        isOpen={isCallPreviewOpen}
        onOpenChange={setIsCallPreviewOpen}
      />

      {/* Lead Header */}
      <div className="p-6 border-b border-border/40 bg-card/30 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="rounded-lg text-xs font-bold uppercase tracking-widest" onClick={() => router.push("/dashboard/crm/leads")}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModal('note')} className="rounded-xl border-border/40 h-9 font-bold text-[10px] uppercase px-4">
              <StickyNote className="mr-2 h-3.5 w-3.5" /> Add Note
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveModal('call')} className="rounded-xl border-border/40 h-9 font-bold text-[10px] uppercase px-4">
              <PhoneCall className="mr-2 h-3.5 w-3.5" /> Log Call
            </Button>
            {lead.data.status !== 'won' && (
              <Button variant="default" size="sm" onClick={() => setActiveModal('convert')} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-9 font-bold text-[10px] uppercase px-4 shadow-lg shadow-blue-500/20">
                <ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Convert to Deal
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-red-500 hover:bg-red-500/10" onClick={handleDelete}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20 shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <InlineEdit value={lead.name} onSave={(val) => updateEntityField(lead.id, 'name', val)} className="text-3xl font-bold tracking-tight mb-1 h-auto p-0 hover:bg-transparent" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase size={14} className="shrink-0" />
                  <InlineEdit value={lead.data.company || "Individual"} onSave={(val) => updateEntityField(lead.id, 'company', val)} className="text-sm font-medium h-auto p-0 hover:bg-transparent" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-blue-500/20")} variant="outline">
                {currentStatus?.label || lead.data.status}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {lead.data.priority} Priority
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lead Value</p>
            <h2 className="text-3xl font-bold text-blue-500">${Number(lead.data.value || 0).toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-secondary/30 p-1 rounded-xl border border-border/40 w-full justify-start mb-6 backdrop-blur-sm">
                <TabsTrigger value="details" className="rounded-lg text-xs font-bold px-6">Details</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-lg text-xs font-bold px-6">Timeline</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-lg text-xs font-bold px-6">Notes ({linkedNotes.length})</TabsTrigger>
                <TabsTrigger value="calls" className="rounded-lg text-xs font-bold px-6">Calls ({linkedCalls.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Organization Section */}
                  <Card className="border-border/40 bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization</p>
                        <InlineEdit 
                          value={lead.data.company || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'company', val)} 
                          placeholder="Organization name"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Industry</p>
                        <InlineEdit 
                          value={lead.data.industry || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'industry', val)} 
                          placeholder="Select or type industry"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website</p>
                        <InlineEdit 
                          value={lead.data.website || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'website', val)} 
                          placeholder="https://..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Job Details Section */}
                  <Card className="border-border/40 bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Job Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Job Title</p>
                        <InlineEdit 
                          value={lead.data.jobTitle || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'jobTitle', val)} 
                          placeholder="e.g. CEO"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Source Section */}
                  <Card className="border-border/40 bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source</p>
                        <InlineEdit 
                          value={lead.data.source || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'source', val)} 
                          placeholder="Select or type source"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Person Section */}
                  <Card className="border-border/40 bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Person</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Salutation</p>
                        <InlineEdit 
                          value={lead.data.salutation || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'salutation', val)} 
                          placeholder="Mr/Ms/Dr..."
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
                        <InlineEdit 
                          value={lead.data.email || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'email', val)} 
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">First Name</p>
                        <InlineEdit 
                          value={lead.data.firstName || ''} 
                          onSave={(val) => {
                            updateEntityField(lead.id, 'firstName', val);
                            const fullName = `${val} ${lead.data.lastName || ''}`.trim();
                            updateEntityField(lead.id, 'name', fullName);
                          }} 
                          placeholder="First Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Name</p>
                        <InlineEdit 
                          value={lead.data.lastName || ''} 
                          onSave={(val) => {
                            updateEntityField(lead.id, 'lastName', val);
                            const fullName = `${lead.data.firstName || ''} ${val}`.trim();
                            updateEntityField(lead.id, 'name', fullName);
                          }} 
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile No.</p>
                        <InlineEdit 
                          value={lead.data.mobile || ''} 
                          onSave={(val) => updateEntityField(lead.id, 'mobile', val)} 
                          placeholder="Mobile Number"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ActivityTimeline history={lead.history} />
              </TabsContent>

              <TabsContent value="notes" className="mt-0 space-y-4">
                {linkedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/20 rounded-3xl text-center space-y-4">
                    <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold">No linked notes</h3>
                      <p className="text-xs text-muted-foreground">Add a note to keep track of specific lead details.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveModal('note')} className="rounded-xl text-[10px] font-bold uppercase tracking-widest">
                      Create First Note
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {linkedNotes.map(note => (
                      <Card 
                        key={note.id} 
                        onClick={() => { setSelectedNote(note); setIsNotePreviewOpen(true); }}
                        className="border-border/40 bg-card/50 hover:bg-card hover:border-blue-500/30 transition-all cursor-pointer rounded-2xl group"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm truncate group-hover:text-blue-500 transition-colors">{note.name}</h4>
                            <Clock size={12} className="text-muted-foreground shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                            {note.data.content}
                          </p>
                          <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Preview <ExternalLink size={10} /></span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calls" className="mt-0 space-y-4">
                {linkedCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/20 rounded-3xl text-center space-y-4">
                    <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                      <PhoneCall size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold">No call history</h3>
                      <p className="text-xs text-muted-foreground">Log your interactions to see a history of calls here.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveModal('call')} className="rounded-xl text-[10px] font-bold uppercase tracking-widest">
                      Log First Call
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {linkedCalls.map(call => (
                      <Card 
                        key={call.id} 
                        onClick={() => { setSelectedCall(call); setIsCallPreviewOpen(true); }}
                        className="border-border/40 bg-card/50 hover:bg-card hover:border-blue-500/30 transition-all cursor-pointer rounded-2xl group"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1 rounded-lg",
                                call.data.type === 'Incoming' ? "bg-green-500/10 text-green-500" : "bg-purple-500/10 text-purple-500"
                              )}>
                                <Phone size={10} />
                              </div>
                              <h4 className="font-bold text-sm truncate group-hover:text-blue-500 transition-colors">{call.data.summary || 'Call Log'}</h4>
                            </div>
                            <Clock size={12} className="text-muted-foreground shrink-0" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-[8px] font-black uppercase px-1.5 h-4 bg-secondary/50">
                              {call.data.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground">{call.data.duration}s</span>
                          </div>
                          <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span>{new Date(call.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Preview <ExternalLink size={10} /></span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="border-border/40 bg-card/50 overflow-hidden shadow-xl shadow-blue-500/5">
              <div className="h-1 w-full bg-blue-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pipeline Meta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><Clock size={12} /> Created</div>
                  <span className="text-xs font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><History size={12} /> Updated</div>
                  <span className="text-xs font-bold">{new Date(lead.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[550px] border-border/40 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {activeModal === 'call' && 'Log Interaction'}
              {activeModal === 'note' && 'Add Private Note'}
              {activeModal === 'convert' && 'Lead Conversion'}
            </DialogTitle>
          </DialogHeader>
          {activeModal === 'call' && (
            <LogCallForm 
              initialData={{ 
                related_to: lead.name, 
                from: userData?.name || user?.displayName || "You",
                to: String(lead.data.phone || ""),
                type: "Outgoing",
                status: "initiated"
              }} 
              onSubmit={handleLogCall} 
              onCancel={() => setActiveModal(null)} 
            />
          )}
          {activeModal === 'note' && <AddNoteForm onSubmit={handleAddNote} onCancel={() => setActiveModal(null)} />}
          {activeModal === 'convert' && (
            <div className="py-6 text-center space-y-4">
              <div className="size-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto">
                <ArrowRightLeft className="text-blue-500" size={32} />
              </div>
              <h3 className="font-bold text-lg">Convert to Business Deal?</h3>
              <div className="flex gap-3 pt-4 justify-center">
                <Button variant="ghost" onClick={() => setActiveModal(null)} className="rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</Button>
                <Button onClick={async () => {
                  await updateEntityField(lead.id, 'status', 'won');
                  toast.success("Converted!");
                  setActiveModal(null);
                }} className="bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20">Convert Now</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
