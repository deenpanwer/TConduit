"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useCRMDeals } from "@/hooks/use-crm-deals";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { 
  LayoutGrid, List as ListIcon, Plus, Search, 
  Filter, Download, ArrowUpDown, Loader2,
  ExternalLink, Eye, Edit2, PhoneCall, NotebookPen, Trash, FileText
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
import { DealModal } from "@/components/crm/forms/DealModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { useCRM } from "@/hooks/use-crm";
import { CRMEntity } from "@/hooks/use-crm-module";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

function DealsPageContent() {
  const { user } = useAuth();
  const { leads } = useCRM();
  const { 
    entities: deals, 
    config, 
    updateEntity, 
    deleteEntity, 
    updateConfig, 
    pageSize, 
    setPageSize, 
    addEntity, 
    loading
  } = useCRMDeals();
  const { addEntity: addNote } = useCRMNotes();
  const { addEntity: addCall } = useCRMCalls();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "value" | "updated">("updated");
  const [filterStage, setFilterStage] = useState<string | null>(null);
  
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedDeal, setSelectedDeal] = useState<CRMEntity | null>(null);
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

  const filteredDeals = useMemo(() => {
    let result = deals.filter(d => !d.isDeleted);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => {
        const name = (d.name || "").toLowerCase();
        const organization = (d.data?.organization || "").toLowerCase();
        const email = (d.data?.email || "").toLowerCase();
        return name.includes(q) || organization.includes(q) || email.includes(q);
      });
    }

    if (filterStage) {
      result = result.filter(d => d.data?.status === filterStage);
    }
    
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "value") return (Number(b.data?.annualRevenue) || 0) - (Number(a.data?.annualRevenue) || 0);
      if (sortBy === "updated") {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
        return timeB - timeA;
      }
      return 0;
    });
    return result;
  }, [deals, searchQuery, sortBy, filterStage]);

  const handleLogCall = (deal: CRMEntity) => { setSelectedDeal(deal); setShowCallModal(true); };
  const handleAddNote = (deal: CRMEntity) => { setSelectedDeal(deal); setShowNoteModal(true); };

  const handleNoteSubmit = async (noteData: any) => {
    await addNote({ 
      name: `Note for ${selectedDeal?.name}`,
      data: { ...noteData, relatedTo: selectedDeal!.id } 
    });
    toast.success("Note added successfully!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({ 
      name: `Call for ${selectedDeal?.name}`,
      data: { ...callData, relatedTo: selectedDeal!.id } 
    });
    toast.success("Call logged successfully!");
    setShowCallModal(false);
  };

  const handleKanbanQuickAdd = (stage: string) => {
    setInitialStage(stage);
    setSelectedDeal(null);
    setModalMode('create');
    setShowDealModal(true);
  };

  const dealActions = (deal: CRMEntity) => (
    <>
      <DropdownMenuItem className="text-[10px] font-black uppercase" onClick={() => router.push(`/crm/deals/${deal.id}?from=${activeView}`)}><ExternalLink size={12} className="mr-2 text-blue-500"/> Open Deal</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => router.push(`/crm/invoices/builder?type=deal&id=${deal.id}`)}><FileText size={12} className="mr-2 text-purple-500"/> Create Invoice</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setSelectedDeal(deal); setModalMode('preview'); setShowDealModal(true); }}><Eye size={12} className="mr-2 text-blue-500"/> View details</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setSelectedDeal(deal); setModalMode('edit'); setShowDealModal(true); }}><Edit2 size={12} className="mr-2 text-blue-500"/> Edit Deal</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleLogCall(deal)}><PhoneCall size={12} className="mr-2 text-indigo-500"/> Log Call</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleAddNote(deal)}><NotebookPen size={12} className="mr-2 text-orange-500"/> Add Note</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(deal.id)}><Trash size={12} className="mr-2"/> Delete Deal</DropdownMenuItem>
    </>
  );

  if (loading && deals.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 md:pb-2 pb-2 space-y-4 flex flex-col h-full overflow-hidden relative w-full">
      <DealModal 
        isOpen={showDealModal} 
        onOpenChange={setShowDealModal} 
        mode={modalMode} 
        deal={selectedDeal}
        initialStage={initialStage}
        onClose={() => setInitialStage(undefined)}
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
          relatedTo: selectedDeal?.id 
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
          relatedTo: selectedDeal?.id
        }}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Deal <span className="text-blue-600 italic">Core</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md">
            <Button variant={activeView === "list" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("list")}><ListIcon size={14} className="mr-2" /> List View</Button>
            <Button variant={activeView === "kanban" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("kanban")}><LayoutGrid size={14} className="mr-2" /> Pipeline</Button>
          </div>
          <Button 
            onClick={() => { setSelectedDeal(null); setModalMode('create'); setShowDealModal(true); }} 
            className="h-12 px-8 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> New Deal
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            placeholder="SEARCH BY NAME, ORGANIZATION..." 
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
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col min-h-0 h-full">
            <CRMTable 
              entities={filteredDeals} 
              config={config} 
              updateEntity={updateEntity} 
              deleteEntity={deleteEntity} 
              updateConfig={updateConfig} 
              onEntityClick={(deal) => router.push(`/crm/deals/${deal.id}?from=list`)}
              selectedIds={selectedIds}
              onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              onSelectAll={setSelectedIds}
              addEntity={(data) => {
                  const dealName = data.name || (data.organization ? `${data.organization} - Deal` : 'New Deal');
                  return addEntity({ name: dealName, data });
              }}
              pageSize={pageSize}
              setPageSize={setPageSize}
              actions={dealActions}
            />
          </motion.div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col min-h-0 h-full">
            <CRMKanban 
              entities={filteredDeals} 
              config={config} 
              updateEntity={updateEntity} 
              addEntity={addEntity}
              deleteEntity={deleteEntity} 
              updateConfig={updateConfig} 
              onEntityClick={(deal) => router.push(`/crm/deals/${deal.id}?from=kanban`)}
              onQuickAdd={handleKanbanQuickAdd}
              actions={dealActions}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <DealsPageContent />
    </Suspense>
  );
}
