"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useCRMLeads } from "@/hooks/use-crm-leads";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { 
  LayoutGrid, List as ListIcon, Plus, Search, 
  Filter, Download, ArrowUpDown, Loader2, Check, Database,
  ExternalLink, Eye, Edit2, Briefcase, PhoneCall, NotebookPen, Trash, FileText, Upload, SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CRMTable } from "@/components/crm/shared/CRMTable";
import { CRMKanban } from "@/components/crm/shared/CRMKanban";
import { LeadModal } from "@/components/crm/forms/LeadModal";
import { DealModal } from "@/components/crm/forms/DealModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { CRMEntity } from "@/hooks/use-crm-module";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { LeadImportDrawer } from "@/components/crm/shared/LeadImportDrawer";
import { OutreachSetupModal } from "@/components/OutreachSetupModal";
import { Suspense } from "react";
import { useCrmFollowups } from "@/hooks/use-crm-followups";

function LeadsPageContent() {
  const { user, userData } = useAuth();
  const { employees } = useTeam();
  const { 
    entities: leads, 
    config, 
    updateEntity, 
    deleteEntity, 
    updateConfig, 
    pageSize, 
    setPageSize, 
    addEntity, 
    loading
  } = useCRMLeads();

  const orgId = userData?.ownedOrgId || userData?.orgId;
  useCrmFollowups(leads, user, orgId, config.fields);
  const { addEntity: addNote } = useCRMNotes();
  const { addEntity: addCall } = useCRMCalls();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStage, setFilterStage] = useState<string | null>(null);
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
  
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedLead, setSelectedLead] = useState<CRMEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportDrawer, setShowImportDrawer] = useState(false);

  // Outreach Setup states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("lead_finder_email_subject") || "Quick question re: {Company Name}" : "Quick question re: {Company Name}";
  });
  const [emailBody, setEmailBody] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("lead_finder_email_body") || 
      "Hi {First Name},\n\nI was doing some research on {Company Name} and noticed you lead the {Industry} team.\n\nAre you currently taking on new clients, or is your plate full for this quarter?\n\nBest,\n{User Name}" : "Hi {First Name},\n\nI was doing some research on {Company Name} and noticed you lead the {Industry} team.\n\nAre you currently taking on new clients, or is your plate full for this quarter?\n\nBest,\n{User Name}";
  });
  const [callScript, setCallScript] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("lead_finder_call_script") || 
      "Hello {First Name},\n\nI know I'm calling you completely out of the blue. Do you have 30 seconds for me to tell you why I called, and you can decide if it makes sense to keep talking?\n\n(Wait for agreement)\n\nGreat. I noticed that {Company Name} is active in {Industry}. We help organizations in your sector optimize workflow efficiency.\n\nHow are you currently handling that bottleneck, and are you seeing the results you expected, or is that becoming a challenge for your team?\n\n(Listen to response)\n\nI'm not suggesting we make any changes today, but I'd love to share how peers in your industry are benchmarking this. Do you have 15 minutes later this week to compare notes?" : "Hello {First Name},\n\nI know I'm calling you completely out of the blue. Do you have 30 seconds for me to tell you why I called, and you can decide if it makes sense to keep talking?\n\n(Wait for agreement)\n\nGreat. I noticed that {Company Name} is active in {Industry}. We help organizations in your sector optimize workflow efficiency.\n\nHow are you currently handling that bottleneck, and are you seeing the results you expected, or is that becoming a challenge for your team?\n\n(Listen to response)\n\nI'm not suggesting we make any changes today, but I'd love to share how peers in your industry are benchmarking this. Do you have 15 minutes later this week to compare notes?";
  });
  const [callMethod, setCallMethod] = useState<"system" | "google-voice" | "justcall" | "ringcentral">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lead_finder_call_method") as "system" | "google-voice" | "justcall" | "ringcentral") || "system";
    }
    return "system";
  });
  const [emailMethod, setEmailMethod] = useState<"gmail" | "outlook" | "yahoo">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lead_finder_email_method") as "gmail" | "outlook" | "yahoo") || "gmail";
    }
    return "gmail";
  });

  const handleSetCallMethod = (method: "system" | "google-voice" | "justcall" | "ringcentral") => {
    setCallMethod(method);
    if (typeof window !== "undefined") {
      localStorage.setItem("lead_finder_call_method", method);
    }
  };
  const handleSetEmailMethod = (method: "gmail" | "outlook" | "yahoo") => {
    setEmailMethod(method);
    if (typeof window !== "undefined") {
      localStorage.setItem("lead_finder_email_method", method);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lead_finder_email_subject", emailSubject);
      localStorage.setItem("lead_finder_email_body", emailBody);
      localStorage.setItem("lead_finder_call_script", callScript);
    }
  }, [emailSubject, emailBody, callScript]);

  const isManager = useMemo(() => {
    const u = userData as any;
    if (!u) return false;
    const role = u.role?.toLowerCase();
    return role !== "employee" || !!u.ownedOrgId;
  }, [userData]);

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
        
        let foundInData = false;
        if (l.data) {
          foundInData = Object.values(l.data).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          });
        }
        
        return name.includes(q) || foundInData;
      });
    }

    if (filterStage) {
      result = result.filter(l => l.data?.status === filterStage);
    }

    if (filterAssignedToMe && user) {
      result = result.filter(l => l.data?.assignedTo === user.uid || (l as any).assignedTo === user.uid);
    }

    result.sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortBy === "newest") {
        return (((b as any).createdAt || 0) - ((a as any).createdAt || 0)) * multiplier;
      }
      if (sortBy === "oldest") {
        return (((a as any).createdAt || 0) - ((b as any).createdAt || 0)) * multiplier;
      }
      
      const field = config.fields.find(f => f.key === sortBy);
      if (field) {
        const valA = a.data?.[sortBy];
        const valB = b.data?.[sortBy];
        
        if (field.type === "number" || field.type === "currency") {
          return ((Number(valB) || 0) - (Number(valA) || 0)) * multiplier;
        } else if (field.type === "date" || field.type === "timeline") {
          const timeA = valA ? new Date(valA).getTime() : 0;
          const timeB = valB ? new Date(valB).getTime() : 0;
          return (timeB - timeA) * multiplier;
        } else {
          return String(valA || "").localeCompare(String(valB || "")) * multiplier;
        }
      }

      // Default fallback
      return (((b as any).createdAt || 0) - ((a as any).createdAt || 0)) * multiplier;
    });
    return result;
  }, [leads, searchQuery, sortBy, sortDirection, filterStage, filterAssignedToMe, user, config.fields]);

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
    <div className="p-4 md:p-6 md:pb-2 pb-2 space-y-4 flex flex-col h-full overflow-hidden relative w-full">
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
      
      <OutreachSetupModal
        isOpen={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        emailSubject={emailSubject}
        emailBody={emailBody}
        callScript={callScript}
        callMethod={callMethod}
        setCallMethod={handleSetCallMethod}
        emailMethod={emailMethod}
        setEmailMethod={handleSetEmailMethod}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Leads <span className="text-blue-600 italic">Hub</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md">
            <Button variant={activeView === "list" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("list")}><ListIcon size={14} className="mr-2" /> List View</Button>
            <Button variant={activeView === "kanban" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("kanban")}><LayoutGrid size={14} className="mr-2" /> Kanban</Button>
          </div>
          {isManager && (
            <Button 
              onClick={() => setShowImportDrawer(true)} 
              variant="outline"
              className="h-9 px-4 font-black text-[10px] uppercase tracking-[0.1em] border-border/40 rounded-xl shadow-sm hover:bg-muted text-foreground"
            >
              <Upload size={14} className="mr-2 text-blue-500" /> Import CSV
            </Button>
          )}
          <Button 
            onClick={() => setIsTemplateModalOpen(true)} 
            variant="outline"
            className="h-9 px-4 font-black text-[10px] uppercase tracking-[0.1em] border-border/40 rounded-xl shadow-sm hover:bg-muted text-foreground"
          >
            <SlidersHorizontal size={14} className="mr-2 text-purple-500" /> Outreach
          </Button>
          <Button 
            onClick={() => { setSelectedLead(null); setModalMode('create'); setShowLeadModal(true); }} 
            className="h-9 px-5 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 group">
            <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" /> New Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            placeholder="SEARCH ACROSS ALL LEAD DATA..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-12 h-12 bg-background/50 border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/20" 
          />
        </div>
        <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm text-foreground shrink-0">
                <ArrowUpDown size={14} className="mr-2 text-blue-500" /> Sort: {
                  sortBy === "newest" ? "Newest First" : 
                  sortBy === "oldest" ? "Oldest First" : 
                  config.fields.find(f => f.key === sortBy)?.label || "Newest First"}
                  {sortBy !== "newest" && sortBy !== "oldest" && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl max-h-64 overflow-y-auto">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("newest")}>Newest First</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("oldest")}>Oldest First</DropdownMenuItem>
              <DropdownMenuSeparator />
              {config.fields.filter(f => f.isVisible).map(f => (
                <DropdownMenuItem key={f.key} className="text-[10px] font-bold uppercase" onClick={() => {
                  if (sortBy === f.key) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                  else { setSortBy(f.key); setSortDirection('desc'); }
                }}>
                  {f.label} {sortBy === f.key && (sortDirection === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm shrink-0"><Filter size={14} className="mr-2 text-blue-500" /> Stage: {filterStage || 'All'}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStage(null)}>All Stages</DropdownMenuItem>
              {config.fields.find(f => f.key === 'status')?.options?.map(s => (
                <DropdownMenuItem key={s.value} className="text-[10px] font-bold uppercase" onClick={() => setFilterStage(s.value)}>{s.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant={filterAssignedToMe ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
            className={cn(
              "h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm flex items-center shrink-0",
              filterAssignedToMe && "border-blue-500/30 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10"
            )}
          >
            <Check size={14} className={cn("mr-2 text-blue-500 opacity-30", filterAssignedToMe && "opacity-100")} /> 
            Assigned to me
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm shrink-0">
                <Database size={14} className="mr-2 text-blue-500" /> {pageSize === 1000000 ? 'All' : pageSize.toLocaleString()} Leads
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl rounded-xl shadow-2xl p-2">
              <DropdownMenuItem onClick={() => setPageSize(100)} className="text-[10px] font-black uppercase py-2.5 cursor-pointer flex justify-between items-center">
                <span>100 Leads</span> {pageSize === 100 && <Check size={12} className="text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPageSize(500)} className="text-[10px] font-black uppercase py-2.5 cursor-pointer flex justify-between items-center">
                <span>500 Leads</span> {pageSize === 500 && <Check size={12} className="text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPageSize(1000)} className="text-[10px] font-black uppercase py-2.5 cursor-pointer flex justify-between items-center">
                <span>1,000 Leads</span> {pageSize === 1000 && <Check size={12} className="text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPageSize(5000)} className="text-[10px] font-black uppercase py-2.5 cursor-pointer flex justify-between items-center">
                <span>5,000 Leads</span> {pageSize === 5000 && <Check size={12} className="text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPageSize(10000)} className="text-[10px] font-black uppercase py-2.5 cursor-pointer flex justify-between items-center">
                <span>10,000 Leads</span> {pageSize === 10000 && <Check size={12} className="text-blue-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPageSize(1000000)} className="text-[10px] font-black uppercase py-2.5 cursor-pointer flex justify-between items-center">
                <span>Load All</span> {pageSize === 1000000 && <Check size={12} className="text-blue-500" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeView === "list" ? (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col min-h-0">
              <CRMTable 
                entities={filteredLeads} config={config} updateEntity={updateEntity} deleteEntity={deleteEntity} updateConfig={updateConfig} 
                onEntityClick={(l) => router.push(`/crm/leads/${l.id}?from=${activeView}`)} selectedIds={selectedIds} onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onSelectAll={setSelectedIds} 
                addEntity={addEntity} pageSize={pageSize} setPageSize={setPageSize} actions={leadActions}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortToggle={(key) => { if (sortBy === key) setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDirection('desc'); } }}
          />
            </motion.div>
          ) : (
            <motion.div key="kanban" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col min-h-0">
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
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 rounded-2xl text-blue-500 hover:bg-blue-500/10 border-blue-500/20 font-black text-[10px] uppercase px-6">Assign</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                  <>
                    <DropdownMenuItem onClick={async () => {
                      await Promise.all(selectedIds.map(id => updateEntity(id, { assignedTo: "" })));
                      setSelectedIds([]);
                      toast.success("Unassigned selected leads");
                    }} className="text-[10px] font-black uppercase py-2 cursor-pointer">Unassigned</DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-border/20" />
                    {employees.map(emp => (
                      <DropdownMenuItem key={emp.id} onClick={async () => {
                        await Promise.all(selectedIds.map(id => updateEntity(id, { assignedTo: emp.id })));
                        setSelectedIds([]);
                        toast.success(`Assigned selected leads to ${emp.name}`);
                      }} className="flex items-center gap-2 text-[10px] font-bold uppercase py-2 cursor-pointer">
                        <Avatar className="size-5">
                          <AvatarImage src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${emp.email || emp.name || emp.id}`} />
                          <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {emp.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={async () => { if (confirm(`Delete items?`)) { await Promise.all(selectedIds.map(id => deleteEntity(id))); setSelectedIds([]); }}} className="h-10 rounded-2xl text-red-500 hover:bg-red-500/10 border-red-500/20 font-black text-[10px] uppercase px-6">Delete</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-10 rounded-2xl font-black text-[10px] uppercase px-6">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportDrawer && (
          <LeadImportDrawer 
            onClose={() => setShowImportDrawer(false)}
            config={config}
            addEntity={(payload) => addEntity(payload)}
            employees={employees}
            existingLeads={leads}
          />
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
