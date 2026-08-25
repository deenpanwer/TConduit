"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2, ShieldCheck, AlertTriangle, Trash2 } from "lucide-react";
import { getUserAvatar } from "@/lib/utils";

interface ManageGroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  group: any;
  employees: any[];
  currentUserId: string;
  isLeadership?: boolean;
  onUpdateGroup: (groupId: string, name: string, members: string[], imageFile: File | null, removeImage?: boolean) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;
}

export function ManageGroupModal({
  isOpen,
  onOpenChange,
  group,
  employees,
  currentUserId,
  isLeadership = false,
  onUpdateGroup,
  onDeleteGroup
}: ManageGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when group or modal opens
  useEffect(() => {
    if (group && isOpen) {
      setGroupName(group.name || "");
      setSelectedMembers(group.members ? [...group.members] : []);
      setImagePreview(group.photoUrl || null);
      setGroupImageFile(null);
      setRemoveImage(false);
      setShowDeleteConfirm(false);
      setSearchQuery("");
      setError(null);
    }
  }, [group, isOpen]);

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleMember = (uid: string) => {
    setError(null);
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selectedMembers.length < 2) {
      setError("Group must have at least 2 collaborators");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdateGroup(group.id, groupName.trim(), selectedMembers, groupImageFile, removeImage);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update group:", err);
      setError(err.message || "Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteGroup || !group?.id) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onDeleteGroup(group.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to delete group:", err);
      setError(err.message || "Failed to delete group");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting && !isDeleting) {
        onOpenChange(open);
        setError(null);
      }
    }}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl p-6 rounded-2xl gap-4">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-4.5 w-4.5" />
            </div>
            Manage Group Chat
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Update group name, avatar, and manage active collaborators in this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-1">
          {/* Creator & Meta info banner */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Created By</p>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-xs mt-1">{group.createdByName || "Organization Admin"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Collaborators</p>
              <p className="font-bold text-blue-600 dark:text-blue-400 text-xs mt-1">{selectedMembers.length} active</p>
            </div>
          </div>

          {/* 2-Column Grid: Avatar & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Group Avatar */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Group Avatar</label>
              <div className="flex items-center gap-3 w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 p-2.5 rounded-xl h-[62px]">
                <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800 shrink-0">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <input
                    id="modal-edit-group-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGroupImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                        setRemoveImage(false);
                      }
                    }}
                    disabled={isSubmitting || isDeleting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("modal-edit-group-avatar")?.click()}
                    className="text-xs rounded-lg h-7 px-2.5 font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={isSubmitting || isDeleting}
                  >
                    Change Avatar
                  </Button>
                  {(imagePreview || groupImageFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setGroupImageFile(null);
                        setImagePreview(null);
                        setRemoveImage(true);
                      }}
                      className="text-[9px] text-red-500 font-bold uppercase tracking-wider block mt-0.5 hover:underline"
                      disabled={isSubmitting || isDeleting}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Group Name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Group Name</label>
              <div className="flex items-center h-[62px]">
                <Input
                  placeholder="e.g. Operations, Marketing, Sync"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    setError(null);
                  }}
                  className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs w-full"
                  disabled={isSubmitting || isDeleting}
                />
              </div>
            </div>
          </div>

          {/* Members search & Collaborators Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Manage Collaborators</label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{selectedMembers.length} selected</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search roster members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8.5 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg text-xs"
                disabled={isSubmitting || isDeleting}
              />
            </div>

            <ScrollArea className="h-[180px] border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 p-1.5">
              {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <p className="text-xs text-slate-400 italic">No team members found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredEmployees.map((emp) => {
                    const empId = emp.id || emp.uid;
                    const isChecked = selectedMembers.includes(empId);
                    const isCreator = empId === group.createdBy;
                    const isMe = empId === currentUserId;

                    return (
                      <div
                        key={empId}
                        onClick={() => !isSubmitting && !isDeleting && handleToggleMember(empId)}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer select-none ${
                          isChecked 
                            ? "bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700 shrink-0">
                            <AvatarImage src={getUserAvatar(emp)} />
                            <AvatarFallback className="text-[10px] font-bold">{emp.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div className="text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">{emp.name || emp.email?.split("@")[0]}</p>
                              {isCreator && (
                                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold">
                                  Creator
                                </Badge>
                              )}
                              {isMe && !isCreator && (
                                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 capitalize font-medium leading-none mt-0.5">
                              {emp.role || "Employee"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center pr-1 pointer-events-none">
                          <Checkbox checked={isChecked} className="h-4 w-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Soft Delete Group Section */}
          {showDeleteConfirm ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2 text-left">
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Are you sure you want to delete this group?</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                The group will be archived and hidden from team chats. Leaders can restore it anytime from History.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-7 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="h-7 text-xs rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                  Confirm Delete
                </Button>
              </div>
            </div>
          ) : (
            (isLeadership || group.createdBy === currentUserId) && onDeleteGroup && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Delete Group Chat</p>
                  <p className="text-[10px] text-slate-400">Soft delete this group with audit trail</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-8 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Group
                </Button>
              </div>
            )
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl font-semibold">
            {error}
          </p>
        )}

        <DialogFooter className="sm:justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-semibold h-9 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            disabled={isSubmitting || isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || isDeleting}
            className="rounded-xl text-xs font-bold px-5 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-transform active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
