'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMCalls } from '@/hooks/use-crm-calls';
import { CRMEntity, FieldConfig } from '@/hooks/use-crm-module';
import { Settings, ArrowLeft } from 'lucide-react';
import { FieldEditor } from './FieldEditor';

interface CallModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: 'create' | 'edit' | 'preview' | 'configure';
  call: CRMEntity | null;
  leads: CRMEntity[];
  onSubmit: (data: any) => void;
  initialStage?: string;
  initialData?: Record<string, any>;
  onClose?: () => void;
}

export function CallModal({ isOpen, onOpenChange, mode: initialMode, call, leads, onSubmit, initialStage, initialData, onClose }: CallModalProps) {
  const { config, updateConfig } = useCRMCalls();
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

  const handleSubmitLocal = () => {
    onSubmit(formData);
    handleClose();
  };

  const handleConfigSave = async () => {
    await updateConfig({ fields: editedFields });
    console.log('New call field configuration saved!');
    setCurrentMode(previousMode);
  }

  const handleClose = () => {
    onOpenChange(false);
    if (onClose) { onClose(); }
  };

  const renderField = (field: FieldConfig) => {
    if (!field.isVisible) return null;
    let value = formData[field.key] || '';

    const label = (
      <label htmlFor={field.key} className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block px-1">
        {field.label}
      </label>
    );

    if (field.key === 'relatedTo') {
      const leadName = value ? (leads.find(l => l.id === value)?.name || 'N/A') : 'N/A';
      return (
        <div key={field.key} className="space-y-1">
          {label}
          <Input 
              id={field.key} 
              value={leadName}
              className="h-12 bg-secondary/5 border-border/20 rounded-xl text-[11px] font-bold focus:ring-blue-500/20 px-4" 
              disabled
          />
        </div>
      );
    }

    switch (field.type) {
      case 'text': case 'email': case 'phone': case 'textarea': case 'number': case 'currency':
        return (
          <div key={field.key} className="space-y-1">
            {label}
            <Input 
                id={field.key} 
                value={value}
                onChange={e => handleInputChange(field.key, e.target.value)} 
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
      default: return null;
    }
  };

  const getTitle = () => {
      switch(currentMode) {
          case 'create': return 'Create New Call';
          case 'edit': return 'Edit Call';
          case 'preview': return 'Call Profile';
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
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Call Intelligence</span>
                </div>
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
            <FieldEditor fields={editedFields} onFieldsChange={setEditedFields} />
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
                    onClick={handleSubmitLocal}
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                    {currentMode === 'create' ? 'Launch Call' : 'Save Changes'}
                    </Button>
                )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
