"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useCRM, CRMEntity } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, List as ListIcon, Plus, Search, 
  StickyNote, Clock, ArrowRight, FileText, MoreVertical,
  Eye, Trash2, Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { NotePreviewModal } from "@/components/dashboard/crm/NotePreviewModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NoteSkeleton = () => (
  <div className="p-4 rounded-2xl bg-card border border-border/40 space-y-3 animate-pulse">
    <div className="h-4 bg-secondary rounded-full w-3/4" />
    <div className="space-y-2">
      <div className="h-3 bg-secondary rounded-full w-full" />
      <div className="h-3 bg-secondary rounded-full w-5/6" />
    </div>
    <div className="flex justify-between pt-2">
      <div className="h-3 bg-secondary rounded-full w-1/4" />
      <div className="h-3 bg-secondary rounded-full w-1/5" />
    </div>
  </div>
);

export default function NotesPage() {
  const { notes, loading, addEntity, deleteEntity } = useCRM();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeView = (searchParams.get("view") as "grid" | "list") || "grid";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<CRMEntity | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'preview' | 'edit'>('preview');

  const setView = (view: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => !n.isDeleted);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.name.toLowerCase().includes(q) || 
        n.data.content?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery]);

  const handleCreateNote = async () => {
    // Prepare a temporary object for a new note to be saved upon modal confirmation.
    const tempNewNote: CRMEntity = {
      id: `new-note-${Date.now()}`, // Use a placeholder string for new notes until saved by backend
      name: "New Intelligence Note",
      data: { content: "", relatedTo: "General" },
      createdAt: new Date().toISOString(), // Placeholder, will be set by backend on save
      updatedAt: new Date().toISOString(), // Placeholder, will be set by backend on save
      isDeleted: false,
      // Added missing CRMEntity properties with placeholder values
      orgId: "default-org-id", // Placeholder for organization ID
      type: "note",           // Type of entity
      history: [],            // Initialize history as an empty array
      lastEditedBy: "unknown-user" // Placeholder for user ID
    };
    setSelectedNote(tempNewNote);
    setModalMode('edit'); // Always open in edit mode for creation
    setIsPreviewOpen(true);
  };

  const handleOpenNote = (note: CRMEntity, mode: 'preview' | 'edit' = 'preview') => {
    setSelectedNote(note);
    setModalMode(mode);
    setIsPreviewOpen(true);
  };

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this note?")) {
      await deleteEntity(id);
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen bg-background">
      <NotePreviewModal 
        note={selectedNote} 
        isOpen={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen}
        initialMode={modalMode}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground font-medium text-sm">Your knowledge base and private records.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl border border-border/40 backdrop-blur-md">
            <Button 
              variant={activeView === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              className={cn(
                "h-8 text-[10px] font-black uppercase rounded-lg transition-all",
                activeView === "grid" ? "bg-background shadow-sm opacity-100" : "opacity-50"
              )}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={12} className="mr-2" /> Grid
            </Button>
            <Button 
              variant={activeView === "list" ? "secondary" : "ghost"} 
              size="sm" 
              className={cn(
                "h-8 text-[10px] font-black uppercase rounded-lg transition-all",
                activeView === "list" ? "bg-background shadow-sm opacity-100" : "opacity-50"
              )}
              onClick={() => setView("list")}
            >
              <ListIcon size={12} className="mr-2" /> List
            </Button>
          </div>
          <Button 
            onClick={handleCreateNote}
            className="h-10 px-6 font-bold text-xs uppercase bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
          >
            <Plus size={16} className="mr-2" /> Create Note
          </Button>
        </div>
      </div>

      <div className="relative max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
        <Input 
          placeholder="Search your notes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 bg-card/50 border-border/60 rounded-xl text-sm focus:ring-blue-500/20" 
        />
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className={cn("gap-6", activeView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-3")}>
            {[...Array(6)].map((_, i) => <NoteSkeleton key={i} />)}
          </div>
        ) : (
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
                            {note.data.relatedTo || 'General'}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors line-clamp-1">{note.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 mt-1 font-medium leading-relaxed">
                            {note.data.content || "No content..."}
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
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-border/40 bg-card/30 overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border/20">
                      <th className="p-4 font-black uppercase tracking-widest text-[10px]">Title</th>
                      <th className="p-4 font-black uppercase tracking-widest text-[10px]">Related To</th>
                      <th className="p-4 font-black uppercase tracking-widest text-[10px]">Last Updated</th>
                      <th className="p-4 w-12 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotes.map(note => (
                      <tr 
                        key={note.id} 
                        onClick={() => handleOpenNote(note)}
                        className="border-b border-border/10 hover:bg-secondary/20 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-muted-foreground group-hover:text-blue-500" />
                            <span className="font-bold text-sm">{note.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                            {note.data.relatedTo || 'General'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical size={14} className="text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/40 bg-card/95 backdrop-blur-md">
                              <DropdownMenuItem onClick={() => handleOpenNote(note, 'preview')} className="text-xs font-bold uppercase tracking-tight">
                                <Eye size={14} className="mr-2" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenNote(note, 'edit')} className="text-xs font-bold uppercase tracking-tight">
                                <Edit size={14} className="mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => handleDeleteNote(e, note.id)} 
                                className="text-xs font-bold uppercase tracking-tight text-red-500 focus:text-red-500 focus:bg-red-500/10"
                              >
                                <Trash2 size={14} className="mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}