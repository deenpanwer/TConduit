"use client";

import React, { useState } from "react";
import {
    CheckCircle2, XCircle, AlertCircle,
    ArrowRight, FileEdit, Plus, Trash2,
    ChevronRight, Calendar, User, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TaskProposalVisualizerProps {
    proposalId: string;
    orgId: string;
    actionType: "create" | "update" | "delete";
    params: any;
    message?: string;
}

export function TaskProposalVisualizer({
    proposalId,
    orgId,
    actionType,
    params,
    message
}: TaskProposalVisualizerProps) {
    const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "loading">("pending");

    const handleAction = async (action: "approve" | "reject") => {
        setStatus("loading");
        try {
            const res = await fetch("/api/tasks/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proposalId, orgId, action }),
            });

            const data = await res.json();
            if (data.success) {
                setStatus(action === "approve" ? "approved" : "rejected");
                toast.success(action === "approve" ? "Proposal Approved" : "Proposal Rejected");
            } else {
                setStatus("pending");
                toast.error(data.error || "Failed to process proposal");
            }
        } catch (error) {
            console.error("Proposal error:", error);
            setStatus("pending");
            toast.error("Network error processing proposal");
        }
    };

    const isApproved = status === "approved";
    const isRejected = status === "rejected";
    const isPending = status === "pending";
    const isLoading = status === "loading";

    return (
        <div className={cn(
            "w-full max-w-lg border rounded-2xl overflow-hidden transition-all duration-500",
            isPending ? "bg-card border-border/60 shadow-lg" :
                isApproved ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 shadow-sm" :
                    "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 opacity-80"
        )}>
            {/* Header */}
            <div className={cn(
                "px-4 py-3 flex items-center justify-between border-b",
                isPending ? "bg-primary/5 border-primary/10 dark:bg-primary/10 dark:border-primary/20" :
                    isApproved ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/50" :
                        "bg-rose-50 border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/50"
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center",
                        isPending ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" :
                            isApproved ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white" :
                                "bg-rose-500 text-white dark:bg-rose-600 dark:text-white"
                    )}>
                        {actionType === "create" ? <Plus size={16} /> :
                            actionType === "update" ? <FileEdit size={16} /> :
                                <Trash2 size={16} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                            AI Task Proposal
                        </span>
                        <span className="text-xs font-bold capitalize text-foreground">
                            {actionType} Task
                        </span>
                    </div>
                </div>

                {isApproved && <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase"><CheckCircle2 size={14} /> Approved</div>}
                {isRejected && <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase"><XCircle size={14} /> Rejected</div>}
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                {message && (
                    <p className="text-xs text-muted-foreground font-medium italic">
                        "{message}"
                    </p>
                )}

                {/* Change Diff Visualizer */}
                <div className="space-y-3">
                    {actionType === "update" && (
                        <div className="space-y-2">
                            {Object.entries(params).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/30 dark:bg-secondary/20 border border-border/40 dark:border-border/20">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/70 dark:text-muted-foreground/90">
                                        <ChevronRight size={10} /> {key.replace(/([A-Z])/g, ' $1')}
                                    </div>
                                    <div className="text-[11px] font-medium leading-relaxed text-foreground/90 dark:text-foreground">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {actionType === "create" && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
                                <Hash size={14} className="text-primary/50 dark:text-primary/70" />
                                <span className="text-xs font-bold text-primary dark:text-primary/90">{params.title}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                                {params.description}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary dark:bg-secondary/50 text-foreground/70 dark:text-foreground/90 text-[9px] font-bold">
                                    <User size={10} /> {params.assigneeId || 'Team'}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary dark:bg-secondary/50 text-foreground/70 dark:text-foreground/90 text-[9px] font-bold">
                                    <AlertCircle size={10} /> {params.priority}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Actions */}
            <AnimatePresence>
                {isPending && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-3 bg-secondary/30 dark:bg-secondary/10 border-t dark:border-t-border/40 flex items-center justify-end gap-3"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction("reject")}
                            disabled={isLoading}
                            className="h-8 text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                            Reject
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAction("approve")}
                            disabled={isLoading}
                            className="h-8 px-5 rounded-full text-[10px] font-black uppercase tracking-wider gap-2 shadow-md shadow-primary/20"
                        >
                            {isLoading ? (
                                <div className="size-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : (
                                <CheckCircle2 size={14} />
                            )}
                            Approve Changes
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
