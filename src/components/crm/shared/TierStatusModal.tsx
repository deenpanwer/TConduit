import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'Free' | 'Standard' | 'Premium';
  leadsUsed: number;
  quotaLimit: number | 'Unlimited';
}

const TIERS = [
  {
    name: 'Free',
    leadLimit: '1,500',
  },
  {
    name: 'Standard',
    leadLimit: '4,500',
  },
  {
    name: 'Premium',
    leadLimit: '9,500',
  }
];

export function TierStatusModal({ isOpen, onClose, tier, leadsUsed, quotaLimit }: TierStatusModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] p-6 bg-background border-border shadow-2xl rounded-2xl">
        <DialogHeader className="mb-4 text-center">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
            Account Limits
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of database access by plan.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4">
          {TIERS.map((t) => {
            const isCurrent = t.name === tier;
            return (
              <div 
                key={t.name}
                className={cn(
                  "relative p-6 rounded-2xl border flex flex-col transition-all duration-200",
                  isCurrent 
                    ? "border-blue-500 bg-blue-500/[0.03] shadow-sm shadow-blue-500/10" 
                    : "border-border/60 bg-card hover:border-border"
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                    Current Plan
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-foreground mt-2">{t.name}</h3>
                
                <div className="mt-8 flex-1 space-y-6">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Lead Database
                    </div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2.5">
                      <div className="size-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-blue-500" />
                      </div>
                      {t.leadLimit} leads
                    </div>
                  </div>
                </div>

                {isCurrent && quotaLimit !== 'Unlimited' && (
                  <div className="mt-8 pt-5 border-t border-border/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead Usage</span>
                      <span className="text-xs font-bold font-mono">
                        {leadsUsed.toLocaleString()} / {quotaLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (leadsUsed / (quotaLimit as number)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto text-xs font-bold px-8 rounded-xl h-10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
