"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCRMLeads } from "@/hooks/use-crm-leads";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Mail, 
  Building2, Clock, History, Trash2, 
  ArrowLeft, AlertCircle, User, StickyNote, 
  PhoneCall, ArrowRightLeft, Briefcase,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { InlineEdit } from "@/components/crm/shared/InlineEdit";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { cn } from "@/lib/utils";
import { CRMEntity } from "@/hooks/use-crm";

interface NoteModalState {
  mode: 'create' | 'edit' | 'preview';
  note: any | null;
  isOpen: boolean;
}

interface CallModalState {
    mode: 'create' | 'edit' | 'preview';
    call: any | null;
    isOpen: boolean;
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData } = useAuth();
  const { entities: leads, updateEntity, deleteEntity, config, loading } = useCRMLeads();
  const { addEntity: addNote } = useCRMNotes();
  const { addEntity: addCall } = useCRMCalls();

  const [noteModal, setNoteModal] = useState<NoteModalState>({ mode: 'create', note: null, isOpen: false });
  const [callModal, setCallModal] = useState<CallModalState>({ mode: 'create', call: null, isOpen: false });
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const lead = useMemo(() => leads.find(l => l.id === id), [leads, id]);

  const fromView = searchParams.get("from") || "list";
  const backPath = `/crm/leads?view=${fromView}`;

  const allActivities = lead?.history || [];
  const notes = allActivities.filter(a => a.type === 'Note');
  const calls = allActivities.filter(a => a.type === 'Call');

  const handleNoteSubmit = (noteData: { content: string }) => {
    if (!lead) return;
    addNote({ 
        name: `Note for ${lead.name}`,
        data: {
            content: noteData.content,
            relatedTo: lead.id 
        }
    });
    toast.success("Note added successfully!");
    setNoteModal({ mode: 'create', note: null, isOpen: false });
  };

  const handleCallSubmit = (callData: any) => {
    if (!lead) return;
    addCall({ 
        summary: callData.summary, 
        data: {
            ...callData,
            relatedTo: lead.id 
        }
    });
    toast.success("Call logged successfully!");
    setCallModal({ mode: 'create', call: null, isOpen: false });
  };

  if (loading && !lead) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (!lead) { 
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen">
        <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center mb-4"><AlertCircle className="text-muted-foreground" size={32} /></div>
        <h2 className="text-xl font-bold uppercase tracking-tighter">Lead not found</h2>
        <Button variant="outline" className="mt-6 rounded-xl font-bold text-xs uppercase tracking-widest" onClick={() => router.push(backPath)}>
          <ArrowLeft size={16} className="mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await deleteEntity(lead.id);
      router.push(backPath);
    }
  };

  const handleUpdateField = (key: string, value: any) => {
    updateEntity(lead.id, { [key]: value });
  };

  const statusField = config.fields.find(f => f.key === 'status');
  const currentStatus = statusField?.options?.find(o => o.value === lead.data.status);
  
  const initialCallData = { from: userData?.name || user?.displayName || "You", to: String(lead.data.mobile || ""), type: "Outgoing", status: "completed", summary: "", duration: 0, relatedTo: lead.id };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <NoteModal isOpen={noteModal.isOpen} onOpenChange={(isOpen) => setNoteModal({ ...noteModal, isOpen })} mode={noteModal.mode} note={noteModal.note} onSubmit={handleNoteSubmit} leads={[lead]} />
      <CallModal isOpen={callModal.isOpen} onOpenChange={(isOpen) => setCallModal({ ...callModal, isOpen })} mode={callModal.mode} call={callModal.call} onSubmit={handleCallSubmit} leads={[lead]} initialData={callModal.call} />
      
      <header className="p-6 border-b border-border/40 bg-card/30 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" className="rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground" onClick={() => router.push(backPath)}>
            <ChevronLeft size={16} className="mr-1" /> Back to Pipeline
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNoteModal({ mode: 'create', note: null, isOpen: true })} className="rounded-xl border-border/40 h-9 font-black text-[10px] uppercase px-4 shadow-sm"><StickyNote className="mr-2 h-3.5 w-3.5" /> Add Note</Button>
            <Button variant="outline" size="sm" onClick={() => setCallModal({ mode: 'create', call: initialCallData, isOpen: true })} className="rounded-xl border-border/40 h-9 font-black text-[10px] uppercase px-4 shadow-sm"><PhoneCall className="mr-2 h-3.5 w-3.5" /> Log Interaction</Button>
            {lead.data.status !== 'won' && <Button onClick={() => setIsConvertModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 font-black text-[10px] uppercase px-6 shadow-xl shadow-blue-500/20"><ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Launch Deal</Button>}
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-red-500 hover:bg-red-500/10" onClick={handleDelete}><Trash2 size={16} /></Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-4 flex-1">
            <div className="flex items-center gap-5">
              <div className="size-16 rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20 shrink-0 border-2 border-white/10">{lead.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <InlineEdit value={lead.name} onSave={(val) => updateEntity(lead.id, { name: val })} className="text-4xl font-black tracking-tighter mb-1 h-auto p-0 hover:bg-transparent bg-transparent border-none" />
                <div className="flex items-center gap-2 text-muted-foreground"><Briefcase size={14} className="shrink-0 text-blue-500" /><InlineEdit value={lead.data.company || "Individual"} onSave={(val) => handleUpdateField('company', val)} className="text-sm font-bold h-auto p-0 hover:bg-transparent bg-transparent border-none text-muted-foreground" /></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm")} variant="outline">{currentStatus?.label || lead.data.status}</Badge>
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary/50 border-none">{lead.data.priority} Priority</Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 bg-blue-500/[0.03] p-5 rounded-3xl border border-blue-500/10 shadow-inner min-w-[180px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estimated Value</p>
            <h2 className="text-4xl font-black text-blue-600 tracking-tighter">${Number(lead.data.value || 0).toLocaleString()}</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-secondary/20 p-1.5 rounded-2xl border border-border/40 w-full justify-start mb-8 backdrop-blur-sm shadow-inner max-w-fit"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="calls">Call Logs</TabsTrigger><TabsTrigger value="emails">Emails</TabsTrigger></TabsList>
              <TabsContent value="details" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <Card className="border-border/30 bg-card/40 backdrop-blur-md rounded-3xl shadow-xl">
                   <CardHeader><CardTitle>Organization Context</CardTitle></CardHeader>
                   <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">Entity Name</label><InlineEdit value={lead.data.company || ''} onSave={(val) => handleUpdateField('company', val)} /></div>
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">Industry</label><InlineEdit value={lead.data.industry || ''} onSave={(val) => handleUpdateField('industry', val)} /></div>
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">Website</label><InlineEdit value={lead.data.website || ''} onSave={(val) => handleUpdateField('website', val)} /></div>
                   </CardContent>
                 </Card>
                 <Card className="border-border/30 bg-card/40 backdrop-blur-md rounded-3xl shadow-xl">
                   <CardHeader><CardTitle>Point of Contact</CardTitle></CardHeader>
                   <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">First Name</label><InlineEdit value={lead.data.firstName || ''} onSave={(val) => handleUpdateField('firstName', val)} /></div>
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">Last Name</label><InlineEdit value={lead.data.lastName || ''} onSave={(val) => handleUpdateField('lastName', val)} /></div>
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">Job Title</label><InlineEdit value={lead.data.jobTitle || ''} onSave={(val) => handleUpdateField('jobTitle', val)} /></div>
                     <div className="space-y-2"><label className="text-sm text-muted-foreground">Email</label><InlineEdit value={lead.data.email || ''} onSave={(val) => handleUpdateField('email', val)} /></div>
                   </CardContent>
                 </Card>
              </TabsContent>
              <TabsContent value="activity" className="mt-0"><ActivityTimeline history={allActivities} /></TabsContent>
              <TabsContent value="notes" className="mt-0">
                 {notes.length > 0 ? <div className="space-y-4">{notes.map(note => (<Card key={note.id} onClick={() => setNoteModal({ mode: 'preview', note, isOpen: true })} className="cursor-pointer transition-all"><CardContent className="p-6"><p className="truncate">{note.content}</p><p>{note.userName} on {new Date(note.timestamp).toLocaleDateString()}</p></CardContent></Card>))}</div> : <EmptyState icon={<FileText size={32}/>} title="No Notes Yet" subtitle="All notes for this lead will appear here." buttonText="Create First Note" onButtonClick={() => setNoteModal({ mode: 'create', note: null, isOpen: true })} />}
              </TabsContent>
              <TabsContent value="calls" className="mt-0">
                 {calls.length > 0 ? <div className="space-y-4">{calls.map(call => (<Card key={call.id} onClick={() => setCallModal({ mode: 'preview', call: call.details, isOpen: true })} className="cursor-pointer"><CardContent className="p-6"><p className="font-semibold">{call.content}</p><div><span>{call.userName} on {new Date(call.timestamp).toLocaleDateString()}</span><span>{call.details?.duration} mins</span></div></CardContent></Card>))}</div> : <EmptyState icon={<PhoneCall size={32}/>} title="No Call Logs" subtitle="Logged calls and interactions will appear here." buttonText="Log First Call" onButtonClick={() => setCallModal({ mode: 'create', call: initialCallData, isOpen: true })} />}
              </TabsContent>
              <TabsContent value="emails" className="mt-0"><EmptyState icon={<Mail size={32}/>} title="Coming Soon" subtitle="Email integration is on the roadmap." /></TabsContent>
            </Tabs>
          </div>
          <aside className="space-y-8">
            <Card className="border-border/30 bg-card/40 backdrop-blur-md"><CardHeader><CardTitle>Intelligence</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex justify-between items-center"><div className="flex items-center gap-3"><Clock size={14} /> Created</div><span>{new Date(lead.createdAt).toLocaleDateString()}</span></div><div className="flex justify-between items-center"><div className="flex items-center gap-3"><History size={14} /> Modified</div><span>{new Date(lead.updatedAt).toLocaleDateString()}</span></div><div className="flex justify-between items-center"><div className="flex items-center gap-3"><User size={14} /> Owner</div><span>{userData?.name || "System AI"}</span></div></CardContent></Card>
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white"><h3 className="font-black">Next Suggested Action</h3><p>The lead is in {currentStatus?.label || lead.data.status} stage. Schedule a discovery call.</p><Button variant="secondary" className="w-full">Book Discovery Call</Button></div>
          </aside>
        </div>
      </main>

      <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Graduate to Deal?</DialogTitle></DialogHeader><div className="py-10 text-center space-y-8"><p>This will convert the lead into an active business opportunity.</p><div className="flex gap-4 pt-4 justify-center"><Button variant="ghost" onClick={() => setIsConvertModalOpen(false)}>Hold Back</Button><Button onClick={async () => { await updateEntity(lead.id, { status: 'qualified' }); toast.success("Lead Qualified!"); setIsConvertModalOpen(false);}}>Convert Now</Button></div></div></DialogContent>
      </Dialog>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("animate-spin", className)}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>);

const EmptyState = ({icon, title, subtitle, buttonText, onButtonClick}: any) => (
    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-border/20 rounded-[2.5rem] text-center space-y-6 bg-secondary/5">
        <div className="size-20 rounded-[2rem] bg-secondary flex items-center justify-center text-muted-foreground/40 shadow-inner">{icon}</div>
        <div className="space-y-1"><h3 className="font-black text-xl tracking-tighter uppercase">{title}</h3><p className="text-xs text-muted-foreground font-bold max-w-xs mx-auto">{subtitle}</p></div>
        {buttonText && <Button variant="outline" size="sm" onClick={onButtonClick} className="rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] h-12 px-10 border-2 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all">{buttonText}</Button>}
    </div>
);