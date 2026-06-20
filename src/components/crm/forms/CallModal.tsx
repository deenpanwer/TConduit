"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCRMCalls } from '@/hooks/use-crm-calls';
import { CRMEntity, FieldConfig } from '@/hooks/use-crm-module';
import { Settings, ArrowLeft } from 'lucide-react';
import { FieldEditor } from './FieldEditor';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

import { CRMPhoneInput } from '../shared/CRMPhoneInput';

interface CallModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: 'create' | 'edit' | 'preview' | 'configure';
  call: CRMEntity | null;
  leads?: CRMEntity[];
  organizations?: CRMEntity[];
  contacts?: CRMEntity[];
  onSubmit?: (data: any) => void;
  initialStage?: string;
  initialData?: Record<string, any>;
  onClose?: () => void;
}

export function CallModal({ isOpen, onOpenChange, mode: initialMode, call, leads = [], organizations = [], contacts = [], onSubmit, initialStage, initialData, onClose }: CallModalProps) {
  const { addEntity, updateEntity, config, updateConfig } = useCRMCalls();
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
        if ((initialMode === 'edit' || initialMode === 'preview') && call) {
            setFormData({ ...call.data, name: call.name });
        } else if (initialMode === 'create') {
            const newFormData: Record<string, any> = { ...initialData };
            if (initialStage) {
                const stageField = config.fields.find(f => f.key === 'status');
                if (stageField) { newFormData[stageField.key] = initialStage; }
            }
            setFormData(newFormData);
        } else {
            setFormData({});
        }
    }
  }, [isOpen, initialMode, call, initialStage, initialData, config.fields]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const entityData = { ...formData };
    const callSummary = entityData.summary || `Call log ${new Date().getTime()}`;

    if (onSubmit) {
      onSubmit(entityData);
    } else {
      if (currentMode === 'create') {
        await addEntity({ name: callSummary, data: entityData });
      } else if (currentMode === 'edit' && call) {
        await updateEntity(call.id, { ...entityData, name: callSummary });
      }
    }
    handleClose();
  };

  const handleConfigSave = async () => {
    const listView = config.views.find(v => v.type === 'list') || config.views[0];
    const updatedViews = config.views.map(v => {
       if (v.id === listView?.id) {
           return { ...v, visibleFields: editedFields.filter(f => f.isVisible).map(f => f.id) };
       }
       return v;
    });
    await updateConfig({ fields: editedFields, views: updatedViews });
    setCurrentMode(previousMode);
  }

  const handleClose = () => {
    onOpenChange(false);
    if (onClose) { onClose(); }
  };

  const renderField = (field: FieldConfig) => {
    const listView = config.views.find(v => v.type === 'list') || config.views[0];
    const isVisibleInList = listView?.visibleFields?.includes(field.id);
    
    if (!field.isVisible || !isVisibleInList) return null;
    const value = formData[field.key] || "";

    const label = (
      <label htmlFor={field.key} className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block px-1">
        {field.label}
      </label>
    );

    if (field.key === 'relatedTo') {
      // Find name from either leads, organizations or contacts
      const relatedEntity = leads.find(l => l.id === value) || organizations.find(o => o.id === value) || contacts.find(c => c.id === value);
      const displayName = value ? (relatedEntity?.name || value) : 'N/A';
      return (
        <div key={field.key} className="space-y-1">
          {label}
          <Input 
              id={field.key} 
              value={displayName}
              className="h-12 bg-secondary/5 border-border/20 rounded-xl text-[11px] font-bold focus:ring-blue-500/20 px-4" 
              disabled
          />
        </div>
      );
    }

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
          case 'create': return 'Create New Call Log';
          case 'edit': return 'Edit Call Log';
          case 'preview': return 'Call Details';
          case 'configure': return 'Configure Call Fields';
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
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">{getTitle()}</DialogTitle>
            </div>
          </div>
          {currentMode !== 'configure' && (
            <Button variant="ghost" size="icon" onClick={() => {
                setPreviousMode(currentMode);
                setEditedFields(config.fields);
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
                {config.fields.sort((a, b) => {
                  const listView = config.views.find(v => v.type === 'list') || config.views[0];
                  const idxA = listView?.visibleFields.indexOf(a.id) ?? -1;
                  const idxB = listView?.visibleFields.indexOf(b.id) ?? -1;
                  if (idxA === -1 && idxB === -1) return a.order - b.order;
                  if (idxA === -1) return 1;
                  if (idxB === -1) return -1;
                  return idxA - idxB;
                }).map(renderField)}
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
                    {currentMode === 'create' ? 'Launch Call Log' : 'Save Changes'}
                    </Button>
                )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
