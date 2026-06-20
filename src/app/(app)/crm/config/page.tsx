"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCRM, FieldConfig, ModuleConfig, CRMConfig } from "@/hooks/use-crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, ChevronUp, ChevronDown,
  Layout, Database, Save, Loader2, X,
  Users, Briefcase, PhoneCall, StickyNote, Target, Building2,
  Info, Sparkles, Eye, EyeOff, AlertCircle, Check, ArrowRight,
  RotateCcw, History, AlignLeft, Settings2
} from "lucide-react";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const isFieldEqual = (a: FieldConfig, b: FieldConfig): boolean => {
  if (a.id !== b.id) return false;
  if (a.key !== b.key) return false;
  if (a.label !== b.label) return false;
  if ((a.description || "") !== (b.description || "")) return false;
  if (a.type !== b.type) return false;
  if (a.isSystem !== b.isSystem) return false;
  if (a.isVisible !== b.isVisible) return false;
  
  const optsA = a.options || [];
  const optsB = b.options || [];
  if (optsA.length !== optsB.length) return false;
  for (let i = 0; i < optsA.length; i++) {
    if (optsA[i].label !== optsB[i].label) return false;
    if (optsA[i].value !== optsB[i].value) return false;
    if (optsA[i].color !== optsB[i].color) return false;
  }
  return true;
};

const areFieldsEqual = (fieldsA: FieldConfig[], fieldsB: FieldConfig[]): boolean => {
  if (fieldsA.length !== fieldsB.length) return false;
  for (let i = 0; i < fieldsA.length; i++) {
    if (!isFieldEqual(fieldsA[i], fieldsB[i])) return false;
  }
  return true;
};

