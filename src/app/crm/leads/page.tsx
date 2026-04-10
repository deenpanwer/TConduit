"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useCRMLeads } from "@/hooks/use-crm-leads";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { 
  LayoutGrid, List as ListIcon, Plus, Search, 
  Filter, Download, ArrowUpDown, Loader2,
  ExternalLink, Eye, Edit2, Briefcase, PhoneCall, NotebookPen, Trash, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { CRMTable } from "@/components/crm/shared/CRMTable";
import { CRMKanban } from "@/components/crm/shared/CRMKanban";
import { LeadModal } from "@/components/crm/forms/LeadModal";
import { DealModal } from "@/components/crm/forms/DealModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { CRMEntity } from "@/hooks/use-crm-module";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Suspense } from "react";

function LeadsPageContent() {
  const { user } = useAuth();
  const { entities: leads, config, updateEntity, deleteEntity, updateConfig, pageSize, setPageSize, addEntity, loading } = useCRMLeads();
  const { addEntity: addNote } = useCRMNotes();
  const { addEntity: addCall } = useCRMCalls();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "value" | "updated">("updated");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string | null>(null);
  
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedLead, setSelectedLead] = useState<CRMEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [initialStage, setInitialStage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "list" || view === "kanban") setActiveView(view as any);
  }, [searchParams]);

  const setView = (view: "list" | "kanban") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSelectedIds([]);
  };

  const filteredLeads = useMemo(() => {
    let result = leads.filter(l => !l.isDeleted);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        const name = (l.name || "").toLowerCase();
        const firstName = (l.data?.firstName || "").toLowerCase();
        const lastName = (l.data?.lastName || "").toLowerCase();
        const email = (l.data?.email || "").toLowerCase();
        const company = (l.data?.company || "").toLowerCase();
        return name.includes(q) || firstName.includes(q) || lastName.includes(q) || email.includes(q) || company.includes(q);
      });
    }

    if (filterPriority) {
      result = result.filter(l => l.data?.priority === filterPriority);
    }

    if (filterStage) {
      result = result.filter(l => l.data?.status === filterStage);
    }
    
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "value") return (Number(b.data?.value) || 0) - (Number(a.data?.value) || 0);
      if (sortBy === "updated") {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
        return timeB - timeA;
      }
      return 0;
    });
    return result;
  }, [leads, searchQuery, sortBy, filterPriority, filterStage]);

  const handleLaunchDeal = (lead: CRMEntity) => { setSelectedLead(lead); setShowDealModal(true); };
  const handleLogCall = (lead: CRMEntity) => { setSelectedLead(lead); setShowCallModal(true); };
  const handleAddNote = (lead: CRMEntity) => { setSelectedLead(lead); setShowNoteModal(true); };

  const handleNoteSubmit = async (noteData: any) => {
    await addNote({ 
      name: `Note for ${selectedLead?.name}`,
      data: { ...noteData, relatedTo: selectedLead!.id } 
    });
    toast.success("Note added successfully!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({ 
      name: `Call with ${selectedLead?.name}`,
      data: { ...callData, relatedTo: selectedLead!.id } 
    });
    toast.success("Call logged successfully!");
    setShowCallModal(false);
  };

  const handleKanbanQuickAdd = (stage: string) => {
    setInitialStage(stage);
    setSelectedLead(null);
    setModalMode('create');
    setShowLeadModal(true);
  };

  const leadActions = (lead: CRMEntity) => (
    <>
      <DropdownMenuItem className="text-[10px] font-black uppercase" onClick={() => router.push(`/crm/leads/${lead.id}?from=${activeView}`)}><ExternalLink size={12} className="mr-2 text-blue-500"/> Open Lead</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => router.push(`/crm/invoices/builder?type=lead&id=${lead.id}`)}><FileText size={12} className="mr-2 text-purple-500"/> Create Invoice</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setSelectedLead(lead); setModalMode('preview'); setShowLeadModal(true); }}><Eye size={12} className="mr-2 text-blue-500"/> View Profile</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setSelectedLead(lead); setModalMode('edit'); setShowLeadModal(true); }}><Edit2 size={12} className="mr-2 text-blue-500"/> Edit Details</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleLaunchDeal(lead)}><Briefcase size={12} className="mr-2 text-green-500"/> Launch Deal</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleLogCall(lead)}><PhoneCall size={12} className="mr-2 text-indigo-500"/> Log Call</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleAddNote(lead)}><NotebookPen size={12} className="mr-2 text-orange-500"/> Add Note</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(lead.id)}><Trash size={12} className="mr-2"/> Delete Lead</DropdownMenuItem>
    </>
  );

  if (loading && leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen relative max-w-[1600px] mx-auto">
      <LeadModal 
        isOpen={showLeadModal} 
        onOpenChange={setShowLeadModal} 
        mode={modalMode} 
        lead={selectedLead}
        initialStage={initialStage}
        onClose={() => setInitialStage(undefined)}
      />
      <DealModal 
        isOpen={showDealModal} 
        onOpenChange={setShowDealModal} 
        mode="create" 
        deal={null}
        initialData={{ 
          organization: selectedLead?.data.company, 
          firstName: selectedLead?.data.firstName, 
          lastName: selectedLead?.data.lastName, 
          email: selectedLead?.data.email, 
          mobile: selectedLead?.data.mobile, 
          name: `${selectedLead?.name} - Deal` 
        }} 
      />
      <CallModal 
        isOpen={showCallModal} 
        onOpenChange={setShowCallModal} 
        mode="create" 
        call={null} 
        leads={leads}
        onSubmit={handleCallSubmit} 
        initialData={{ 
          from: user?.displayName, 
          relatedTo: selectedLead?.id 
        }}
      />
      <NoteModal 
        isOpen={showNoteModal} 
        onOpenChange={setShowNoteModal} 
        mode="create" 
        note={null} 
        leads={leads}
        onSubmit={handleNoteSubmit} 
        initialData={{ 
          relatedTo: selectedLead?.id
        }}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Active Intelligence</span><span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" /></div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Leads <span className="text-blue-600 italic">Hub</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md">
            <Button variant={activeView === "list" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("list")}><ListIcon size={14} className="mr-2" /> List View</Button>
            <Button variant={activeView === "kanban" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("kanban")}><LayoutGrid size={14} className="mr-2" /> Kanban</Button>
          </div>
          <Button 
            onClick={() => { setSelectedLead(null); setModalMode('create'); setShowLeadModal(true); }} 
            className="h-12 px-8 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> New Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            autoFocus
            placeholder="SEARCH BY NAME, EMAIL, OR ORGANIZATION..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-12 h-12 bg-background/50 border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/20" 
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm"><ArrowUpDown size={14} className="mr-2 text-blue-500" /> Sort: {sortBy}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("name")}>Sort by Name</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("value")}>Sort by Value</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("updated")}>Sort by Updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm"><Filter size={14} className="mr-2 text-blue-500" /> Stage: {filterStage || 'All'}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStage(null)}>All Stages</DropdownMenuItem>
              {config.fields.find(f => f.key === 'status')?.options?.map(s => (
                <DropdownMenuItem key={s.value} className="text-[10px] font-bold uppercase" onClick={() => setFilterStage(s.value)}>{s.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm"><Filter size={14} className="mr-2 text-blue-500" /> Urgency: {filterPriority || 'All'}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterPriority(null)}>All Priorities</DropdownMenuItem>
              {config.fields.find(f => f.key === 'priority')?.options?.map(p => (
                <DropdownMenuItem key={p.value} className="text-[10px] font-bold uppercase" onClick={() => setFilterPriority(p.value)}>{p.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" disabled className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest opacity-40 px-6 shadow-sm"><Download size={14} className="mr-2 text-blue-500" /> Export</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeView === "list" ? (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CRMTable 
                entities={filteredLeads} config={config} updateEntity={updateEntity} deleteEntity={deleteEntity} updateConfig={updateConfig} 
                onEntityClick={(l) => router.push(`/crm/leads/${l.id}?from=${activeView}`)} selectedIds={selectedIds} onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onSelectAll={setSelectedIds} 
                addEntity={addEntity} pageSize={pageSize} setPageSize={setPageSize} actions={leadActions}
              />
            </motion.div>
          ) : (
            <motion.div key="kanban" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
              <CRMKanban 
                  entities={filteredLeads} config={config} updateEntity={updateEntity} deleteEntity={deleteEntity}
                  updateConfig={updateConfig} onEntityClick={(l) => router.push(`/crm/leads/${l.id}?from=${activeView}`)}
                  actions={leadActions}
                  onQuickAdd={handleKanbanQuickAdd}
                  addEntity={(payload) => addEntity(payload)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-blue-500/20 shadow-2xl rounded-[2rem] p-4 flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 px-4 border-r border-border/20 mr-2"><span className="bg-blue-600 text-white size-7 rounded-full flex items-center justify-center text-[10px] font-black">{selectedIds.length}</span><span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Selected</span></div>
            <div className="flex items-center gap-3"><Button variant="outline" size="sm" onClick={async () => { if (confirm(`Delete items?`)) { await Promise.all(selectedIds.map(id => deleteEntity(id))); setSelectedIds([]); }}} className="h-10 rounded-2xl text-red-500 hover:bg-red-500/10 border-red-500/20 font-black text-[10px] uppercase px-6">Delete</Button><Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-10 rounded-2xl font-black text-[10px] uppercase px-6">Cancel</Button></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
