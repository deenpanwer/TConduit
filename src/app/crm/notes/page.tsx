"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useCRMNotes } from "@/hooks/use-crm-notes";
import { 
  LayoutGrid, List as ListIcon, Plus, Search, 
  Download, ArrowUpDown, Loader2,
  Eye, Edit2, Trash, StickyNote, Clock, ArrowRight
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
import { NoteModal } from "@/components/crm/forms/NoteModal";
import { CRMEntity } from "@/hooks/use-crm-module";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCRM } from "@/hooks/use-crm";

function NotesPageContent() {
  const { user } = useAuth();
  const { leads, organizations } = useCRM();
  const { entities: notes, config, updateEntity, deleteEntity, updateConfig, pageSize, setPageSize, addEntity, loading } = useCRMNotes();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeView = (searchParams.get("view") as "grid" | "list") || "grid";
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("updated");
  
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedNote, setSelectedNote] = useState<CRMEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setView = (view: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSelectedIds([]);
  };

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => !n.isDeleted);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => {
        const name = (n.name || "").toLowerCase();
        const content = (n.data?.content || "").toLowerCase();
        const relatedTo = (n.data?.relatedTo || "").toLowerCase();
        return name.includes(q) || content.includes(q) || relatedTo.includes(q);
      });
    }
    
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "updated") {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
        return timeB - timeA;
      }
      return 0;
    });
    return result;
  }, [notes, searchQuery, sortBy]);

  const handleOpenNote = (note: CRMEntity) => {
    setSelectedNote(note);
    setModalMode('preview');
    setShowNoteModal(true);
  };

  const handleEditNote = (note: CRMEntity) => {
    setSelectedNote(note);
    setModalMode('edit');
    setShowNoteModal(true);
  };

  const noteActions = (note: CRMEntity) => (
    <>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleOpenNote(note)}><Eye size={12} className="mr-2 text-blue-500"/> View Content</DropdownMenuItem>
      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleEditNote(note)}><Edit2 size={12} className="mr-2 text-blue-500"/> Edit Note</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(note.id)}><Trash size={12} className="mr-2"/> Delete Note</DropdownMenuItem>
    </>
  );

  if (loading && notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen relative max-w-[1600px] mx-auto">
      <NoteModal 
        isOpen={showNoteModal} 
        onOpenChange={setShowNoteModal} 
        mode={modalMode} 
        note={selectedNote}
        leads={leads}
        organizations={organizations}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Active Knowledge</span><span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" /></div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Intelligence <span className="text-blue-600 italic">Notes</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md">
            <Button variant={activeView === "grid" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("grid")}><LayoutGrid size={14} className="mr-2" /> Grid</Button>
            <Button variant={activeView === "list" ? "secondary" : "ghost"} size="sm" className="h-9 px-4 text-[10px] font-black uppercase rounded-xl transition-all" onClick={() => setView("list")}><ListIcon size={14} className="mr-2" /> List View</Button>
          </div>
          <Button 
            onClick={() => { setSelectedNote(null); setModalMode('create'); setShowNoteModal(true); }} 
            className="h-12 px-8 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 group">
            <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> New Note
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            autoFocus
            placeholder="SEARCH BY TITLE, CONTENT, OR RELATION..." 
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
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("updated")}>Sort by Updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" disabled className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest opacity-40 px-6 shadow-sm"><Download size={14} className="mr-2 text-blue-500" /> Export</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeView === "grid" ? (
            <motion.div 
              key="grid" 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredNotes.map(note => (
                <Card 
                  key={note.id} 
                  onClick={() => handleOpenNote(note)}
                  className="group border-border/40 bg-card/50 hover:bg-card hover:border-blue-500/30 transition-all cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 h-full flex flex-col"
                >
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <StickyNote size={20} />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-secondary/30 border-none">
                          {note.data.relatedTo ? (leads.find(l => l.id === note.data.relatedTo)?.name || organizations.find(o => o.id === note.data.relatedTo)?.name || 'Linked') : 'General'}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors line-clamp-1 uppercase tracking-tight">{note.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 mt-1 font-medium leading-relaxed">
                          {note.data.content || "No content captured..."}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-border/10">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <Clock size={10} /> {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CRMTable 
                entities={filteredNotes} config={config} updateEntity={updateEntity} deleteEntity={deleteEntity} updateConfig={updateConfig} 
                onEntityClick={handleOpenNote} selectedIds={selectedIds} onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onSelectAll={setSelectedIds} 
                addEntity={addEntity} pageSize={pageSize} setPageSize={setPageSize} actions={noteActions}
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

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}
