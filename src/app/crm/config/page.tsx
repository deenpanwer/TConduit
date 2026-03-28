"use client";

import React, { useState, useEffect } from "react";
import { useCRM, FieldConfig, ModuleConfig, CRMConfig } from "@/hooks/use-crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, GripVertical, 
  Layout, Database, Save, Loader2, X,
  Users, Briefcase, PhoneCall, StickyNote, Target, Building2,
  Info, Sparkles, HelpCircle
} from "lucide-react";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * REUSABLE COMPONENT FOR A MODULE'S SETUP
 */
const ModuleSetup = ({ 
  moduleKey, 
  config, 
  onSave 
}: { 
  moduleKey: keyof CRMConfig['modules'], 
  config: CRMConfig,
  onSave: (module: keyof CRMConfig['modules'], fields: FieldConfig[]) => Promise<void>
}) => {
  const module = config.modules[moduleKey];
  const [localFields, setLocalFields] = useState<FieldConfig[]>(module?.fields || []);
  const [loading, setLoading] = useState(false);

  // Sync local fields if the original config changes externally
  useEffect(() => {
    setLocalFields(module?.fields || []);
  }, [module?.fields]);

  const hasChanges = JSON.stringify(localFields) !== JSON.stringify(module?.fields);

  const handleApply = async () => {
    setLoading(true);
    await onSave(moduleKey, localFields);
    setLoading(false);
  };

  const addField = () => {
    const newField: FieldConfig = { 
      id: `f_${Date.now()}`, 
      key: `custom_${Date.now()}`,
      label: "New Information Piece", 
      type: "text",
      isSystem: false,
      isVisible: true,
      order: localFields.length
    };
    setLocalFields([...localFields, newField]);
  };

  const updateField = (id: string, updates: Partial<FieldConfig>) => {
    setLocalFields(localFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setLocalFields(localFields.filter(f => f.id !== id || f.isSystem));
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

  // Identify if this module has "Stages" (like Status)
  const statusField = localFields.find(f => f.key === 'status');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Setting up {module?.name || 'this module'}</h2>
          <p className="text-sm text-muted-foreground font-medium">{module?.description || 'Configure your settings below.'}</p>
        </div>
        <Button 
          onClick={handleApply} 
          disabled={loading || !hasChanges}
          className={cn(
            "rounded-2xl font-black text-[10px] uppercase tracking-widest px-8 h-12 transition-all active:scale-95 shadow-xl",
            hasChanges 
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20" 
              : "bg-secondary text-muted-foreground shadow-none opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : hasChanges ? (
            <Save className="mr-2 h-4 w-4" />
          ) : null}
          {loading ? "Saving..." : hasChanges ? "Save my setup" : "No changes yet"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Stages Section */}
        {statusField && (
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-blue-500/5 rounded-3xl overflow-hidden">
            <div className="h-1.5 w-full bg-blue-500" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20"><Layout size={20} /></div>
                <div>
                  <CardTitle className="text-lg font-bold">Your Workflow Stages</CardTitle>
                  <CardDescription>These are the steps or "buckets" where your {(module?.name || 'items').toLowerCase()} move through.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {statusField.options?.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/40 group transition-all hover:bg-secondary/50">
                    <Select 
                      value={opt.color} 
                      onValueChange={v => {
                        const newOpts = [...(statusField.options || [])];
                        newOpts[idx] = { ...opt, color: v };
                        updateField(statusField.id, { options: newOpts });
                      }}
                    >
                      <SelectTrigger className="size-10 p-0 border-none bg-background shadow-sm rounded-xl shrink-0">
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
                      className="flex-1 h-10 bg-transparent border-none focus-visible:ring-0 font-bold text-sm"
                      placeholder="Name this stage..."
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
              </div>
              <Button 
                variant="outline" 
                className="w-full h-12 border-dashed rounded-2xl font-black text-[10px] uppercase tracking-widest mt-2 border-border/60 hover:bg-blue-500/5 hover:text-blue-500 transition-all group"
                onClick={() => addOption(statusField.id)}
              >
                <Plus size={16} className="mr-2 group-hover:scale-110 transition-transform" /> Add Another Stage
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Information Architecture Section */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-blue-500/5 rounded-3xl overflow-hidden">
          <div className="h-1.5 w-full bg-blue-500/20" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-secondary text-foreground shadow-sm"><Database size={20} /></div>
              <div>
                <CardTitle className="text-lg font-bold">Details to Collect</CardTitle>
                <CardDescription>What specific pieces of information do you want to save for each {(module?.name || 'item').toLowerCase()}?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Reorder.Group axis="y" values={localFields} onReorder={setLocalFields} className="space-y-4">
              {localFields.map((field) => (
                <Reorder.Item 
                  key={field.id} 
                  value={field}
                  className={cn(
                    "p-4 rounded-2xl bg-secondary/30 border border-border/40 space-y-4 group transition-all hover:bg-secondary/50",
                    field.isSystem && "opacity-90"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <Input 
                        value={field.label} 
                        disabled={field.isSystem && (field.key === 'name' || field.key === 'status')}
                        onChange={e => updateField(field.id, { label: e.target.value })}
                        className="h-10 bg-transparent border-none focus-visible:ring-0 font-bold text-sm p-0 mb-0.5"
                        placeholder="Label (e.g. Favorite Color)"
                      />
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{field.isSystem ? 'Required by System' : 'Your Custom Detail'}</p>
                        {!field.isSystem && <div className="size-1 rounded-full bg-blue-500/30" />}
                        {!field.isSystem && <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/60">{field.type}</p>}
                      </div>
                    </div>
                    <div className="w-44">
                      <Select 
                        disabled={field.isSystem}
                        value={field.type} 
                        onValueChange={v => updateField(field.id, { type: v as any, options: v === 'select' ? [] : undefined })}
                      >
                        <SelectTrigger className="h-10 text-[10px] font-black uppercase tracking-widest border-border/40 bg-background/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl">
                          <SelectItem value="text" className="text-[10px] font-black uppercase tracking-widest">Short Text</SelectItem>
                          <SelectItem value="textarea" className="text-[10px] font-black uppercase tracking-widest">Long Text</SelectItem>
                          <SelectItem value="number" className="text-[10px] font-black uppercase tracking-widest">Number</SelectItem>
                          <SelectItem value="select" className="text-[10px] font-black uppercase tracking-widest">Dropdown List</SelectItem>
                          <SelectItem value="date" className="text-[10px] font-black uppercase tracking-widest">Date Picker</SelectItem>
                          <SelectItem value="currency" className="text-[10px] font-black uppercase tracking-widest">Money Value</SelectItem>
                          <SelectItem value="email" className="text-[10px] font-black uppercase tracking-widest">Email Address</SelectItem>
                          <SelectItem value="phone" className="text-[10px] font-black uppercase tracking-widest">Phone Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!field.isSystem && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl" onClick={() => removeField(field.id)}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  {/* Dropdown Options for non-status fields */}
                  {field.type === 'select' && field.key !== 'status' && (
                    <div className="pl-8 space-y-3 pt-4 border-t border-border/10">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Choices for this List</Label>
                        <Button variant="ghost" size="sm" onClick={() => addOption(field.id)} className="h-7 px-3 text-[10px] font-bold uppercase rounded-lg hover:bg-blue-500/5">Add Choice</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {field.options?.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-background/40 border border-border/40 group/opt">
                            <Input 
                              value={opt.label} 
                              onChange={e => updateOption(field.id, idx, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                              className="h-8 bg-transparent border-none focus-visible:ring-0 text-xs font-bold p-0 px-2"
                              placeholder="Choice name..."
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 opacity-0 group-hover/opt:opacity-100 rounded-lg" onClick={() => {
                              const newOpts = field.options?.filter((_: any, i: number) => i !== idx);
                              updateField(field.id, { options: newOpts || [] });
                            }}>
                              <X size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <Button variant="outline" className="w-full h-14 border-dashed rounded-2xl font-black text-[10px] uppercase tracking-widest mt-4 border-border/60 hover:bg-blue-500/5 hover:text-blue-500 transition-all group" onClick={addField}>
              <Plus size={18} className="mr-2 group-hover:scale-110 transition-transform" /> Add New Detail Piece
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function CRMConfigPage() {
  const { config, updateModuleConfig } = useCRM();

  const handleSaveModule = async (module: keyof CRMConfig['modules'], fields: FieldConfig[]) => {
    try {
      await updateModuleConfig(module, { fields });
      toast.success(`${config.modules[module]?.name || 'Module'} updated successfully!`);
    } catch (err) {
      toast.error("Failed to save changes.");
    }
  };

  return (
    <div className="p-6 pb-20 space-y-10 max-w-5xl mx-auto min-h-screen">
      <header className="space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-500/20 animate-pulse-slow">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase tracking-widest">CRM Setup Hub</h1>
            <p className="text-muted-foreground font-medium text-sm flex items-center gap-2">
              <Info size={14} className="text-blue-500" />
              Customize how your business works. No code required.
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="leads" className="space-y-8">
        <div className="sticky top-0 z-30 pt-2 pb-4 bg-background/80 backdrop-blur-xl border-b border-border/20">
          <TabsList className="bg-secondary/30 p-1 rounded-2xl border border-border/40 w-full justify-start overflow-x-auto h-14 no-scrollbar">
            <TabsTrigger value="leads" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Target size={14} className="mr-2" /> Leads
            </TabsTrigger>
            <TabsTrigger value="deals" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Briefcase size={14} className="mr-2" /> Deals
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Users size={14} className="mr-2" /> People
            </TabsTrigger>
            <TabsTrigger value="organizations" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Building2 size={14} className="mr-2" /> Businesses
            </TabsTrigger>
            <TabsTrigger value="calls" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <PhoneCall size={14} className="mr-2" /> Call Logs
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <StickyNote size={14} className="mr-2" /> Note Setup
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads"><ModuleSetup moduleKey="leads" config={config} onSave={handleSaveModule} /></TabsContent>
        <TabsContent value="deals"><ModuleSetup moduleKey="deals" config={config} onSave={handleSaveModule} /></TabsContent>
        <TabsContent value="contacts"><ModuleSetup moduleKey="contacts" config={config} onSave={handleSaveModule} /></TabsContent>
        <TabsContent value="organizations"><ModuleSetup moduleKey="organizations" config={config} onSave={handleSaveModule} /></TabsContent>
        <TabsContent value="calls"><ModuleSetup moduleKey="calls" config={config} onSave={handleSaveModule} /></TabsContent>
        <TabsContent value="notes"><ModuleSetup moduleKey="notes" config={config} onSave={handleSaveModule} /></TabsContent>
      </Tabs>

      <footer className="pt-16 border-t border-border/20 flex flex-col items-center text-center space-y-6">
        <div className="max-w-2xl space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Need help building your CRM?</h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Our modular architecture allows you to scale from a simple list to a multi-billion dollar business pipeline. 
            Every change you make here is reflected instantly across your organization.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <a 
            href="https://wa.me/923057631663?text=Hello!%20I%20need%20help%20setting%20up%20my%20custom%20CRM%20on%20TRAC."
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] px-8 py-4 rounded-2xl border border-[#25D366]/30 transition-all active:scale-95"
          >
            <img src="/whatsapp-real.svg" alt="WhatsApp" className="size-6" />
            <span className="font-black text-xs uppercase tracking-widest">Ask for Help on WhatsApp</span>
          </a>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Official TRAC Support</p>
        </div>
      </footer>
    </div>
  );
}
