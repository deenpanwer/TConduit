"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCRM } from "@/hooks/use-crm";
import { useCRMDeals } from "@/hooks/use-crm-deals";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, PhoneCall, NotebookPen,
  Briefcase, TrendingUp, Clock, CheckCircle2,
  Calendar as CalendarIcon, DollarSign, Building2,
  ExternalLink, Globe, MapPin, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { InlineEditField } from "@/components/crm/shared/InlineEditField";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { FieldConfig, CRMEntity } from "@/hooks/use-crm-module";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function DealDetailClientPage() {
  const { id: dealId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { config, updateEntityField, notes, calls, leads } = useCRM();
  const { entities: deals, loading: dealsLoading } = useCRMDeals();
  const { addEntity: addNote } = useCRMNotes();
  const { addEntity: addCall } = useCRMCalls();

  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const deal = useMemo(() => deals.find((d) => d.id === dealId), [deals, dealId]);

  const dealNotes = useMemo(() => notes.filter(n => n.data.relatedTo === dealId), [notes, dealId]);
  const dealCalls = useMemo(() => calls.filter(c => c.data.relatedTo === dealId), [calls, dealId]);

  const visibleFields = useMemo(() => {
    const dealConfig = config.modules.deals;
    const listView = dealConfig.views.find(v => v.type === 'list') || dealConfig.views[0];
    const visibleIds = listView?.visibleFields || [];

    return visibleIds
      .map(id => dealConfig.fields.find(f => f.id === id))
      .filter((field): field is FieldConfig =>
        !!field &&
        !['name'].includes(field.key)
      );
  }, [config.modules.deals]);

  const handleSaveField = async (fieldKey: string, value: any) => {
    if (!deal) return;
    await updateEntityField(deal.id, fieldKey, value);
  };

  const handleNoteSubmit = async (noteData: any) => {
    await addNote({
      name: `Note for ${deal?.name}`,
      data: { ...noteData, relatedTo: deal!.id }
    });
    toast.success("Note added!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({
      name: `Call for ${deal?.name}`,
      data: { ...callData, relatedTo: deal!.id }
    });
    toast.success("Call logged!");
    setShowCallModal(false);
  };

  if (dealsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Deal Not Found</h2>
        <p>We couldn't find the deal you're looking for.</p>
        <Button onClick={() => router.push('/crm/deals')}>
          <ArrowLeft className="mr-2" size={16} /> Back to Pipeline
        </Button>
      </div>
    );
  }

  const statusField = config.modules.deals.fields.find(f => f.key === 'status');
  const currentStatus = statusField?.options?.find(o => o.value === deal.data.status);

  return (
    <>
      <CallModal
        isOpen={showCallModal}
        onOpenChange={setShowCallModal}
        mode="create"
        call={null}
        leads={leads}
        onSubmit={handleCallSubmit}
        initialData={{ from: user?.displayName, relatedTo: deal.id }}
      />
      <NoteModal
        isOpen={showNoteModal}
        onOpenChange={setShowNoteModal}
        mode="create"
        note={null}
        leads={leads}
        onSubmit={handleNoteSubmit}
        initialData={{ relatedTo: deal.id }}
      />

      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/crm/deals')}
            className="group text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Pipeline</span>
          </Button>
        </div>

        <div className="w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden relative shadow-lg">
          <Image
            src={`https://picsum.photos/seed/${deal.id}/1600/400`}
            alt="Cover Photo"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 md:-mt-20 px-4 md:px-8 z-10 relative">
          <div className="flex-shrink-0">
            <div className="h-28 w-28 md:h-40 md:w-40 border-4 border-background shadow-md bg-green-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black">
              {deal.name.charAt(0)}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center w-full mt-4 md:ml-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{deal.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 size={16} />
                <span className="font-semibold">{deal.data.organization || 'No organization'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
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
                <CardTitle className="text-xl">Deal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {visibleFields.map((field: FieldConfig) => (
                  <InlineEditField
                    key={field.key}
                    label={field.label}
                    value={deal.data[field.key] || ''}
                    onSave={(newValue) => handleSaveField(field.key, newValue)}
                    type={field.type as any}
                    options={field.options}
                    readOnly={field.key === 'lastInteraction'}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-4 border-t-green-500">
              <CardHeader>
                <CardTitle className="text-xl">Vitals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><TrendingUp size={14} /> Stage</div>
                  <span className="text-xs font-bold text-blue-500">{currentStatus?.label || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><DollarSign size={14} /> Revenue</div>
                  <span className="text-xs font-bold text-green-600">${Number(deal.data.annualRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><Clock size={14} /> Created</div>
                  <span className="text-xs font-bold">{format(new Date(deal.createdAt), "PPP")}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><CheckCircle2 size={14} /> Health</div>
                  <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border-green-500/20">On Track</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-12 p-0 mb-6">
                <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent h-12 px-6 font-bold text-sm">Timeline</TabsTrigger>
                <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent h-12 px-6 font-bold text-sm">Notes ({dealNotes.length})</TabsTrigger>
                <TabsTrigger value="calls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent h-12 px-6 font-bold text-sm">Calls ({dealCalls.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="activity">
                <ActivityTimeline history={deal.history} />
              </TabsContent>

              <TabsContent value="notes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dealNotes.map(note => (
                    <Card key={note.id} className="border-border/40 hover:border-blue-500/30 transition-all rounded-2xl group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm truncate">{note.name}</h4>
                          <Clock size={12} className="text-muted-foreground shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 font-medium">{note.data.content}</p>
                        <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {dealNotes.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-muted-foreground italic">No notes found for this deal.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="calls">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dealCalls.map(call => (
                    <Card key={call.id} className="border-border/40 hover:border-blue-500/30 transition-all rounded-2xl group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-lg", call.data.type === 'Incoming' ? "bg-green-500/10 text-green-500" : "bg-purple-500/10 text-purple-500")}>
                              <PhoneCall size={12} />
                            </div>
                            <h4 className="font-bold text-sm truncate">{call.data.summary}</h4>
                          </div>
                          <Clock size={12} className="text-muted-foreground shrink-0" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-[8px] font-black uppercase">{call.data.status}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground">{call.data.duration}s</span>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>{format(new Date(call.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {dealCalls.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-muted-foreground italic">No calls logged for this deal.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DealDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    }>
      <DealDetailClientPage />
    </Suspense>
  );
}
