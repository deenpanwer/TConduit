"use client";

import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { History, RotateCcw, Archive, Users, Loader2 } from "lucide-react";

interface DeletedGroupsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deletedGroups: any[];
  onRestoreGroup: (groupId: string) => Promise<void>;
}

export function DeletedGroupsModal({
  isOpen,
  onOpenChange,
  deletedGroups,
  onRestoreGroup
}: DeletedGroupsModalProps) {
  const [restoringGroupId, setRestoringGroupId] = useState<string | null>(null);

  const handleRestore = async (groupId: string) => {
    setRestoringGroupId(groupId);
    try {
      await onRestoreGroup(groupId);
    } catch (err) {
      console.error("Failed to restore group:", err);
    } finally {
      setRestoringGroupId(null);
    }
  };

  const formatDelDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
      return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return "Recently";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl p-6 rounded-2xl gap-4">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <History className="h-4.5 w-4.5" />
            </div>
            Deleted Groups History
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Audited archive of deleted group chats. Leadership can restore groups to active conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-1 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
          {deletedGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Archive className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No deleted groups found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">All active group conversations are healthy.</p>
            </div>
          ) : (
            deletedGroups.map((group) => {
              const isRestoring = restoringGroupId === group.id;
              const delDateStr = formatDelDate(group.deletedAt);

              return (
                <div
                  key={group.id}
                  className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700 shrink-0">
                        {group.photoUrl ? (
                          <AvatarImage src={group.photoUrl} alt={group.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Users className="h-4.5 w-4.5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 text-left">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">{group.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          Created by {group.createdByName || "Admin"} • {group.members?.length || 0} collaborators
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleRestore(group.id)}
                      disabled={isRestoring}
                      className="h-8 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Deletion Audit Trail */}
                  <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/15 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Deleted by <span className="font-bold">{group.deletedByName || "Admin"}</span>
                    </span>
                    <span className="text-slate-400 font-mono">
                      {delDateStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="sm:justify-end border-t border-slate-200 dark:border-slate-800 pt-3">
          <Button onClick={() => onOpenChange(false)} variant="ghost" className="rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
