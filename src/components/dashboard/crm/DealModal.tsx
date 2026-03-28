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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCRM, FieldConfig, CRMEntity } from "@/hooks/use-crm";
import { toast } from "sonner";
import { Loader2, Building2, Globe, DollarSign, Users, Briefcase, User, Mail, Phone, Info, Tag, Edit3, Eye, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DealModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit' | 'preview';
  dealId?: string;
  initialStatus?: string;
  initialData?: Record<string, any>;
}

export function DealModal({ isOpen, onOpenChange, mode = 'create', dealId, initialStatus, initialData }: DealModalProps) {
  const { addEntity, updateEntity, entities, config, loading: crmLoading } = useCRM();
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(mode);
  
  const dealFields = config.modules.deals.fields;
  const currentDeal = entities.find(e => e.id === dealId);
  
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    if (activeMode !== 'create' && currentDeal) {
      setFormData(currentDeal.data);
    } else {
      const initial: Record<string, any> = {};
      dealFields.forEach((f: FieldConfig) => {
        initial[f.key] = f.key === 'status' ? (initialStatus || 'qualification') : '';
      });
      if (initialData) {
        Object.assign(initial, initialData);
      }
      setFormData(initial);
    }
  }, [isOpen, activeMode, currentDeal, initialStatus, dealFields, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Derive deal name from organization or person
    const name = formData.organization || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || "Unnamed Deal";
    
    setLoading(true);
    try {
      const finalData = { ...formData, name };
      if (activeMode === 'create') {
        const newDeal = await addEntity('deal', finalData);
        if (newDeal) {
            toast.success("Deal created successfully!");
        }
      } else if (activeMode === 'edit' && dealId) {
        await updateEntity(dealId, finalData);
        toast.success("Deal updated successfully!");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const organizations = entities.filter(e => e.type === 'organization').map(o => ({ label: o.name, value: o.name }));
  
  const renderField = (field: FieldConfig) => {
    if (activeMode === 'preview') {
      const value = formData[field.key] || '-';
      return (
        <div key={field.id} className="space-y-1 p-3 rounded-2xl bg-secondary/10 border border-border/5">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{field.label}</p>
          {field.type === 'select' ? (
            <Badge variant="secondary" className="text-[10px] font-bold uppercase">
              {field.options?.find(o => o.value === value)?.label || value}
            </Badge>
          ) : (
            <p className="text-xs font-bold truncate">{value}</p>
          )}
        </div>
      );
    }

    // Special handling for Organization and Industry (dropdown + input)
    if (field.key === 'organization' || field.key === 'industry') {
      const options = field.key === 'organization' ? organizations : (field.options || []);
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            {field.label}
          </Label>
          <div className="relative group">
            <Input 
              value={formData[field.key] || ""}
              onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
              placeholder={`Type or select ${field.label.toLowerCase()}...`}
              className="bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10 pr-10"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity">
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-[200px] overflow-y-auto border-border bg-card/95 backdrop-blur-xl">
                  {options.length > 0 ? (
                    options.map(opt => (
                      <DropdownMenuItem 
                        key={opt.value} 
                        className="text-xs font-bold"
                        onSelect={() => setFormData({ ...formData, [field.key]: opt.value })}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-2 text-[10px] text-muted-foreground text-center font-bold">No suggestions found</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={field.id} 
        className={cn(
          "space-y-2",
          field.type === 'textarea' && "md:col-span-2"
        )}
      >
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          {field.label} {field.isSystem && field.key === 'status' ? '*' : ''}
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
        ) : field.type === 'currency' ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">PKR</span>
            <Input 
              type="number"
              value={formData[field.key] || ""}
              onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })}
              className="pl-12 bg-secondary/30 border-transparent focus:bg-secondary/50 rounded-xl h-10"
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
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar",
        activeMode === 'preview' ? "sm:max-w-[500px]" : "sm:max-w-[800px]"
      )}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                {activeMode === 'create' ? <Briefcase size={20} /> : activeMode === 'edit' ? <Edit3 size={20} /> : <Eye size={20} />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {activeMode === 'create' ? 'Launch New Deal' : activeMode === 'edit' ? 'Edit Deal Details' : 'Deal Intelligence'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-medium">
                  {activeMode === 'preview' && currentDeal ? `Captured on ${format(new Date(currentDeal.createdAt), 'MMM d, yyyy')}` : 'Structure your business opportunity.'}
                </p>
              </div>
            </div>
            {activeMode === 'preview' && (
              <Button size="sm" variant="outline" className="rounded-xl h-8 text-[10px] font-black uppercase tracking-widest border-blue-500/30 text-blue-500 hover:bg-blue-500/10" onClick={() => setActiveMode('edit')}>
                Edit Deal
              </Button>
            )}
          </div>
        </DialogHeader>

        {activeMode === 'preview' ? (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {dealFields.slice(0, 6).map(renderField)}
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
              <div className="flex items-center gap-2">
                <User size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Point of Contact</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {dealFields.slice(6).map(renderField)}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {dealFields
                .filter((f: FieldConfig) => f.isVisible)
                .sort((a: FieldConfig, b: FieldConfig) => a.order - b.order)
                .map(renderField)}
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
                {activeMode === 'create' ? 'Launch Deal' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
