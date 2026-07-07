"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCRM } from "@/hooks/use-crm";
import { useCRMLeads } from "@/hooks/use-crm-leads";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { CRMEntity, FieldConfig } from "@/hooks/use-crm-module";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  PhoneCall, 
  NotebookPen, 
  Loader2, 
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';

import { InlineEditField } from "@/components/crm/shared/InlineEditField"; 
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { DealModal } from "@/components/crm/forms/DealModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { useAuth } from "@/hooks/use-auth";

function LeadDetailClientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const { updateEntityField } = useCRM();
  const { entities: leads, config, loading: leadsLoading } = useCRMLeads();
  const { entities: notes, addEntity: addNote, loading: notesLoading } = useCRMNotes();
  const { entities: calls, addEntity: addCall, loading: callsLoading } = useCRMCalls();

  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const lead = useMemo(() => leads.find((l) => l.id === leadId), [leads, leadId]);

  const leadNotes = useMemo(() => notes.filter(n => n.data.relatedTo === leadId), [notes, leadId]);
  const leadCalls = useMemo(() => calls.filter(c => c.data.relatedTo === leadId), [calls, leadId]);

  const visibleFields = useMemo(() => {
    const listView = config.views.find(v => v.type === 'list') || config.views[0];
    const visibleIds = listView?.visibleFields || [];
    
    return visibleIds
      .map(id => config.fields.find(f => f.id === id))
      .filter((field): field is FieldConfig => 
        !!field && 
        !['firstName', 'lastName', 'name'].includes(field.key)
      );
  }, [config.fields, config.views]);

  const handleSaveField = async (fieldKey: string, value: any) => {
    if (!lead) return;
    await updateEntityField(lead.id, fieldKey, value);
  };
  
  const handleNoteSubmit = async (noteData: any) => {
    await addNote({
      name: `Note for ${lead?.name}`,
      data: { ...noteData, relatedTo: lead!.id }
    });
    toast.success("Note added!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({
      name: `Call with ${lead?.name}`,
      data: { ...callData, relatedTo: lead!.id }
    });
    toast.success("Call logged!");
    setShowCallModal(false);
  };

  const leadName = useMemo(() => {
    if (!lead) return "Lead Not Found";
    const firstName = lead.data.firstName || "";
    const lastName = lead.data.lastName || "";
    return lead.name || `${firstName} ${lastName}`.trim() || "Unnamed Lead";
  }, [lead]);

  if (leadsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Lead Not Found</h2>
        <p>We couldn't find the lead you're looking for.</p>
        <Button onClick={() => router.push('/crm/leads')}>
          <ArrowLeft className="mr-2" size={16} /> Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <>
      <DealModal 
          isOpen={showDealModal} 
          onOpenChange={setShowDealModal}
          mode="create"
          deal={null}
          initialData={{ 
              organization: lead.data.company, 
              firstName: lead.data.firstName, 
              lastName: lead.data.lastName, 
              email: lead.data.email, 
              mobile: lead.data.mobile, 
              name: `${leadName} - Deal` 
          }}
      />
      <CallModal 
          isOpen={showCallModal} 
          onOpenChange={setShowCallModal}
          mode="create"
          call={null}
          leads={leads}
          onSubmit={handleCallSubmit}
          initialData={{ from: user?.displayName, relatedTo: lead.id }}
      />
      <NoteModal 
          isOpen={showNoteModal} 
          onOpenChange={setShowNoteModal}
          mode="create"
          note={null}
          leads={leads}
          onSubmit={handleNoteSubmit}
          initialData={{ relatedTo: lead.id }}
      />

      <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="mb-6">
            <Button 
                variant="ghost" 
                onClick={() => router.push('/crm/leads')}
                className="group text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Leads</span>
            </Button>
        </div>

        <div className="w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden relative shadow-lg">
          <Image
            src={`https://picsum.photos/seed/${lead.data.firstName || 'lead'}/1600/400`}
            alt="Cover Photo"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-4 md:px-8 z-10 relative">
          <div className="flex-shrink-0">
            <Avatar className="h-28 w-28 md:h-40 md:w-40 border-4 border-background shadow-md bg-muted">
              <AvatarImage src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${lead.data.firstName || 'avatar'}`} alt={leadName} />
              <AvatarFallback>{(lead.data.firstName || '').charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:ml-6">
              <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{leadName}</h1>
                  <p className="text-muted-foreground text-lg">{lead.data.jobTitle || 'No title specified'}</p>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <Button onClick={() => setShowDealModal(true)} size="lg" className="bg-green-600 hover:bg-green-700 shadow-md">
                  <Briefcase size={16} className="mr-2" /> Start a Deal
                </Button>
                <Button onClick={() => setShowCallModal(true)} size="lg" variant="outline" className="shadow-sm">
                  <PhoneCall size={16} className="mr-2" /> Log a Call
                </Button>
                <Button onClick={() => setShowNoteModal(true)} size="lg" variant="outline" className="shadow-sm">
                  <NotebookPen size={16} className="mr-2" /> Add a Note
                </Button>
              </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-xl">About This Lead</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {visibleFields.map((field: FieldConfig) => (
                        <InlineEditField
                            key={field.key}
                            label={field.label}
                            value={
                              field.key === 'lastInteraction' ? (lead.data[field.key] || (lead as any).createdAt || '') :
                              field.key === 'createdBy' ? (lead.data[field.key] || 'System') :
                              (lead.data[field.key] || '')
                            }
                            onSave={(newValue) => handleSaveField(field.key, newValue)}
                            type={field.type as any}
                            options={field.options}
                            readOnly={field.key === 'lastInteraction' || field.key === 'createdBy'}
                        />
                      ))}
                  </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="activity">Activities</TabsTrigger>
                <TabsTrigger value="notes">Notes ({leadNotes.length})</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
                <TabsTrigger value="calls">Calls ({leadCalls.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="mt-4">
                  <Card className="shadow-sm">
                      <CardHeader><CardTitle>Recent History</CardTitle></CardHeader>
                      <CardContent>
                          <ActivityTimeline history={lead.history || []} />
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                  <Card className="shadow-sm">
                      <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                      <CardContent>
                          {notesLoading ? <Loader2 className="animate-spin"/> :
                           leadNotes.length > 0 ? (
                            <ul className="space-y-4">{leadNotes.map(note => <li key={note.id} className="p-3 bg-muted/50 rounded-lg">{note.data.content}</li>)}</ul>
                           ) : <p>No notes yet.</p>
                          }
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="emails" className="mt-4">
                  <Card className="shadow-sm">
                      <CardHeader><CardTitle>Emails</CardTitle></CardHeader>
                      <CardContent><p>Email integration is not set up yet.</p></CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="calls" className="mt-4">
                  <Card className="shadow-sm">
                      <CardHeader><CardTitle>Call Logs</CardTitle></CardHeader>
                      <CardContent>
                          {callsLoading ? <Loader2 className="animate-spin"/> :
                            leadCalls.length > 0 ? (
                              <ul className="space-y-4">{leadCalls.map(call => <li key={call.id} className="p-3 bg-muted/50 rounded-lg">{call.data.summary}</li>)}</ul>
                            ) : <p>No calls logged yet.</p>
                          }
                      </CardContent>
                  </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LeadDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    }>
      <LeadDetailClientPage />
    </Suspense>
  );
}
