"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Edit3, Trash2, Save, Clock, User, StickyNote, FileEdit
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CRMEntity, useCRM } from "@/hooks/use-crm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotePreviewModalProps {
  note: CRMEntity | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'preview' | 'edit';
}

export function NotePreviewModal({ note, isOpen, onOpenChange, initialMode = 'preview' }: NotePreviewModalProps) {
  const [isEditing, setIsEditing] = useState(initialMode === 'edit');
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { updateEntity, deleteEntity, addEntity } = useCRM();

  useEffect(() => {
    if (note && isOpen) {
      setTitle(note.name || "");
      setContent(note.data.content || "");
      setIsEditing(initialMode === 'edit');
    }
  }, [note, isOpen, initialMode]);

  if (!note) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Note title cannot be empty");
      return;
    }

    try {
      if (note.id === null) { // Check if it's a new note (id is null)
        // Call addEntity for new notes
        const savedNote = await addEntity('note', { name: title, content: content, relatedTo: note.data.relatedTo });
        if (savedNote) {
          toast.success("Note created successfully");
          onOpenChange(false); // Close the modal after successful creation
          // Note: Parent might need to refresh the list of notes.
        } else {
          // If addEntity returns null/undefined without throwing, this branch is hit.
          toast.error("Failed to create note. Please try again.");
        }
      } else {
        // Call updateEntity for existing notes
        await updateEntity(note.id, { name: title, content: content });
        toast.success("Note saved successfully");
        setIsEditing(false); // Stay in modal, exit edit mode
      }
    } catch (error) {
      console.error("Error saving note:", error);
      if (note.id === null) {
        toast.error("An error occurred while creating the note. Please try again.");
      } else {
        toast.error("An error occurred while saving the note. Please try again.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this note?")) {
      await deleteEntity(note.id);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] h-[85vh] flex flex-col p-0 border-border/40 bg-card/95 backdrop-blur-xl gap-0 overflow-hidden rounded-[2rem] shadow-2xl">
        
        <DialogHeader className="p-6 border-b border-border/20 flex flex-row items-center justify-between shrink-0 space-y-0 bg-secondary/5">
          <div className="flex items-center gap-4 flex-1">
            <div className="size-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
              <StickyNote size={22} />
            </div>
            <div className="flex-1 mr-4">
              {isEditing ? (
                <div className="px-3 py-1.5 rounded-xl bg-background border border-border/40 focus-within:border-blue-500/50 transition-all shadow-sm">
                  <input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-7 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-lg font-bold placeholder:opacity-50"
                    placeholder="Note Title..."
                    autoFocus
                  />
                </div>
              ) : (
                <DialogTitle className="text-xl font-bold truncate">
                  {title}
                </DialogTitle>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Clock size={10} className="text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)} 
              className="rounded-xl h-9 border-border/60 text-[10px] font-black uppercase tracking-widest bg-background hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all px-5"
            >
              <Edit3 size={14} className="mr-2" /> Edit
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isEditing ? (
            <div className="flex-1 flex flex-col bg-background/50">
              <div className="px-8 py-3 border-b border-border/10 bg-secondary/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileEdit size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">Editor Mode</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter opacity-50 border-none">Markdown Supported</Badge>
              </div>
              
              <div className="flex-1 p-6">
                <div className="h-full w-full rounded-[1.5rem] border border-border/40 bg-background overflow-hidden focus-within:border-blue-500/50 transition-all shadow-inner">
                  <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    className="w-full h-full border-none focus:outline-none focus:ring-0 p-8 text-base font-medium resize-none bg-transparent custom-scrollbar leading-relaxed"
                    placeholder="Type your notes here. You can use # Headings, **Bold**, [Links] etc..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 h-full overflow-y-auto custom-scrollbar bg-transparent">
              <div className="prose prose-md dark:prose-invert max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-foreground/90 prose-p:leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "_This note has no content yet._"}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-secondary/30 border-t border-border/20 shrink-0 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 ml-2">
            <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <User size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-none mb-1">Assigned Context</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                {note.data.relatedTo || "Internal Intelligence"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (note.id === null) { // If it's a new, unsaved note
                      onOpenChange(false); // Close the modal
                    } else { // If it's an existing note
                      setIsEditing(false); // Just exit edit mode, stay in preview
                    }
                  }} 
                  className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest px-5 hover:bg-background transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-10 text-[10px] font-black uppercase tracking-widest px-7 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Save size={14} className="mr-2" /> Save Note
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleDelete} 
                  className="rounded-xl h-10 w-10 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all border border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={18} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleClose} 
                  className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest px-5 bg-background border border-border/40"
                >
                  Close
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}