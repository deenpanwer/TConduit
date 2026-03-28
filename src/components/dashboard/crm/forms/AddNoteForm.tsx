"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddNoteFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function AddNoteForm({ onSubmit, onCancel }: AddNoteFormProps) {
  const [content, setContent] = useState("");

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Note Content</Label>
        <Textarea 
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Enter your note here..."
          className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl min-h-[150px]"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onCancel} className="rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</Button>
        <Button onClick={() => onSubmit({ content })} className="bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest px-8">Add Note</Button>
      </div>
    </div>
  );
}
