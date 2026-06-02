"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCRMLeads } from '@/hooks/use-crm-leads';
import { CRMEntity, FieldConfig } from '@/hooks/use-crm-module';
import { Settings, ArrowLeft } from 'lucide-react';
import { FieldEditor } from './FieldEditor';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

import { CRMPhoneInput } from '../shared/CRMPhoneInput';

interface LeadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: 'create' | 'edit' | 'preview' | 'configure';
  lead: CRMEntity | null;
  initialStage?: string;
  onClose?: () => void;
}

export function LeadModal({ isOpen, onOpenChange, mode: initialMode, lead, initialStage, onClose }: LeadModalProps) {
  // Corrected: use 'updateConfig' from the specialized hook
  const { addEntity, updateEntity, config, updateConfig } = useCRMLeads();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [previousMode, setPreviousMode] = useState(initialMode);
  const [editedFields, setEditedFields] = useState<FieldConfig[]>([]);

  useEffect(() => {
    setCurrentMode(initialMode);
    if (initialMode === 'configure') {
      setEditedFields(config.fields);
    }

    if (isOpen) {
        if ((initialMode === 'edit' || initialMode === 'preview') && lead) {
            setFormData({ ...lead.data, name: lead.name });
        } else if (initialMode === 'create') {
            const initialData: Record<string, any> = {};
            if (initialStage) {
                const stageField = config.fields.find(f => f.key === 'status');
                if (stageField) { initialData[stageField.key] = initialStage; }
            }
            setFormData(initialData);
        } else {
            setFormData({});
        }
    }
  }, [isOpen, initialMode, lead, initialStage, config.fields]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const entityData = { ...formData };
    const firstName = entityData[config.fields.find(f => f.key === 'firstName')?.key || '' ] || '';
    const lastName = entityData[config.fields.find(f => f.key === 'lastName')?.key || '' ] || '';
    
    // Improved name logic: if name is not explicitly set, use firstName or firstName + lastName
    let leadName = entityData.name;
    if (!leadName || leadName.trim() === '') {
        leadName = `${firstName} ${lastName}`.trim();
    }
    if (!leadName || leadName.trim() === '') {
        leadName = firstName || `Unnamed Lead ${new Date().getTime()}`;
    }

    if (currentMode === 'create') {
      await addEntity({ name: leadName, data: entityData });
    } else if (currentMode === 'edit' && lead) {
      await updateEntity(lead.id, { ...entityData, name: leadName });
    }
    handleClose();
  };

  const handleConfigSave = async () => {
    // Corrected: Call the 'updateConfig' function
    await updateConfig({ fields: editedFields });
    console.log("New lead field configuration saved!");
    setCurrentMode(previousMode);
  }

  const handleClose = () => {
    onOpenChange(false);
    if (onClose) { onClose(); }
  };

  const renderField = (field: FieldConfig) => {
    // Only show fields that are in the list view's visibleFields
    const listView = config.views.find(v => v.type === 'list') || config.views[0];
    const isVisibleInList = listView?.visibleFields?.includes(field.id);
    
    // During creation/edit, we might want to show all visible fields or just list-visible ones.
    // The user said: "we show the non hidden fields where which means in this crm whatever columns the employer has set we only show them in the individual leads page okay... and edit the leadsmodal to comply with this logic"
    if (!field.isVisible || !isVisibleInList) return null;
    const value = formData[field.key] || "";

    const label = (
      <label htmlFor={field.key} className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block px-1">
        {field.label}
      </label>
    );

    switch (field.type) {
      case 'phone':
        return (
          <div key={field.key} className="space-y-1">
            {label}
            <CRMPhoneInput
              value={value}
              onChange={(val) => handleInputChange(field.key, val)}
              disabled={currentMode === 'preview'}
              placeholder={`ENTER ${field.label.toUpperCase()}...`}
              context="modal"
            />
          </div>
        );
      case 'text': case 'email': case 'textarea': case 'number': case 'currency':
        return (
          <div key={field.key} className="space-y-1">
            {label}
            <Input 
                id={field.key} 
                value={value}
                onChange={e => {
                    const val = e.target.value;
                    if ((field.type === 'number' || field.type === 'currency') && val !== "" && Number(val) < 0) return;
                    handleInputChange(field.key, val);
                }} 
                className="h-12 bg-secondary/5 border-border/20 rounded-xl text-[11px] font-bold focus:ring-blue-500/20 px-4" 
                disabled={currentMode === 'preview'}
                type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                placeholder={`ENTER ${field.label.toUpperCase()}...`}
            />
          </div>
        );
      case 'select':
        return (
            <div key={field.key} className="space-y-1">
                {label}
                <Select value={value} onValueChange={v => handleInputChange(field.key, v)} disabled={currentMode === 'preview'} >
                    <SelectTrigger className="h-12 bg-secondary/5 border-border/20 rounded-xl text-[11px] font-bold focus:ring-blue-500/20 px-4">
                        <SelectValue placeholder={`SELECT ${field.label.toUpperCase()}...`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl">
                        {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-[11px] font-bold uppercase tracking-wider py-3">
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
      case 'date':
        return (
          <div key={field.key} className="space-y-1">
            {label}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 w-full bg-secondary/5 border-border/20 rounded-xl text-[11px] font-bold focus:ring-blue-500/20 px-4 justify-start" disabled={currentMode === 'preview'}>
                  {value ? format(new Date(value), "PPP") : `SELECT ${field.label.toUpperCase()}...`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => {
                    if (date) handleInputChange(field.key, date.toISOString());
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      case 'timeline':
        const range = typeof value === 'string' ? JSON.parse(value || '{}') : (value || { from: undefined, to: undefined });
        return (
          <div key={field.key} className="space-y-1">
            {label}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 w-full bg-secondary/5 border-border/20 rounded-xl text-[11px] font-bold focus:ring-blue-500/20 px-4 justify-start truncate" disabled={currentMode === 'preview'}>
                  {range.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : `SELECT ${field.label.toUpperCase()}...`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={range.from ? new Date(range.from) : new Date()}
                  selected={{ 
                    from: range.from ? new Date(range.from) : undefined, 
                    to: range.to ? new Date(range.to) : undefined 
                  }}
                  onSelect={(newRange) => {
                    if (newRange?.from) {
                      handleInputChange(field.key, JSON.stringify({ from: newRange.from.toISOString(), to: newRange.to?.toISOString() }));
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      default: return null;
    }
  };
  const getTitle = () => {
      switch(currentMode) {
          case 'create': return 'Create New Lead';
          case 'edit': return 'Edit Lead';
          case 'preview': return 'Lead Profile';
          case 'configure': return 'Configure Lead Fields';
          default: return '';
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-card/95 backdrop-blur-2xl border-border/40 rounded-[2.5rem] shadow-3xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-8 pb-4 bg-secondary/5 border-b border-border/10 flex-row items-center justify-between">
          <div className='flex items-center gap-4'>
            {currentMode === 'configure' && (
                <Button variant="ghost" size="icon" onClick={() => setCurrentMode(previousMode)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Lead Intelligence</span>
                </div>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">{getTitle()}</DialogTitle>
            </div>
          </div>
          {currentMode !== 'configure' && (
            <Button variant="ghost" size="icon" onClick={() => {
                setPreviousMode(currentMode);
                setEditedFields(config.fields); // Initialize editor state on open
                setCurrentMode('configure');
            }}>
                <Settings className="h-5 w-5" />
            </Button>
          )}
        </DialogHeader>
        
        {currentMode === 'configure' ? (
            <FieldEditor 
                fields={editedFields} 
                onFieldsChange={setEditedFields} 
                availableTemplates={config.fields.filter(f => f.isSystem)}
            />
        ) : (
            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {config.fields.sort((a, b) => a.order - b.order).map(renderField)}
              </div>
            </div>
        )}
        
        <DialogFooter className="p-8 bg-secondary/5 border-t border-border/10">
          {currentMode === 'configure' ? (
            <>
                <Button type="button" variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-6" onClick={() => setCurrentMode(previousMode)}>Cancel</Button>
                <Button 
                  type="button" 
                  onClick={handleConfigSave}
                  className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Save Configuration
                </Button>
            </>
          ) : (
            <>
                <Button type="button" variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-6" onClick={handleClose}>Cancel</Button>
                {currentMode !== 'preview' && (
                    <Button 
                    type="submit" 
                    onClick={handleSubmit}
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                    {currentMode === 'create' ? 'Launch Lead' : 'Save Changes'}
                    </Button>
                )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
