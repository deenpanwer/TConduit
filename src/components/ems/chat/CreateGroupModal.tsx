"use client";

import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, X, Check, Loader2 } from "lucide-react";
import { getUserAvatar } from "@/lib/utils";

interface CreateGroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  onCreateGroup: (name: string, members: string[], imageFile: File | null) => Promise<void>;
}

export function CreateGroupModal({ isOpen, onOpenChange, employees, onCreateGroup }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleMember = (uid: string) => {
    setError(null);
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleRemoveMember = (uid: string) => {
    setSelectedMembers((prev) => prev.filter((id) => id !== uid));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selectedMembers.length === 0) {
      setError("Please select at least 1 member");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateGroup(groupName, selectedMembers, groupImageFile);
      // Reset state and close modal
      setGroupName("");
      setSelectedMembers([]);
      setGroupImageFile(null);
      setImagePreview(null);
      setSearchQuery("");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to create group:", err);
      setError(err.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedEmployeeDetails = (uid: string) => {
    return employees.find((emp) => emp.id === uid);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) {
        onOpenChange(open);
        setError(null);
        if (!open) {
          setGroupName("");
          setSelectedMembers([]);
          setGroupImageFile(null);
          setImagePreview(null);
          setSearchQuery("");
        }
      }
    }}>
      <DialogContent className="sm:max-w-[460px] bg-card/60 backdrop-blur-2xl border border-border/40 shadow-2xl p-6 rounded-3xl gap-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            Create New Group
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            Build a channel for teamwork. Set a group name and choose collaborators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Group Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground self-start">Group Avatar (Optional)</label>
            <div className="flex items-center gap-4 w-full bg-secondary/10 border border-border/10 p-3 rounded-2xl">
              <Avatar className="h-14 w-14 border border-border/40 shrink-0">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Users className="h-7 w-7" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 text-left">
                <input
                  id="modal-group-avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setGroupImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("modal-group-avatar")?.click()}
                  className="text-xs rounded-xl h-9 font-semibold bg-background hover:bg-secondary/30"
                  disabled={isSubmitting}
                >
                  Choose Group Image
                </Button>
                {groupImageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-[10px] text-destructive font-bold uppercase tracking-wider block mt-1 hover:underline ml-1"
                    disabled={isSubmitting}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Group Name input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Group Name</label>
            <Input
              placeholder="e.g. Operations, Marketing, Sync"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError(null);
              }}
              className="h-11 bg-secondary/30 border-border/20 rounded-xl px-4 text-xs font-semibold focus-visible:ring-primary/20"
              disabled={isSubmitting}
            />
          </div>

          {/* Selected badges list */}
          {selectedMembers.length > 0 && (
            <div className="space-y-1.5 animate-in fade-in duration-300">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Selected Participants ({selectedMembers.length})
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-1 scrollbar-thin">
                {selectedMembers.map((uid) => {
                  const emp = getSelectedEmployeeDetails(uid);
                  if (!emp) return null;
                  return (
                    <Badge 
                      key={uid} 
                      variant="secondary" 
                      className="gap-1 pl-1.5 pr-1 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 text-xs font-semibold border border-primary/10 transition-all"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={getUserAvatar(emp)} />
                        <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="max-w-[80px] truncate">{emp.name || emp.email?.split("@")[0]}</span>
                      <button 
                        onClick={() => handleRemoveMember(uid)}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-0.5 rounded-full p-0.5"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members search & scrollable selection list */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 bg-secondary/30 border-border/20 rounded-xl text-xs font-semibold focus-visible:ring-primary/20"
                disabled={isSubmitting}
              />
            </div>

            <ScrollArea className="h-[180px] border border-border/20 rounded-2xl bg-secondary/15 p-2 mt-1">
              {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <p className="text-xs text-muted-foreground/60 italic font-medium">No team members found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredEmployees.map((emp) => {
                    const isChecked = selectedMembers.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => !isSubmitting && handleToggleMember(emp.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none ${
                          isChecked 
                            ? "bg-primary/5 border border-primary/20 shadow-sm" 
                            : "hover:bg-secondary/30 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border/30">
                            <AvatarImage src={getUserAvatar(emp)} />
                            <AvatarFallback className="text-xs font-bold">{emp.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-left min-w-0">
                            <p className="text-xs font-bold truncate leading-snug">{emp.name || emp.email?.split("@")[0]}</p>
                            <p className="text-[10px] text-muted-foreground capitalize font-semibold truncate leading-none mt-0.5">
                              {emp.role || "Employee"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center pr-1.5">
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked 
                              ? "bg-primary border-primary text-primary-foreground shadow" 
                              : "border-muted-foreground/30 bg-transparent"
                          }`}>
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl font-semibold animate-shake">
            {error}
          </p>
        )}

        <DialogFooter className="sm:justify-end gap-2.5 border-t border-border/20 pt-4 shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold px-6 shadow-lg shadow-primary/10 transition-transform active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
