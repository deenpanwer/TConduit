"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface IssueWarningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    orgId?: string;
  } | null;
  onWarningIssued?: (warning: any) => void;
}

const WARNING_CATEGORIES = [
  { id: "attendance", label: "Attendance" },
  { id: "inactivity", label: "Inactivity" },
  { id: "deadlines", label: "Missed Deadlines" },
  { id: "conduct", label: "Conduct" },
  { id: "policy", label: "Policy Violation" },
  { id: "general", label: "General" },
];

const TIERS = [
  {
    tier: 1 as const,
    label: "Tier 1",
    name: "First Warning",
    desc: "Initial notice for minor issues",
  },
  {
    tier: 2 as const,
    label: "Tier 2",
    name: "Second Warning",
    desc: "Follow-up for repeat issues",
  },
  {
    tier: 3 as const,
    label: "Tier 3",
    name: "Final Warning",
    desc: "Critical notice before termination",
  },
];

export function IssueWarningModal({
  isOpen,
  onOpenChange,
  employee,
  onWarningIssued,
}: IssueWarningModalProps) {
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState("attendance");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user, userData } = useAuth();

  const issuerName = userData?.name || user?.displayName || "Management";
  const issuerRole = userData?.role || "Manager";
  const orgId = userData?.ownedOrgId || userData?.orgId || employee?.orgId || "";

  const handleTierSelect = (selectedTier: 1 | 2 | 3) => {
    setTier(selectedTier);
    const selectedCat = WARNING_CATEGORIES.find((c) => c.id === category)?.label || "Notice";
    if (selectedTier === 1) setTitle(`First Warning: ${selectedCat}`);
    else if (selectedTier === 2) setTitle(`Second Warning: ${selectedCat}`);
    else setTitle(`Final Warning: ${selectedCat}`);
  };

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    const catLabel = WARNING_CATEGORIES.find((c) => c.id === catId)?.label || "Notice";
    if (tier === 1) setTitle(`First Warning: ${catLabel}`);
    else if (tier === 2) setTitle(`Second Warning: ${catLabel}`);
    else setTitle(`Final Warning: ${catLabel}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id) {
      toast({ title: "Error", description: "No employee selected", variant: "destructive" });
      return;
    }

    if (!message.trim()) {
      toast({ title: "Reason Required", description: "Please provide details for this warning.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ems/issue-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: employee.id,
          targetUserName: employee.name || "Staff Member",
          orgId,
          issuerId: user?.uid,
          issuerName,
          issuerRole,
          tier,
          category: WARNING_CATEGORIES.find((c) => c.id === category)?.label || "General",
          title: title.trim() || `Tier ${tier} Warning`,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to issue warning");
      }

      toast({
        title: "Warning Sent",
        description: `Warning has been sent to ${employee.name || "employee"}.`,
      });

      if (onWarningIssued) {
        onWarningIssued(data.warning);
      }

      setMessage("");
      setTitle("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to Send Warning",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card shadow-2xl p-6 sm:p-8">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Issue Warning
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Recipient: <span className="font-medium text-foreground">{employee?.name || "Employee"}</span> {employee?.email ? `(${employee.email})` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-5 pt-2">
          {/* Warning Tier Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Warning Level
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIERS.map((item) => {
                const isSelected = tier === item.tier;
                return (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => handleTierSelect(item.tier)}
                    className={cn(
                      "flex flex-col text-left p-4 rounded-xl border transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <h5 className="font-semibold text-sm text-foreground">{item.name}</h5>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Category
            </Label>
            <div className="flex flex-wrap gap-2">
              {WARNING_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    category === cat.id
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary/70 border border-border/50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="warning-title" className="text-xs font-semibold text-muted-foreground">
              Subject
            </Label>
            <Input
              id="warning-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First Warning: Attendance"
              className="rounded-xl border-border bg-secondary/20 h-10 text-sm"
            />
          </div>

          {/* Reason & Details */}
          <div className="space-y-1.5">
            <Label htmlFor="warning-message" className="text-xs font-semibold text-muted-foreground">
              Reason & Details <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="warning-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue, context, or corrective actions required..."
              className="rounded-xl border-border bg-secondary/20 min-h-[100px] text-sm p-3"
              rows={3}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="rounded-xl font-semibold text-xs h-10 px-5 shadow-sm transition-all"
            >
              {isSubmitting ? "Sending..." : `Issue ${TIERS.find(t => t.tier === tier)?.name || "Warning"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
