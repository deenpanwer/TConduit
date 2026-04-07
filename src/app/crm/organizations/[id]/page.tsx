"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCRM } from "@/hooks/use-crm";
import { useCRMOrganizations } from "@/hooks/use-crm-organizations";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { useCRMDeals } from "@/hooks/use-crm-deals";
import { useCRMContacts } from "@/hooks/use-crm-contacts";
import { CRMEntity, FieldConfig } from "@/hooks/use-crm-module";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  PhoneCall, 
  NotebookPen, 
  Loader2, 
  ArrowLeft,
  Users,
  Building2,
  Trash2,
  Link as LinkIcon,
  Check,
  User
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
import { ContactModal } from "@/components/crm/forms/ContactModal";
import { useAuth } from "@/hooks/use-auth";

function OrganizationDetailClientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  const { updateEntityField, deleteEntity } = useCRM();
  const { entities: organizations, config, loading: orgsLoading } = useCRMOrganizations();
  const { entities: notes, addEntity: addNote, loading: notesLoading } = useCRMNotes();
  const { entities: calls, addEntity: addCall, loading: callsLoading } = useCRMCalls();
  const { entities: deals } = useCRMDeals();
  const { entities: contacts } = useCRMContacts();

  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const organization = useMemo(() => organizations.find((o) => o.id === orgId), [organizations, orgId]);

  const orgNameValue = useMemo(() => organization?.data.organizationName || organization?.name, [organization]);

  const orgNotes = useMemo(() => notes.filter(n => n.data.relatedTo === orgId), [notes, orgId]);
  const orgCalls = useMemo(() => calls.filter(c => c.data.relatedTo === orgId), [calls, orgId]);
  const orgDeals = useMemo(() => deals.filter(d => d.data.organization === orgNameValue), [deals, orgNameValue]);
  const orgContacts = useMemo(() => contacts.filter(c => c.data.company === orgNameValue), [contacts, orgNameValue]);

  const visibleFields = useMemo(() => {
    const listView = config.views.find(v => v.type === 'list') || config.views[0];
    const visibleIds = listView?.visibleFields || [];
    
    return visibleIds
      .map(id => config.fields.find(f => f.id === id))
      .filter((field): field is FieldConfig => 
        !!field && 
        !['organizationName', 'name'].includes(field.key)
      );
  }, [config.fields, config.views]);

  const handleSaveField = async (fieldKey: string, value: any) => {
    if (!organization) return;
    await updateEntityField(organization.id, fieldKey, value);
  };
  
  const handleNoteSubmit = async (noteData: any) => {
    await addNote({
      name: `Note for ${orgNameValue}`,
      data: { ...noteData, relatedTo: organization!.id }
    });
    toast.success("Note added!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({
      name: `Call with ${orgNameValue}`,
      data: { ...callData, relatedTo: organization!.id }
    });
    toast.success("Call logged!");
    setShowCallModal(false);
  };

  const handleDelete = async () => {
    if (!organization) return;
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      await deleteEntity(organization.id);
      toast.success('Organization has been deleted.');
      router.push('/crm/organizations');
    }
  };
  
  const copyLink = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  }

  if (orgsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Organization Not Found</h2>
        <p>We couldn't find the organization you're looking for.</p>
        <Button onClick={() => router.push('/crm/organizations')}>
          <ArrowLeft className="mr-2" size={16} /> Back to Organizations
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
              organization: orgNameValue, 
              name: `${orgNameValue} - Deal` 
          }}
      />
      <CallModal 
          isOpen={showCallModal} 
          onOpenChange={setShowCallModal}
          mode="create"
          call={null}
          organizations={organizations}
          onSubmit={handleCallSubmit}
          initialData={{ from: user?.displayName, relatedTo: organization.id }}
      />
      <NoteModal 
          isOpen={showNoteModal} 
          onOpenChange={setShowNoteModal}
          mode="create"
          note={null}
          organizations={organizations}
          onSubmit={handleNoteSubmit}
          initialData={{ relatedTo: organization.id }}
      />
      <ContactModal
          isOpen={showContactModal}
          onOpenChange={setShowContactModal}
          mode="create"
          contact={null}
          initialStage={orgNameValue} // Assuming this sets the company name
      />

      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-center">
            <Button 
                variant="ghost" 
                onClick={() => router.push('/crm/organizations')}
                className="group text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Organizations</span>
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
            src={`https://picsum.photos/seed/${orgNameValue || 'org'}/1600/400`}
            alt="Cover Photo"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-4 md:px-8 z-10 relative">
          <div className="flex-shrink-0">
            <Avatar className="h-28 w-28 md:h-40 md:w-40 border-4 border-background shadow-md bg-muted rounded-3xl">
              <AvatarImage src={`https://api.dicebear.com/9.x/shapes/svg?seed=${orgNameValue || 'avatar'}`} alt={orgNameValue} />
              <AvatarFallback className="rounded-3xl">{(orgNameValue || 'O').charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:ml-6">
              <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{orgNameValue}</h1>
                  <p className="text-muted-foreground text-lg font-bold italic">{organization.data.industry || 'Organization'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 md:mt-0">
                <Button onClick={() => setShowDealModal(true)} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-2xl h-12">
                  <Briefcase size={16} className="mr-2" /> Launch Deal
                </Button>
                <Button onClick={() => setShowContactModal(true)} size="lg" variant="outline" className="shadow-sm text-[10px] font-black uppercase tracking-widest rounded-2xl h-12">
                  <Users size={16} className="mr-2" /> Add Contact
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
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Corporate Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                      {visibleFields.map((field: FieldConfig) => (
                        <InlineEditField
                            key={field.key}
                            label={field.label}
                            value={organization.data[field.key] || ''}
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
              <TabsList className="grid w-full grid-cols-6 bg-muted/20 p-1 rounded-2xl h-auto">
                <TabsTrigger value="activity" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Activities</TabsTrigger>
                <TabsTrigger value="deals" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Deals ({orgDeals.length})</TabsTrigger>
                <TabsTrigger value="contacts" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Contacts ({orgContacts.length})</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Notes ({orgNotes.length})</TabsTrigger>
                <TabsTrigger value="emails" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Emails</TabsTrigger>
                <TabsTrigger value="calls" className="rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest">Calls ({orgCalls.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="mt-4">
                  <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Recent History</CardTitle></CardHeader>
                      <CardContent className="p-6">
                          <ActivityTimeline history={organization.history || []} />
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="deals" className="mt-4">
                 <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden min-h-[400px]">
                   <CardHeader className="bg-secondary/5 border-b border-border/10 flex flex-row items-center justify-between">
                     <CardTitle className="text-lg font-black uppercase">Active Deals</CardTitle>
                     <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-[9px] font-black uppercase tracking-widest h-8 rounded-xl" onClick={() => setShowDealModal(true)}>
                       <Plus size={14} className="mr-1"/>New Deal
                     </Button>
                   </CardHeader>
                   <CardContent className="p-6">
                   {orgDeals.length === 0 ? (
                     <div className="py-12 text-center">
                       <Briefcase size={40} className="mx-auto text-muted-foreground/30 mb-4"/>
                       <h3 className="font-black text-sm uppercase">No Deals Found</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Initiate a new deal to track progress.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {orgDeals.map(deal => (
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

               <TabsContent value="contacts" className="mt-4">
                 <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden min-h-[400px]">
                   <CardHeader className="bg-secondary/5 border-b border-border/10 flex flex-row items-center justify-between">
                     <CardTitle className="text-lg font-black uppercase">Key Contacts</CardTitle>
                     <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-[9px] font-black uppercase tracking-widest h-8 rounded-xl" onClick={() => setShowContactModal(true)}>
                       <Plus size={14} className="mr-1"/>New Contact
                     </Button>
                   </CardHeader>
                   <CardContent className="p-6">
                   {orgContacts.length === 0 ? (
                     <div className="py-12 text-center">
                        <Users size={40} className="mx-auto text-muted-foreground/30 mb-4"/>
                       <h3 className="font-black text-sm uppercase">No Contacts Found</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Add individual stakeholders for this organization.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {orgContacts.map(contact => (
                          <div key={contact.id} className="p-4 rounded-2xl border border-border/40 hover:border-blue-500/30 bg-muted/5 transition-all flex justify-between items-center group cursor-pointer" onClick={() => router.push(`/crm/contacts/${contact.id}`)}>
                             <div className="flex items-center gap-3">
                                <Avatar className="size-10 rounded-xl border border-border/40 bg-secondary">
                                   <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${contact.name}`} />
                                   <AvatarFallback className="rounded-xl"><User size={16}/></AvatarFallback>
                                </Avatar>
                                <div>
                                   <p className="font-black text-[11px] uppercase tracking-wider group-hover:text-blue-500 transition-colors">{contact.name}</p>
                                   <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mt-0.5">{contact.data.designation || 'Stakeholder'}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="font-black text-[10px] text-foreground">{contact.data.email}</p>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5">{contact.data.mobile}</p>
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
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Intelligence Notes</CardTitle></CardHeader>
                      <CardContent className="p-6">
                          {notesLoading ? <Loader2 className="animate-spin"/> :
                           orgNotes.length > 0 ? (
                            <ul className="space-y-4">{orgNotes.map(note => <li key={note.id} className="p-4 bg-muted/20 border border-border/10 rounded-2xl text-xs font-medium leading-relaxed">{note.data.content}</li>)}</ul>
                           ) : <p className="text-center py-8 text-[10px] font-black uppercase text-muted-foreground tracking-widest">No notes compiled yet.</p>
                          }
                      </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="emails" className="mt-4">
                  <Card className="shadow-sm border-border/40 rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-secondary/5 border-b border-border/10"><CardTitle className="text-lg font-black uppercase">Communication</CardTitle></CardHeader>
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
                            orgCalls.length > 0 ? (
                              <ul className="space-y-4">{orgCalls.map(call => <li key={call.id} className="p-4 bg-muted/20 border border-border/10 rounded-2xl flex justify-between items-center"><span className="text-xs font-medium">{call.data.summary}</span><span className="text-[9px] font-black uppercase text-muted-foreground">{new Date(call.createdAt).toLocaleDateString()}</span></li>)}</ul>
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

export default function OrganizationDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    }>
      <OrganizationDetailClientPage />
    </Suspense>
  );
}
