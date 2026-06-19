"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useCRMOrganizations } from "@/hooks/use-crm-organizations";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { 
  List as ListIcon, Plus, Search, 
  Filter, Download, ArrowUpDown, Loader2,
  ExternalLink, Eye, Edit2, Briefcase, PhoneCall, NotebookPen, Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { CRMTable } from "@/components/crm/shared/CRMTable";
import { OrgModal } from "@/components/crm/forms/OrgModal";
import { DealModal } from "@/components/crm/forms/DealModal";
import { CallModal } from "@/components/crm/forms/CallModal";
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { CRMEntity } from "@/hooks/use-crm-module";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

function OrganizationsPageContent() {
  const { user } = useAuth();
  const { entities: organizations, config, updateEntity, deleteEntity, updateConfig, pageSize, setPageSize, addEntity, loading } = useCRMOrganizations();
  const { addEntity: addNote } = useCRMNotes();
  const { addEntity: addCall } = useCRMCalls();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "revenue" | "updated">("updated");
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null);
  
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedOrg, setSelectedOrg] = useState<CRMEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOrgs = useMemo(() => {
    let result = organizations.filter(o => !o.isDeleted);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => {
        const name = (o.name || "").toLowerCase();
        const orgName = (o.data?.organizationName || "").toLowerCase();
        const website = (o.data?.website || "").toLowerCase();
        return name.includes(q) || orgName.includes(q) || website.includes(q);
      });
    }

    if (filterIndustry) {
      result = result.filter(o => o.data?.industry === filterIndustry);
    }
    
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "revenue") return (Number(b.data?.annualRevenue) || 0) - (Number(a.data?.annualRevenue) || 0);
      if (sortBy === "updated") {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
        return timeB - timeA;
      }
      return 0;
    });
    return result;
  }, [organizations, searchQuery, sortBy, filterIndustry]);

  const handleLaunchDeal = (org: CRMEntity) => { setSelectedOrg(org); setShowDealModal(true); };
  const handleLogCall = (org: CRMEntity) => { setSelectedOrg(org); setShowCallModal(true); };
  const handleAddNote = (org: CRMEntity) => { setSelectedOrg(org); setShowNoteModal(true); };

  const handleNoteSubmit = async (noteData: any) => {
    await addNote({ 
      name: `Note for ${selectedOrg?.name}`,
      data: { ...noteData, relatedTo: selectedOrg!.id } 
    });
    toast.success("Note added successfully!");
    setShowNoteModal(false);
  };

  const handleCallSubmit = async (callData: any) => {
    await addCall({ 
      name: `Call with ${selectedOrg?.name}`,
      data: { ...callData, relatedTo: selectedOrg!.id } 
    });
    toast.success("Call logged successfully!");
    setShowCallModal(false);
  };

  const orgActions = (org: CRMEntity) => (
    <>
      <DropdownMenuItem className="text-[10px] font-black uppercase" onClick={() => router.push(`/crm/organizations/${org.id}`)}><ExternalLink size={12} className="mr-2 text-blue-500"/> Open Organization</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setSelectedOrg(org); setModalMode('preview'); setShowOrgModal(true); }}><Eye size={12} className="mr-2 text-blue-500"/> View Profile</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setSelectedOrg(org); setModalMode('edit'); setShowOrgModal(true); }}><Edit2 size={12} className="mr-2 text-blue-500"/> Edit Details</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleLaunchDeal(org)}><Briefcase size={12} className="mr-2 text-green-500"/> Launch Deal</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleLogCall(org)}><PhoneCall size={12} className="mr-2 text-indigo-500"/> Log Call</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleAddNote(org)}><NotebookPen size={12} className="mr-2 text-orange-500"/> Add Note</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(org.id)}><Trash size={12} className="mr-2"/> Delete Organization</DropdownMenuItem>
    </>
  );

  if (loading && organizations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 flex flex-col h-full overflow-hidden relative w-full">
      <OrgModal 
        isOpen={showOrgModal} 
        onOpenChange={setShowOrgModal} 
        mode={modalMode} 
        organization={selectedOrg}
      />
      <DealModal 
        isOpen={showDealModal} 
        onOpenChange={setShowDealModal} 
        mode="create" 
        deal={null}
        initialData={{ 
          organization: selectedOrg?.data.organizationName || selectedOrg?.name, 
          name: `${selectedOrg?.name} - Deal` 
        }} 
      />
      <CallModal 
        isOpen={showCallModal} 
        onOpenChange={setShowCallModal} 
        mode="create" 
        call={null} 
        organizations={organizations}
        onSubmit={handleCallSubmit} 
        initialData={{ 
          from: user?.displayName, 
          relatedTo: selectedOrg?.id 
        }}
      />
      <NoteModal 
        isOpen={showNoteModal} 
        onOpenChange={setShowNoteModal} 
        mode="create" 
        note={null} 
        organizations={organizations}
        onSubmit={handleNoteSubmit} 
        initialData={{ 
          relatedTo: selectedOrg?.id
        }}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Organizations <span className="text-blue-600 italic">Hub</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md">
            <Button variant="secondary" size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all"><ListIcon size={14} className="mr-2" /> List View</Button>
          </div>
          <Button 
            onClick={() => { setSelectedOrg(null); setModalMode('create'); setShowOrgModal(true); }} 
            className="h-12 px-8 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> New Organization
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            placeholder="SEARCH BY NAME, WEBSITE, OR REVENUE..." 
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
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("revenue")}>Sort by Revenue</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("updated")}>Sort by Updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm"><Filter size={14} className="mr-2 text-blue-500" /> Industry: {filterIndustry || 'All'}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterIndustry(null)}>All Industries</DropdownMenuItem>
              {config.fields.find(f => f.key === 'industry')?.options?.map(i => (
                <DropdownMenuItem key={i.value} className="text-[10px] font-bold uppercase" onClick={() => setFilterIndustry(i.value)}>{i.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" disabled className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest opacity-40 px-6 shadow-sm"><Download size={14} className="mr-2 text-blue-500" /> Export</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col min-h-0">
          <CRMTable 
            entities={filteredOrgs} config={config} updateEntity={updateEntity} deleteEntity={deleteEntity} updateConfig={updateConfig} 
            onEntityClick={(o) => router.push(`/crm/organizations/${o.id}`)} selectedIds={selectedIds} onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onSelectAll={setSelectedIds} 
            addEntity={addEntity} pageSize={pageSize} setPageSize={setPageSize} actions={orgActions}
          />
        </motion.div>
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

export default function OrganizationsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <OrganizationsPageContent />
    </Suspense>
  );
}
