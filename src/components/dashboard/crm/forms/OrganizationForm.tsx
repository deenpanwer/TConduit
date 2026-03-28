"use client";

import React, { useState, useEffect } from "react";
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
import { useCRM, CRMEntity, FieldConfig, ModuleConfig } from "@/hooks/use-crm";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizationFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string; // For editing existing organization
}

export function OrganizationForm({ isOpen, onOpenChange, organizationId }: OrganizationFormProps) {
  const { addEntity, updateEntity, config } = useCRM();
  const [loading, setLoading] = useState(false);
  
  const module = config.modules.organizations;
  const organizationFields = module.fields;

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    organizationFields.forEach((f: FieldConfig) => {
      initial[f.key] = '';
    });
    return initial;
  });

  // Load existing data if editing
  useEffect(() => {
    if (isOpen && organizationId) {
      // Use the hook to get organizations context directly
      const { organizations } = useCRM();
      const orgToEdit = organizations.find(org => org.id === organizationId);
      if (orgToEdit) {
        const initialData: Record<string, any> = {};
        organizationFields.forEach((f: FieldConfig) => {
          // Populate from organization's data or fallback to its name for 'organizationName'
          initialData[f.key] = orgToEdit.data[f.key] !== undefined ? orgToEdit.data[f.key] : (f.key === 'organizationName' ? orgToEdit.name : '');
        });
        setFormData(initialData);
      }
    } else if (isOpen) {
      // Reset form for new entry
      const reset: Record<string, any> = {};
      organizationFields.forEach((f: FieldConfig) => { reset[f.key] = ''; });
      setFormData(reset);
    }
  }, [isOpen, organizationId, config.modules.organizations.fields]); // Re-run if config or ID changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orgName = formData.organizationName || `Unnamed Organization`; // Ensure a name is set

    if (!orgName) { // Basic check, can be expanded
      toast.error("Please enter an Organization Name.");
      return;
    }

    setLoading(true);
    try {
      const finalData = { ...formData, name: orgName }; // Ensure 'name' field for entity is set

      if (organizationId) {
        // Update existing organization
        await updateEntity(organizationId, finalData, "updated_organization");
        toast.success("Organization updated successfully!");
      } else {
        // Add new organization
        await addEntity('organization', finalData);
        toast.success("Organization added successfully!");
      }
      onOpenChange(false);
      // Reset form data after successful submission
      const reset: Record<string, any> = {};
      organizationFields.forEach((f: FieldConfig) => { reset[f.key] = ''; });
      setFormData(reset);
    } catch (err) {
      console.error("Error saving organization:", err);
      toast.error("Failed to save organization. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-bold tracking-tight">{organizationId ? "Edit Organization" : "Create New Organization"}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8"><X size={16} /></Button>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {organizationFields
              .filter((f: FieldConfig) => f.isVisible && !['street', 'city', 'state', 'zipCode', 'country'].includes(f.key)) // Exclude address fields for now
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
                    {field.label} {field.isSystem && field.key === 'organizationName' ? '*' : ''}
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
                        placeholder={`Enter ${field.label.toLowerCase()}`}
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

          {/* Address Section - Grouped based on common UI patterns */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {organizationFields.filter(f => f.key === 'street').map(field => (
                <div key={field.id} className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</Label>
                  <Input type="text" value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10" />
                </div>
              ))}
              {organizationFields.filter(f => f.key === 'city').map(field => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</Label>
                  <Input type="text" value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10" />
                </div>
              ))}
              {organizationFields.filter(f => f.key === 'state').map(field => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</Label>
                  <Input type="text" value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10" />
                </div>
              ))}
              {organizationFields.filter(f => f.key === 'zipCode').map(field => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</Label>
                  <Input type="text" value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10" />
                </div>
              ))}
              {organizationFields.filter(f => f.key === 'country').map(field => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</Label>
                  <Input type="text" value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={`Enter ${field.label.toLowerCase()}`} className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10" />
                </div>
              ))}
            </div>
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
              {organizationId ? "Update Organization" : "Save Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