const ConfigFieldItem = ({
  field,
  index,
  totalFields,
  updateField,
  archiveField,
  toggleVisibility,
  addOption,
  updateOption,
  onMoveUp,
  onMoveDown
}: {
  field: FieldConfig;
  index: number;
  totalFields: number;
  updateField: (id: string, updates: Partial<FieldConfig>) => void;
  archiveField: (id: string) => void;
  toggleVisibility: (id: string) => void;
  addOption: (fieldId: string) => void;
  updateOption: (fieldId: string, idx: number, updates: any) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) => {
  return (
    <div 
      id={`field-card-${field.id}`}
      className={cn(
        "p-5 rounded-[1.5rem] bg-secondary/20 border border-border/20 transition-all hover:bg-secondary/30 relative",
        !field.isVisible && "opacity-60 bg-muted/10 grayscale-[0.5]"
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            {/* UP/DOWN CHEVRONS FOR REORDERING */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 bg-background/30 rounded-xl p-1 border border-border/20">
              <Button
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={onMoveUp}
                className="h-6 w-6 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-20 transition-all"
                title="Move Up"
              >
                <ChevronUp size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={index === totalFields - 1}
                onClick={onMoveDown}
                className="h-6 w-6 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-20 transition-all"
                title="Move Down"
              >
                <ChevronDown size={14} />
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Input 
                  value={field.label} 
                  disabled={field.isSystem && (field.key === 'name' || field.key === 'status')}
                  onChange={e => updateField(field.id, { label: e.target.value })}
                  className="h-8 bg-transparent border-none focus-visible:ring-0 font-black text-sm uppercase tracking-tight p-0 w-full"
                  placeholder="Detail Name (e.g. Budget)"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {field.isSystem ? (
                  <Badge className="bg-blue-500 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">Built-in</Badge>
                ) : (
                  <Badge className="bg-secondary text-muted-foreground border-none text-[8px] font-black uppercase px-2 py-0.5">Custom</Badge>
                )}
                {field.isVisible ? (
                  <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] font-black uppercase px-2 py-0.5">Active</Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-black uppercase px-2 py-0.5">Hidden</Badge>
                )}
                <div className="size-1 rounded-full bg-border" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{field.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-40">
              <Select 
                disabled={field.isSystem}
                value={field.type} 
                onValueChange={v => updateField(field.id, { type: v as any, options: v === 'select' ? [] : undefined })}
              >
                <SelectTrigger className="h-10 text-[9px] font-black uppercase tracking-widest border-border/40 bg-background/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl">
                  <SelectItem value="text" className="text-[9px] font-black uppercase tracking-widest">Short Text</SelectItem>
                  <SelectItem value="textarea" className="text-[9px] font-black uppercase tracking-widest">Long Text</SelectItem>
                  <SelectItem value="number" className="text-[9px] font-black uppercase tracking-widest">Number</SelectItem>
                  <SelectItem value="select" className="text-[9px] font-black uppercase tracking-widest">Choice List</SelectItem>
                  <SelectItem value="date" className="text-[9px] font-black uppercase tracking-widest">Calendar Date</SelectItem>
                  <SelectItem value="currency" className="text-[9px] font-black uppercase tracking-widest">Money Value</SelectItem>
                  <SelectItem value="email" className="text-[9px] font-black uppercase tracking-widest">Email Address</SelectItem>
                  <SelectItem value="phone" className="text-[9px] font-black uppercase tracking-widest">Phone Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center bg-background/50 rounded-xl border border-border/40 p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg transition-all", field.isVisible ? "text-blue-500 bg-blue-500/5" : "text-muted-foreground")}
                onClick={() => toggleVisibility(field.id)}
                title={field.isVisible ? "Hide Detail" : "Show Detail"}
              >
                {field.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </Button>
              
              {!field.isSystem && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg text-orange-500 hover:bg-orange-500/10"
                  onClick={() => archiveField(field.id)}
                  title="Move to Archive"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* DESCRIPTION FIELD */}
        <div className="space-y-1.5 pl-8">
          <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
            <AlignLeft size={10} /> Explanation for your team
          </Label>
          <Input 
            value={field.description || ""}
            onChange={e => updateField(field.id, { description: e.target.value })}
            className="h-10 bg-background/40 border-border/40 rounded-xl text-xs font-medium placeholder:italic"
            placeholder="Briefly describe what this info is used for..."
          />
        </div>

        {/* CHOICE LIST OPTIONS */}
        {field.type === 'select' && field.key !== 'status' && (
          <div className="mt-2 pt-6 border-t border-border/10 space-y-4">
            <div className="flex items-center justify-between ml-8">
              <div className="flex items-center gap-2">
                <Check className="size-3 text-blue-500" />
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/70">List Choices</Label>
              </div>
              <Button variant="outline" size="sm" onClick={() => addOption(field.id)} className="h-7 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest border-border/60 hover:bg-blue-500/5">Add Choice</Button>
            </div>
            <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {field.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 px-3 rounded-xl bg-background/40 border border-border/40 group/opt hover:border-blue-500/20 transition-all shadow-sm">
                  <Input 
                    value={opt.label} 
                    onChange={e => updateOption(field.id, idx, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="h-6 bg-transparent border-none focus-visible:ring-0 text-[10px] font-bold p-0 uppercase"
                    placeholder="Choice name..."
                  />
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 opacity-0 group-hover/opt:opacity-100 rounded-lg transition-opacity" onClick={() => {
                    const newOpts = field.options?.filter((_: any, i: number) => i !== idx);
                    updateField(field.id, { options: newOpts || [] });
                  }}>
                    <X size={10} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * MODULE SETUP COMPONENT
 */
const ModuleSetup = ({ 
  moduleKey, 
  config, 
  onSave,
  isSaving
}: { 
  moduleKey: keyof CRMConfig['modules'], 
  config: CRMConfig,
  onSave: (module: keyof CRMConfig['modules'], fields: FieldConfig[]) => Promise<void>,
  isSaving: boolean
}) => {
  const module = config.modules[moduleKey];
  
  // Local fields state - strictly managed by user actions
  const [localFields, setLocalFields] = useState<FieldConfig[]>([]);
  // Pristine saved fields state to track changes accurately
  const [savedFields, setSavedFields] = useState<FieldConfig[]>([]);
  // Archived fields that will be REMOVED from the blueprint on Save
  const [archivedFields, setArchivedFields] = useState<FieldConfig[]>([]);
  // Local confirmation state
  const [confirmHardDeleteId, setConfirmHardDeleteId] = useState<string | null>(null);

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...localFields];
    const temp = newFields[index];
    newFields[index] = newFields[index - 1];
    newFields[index - 1] = temp;
    setLocalFields(newFields);
  };

  const moveFieldDown = (index: number) => {
    if (index === localFields.length - 1) return;
    const newFields = [...localFields];
    const temp = newFields[index];
    newFields[index] = newFields[index + 1];
    newFields[index + 1] = temp;
    setLocalFields(newFields);
  };

  // We only re-initialize from the cloud blueprint when the tab changes (moduleKey)
  // or if the component is freshly mounted. This prevents flickers after saving.
  const [initialModuleKey, setInitialModuleKey] = useState<string | null>(null);

  useEffect(() => {
    if (module?.fields && initialModuleKey !== moduleKey) {
      const listView = module.views.find((v: any) => v.type === 'list') || module.views[0];
      const sortedFields = [...module.fields].sort((a, b) => {
          const idxA = listView?.visibleFields.indexOf(a.id) ?? -1;
          const idxB = listView?.visibleFields.indexOf(b.id) ?? -1;
          if (idxA === -1 && idxB === -1) return a.order - b.order;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
      });
      setLocalFields(sortedFields);
      setSavedFields(sortedFields);
      setArchivedFields([]);
      setInitialModuleKey(moduleKey);
    }
  }, [module?.fields, moduleKey, initialModuleKey]);

  const hasChanges = React.useMemo(() => {
    return !areFieldsEqual(localFields, savedFields) || archivedFields.length > 0;
  }, [localFields, savedFields, archivedFields]);

  const handleSave = async () => {
    // 1. Finalize the order based on the user's drag-and-drop actions
    const orderedFields = localFields.map((f, index) => ({
      ...f,
      order: index
    }));
    
    // 2. Perform the permanent cloud sync
    await onSave(moduleKey, orderedFields);
    
    // 3. Clear archived list and stay in this "Saved" state
    setArchivedFields([]);
    setSavedFields(orderedFields);
    setLocalFields(orderedFields);
    // We DON'T re-initialize here to prevent the UI from flickering 
    // before the Firestore snapshot trickles back down.
    toast.success("Blueprint saved to Cloud.");
  };

  const addField = () => {
    const newField: FieldConfig = { 
      id: `f_${Date.now()}`, 
      key: `custom_${Date.now()}`,
      label: "New Information Detail", 
      description: "",
      type: "text",
      isSystem: false,
      isVisible: true,
      order: localFields.length
    };
    setLocalFields([...localFields, newField]);
    toast.success("Added a new detail piece!");
  };

  const updateField = (id: string, updates: Partial<FieldConfig>) => {
    setLocalFields(localFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const archiveField = (id: string) => {
    const fieldToArchive = localFields.find(f => f.id === id);
    if (fieldToArchive) {
      setArchivedFields(prev => [...prev, fieldToArchive]);
      setLocalFields(localFields.filter(f => f.id !== id));
      toast.info("Moved to Archive. Hit Save to sync.");
    }
  };

  const restoreField = (id: string) => {
    const fieldToRestore = archivedFields.find(f => f.id === id);
    if (fieldToRestore) {
      setLocalFields([...localFields, fieldToRestore]);
      setArchivedFields(archivedFields.filter(f => f.id !== id));
      toast.success("Restored to active list.");
    }
  };

  const hardDeleteField = (id: string) => {
    setArchivedFields(archivedFields.filter(f => f.id !== id));
    setConfirmHardDeleteId(null);
    toast.success("Removed from this setup session.");
  };

  const toggleVisibility = (id: string) => {
    setLocalFields(localFields.map(f => {
      if (f.id === id) {
        const newVisible = !f.isVisible;
        toast.info(newVisible ? "This detail is now active." : "This detail is now hidden.");
        return { ...f, isVisible: newVisible };
      }
      return f;
    }));
  };

  const addOption = (fieldId: string) => {
    setLocalFields(localFields.map(f => {
      if (f.id === fieldId) {
        const options = f.options || [];
        return { ...f, options: [...options, { label: 'New Choice', value: `v_${Date.now()}`, color: 'gray' }] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId: string, idx: number, updates: any) => {
    setLocalFields(localFields.map(f => {
      if (f.id === fieldId && f.options) {
        const newOpts = [...f.options];
        newOpts[idx] = { ...newOpts[idx], ...updates };
        return { ...f, options: newOpts };
      }
      return f;
    }));
  };

  const statusField = localFields.find(f => f.key === 'status');

  return (
    <div className="space-y-10 pb-20">
      {/* STICKY ACTION HEADER */}
      <div className="sticky top-16 z-20 flex items-center justify-between bg-card/90 backdrop-blur-xl py-3 px-6 rounded-2xl border border-border/40 shadow-xl shadow-blue-500/5">
        <div className="space-y-0.5">
          <h2 className="text-lg font-black uppercase tracking-tight">{module?.name || 'Module'} Setup</h2>
          <p className="text-[10px] text-muted-foreground font-bold">{module?.description || 'Manage how you collect and see information.'}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-orange-500 font-bold text-[9px] uppercase tracking-widest animate-pulse mr-2">
              * Unsaved Changes
            </span>
          )}
          {hasChanges && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setLocalFields(savedFields);
                setArchivedFields([]);
              }}
              className="rounded-xl font-bold text-[9px] uppercase tracking-widest h-10 px-4"
            >
              Discard Changes
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanges}
            className={cn(
              "rounded-xl font-black text-[9px] uppercase tracking-[0.15em] px-6 h-10 transition-all active:scale-95 shadow-lg",
              hasChanges 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30" 
                : "bg-secondary text-muted-foreground shadow-none opacity-50"
            )}
          >
            {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            {isSaving ? "SYNCING..." : "SAVE CONFIGURATION"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* WORKFLOW STAGES (STATUS) */}
        {statusField && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <div className="size-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Layout size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight font-poppins">Workflow Stages</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">The "Buckets" your work moves through.</p>
              </div>
            </div>
            
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statusField.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/20 border border-border/20 group hover:border-blue-500/30 transition-all">
                      <Select 
                        value={opt.color} 
                        onValueChange={v => {
                          const newOpts = [...(statusField.options || [])];
                          newOpts[idx] = { ...opt, color: v };
                          updateField(statusField.id, { options: newOpts });
                        }}
                      >
                        <SelectTrigger className="size-10 p-0 border-none bg-background shadow-md rounded-xl shrink-0">
                          <div className={cn("size-4 rounded-full mx-auto shadow-sm", `bg-${opt.color}-500`)} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl">
                          {['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'indigo', 'pink', 'gray'].map(c => (
                            <SelectItem key={c} value={c} className="text-[10px] font-black uppercase tracking-widest">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        value={opt.label} 
                        onChange={e => {
                          const newOpts = [...(statusField.options || [])];
                          newOpts[idx] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                          updateField(statusField.id, { options: newOpts });
                        }}
                        className="flex-1 h-10 bg-transparent border-none focus-visible:ring-0 font-black text-xs uppercase tracking-tight"
                        placeholder="Stage Name..."
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                        onClick={() => {
                          const newOpts = statusField.options?.filter((_: any, i: number) => i !== idx);
                          updateField(statusField.id, { options: newOpts || [] });
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="h-full min-h-[60px] border-dashed rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/60 hover:bg-blue-500/5 hover:text-blue-500 transition-all group"
                    onClick={() => addOption(statusField.id)}
                  >
                    <Plus size={16} className="mr-2 group-hover:scale-110 transition-transform" /> Add New Stage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ACTIVE INFORMATION DETAILS */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <div className="size-8 rounded-xl bg-secondary flex items-center justify-center text-foreground shadow-sm">
              <Database size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Active Details</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Use arrows to reorder. Changes take effect across your CRM after saving.</p>
            </div>
          </div>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-xl">
            <CardContent className="p-8 space-y-6">
              {localFields && (
                <div id="fields-list-container" className="space-y-4">
                  {localFields.map((field, index) => (
                    <ConfigFieldItem 
                      key={field.id}
                      field={field}
                      index={index}
                      totalFields={localFields.length}
                      updateField={updateField}
                      archiveField={archiveField}
                      toggleVisibility={toggleVisibility}
                      addOption={addOption}
                      updateOption={updateOption}
                      onMoveUp={() => moveFieldUp(index)}
                      onMoveDown={() => moveFieldDown(index)}
                    />
                  ))}
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full h-16 border-dashed border-2 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] mt-4 border-border/60 hover:bg-blue-500/5 hover:text-blue-600 transition-all group" 
                onClick={addField}
              >
                <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform" /> Add New Detail Piece
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PENDING ARCHIVE SECTION */}
        {archivedFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-2">
              <div className="size-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm border border-orange-500/20">
                <History size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-600">Pending Archive</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Details moved here will be REMOVED when you hit Save. Restore them if you change your mind.</p>
              </div>
            </div>

            <Card className="border-orange-500/20 bg-orange-500/[0.02] backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-lg">
              <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {archivedFields.map((field) => (
                  <div key={field.id} className="flex flex-col gap-3 p-5 rounded-2xl bg-background/40 border border-orange-500/10 group">
                    <div className="flex items-center justify-between min-w-0">
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight truncate">{field.label}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{field.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-xl text-blue-500 hover:bg-blue-500/10 font-black text-[9px] uppercase tracking-widest"
                          onClick={() => restoreField(field.id)}
                        >
                          <RotateCcw size={14} className="mr-2" /> Restore
                        </Button>

                        <AnimatePresence mode="wait">
                          {confirmHardDeleteId === field.id ? (
                            <motion.div
                              key="confirm"
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: "auto", opacity: 1 }}
                              exit={{ width: 0, opacity: 0 }}
                              className="flex items-center"
                            >
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-8 px-4 rounded-xl text-[9px] font-black uppercase"
                                onClick={() => hardDeleteField(field.id)}
                              >
                                Clear?
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl text-muted-foreground"
                                onClick={() => setConfirmHardDeleteId(null)}
                              >
                                <X size={14} />
                              </Button>
                            </motion.div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-xl text-red-500 hover:bg-red-500/10"
                              onClick={() => setConfirmHardDeleteId(field.id)}
                              title="Remove Permanently"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CRMConfigPage() {
  const { config, updateModuleConfig } = useCRM();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveModule = async (module: keyof CRMConfig['modules'], fields: FieldConfig[]) => {
    setIsSaving(true);
    try {
      const moduleConfig = config.modules[module];
      const defaultView = moduleConfig.views.find(v => v.type === 'list') || moduleConfig.views[0];
      const updatedViews = moduleConfig.views.map(v => {
        if (v.id === defaultView?.id) {
          return { ...v, visibleFields: fields.filter(f => f.isVisible).map(f => f.id) };
        }
        return v;
      });
      await updateModuleConfig(module, { fields, views: updatedViews });
    } catch (err) {
      toast.error("Cloud sync failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="config-scroll-container"
      className="p-4 md:p-6 space-y-8 w-full h-full overflow-y-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-2xl shadow-blue-600/30 animate-pulse-slow">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase font-poppins leading-none">Setup <span className="text-blue-600 italic">Hub</span></h1>
            </div>
          </div>
          <p className="text-muted-foreground font-medium text-xs max-w-xl">
            Customize how your business organizes and tracks information. Changes update instantly.
          </p>
        </div>
      </header>

      <Tabs defaultValue="leads" className="space-y-6">
        <div className="sticky top-0 z-30 pt-2 pb-2 bg-background/90 backdrop-blur-2xl border-b border-border/20">
          <TabsList className="bg-secondary/20 p-1 rounded-xl w-full justify-start overflow-x-auto h-12 no-scrollbar shadow-inner">
            <TabsTrigger value="leads" className="rounded-lg text-[10px] font-black uppercase tracking-[0.1em] px-6 h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 transition-all">
              <Target size={14} className="mr-2" /> Leads
            </TabsTrigger>
            <TabsTrigger value="deals" className="rounded-lg text-[10px] font-black uppercase tracking-[0.1em] px-6 h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 transition-all">
              <Briefcase size={14} className="mr-2" /> Deals
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-lg text-[10px] font-black uppercase tracking-[0.1em] px-6 h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 transition-all">
              <Users size={14} className="mr-2" /> People
            </TabsTrigger>
            <TabsTrigger value="organizations" className="rounded-lg text-[10px] font-black uppercase tracking-[0.1em] px-6 h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 transition-all">
              <Building2 size={14} className="mr-2" /> Businesses
            </TabsTrigger>
            <TabsTrigger value="calls" className="rounded-lg text-[10px] font-black uppercase tracking-[0.1em] px-6 h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 transition-all">
              <PhoneCall size={14} className="mr-2" /> Call Logs
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg text-[10px] font-black uppercase tracking-[0.1em] px-6 h-10 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 transition-all">
              <StickyNote size={14} className="mr-2" /> Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads"><ModuleSetup moduleKey="leads" config={config} onSave={handleSaveModule} isSaving={isSaving} /></TabsContent>
        <TabsContent value="deals"><ModuleSetup moduleKey="deals" config={config} onSave={handleSaveModule} isSaving={isSaving} /></TabsContent>
        <TabsContent value="contacts"><ModuleSetup moduleKey="contacts" config={config} onSave={handleSaveModule} isSaving={isSaving} /></TabsContent>
        <TabsContent value="organizations"><ModuleSetup moduleKey="organizations" config={config} onSave={handleSaveModule} isSaving={isSaving} /></TabsContent>
        <TabsContent value="calls"><ModuleSetup moduleKey="calls" config={config} onSave={handleSaveModule} isSaving={isSaving} /></TabsContent>
        <TabsContent value="notes"><ModuleSetup moduleKey="notes" config={config} onSave={handleSaveModule} isSaving={isSaving} /></TabsContent>
      </Tabs>

      <footer className="pt-20 border-t border-border/20 flex flex-col items-center text-center space-y-8">
        <div className="max-w-2xl space-y-4">
          <h3 className="text-2xl font-black uppercase tracking-tight">Need Expert Assistance?</h3>
          <p className="text-sm text-muted-foreground font-bold italic leading-relaxed">
            Our modular setup is designed to grow with your business. If you need help tailoring your CRM to your specific needs, our team is standing by.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 pb-20">
          <a 
            href="https://wa.me/923057631663?text=Hello!%20I%20need%20help%20setting%20up%20my%20custom%20CRM%20on%20TRAC."
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] px-10 py-5 rounded-[2rem] border border-[#25D366]/30 transition-all active:scale-95 shadow-xl shadow-[#25D366]/10"
          >
            <img src="/whatsapp-real.svg" alt="WhatsApp" className="size-7 group-hover:scale-110 transition-transform" />
            <span className="font-black text-[11px] uppercase tracking-[0.2em]">Contact Trac Intelligence Support</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
