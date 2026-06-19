"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCRM } from "@/hooks/use-crm";
import { useCRMContacts } from "@/hooks/use-crm-contacts";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { useCRMDeals } from "@/hooks/use-crm-deals";
import { CRMEntity, FieldConfig } from "@/hooks/use-crm-module";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  PhoneCall, 
  NotebookPen, 
  Loader2, 
  ArrowLeft,
  Users,
  Trash2,
  Link as LinkIcon,
  Check,
  User,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { InlineEditField } from "@/components/crm/shared/InlineEditField"; 
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { DealModal } from "@/components/crm/forms/DealModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { useAuth } from "@/hooks/use-auth";

function ContactDetailClientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const { updateEntityField, deleteEntity } = useCRM();
  const { entities: contacts, config, loading: contactsLoading } = useCRMContacts();
  const { entities: notes, addEntity: addNote, loading: notesLoading } = useCRMNotes();
  const { entities: calls, addEntity: addCall, loading: callsLoading } = useCRMCalls();
  const { entities: deals } = useCRMDeals();

  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const contact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId]);

  const contactName = useMemo(() => {
    if (!contact) return "Contact Not Found";
    return contact.name;
  }, [contact]);

  const contactNotes = useMemo(() => notes.filter(n => n.data.relatedTo === contactId), [notes, contactId]);
  const contactCalls = useMemo(() => calls.filter(c => c.data.relatedTo === contactId), [calls, contactId]);
  const contactDeals = useMemo(() => deals.filter(d => d.data.email === contact?.data.email || d.data.contactId === contactId), [deals, contact, contactId]);

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
    if (!contact) return;
    await updateEntityField(contact.id, fieldKey, value);
  };
  
  const handleNoteSubmit = async (noteData: any) => {
    await addNote({
      name: `Note for ${contactName}`,
      data: { ...noteData, relatedTo: contact!.id }
    });
    toast.success("Note added!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({
      name: `Call with ${contactName}`,
      data: { ...callData, relatedTo: contact!.id }
    });
    toast.success("Call logged!");
    setShowCallModal(false);
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      await deleteEntity(contact.id);
      toast.success('Contact has been deleted.');
      router.push('/crm/contacts');
    }
  };
  
  const copyLink = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  }

  if (contactsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Contact Not Found</h2>
        <p>We couldn't find the contact you're looking for.</p>
        <Button onClick={() => router.push('/crm/contacts')}>
          <ArrowLeft className="mr-2" size={16} /> Back to Contacts
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
              organization: contact.data.company, 
              firstName: contact.data.firstName,
              lastName: contact.data.lastName,
              email: contact.data.email,
              mobile: contact.data.mobile,
              name: `${contactName} - Deal` 
          }}
      />
      <CallModal 
          isOpen={showCallModal} 
          onOpenChange={setShowCallModal}
          mode="create"
          call={null}
          contacts={contacts}
          onSubmit={handleCallSubmit}
          initialData={{ from: user?.displayName, relatedTo: contact.id }}
      />
      <NoteModal 
          isOpen={showNoteModal} 
          onOpenChange={setShowNoteModal}
          mode="create"
          note={null}
          contacts={contacts}
          onSubmit={handleNoteSubmit}
          initialData={{ relatedTo: contact.id }}
      />

      <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="mb-6 flex justify-between items-center">
            <Button 
                variant="ghost" 
                onClick={() => router.push('/crm/contacts')}
                className="group text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Network</span>
            </Button>
            <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" className="font-bold text-[10px] uppercase tracking-widest rounded-xl" onClick={handleDelete}>
                    <Trash2 size={14} className="mr-2"/> Delete
                </Button>
                <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase tracking-widest rounded-xl" onClick={copyLink}>
                    {isCopied ? <Check size={14} className="mr-2 text-green-500"/> : <LinkIcon size={14} className="mr-2"/>}
                    {isCopied ? 'Copied' : 'Link'}
                </Button>
            </div>
        </div>

        <div className="w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden relative shadow-lg">
          <Image
            src={`https://picsum.photos/seed/${contact.data.firstName || 'contact'}/1600/400`}
            alt="Cover Photo"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-4 md:px-8 z-10 relative">
          <div className="flex-shrink-0">
            <Avatar className="h-28 w-28 md:h-40 md:w-40 border-4 border-background shadow-md bg-muted rounded-[2.5rem]">
              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${contact.name}`} alt={contactName} />
              <AvatarFallback className="rounded-[2.5rem]">{(contactName || 'C').charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:ml-6">
              <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{contactName}</h1>
                  <p className="text-muted-foreground text-lg font-bold italic">{contact.data.designation || 'Contact'} @ {contact.data.company || 'Independent'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 md:mt-0">
                <Button onClick={() => setShowDealModal(true)} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-2xl h-12">
                  <Briefcase size={16} className="mr-2" /> Launch Deal
                </Button>
                <Button onClick={() => setShowCallModal(true)} size="lg" variant="outline" className="shadow-sm text-[10px] font-black uppercase tracking-widest rounded-2xl h-12">
                  <PhoneCall size={16} className="mr-2" /> Log Call
                </Button>
                <Button onClick={() => setShowNoteModal(true)} size="lg" variant="outline" className="shadow-sm text-[10px] font-black uppercase tracking-widest rounded-2xl h-12">
                  <NotebookPen size={16} className="mr-2" /> Add Note
                </Button>
              </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="shadow-xl border-border/40 rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-secondary/5 border-b border-border/10">
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Stakeholder Intel</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                      {visibleFields.map((field: FieldConfig) => (
                        <InlineEditField
                            key={field.key}
                            label={field.label}
                            value={contact.data[field.key] || ''}
                            onSave={(newValue) => handleSaveField(field.key, newValue)}
                            type={field.type as any}
                            options={field.options}
                        />
                      ))}
                  </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted/20 p-1 rounded-2xl h-auto">
                <TabsTrigger value="activity" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Activities</TabsTrigger>
                <TabsTrigger value="deals" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Deals ({contactDeals.length})</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Notes ({contactNotes.length})</TabsTrigger>
                <TabsTrigger value="emails" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Emails</TabsTrigger>
                <TabsTrigger value="calls" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Calls ({contactCalls.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="mt-4">
                  <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Recent History</CardTitle></CardHeader>
                      <CardContent className="p-6">
                          <ActivityTimeline history={contact.history || []} />
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="deals" className="mt-4">
                 <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden min-h-[400px]">
                   <CardHeader className="bg-secondary/5 border-b border-border/10 flex flex-row items-center justify-between">
                     <CardTitle className="text-lg font-black uppercase">Associated Deals</CardTitle>
                     <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-[9px] font-black uppercase tracking-widest h-8 rounded-xl" onClick={() => setShowDealModal(true)}>
                       <Plus size={14} className="mr-1"/>New Deal
                     </Button>
                   </CardHeader>
                   <CardContent className="p-6">
                   {contactDeals.length === 0 ? (
                     <div className="py-12 text-center">
                       <Briefcase size={40} className="mx-auto text-muted-foreground/30 mb-4"/>
                       <h3 className="font-black text-sm uppercase">No Deals Found</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Initiate a new deal to track progress.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {contactDeals.map(deal => (
                          <div key={deal.id} className="p-4 rounded-2xl border border-border/40 hover:border-blue-500/30 bg-muted/5 transition-all flex justify-between items-center group cursor-pointer" onClick={() => router.push(`/crm/deals/${deal.id}`)}>
                             <div>
                                <p className="font-black text-[11px] uppercase tracking-wider group-hover:text-blue-500 transition-colors">{deal.name}</p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mt-0.5">{deal.data.status}</p>
                             </div>
                             <div className="text-right">
                                <p className="font-black text-xs text-blue-600">${Number(deal.data.annualRevenue || 0).toLocaleString()}</p>
                                <p className="text-[9px] text-muted-foreground font-black uppercase mt-0.5">{new Date(deal.updatedAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                   </CardContent>
                 </Card>
               </TabsContent>

              <TabsContent value="notes" className="mt-4">
                  <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Personal Intelligence</CardTitle></CardHeader>
                      <CardContent className="p-6">
                          {notesLoading ? <Loader2 className="animate-spin"/> :
                           contactNotes.length > 0 ? (
                            <ul className="space-y-4">{contactNotes.map(note => <li key={note.id} className="p-4 bg-muted/20 border border-border/10 rounded-2xl text-xs font-medium leading-relaxed">{note.data.content}</li>)}</ul>
                           ) : <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground tracking-widest">No notes compiled yet.</p>
                          }
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="emails" className="mt-4">
                  <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Correspondence</CardTitle></CardHeader>
                      <CardContent className="p-12 text-center">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic opacity-60">Email synchronization pending configuration.</p>
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="calls" className="mt-4">
                  <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Call Logs</CardTitle></CardHeader>
                      <CardContent className="p-6">
                          {callsLoading ? <Loader2 className="animate-spin"/> :
                            contactCalls.length > 0 ? (
                              <ul className="space-y-4">{contactCalls.map(call => <li key={call.id} className="p-4 bg-muted/20 border border-border/10 rounded-2xl flex justify-between items-center"><span className="text-xs font-medium">{call.data.summary}</span><span className="text-[9px] font-black uppercase text-muted-foreground">{new Date(call.createdAt).toLocaleDateString()}</span></li>)}</ul>
                            ) : <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground tracking-widest">No calls documented yet.</p>
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

export default function ContactDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    }>
      <ContactDetailClientPage />
    </Suspense>
  );
}
