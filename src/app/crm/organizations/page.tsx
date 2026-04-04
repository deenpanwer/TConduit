"use client";

import React, { useState } from "react";
import { useCRMOrganizations } from "@/hooks/use-crm-organizations";
import { useCRM } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { 
  List as ListIcon, Plus, Search, 
  ArrowUpDown, Loader2, Filter, Download,
  Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CRMTable } from "@/components/crm/shared/CRMTable";

export default function OrganizationsPage() {
  const { 
    entities, config, loading, updateEntity, deleteEntity, updateConfig, 
    pageSize, setPageSize, addEntity, searchQuery, setSearchQuery,
    sortBy, setSortBy, sortDirection, setSortDirection
  } = useCRMOrganizations();
  
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Basic Search & Sort UI state (consistent with Deals)
  const handleCreateOrg = () => {
    // In a full implementation, this might open a modal
    toast.info("Add a new row directly in the table below.");
  };

  if (loading && entities.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen relative max-w-[1600px] mx-auto overflow-hidden">
      
      {/* Floating Action Bar for Selection */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-xl border-2 border-blue-500/20 shadow-2xl rounded-[2.5rem] p-4 flex items-center gap-6"
          >
            <div className="flex items-center gap-3 px-6 border-r border-border/20 mr-2">
              <div className="bg-blue-600 text-white size-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-500/30">{selectedIds.length}</div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Organizations Selected</span>
            </div>
            <div className="flex items-center gap-3 pr-2">
              <Button variant="outline" size="sm" onClick={async () => { if (confirm(`Delete ${selectedIds.length} items?`)) { await Promise.all(selectedIds.map(id => deleteEntity(id))); setSelectedIds([]); }}} className="h-11 rounded-2xl text-red-500 hover:bg-red-500/10 border-red-500/20 font-black text-[10px] uppercase px-8 transition-all active:scale-95">Delete Permanently</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-11 rounded-2xl font-black text-[10px] uppercase px-8 hover:bg-secondary/50">Dismiss</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-[0.15em] border border-blue-500/20">Corporate Directory</span>
             <div className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase font-poppins leading-none">Global <span className="text-blue-600 italic">Entities</span></h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">High-fidelity organizational intelligence & relationship mapping.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md">
            <Button variant="secondary" size="sm" className="h-10 px-6 text-[10px] font-black uppercase rounded-xl transition-all shadow-sm"><ListIcon size={14} className="mr-2" /> Spreadsheet View</Button>
          </div>
          <Button onClick={handleCreateOrg} className="h-14 px-10 font-black text-[11px] uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-600/20 transition-all active:scale-95 group"><Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform" /> Add Organization</Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-[2rem] border border-border/20 backdrop-blur-sm">
        <div className="relative flex-1 max-w-2xl group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input placeholder="SEARCH COMPANIES, WEBSITES, OR REVENUE..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-14 h-14 bg-background/50 border-border/40 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest focus-visible:ring-blue-500/20 shadow-inner" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-14 rounded-[1.25rem] border-border/40 bg-background/50 font-black text-[10px] uppercase tracking-widest hover:bg-background px-8 shadow-sm">
                <ArrowUpDown size={14} className="mr-3 text-blue-500" /> Sort: {sortBy || 'Latest'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-2xl shadow-2xl">
              <DropdownMenuItem className="text-[10px] font-black uppercase p-4" onClick={() => { setSortBy('organizationName'); setSortDirection('asc'); }}>Sort by Name (A-Z)</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-black uppercase p-4" onClick={() => { setSortBy('annualRevenue'); setSortDirection('desc'); }}>Sort by Revenue (Highest)</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-black uppercase p-4" onClick={() => { setSortBy('createdAt'); setSortDirection('desc'); }}>Sort by Created (Newest)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="h-14 rounded-[1.25rem] border-border/40 bg-background/50 font-black text-[10px] uppercase tracking-widest hover:bg-background px-8 shadow-sm group">
            <Filter size={14} className="mr-3 text-blue-500 group-hover:rotate-180 transition-transform" /> Filter
          </Button>
          
          <Button variant="outline" className="h-14 w-14 p-0 rounded-[1.25rem] border-border/40 bg-background/50 hover:bg-background shadow-sm">
            <Download size={18} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
          <CRMTable 
            entities={entities} 
            config={config} 
            updateEntity={updateEntity} 
            deleteEntity={deleteEntity} 
            updateConfig={updateConfig} 
            onEntityClick={(org) => router.push(`/crm/organizations/${org.id}`)}
            selectedIds={selectedIds}
            onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={setSelectedIds}
            addEntity={(data) => addEntity({ data })}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </motion.div>
      </div>
    </div>
  );
}