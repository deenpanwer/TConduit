"use client";

import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useCRM, FieldConfig } from "@/hooks/use-crm";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddLeadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: string;
}

export function AddLeadModal({ isOpen, onOpenChange, initialStatus }: AddLeadModalProps) {
  const { addEntity, config } = useCRM();
  const [loading, setLoading] = useState(false);
  
  const leadFields = config.modules.leads.fields;
  
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    leadFields.forEach((f: FieldConfig) => {
      initial[f.key] = f.key === 'status' ? (initialStatus || 'new') : '';
    });
    return initial;
  });

  React.useEffect(() => {
    if (isOpen && initialStatus && typeof initialStatus === 'string') {
      setFormData(prev => ({ ...prev, status: initialStatus }));
    }
  }, [isOpen, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Derive name if not explicitly provided
    const name = formData.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || "Unnamed Lead";
    
    if (!name) {
      toast.error("Please enter at least a name or first/last name.");
      return;
    }

    setLoading(true);
    try {
      const finalData = { ...formData, name };
      const id = await addEntity('lead', finalData); // Use addEntity for creating a new lead
      if (id) {
        toast.success("Lead added successfully!");
        onOpenChange(false);
        const reset: Record<string, any> = {};
        leadFields.forEach((f: FieldConfig) => { reset[f.key] = ''; });
        setFormData(reset);
      }
    } catch (err) {
      console.error("Error adding lead:", err); // Log the error for debugging
      toast.error("Failed to add lead. Please try again.");
    } finally {
      setLoading(false);
    }
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Create New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {leadFields
              .filter((f: FieldConfig) => f.isVisible)
              .sort((a: FieldConfig, b: FieldConfig) => a.order - b.order)
              .map((field: FieldConfig) => (
                <div 
                  key={field.id} 
                  className={cn(
                    "space-y-2",
                    field.type === 'textarea' && "md:col-span-2"
                  )}
                >
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    {field.label} {field.isSystem && field.key === 'name' ? '*' : ''}
                  </Label>
                  
                  {field.type === 'select' ? (
                    <Select 
                      value={formData[field.key] || ""} 
                      onValueChange={v => setFormData({ ...formData, [field.key]: v })}
                    >
                      <SelectTrigger className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10">
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <Textarea 
                      value={formData[field.key] || ""}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl min-h-[120px] resize-none focus:resize-y transition-all"
                    />
                  ) : field.type === 'currency' ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input 
                        type="number"
                        value={formData[field.key] || ""}
                        onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })}
                        className="pl-7 bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10"
                      />
                    </div>
                  ) : (
                    <Input 
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={formData[field.key] || ""}
                      onChange={e => setFormData({ ...formData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10"
                    />
                  )}
                </div>
              ))}
          </div>

          <DialogFooter className="pt-6 border-t border-border/20">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
