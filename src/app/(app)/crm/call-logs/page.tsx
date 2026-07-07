"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useCRMCalls } from "@/hooks/use-crm-calls";
import { 
  Plus, Search, Download, ArrowUpDown, Loader2,
  Eye, Edit2, Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { CRMTable } from "@/components/crm/shared/CRMTable";
import { CallModal } from "@/components/crm/forms/CallModal";
import { CRMEntity } from "@/hooks/use-crm-module";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCRM } from "@/hooks/use-crm";

function CallLogsPageContent() {
  const { user } = useAuth();
  const { leads, organizations, contacts } = useCRM();
  const { entities: calls, config, updateEntity, deleteEntity, updateConfig, pageSize, setPageSize, addEntity, loading } = useCRMCalls();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [showCallModal, setShowCallModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedCall, setSelectedCall] = useState<CRMEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredCalls = useMemo(() => {
    let result = calls.filter(c => !c.isDeleted);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => {
        const name = (c.name || "").toLowerCase();
        const summary = (c.data?.summary || "").toLowerCase();
        const from = (c.data?.from || "").toLowerCase();
        const to = (c.data?.to || "").toLowerCase();
        return name.includes(q) || summary.includes(q) || from.includes(q) || to.includes(q);
      });
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
  }, [calls, searchQuery, sortBy, config.fields]);

  const handleOpenCall = (call: CRMEntity) => {
    setSelectedCall(call);
    setModalMode('preview');
    setShowCallModal(true);
  };

  const handleEditCall = (call: CRMEntity) => {
    setSelectedCall(call);
    setModalMode('edit');
    setShowCallModal(true);
  };

  const callActions = (call: CRMEntity) => (
    <>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleOpenCall(call)}><Eye size={12} className="mr-2 text-blue-500"/> View Details</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleEditCall(call)}><Edit2 size={12} className="mr-2 text-blue-500"/> Edit Log</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(call.id)}><Trash size={12} className="mr-2"/> Delete Log</DropdownMenuItem>
    </>
  );

  if (loading && calls.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 flex flex-col h-full overflow-hidden relative w-full">
      <CallModal 
        isOpen={showCallModal} 
        onOpenChange={setShowCallModal} 
        mode={modalMode} 
        call={selectedCall}
        leads={leads}
        organizations={organizations}
        contacts={contacts}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Call <span className="text-blue-600 italic">Logs</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { setSelectedCall(null); setModalMode('create'); setShowCallModal(true); }} 
            className="h-12 px-8 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> Log New Call
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            placeholder="SEARCH SUMMARIES, NUMBERS, OR CONTACTS..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-12 h-12 bg-background/50 border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/20" 
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm">
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
          
          <Button variant="outline" size="sm" disabled className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest opacity-40 px-6 shadow-sm"><Download size={14} className="mr-2 text-blue-500" /> Export</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col min-h-0">
          <CRMTable 
            entities={filteredCalls} config={config} updateEntity={updateEntity} deleteEntity={deleteEntity} updateConfig={updateConfig} 
            onEntityClick={handleOpenCall} selectedIds={selectedIds} onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onSelectAll={setSelectedIds} 
            addEntity={addEntity} pageSize={pageSize} setPageSize={setPageSize} actions={callActions}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortToggle={(key) => { if (sortBy === key) setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(key); setSortDirection('desc'); } }}
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

export default function CallLogsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <CallLogsPageContent />
    </Suspense>
  );
}
