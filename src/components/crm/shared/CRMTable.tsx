'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MoreVertical, MoreHorizontal, Plus, X, Edit2, 
  Eye, Briefcase, PhoneCall, NotebookPen, Trash, 
  ExternalLink, Loader2, Check, ChevronDown,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  User,
  Clock,
  Mail,
  Phone,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CRMEntity, ModuleConfig, FieldConfig } from "@/hooks/use-crm-module";
import { ColumnPicker } from "./ColumnPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useTeam } from "@/hooks/use-team";
import { useCRM } from "@/hooks/use-crm";
import { Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";

interface CRMTableProps {
  entities: CRMEntity[];
  config: ModuleConfig;
  updateEntity: (id: string, updates: any) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<ModuleConfig>) => Promise<void>;
  onEntityClick: (entity: CRMEntity) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  addEntity: (data: any) => Promise<string | null>;
  pageSize: number;
  setPageSize: (size: number) => void;
  actions?: (entity: CRMEntity) => React.ReactNode;
}

const STRIP_COLORS = [
    '#ffcb00', '#00ca72', '#037f4c', '#00a9ff', 
    '#579bfc', '#a25ddc', '#ff5ac4', '#ff158a', 
    '#bb3354', '#7f5347', '#ff7538'
];

const lightenHexColor = (hex: string, percent: number) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const TableCellEditor = ({ 
  field, 
  value, 
  onSave, 
  onCancel 
}: { 
  field: FieldConfig, 
  value: string, 
  onSave: (val: string) => void, 
  onCancel: () => void 
}) => {
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (field.type !== 'select' && field.type !== 'date') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [field.type]);

  const handleConfirm = () => {
    if (temp !== value) onSave(temp);
    else onCancel();
  };

  if (field.type === 'date') {
      return (
        <div className="absolute inset-0 z-50 flex items-center bg-background ring-2 ring-blue-500 shadow-xl overflow-hidden h-full">
            <Popover open={true} onOpenChange={(open) => !open && onCancel()}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full h-full justify-start text-[10px] font-black uppercase tracking-widest px-4">
                        {temp ? format(new Date(temp), "PPP") : "Select date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                        mode="single"
                        selected={temp ? new Date(temp) : undefined}
                        onSelect={(date) => {
                            if (date) {
                                const iso = date.toISOString();
                                setTemp(iso);
                                onSave(iso);
                            }
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
      );
  }

  if (field.type === 'timeline') {
      const range = temp ? JSON.parse(temp) : { from: undefined, to: undefined };
      return (
          <div className="absolute inset-0 z-50 flex items-center bg-background ring-2 ring-blue-500 shadow-xl overflow-hidden h-full">
              <Popover open={true} onOpenChange={(open) => !open && onCancel()}>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" className="w-full h-full justify-start text-[10px] font-black uppercase tracking-widest px-4 truncate">
                          {range.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : "Select range"}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
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
                                  const saved = JSON.stringify({ from: newRange.from.toISOString(), to: newRange.to?.toISOString() });
                                  setTemp(saved);
                                  if (newRange.to) onSave(saved);
                              }
                          }}
                          numberOfMonths={2}
                      />
                  </PopoverContent>
              </Popover>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center bg-background ring-2 ring-blue-500 shadow-xl overflow-hidden h-full">
      {field.type === "select" ? (
        <div className="flex-1 h-full relative">
            <select
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs font-black uppercase tracking-widest px-4 h-full cursor-pointer appearance-none"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                autoFocus
            >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      ) : field.type === "textarea" ? (
        <textarea
            className="flex-1 h-full py-2 px-4 text-xs font-bold border-none focus-visible:ring-0 bg-transparent rounded-none resize-none overflow-hidden"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirm();
                }
                if (e.key === "Escape") onCancel();
            }}
            autoFocus
        />
      ) : (
        <div className="flex-1 h-full flex items-center relative">
          {field.type === "currency" && <span className="pl-4 text-xs font-black text-blue-500">$</span>}
          <Input
            ref={inputRef}
            type={field.type === "number" || field.type === "currency" ? "number" : field.type === "email" ? "email" : "text"}
            value={temp}
            onChange={(e) => {
                const val = e.target.value;
                if ((field.type === "number" || field.type === "currency") && val !== "" && Number(val) < 0) return;
                if (field.type === "phone" && val !== "" && !/^\d*$/.test(val)) return;
                setTemp(val);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") onCancel();
            }}
            className={cn(
                "flex-1 h-full py-0 text-xs font-bold border-none focus-visible:ring-0 bg-transparent rounded-none",
                field.type === "currency" ? "pl-1" : "px-4"
            )}
          />
        </div>
      )}
      <div className="flex items-center h-full border-l border-border/50 bg-secondary/10 px-1 gap-0.5">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={handleConfirm}>
          <Check size={16} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={onCancel}>
          <X size={16} />
        </Button>
      </div>
    </div>
  );
};

export function CRMTable({
  entities, config, updateEntity, deleteEntity, updateConfig, 
  onEntityClick, selectedIds, onSelect, onSelectAll, addEntity,
  pageSize, setPageSize, actions
}: CRMTableProps) {
  const { employees } = useTeam();
  const { organizations } = useCRM();
  const [editingCell, setEditingCell] = useState<{ id: string, fieldKey: string } | null>(null);
  const [tempRows, setTempRows] = useState<{ id: string, data: any, isSaving?: boolean }[]>([]);
  const [renamingFieldId, setRenamingFieldId] = useState<string | null>(null);
  const [editingDescriptionFieldId, setEditingDescriptionFieldId] = useState<string | null>(null);
  const [descriptionValue, setDescriptionValue] = useState("");

  const [tableColor] = useState(() => STRIP_COLORS[Math.floor(Math.random() * STRIP_COLORS.length)]);
  const lightTableColor = useMemo(() => lightenHexColor(tableColor, 75), [tableColor]);

  const [optimisticValues, setOptimisticValues] = useState<Record<string, string>>({});
  const [optimisticLabels, setOptimisticLabels] = useState<Record<string, string>>({});
  const [orderedFieldIds, setOrderedFieldIds] = useState<string[]>([]);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [activeFieldIdForOption, setActiveFieldIdForOption] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");

  const view = useMemo(() => config.views.find(v => v.type === 'list') || config.views[0], [config.views]);
  
  useEffect(() => {
    setOrderedFieldIds(view.visibleFields);
  }, [view.visibleFields]);

  const handleAddOption = (fieldId: string) => {
    if (!newOptionValue) return;
    const value = newOptionValue.toLowerCase().replace(/\s+/g, '_');
    
    const field = config.fields.find(f => f.id === fieldId);
    if (field?.options?.some(o => o.value === value)) {
        setNewOptionValue("");
        setActiveFieldIdForOption(null);
        return;
    }

    const newFields = config.fields.map(f => {
        if (f.id === fieldId) {
            const options = [...(f.options || []), { label: newOptionValue, value, color: 'gray' }];
            return { ...f, options };
        }
        return f;
    });
    updateConfig({ fields: newFields });
    setNewOptionValue("");
    setActiveFieldIdForOption(null);
  };

  const handleRemoveOption = (fieldId: string, optionValue: string) => {
    const newFields = config.fields.map(f => {
        if (f.id === fieldId) {
            const options = (f.options || []).filter(o => o.value !== optionValue);
            return { ...f, options };
        }
        return f;
    });
    updateConfig({ fields: newFields });
  };

  const displayFields = useMemo(() => {
    const ids = orderedFieldIds.length > 0 ? orderedFieldIds : view.visibleFields;
    return ids
      .map(id => {
        const field = config.fields.find(f => f.id === id);
        if (!field || !field.isVisible) return null;
        const label = optimisticLabels[id] || field.label;
        return { ...field, label };
      })
      .filter((f): f is FieldConfig => !!f);
  }, [config.fields, view.visibleFields, orderedFieldIds, optimisticLabels]);

  const handleCellSave = async (id: string, fieldKey: string, value: any) => {
    setEditingCell(null);
    setOptimisticValues(prev => ({ ...prev, [`${id}-${fieldKey}`]: value }));

    if (id.startsWith('temp_')) {
      setTempRows(prev => prev.map(r => r.id === id ? { ...r, data: { ...r.data, [fieldKey]: value } } : r));
    } else {
      await updateEntity(id, { [fieldKey]: value });
    }
  };

  const handleSaveTempRow = async (id: string) => {
    const row = tempRows.find(r => r.id === id);
    if (!row) return;
    
    const { firstName, lastName, name, company, organization } = row.data;
    if (!firstName && !lastName && !name && !company && !organization) {
        toast.error("Please fill in at least one identifying field (Name/Company/Organization)");
        return;
    }

    setTempRows(prev => prev.map(r => r.id === id ? { ...r, isSaving: true } : r));
    const newId = await addEntity(row.data);
    if (newId) {
        setTempRows(prev => prev.filter(r => r.id !== id));
        toast.success("Item created successfully");
    } else {
        setTempRows(prev => prev.map(r => r.id === id ? { ...r, isSaving: false } : r));
    }
  };

  const handleMoveColumn = (fieldId: string, direction: 'left' | 'right') => {
    const currentIndex = orderedFieldIds.indexOf(fieldId);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= orderedFieldIds.length) return;
    const newOrder = [...orderedFieldIds];
    [newOrder[currentIndex], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[currentIndex]];
    setOrderedFieldIds(newOrder);
    updateConfig({ views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newOrder } : v) });
  };

  const handleRenameColumn = (fieldId: string, newLabel: string) => {
    setRenamingFieldId(null);
    if (!newLabel) return;

    setOptimisticLabels(prev => ({ ...prev, [fieldId]: newLabel }));

    const newFields = config.fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
    updateConfig({ fields: newFields });
  };

  const handleSaveDescription = () => {
    if (editingDescriptionFieldId) {
        const newFields = config.fields.map(f => f.id === editingDescriptionFieldId ? { ...f, description: descriptionValue } : f);
        updateConfig({ fields: newFields });
        setEditingDescriptionFieldId(null);
        setDescriptionValue("");
    }
  };

  const handleAddColumn = (template?: Partial<FieldConfig>, type?: FieldConfig['type']) => {
    let finalField: FieldConfig;
    let newFields = [...config.fields];
    if (template) {
        const existing = config.fields.find(f => f.key === template.key);
        if (existing) {
            if (orderedFieldIds.includes(existing.id)) {
                toast.error("Column already exists in this view");
                return;
            }
            finalField = existing;
            newFields = newFields.map(f => f.id === existing.id ? { ...f, isVisible: true } : f);
        } else {
            finalField = {
                id: `f_${Date.now()}`,
                isSystem: true,
                isVisible: true,
                order: config.fields.length,
                ...template
            } as FieldConfig;
            newFields.push(finalField);
        }
    } else {
        const newId = `c_${Date.now()}`;
        const typeLabel = type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Column';
        finalField = {
            id: newId,
            key: `custom_${Date.now()}`,
            label: typeLabel,
            type: type || 'text',
            isSystem: false,
            isVisible: true,
            order: config.fields.length
        };
        newFields.push(finalField);
    }
    const newVisible = [...orderedFieldIds, finalField.id];
    setOrderedFieldIds(newVisible);
    updateConfig({ 
        fields: newFields,
        views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
    });
  };

  const handleDeleteColumn = (fieldId: string) => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field) return;
    if (confirm(`Remove "${field.label}" from this view?${!field.isSystem ? ' This will delete all data in this column permanently.' : ''}`)) {
        const newVisible = orderedFieldIds.filter(id => id !== fieldId);
        setOrderedFieldIds(newVisible);
        const updates: Partial<ModuleConfig> = {
            views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
        };
        if (!field.isSystem) updates.fields = config.fields.filter(f => f.id !== fieldId);
        updateConfig(updates);
    }
  };

  const getFieldValue = (entity: CRMEntity | {id: string, data: any}, fieldKey: string) => {
    const optKey = `${entity.id}-${fieldKey}`;
    if (optKey in optimisticValues) return optimisticValues[optKey];
    if ('data' in entity) {
        if (fieldKey in entity) return (entity as any)[fieldKey];
        return entity.data?.[fieldKey];
    }
    return (entity as any)[fieldKey];
  };

  return (
    <TooltipProvider>
      <div className="space-y-0">
        <div className="rounded-[1.25rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-x-auto custom-scrollbar relative">
          <table className="w-full text-left text-sm min-w-full border-collapse">
            <thead>
              <tr className="h-12 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                <th className="w-24 p-0 border-r border-border/50 sticky left-0 z-30 bg-slate-100 dark:bg-slate-800">
                  <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: tableColor}} />
                  <div className="flex items-center justify-center h-full pl-3">
                    <input
                      type="checkbox"
                      className="rounded-sm border-border bg-background cursor-pointer accent-blue-600 h-4 w-4"
                      checked={entities.length > 0 && selectedIds.length === entities.length}
                      onChange={(e) => onSelectAll(e.target.checked ? entities.map(l => l.id) : [])}
                    />
                  </div>
                </th>                {displayFields.map((field) => (
                  <th key={field.id} className="p-0 border-r border-border/50 relative group/th h-12 min-w-[150px]">
                    <div className="flex items-center justify-between px-4 h-full">
                      {renamingFieldId === field.id ? (
                        <Input 
                          className="h-8 bg-background/50 border-blue-500/50 text-[10px] font-black uppercase tracking-widest px-2"
                          autoFocus
                          defaultValue={field.label}
                          onBlur={(e) => handleRenameColumn(field.id, e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameColumn(field.id, e.currentTarget.value);
                              if (e.key === "Escape") setRenamingFieldId(null);
                          }}
                        />
                      ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-black uppercase tracking-[0.1em] text-[10px] text-muted-foreground cursor-help hover:text-foreground transition-colors whitespace-nowrap">
                                    {field.label}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card/95 border-border/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl max-w-xs z-[100]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{field.label}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-foreground/60">{field.description || 'No description provided.'}</p>
                            </TooltipContent>
                        </Tooltip>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/th:opacity-100 hover:bg-secondary/50 rounded-lg"><MoreVertical size={12} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl">
                          <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setRenamingFieldId(field.id)}>
                            <Edit2 size={12} className="mr-2" /> Rename Column
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { 
                              setEditingDescriptionFieldId(field.id);
                              setDescriptionValue(field.description || "");
                          }}>
                            <NotebookPen size={12} className="mr-2" /> Edit Description
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[10px] font-bold uppercase" disabled={orderedFieldIds.indexOf(field.id) === 0} onClick={() => handleMoveColumn(field.id, 'left')}>
                            <ArrowLeft size={12} className="mr-2" /> Move Left
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[10px] font-bold uppercase" disabled={orderedFieldIds.indexOf(field.id) === orderedFieldIds.length - 1} onClick={() => handleMoveColumn(field.id, 'right')}>
                            <ArrowRight size={12} className="mr-2" /> Move Right
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => handleDeleteColumn(field.id)}>
                            <Trash size={12} className="mr-2" /> {field.isSystem ? 'Hide Column' : 'Delete Column'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </th>
                ))}
                <th className="w-12 bg-secondary/10 border-l border-border/50 text-center relative">
                  <ColumnPicker 
                      onSelect={handleAddColumn}
                      availableTemplates={config.fields.filter(f => f.isSystem && !orderedFieldIds.includes(f.id))}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 text-blue-500">
                        <Plus size={16} />
                    </Button>
                  </ColumnPicker>
                </th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity, index) => {
                const isSelected = selectedIds.includes(entity.id);
                return (
                  <tr key={entity.id} className={cn("border-b border-border/20 transition-all group h-[52px]", isSelected ? "bg-blue-600/[0.12] hover:bg-blue-600/[0.18]" : "hover:bg-blue-500/[0.03]")}>
                    <td className={cn("w-24 p-0 border-r border-border/20 sticky left-0 z-20 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)]", isSelected ? "bg-blue-600/[0.05]" : "bg-card group-hover:bg-blue-500/[0.03]")}>
                      <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: tableColor}} />
                      <div className="flex items-center justify-center h-full pl-6 pr-3">
                          <input type="checkbox" className="rounded-sm border-border bg-background cursor-pointer accent-blue-600 h-4 w-4" checked={isSelected} onChange={() => onSelect(entity.id)} />
                      </div>
                    </td>
                    {displayFields.map((field) => {
                      const val = getFieldValue(entity, field.key);
                      const isEditing = editingCell?.id === entity.id && editingCell?.fieldKey === field.key;
                      const isLastInteraction = field.key === 'lastInteraction';
                      
                      if (field.type === 'select' || field.type === 'label' || field.key === 'company' || field.key === 'organization') {
                        let options = field.options || [];
                        if (field.key === 'company' || field.key === 'organization') {
                            const orgOptions = organizations.map(o => ({ label: o.name, value: o.name, color: 'blue' }));
                            const existingKeys = new Set(options.map(o => o.value));
                            const uniqueOrgOptions = orgOptions.filter(o => !existingKeys.has(o.value));
                            options = [...uniqueOrgOptions, ...options];
                        }
                        const filteredOptions = options.filter(o => o.label.toLowerCase().includes(dropdownSearch.toLowerCase()));

                        return (
                          <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                            <DropdownMenu onOpenChange={(open) => !open && setDropdownSearch("")}>
                              <DropdownMenuTrigger asChild>
                                <div className="flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]">
                                  <Badge className={cn(
                                    "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform active:scale-95",
                                    {'bg-blue-500 text-white': field.options?.find(o => o.value === val)?.color === 'blue', 'bg-amber-400 text-black': field.options?.find(o => o.value === val)?.color === 'yellow', 'bg-purple-500 text-white': field.options?.find(o => o.value === val)?.color === 'purple', 'bg-emerald-500 text-white': field.options?.find(o => o.value === val)?.color === 'green', 'bg-rose-500 text-white': field.options?.find(o => o.value === val)?.color === 'red', 'bg-orange-500 text-white': field.options?.find(o => o.value === val)?.color === 'orange', 'bg-indigo-500 text-white': field.options?.find(o => o.value === val)?.color === 'indigo', 'bg-gray-400 text-white': !field.options?.find(o => o.value === val)?.color || field.options?.find(o => o.value === val)?.color === 'gray'}
                                  )}>
                                    {options.find(o => o.value === val)?.label || val || <span className="text-[9px] font-black uppercase text-muted-foreground/30 italic tracking-widest">+ {field.label}</span>}
                                  </Badge>
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                                <div className="p-1 pb-2">
                                    <div className="relative">
                                        <SearchIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input 
                                            className="h-7 pl-6 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20" 
                                            placeholder="Search..." 
                                            value={dropdownSearch}
                                            onChange={(e) => setDropdownSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                                    <div key={opt.value} className="flex items-center group/opt">
                                        <DropdownMenuItem onClick={() => handleCellSave(entity.id, field.key, opt.value)} className="flex-1 items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5">
                                            <div className={cn("size-2 rounded-full", {'bg-blue-500': opt.color === 'blue', 'bg-amber-400': opt.color === 'yellow', 'bg-purple-500': opt.color === 'purple', 'bg-emerald-500': opt.color === 'green', 'bg-rose-500': opt.color === 'red', 'bg-orange-500': opt.color === 'orange', 'bg-indigo-500': opt.color === 'indigo', 'bg-gray-400': !opt.color || opt.color === 'gray'})} />
                                            {opt.label}
                                        </DropdownMenuItem>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/opt:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleRemoveOption(field.id, opt.value); }}>
                                            <X size={10} />
                                        </Button>
                                    </div>
                                    )) : (
                                        <div className="p-4 text-center text-[9px] font-black uppercase text-muted-foreground/50 italic tracking-widest">No results</div>
                                    )}
                                </div>
                                <DropdownMenuSeparator className="my-1 bg-border/20" />
                                <div className="p-1">
                                    {activeFieldIdForOption === field.id ? (
                                        <div className="flex items-center gap-1">
                                            <Input 
                                                size={1}
                                                className="h-8 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20" 
                                                placeholder="NEW LABEL..."
                                                value={newOptionValue}
                                                onChange={(e) => setNewOptionValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddOption(field.id);
                                                    if (e.key === 'Escape') setActiveFieldIdForOption(null);
                                                }}
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleAddOption(field.id)}>
                                                <Check size={14} />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setActiveFieldIdForOption(null)}>
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full h-8 justify-start text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFieldIdForOption(field.id);
                                            }}
                                        >
                                            <Plus size={12} className="mr-2" /> Add More
                                        </Button>
                                    )}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        );
                      }
                      if (field.type === 'people') {
                        const assignedEmployee = employees.find(e => e.id === val || e.name === val);
                        return (
                          <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]">
                                        <Avatar className="h-6 w-6 border border-border/40">
                                            <AvatarImage src={assignedEmployee ? (assignedEmployee.photoURL || assignedEmployee.photoUrl) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${val || 'User'}`} />
                                            <AvatarFallback className="text-[8px] font-black">{String(val || 'U').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="ml-2 text-[10px] font-bold truncate">{assignedEmployee?.name || val || 'Unassigned'}</span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <DropdownMenuItem onClick={() => handleCellSave(entity.id, field.key, "")} className="text-[10px] font-black uppercase py-2">
                                            Unassigned
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-1 bg-border/20" />
                                        {employees.map((emp) => (
                                            <DropdownMenuItem key={emp.id} onClick={() => handleCellSave(entity.id, field.key, emp.id)} className="flex items-center gap-2 text-[10px] font-bold uppercase py-2">
                                                <Avatar className="size-5">
                                                    <AvatarImage src={emp.photoURL || emp.photoUrl} />
                                                    <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {emp.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        );
                      }
                      if (field.type === 'checkbox') {
                        return (
                          <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                            <div className="flex items-center justify-center h-full w-full">
                              <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-md border-2", val ? "bg-green-500 border-green-500 text-white" : "border-border/40")} onClick={(e) => { e.stopPropagation(); handleCellSave(entity.id, field.key, !val); }}>
                                {val && <Check size={14} />}
                              </Button>
                            </div>
                          </td>
                        );
                      }
                      if (field.type === 'link' || field.type === 'file') {
                        return (
                          <td key={field.id} className="p-0 border-r border-border/20 relative group/cell" onClick={() => !isEditing && setEditingCell({ id: entity.id, fieldKey: field.key })}>
                            {isEditing ? (
                                <TableCellEditor field={field} value={String(val || '')} onSave={(newVal) => handleCellSave(entity.id, field.key, newVal)} onCancel={() => setEditingCell(null)} />
                            ) : (
                                <div className="flex items-center px-4 h-full w-full group-hover/cell:bg-blue-500/[0.02]">
                                    {field.type === 'link' ? <LinkIcon className="h-3 w-3 mr-2 text-blue-500" /> : <FileText className="h-3 w-3 mr-2 text-indigo-500" />}
                                    <a href={String(val || '#')} target="_blank" rel="noopener noreferrer" className={cn("text-[10px] font-bold hover:underline truncate", field.type === 'link' ? "text-blue-500" : "text-indigo-500")}>{String(val || '-')}</a>
                                </div>
                            )}
                          </td>
                        );
                      }
                      return (
                        <td key={field.id} className="p-0 border-r border-border/20 relative group/cell" onClick={() => !isEditing && !isLastInteraction && setEditingCell({ id: entity.id, fieldKey: field.key })}>
                          {isEditing ? (
                            <TableCellEditor field={field} value={String(val || '')} onSave={(newVal) => handleCellSave(entity.id, field.key, newVal)} onCancel={() => setEditingCell(null)} />
                          ) : (
                            <div className={cn("flex items-center px-4 h-full w-full", !isLastInteraction && "group-hover/cell:bg-blue-500/[0.02]")}>
                              {field.type === 'currency' ? (
                                <span className="text-blue-600 font-black text-xs">${Number(val || 0).toLocaleString()}</span>
                              ) : field.type === 'timeline' ? (() => {
                                  try {
                                      const range = val ? JSON.parse(val) : null;
                                      return (
                                          <div className="flex items-center gap-1.5 w-full">
                                              <Clock className="h-3 w-3 text-pink-500" />
                                              <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                                                  {range?.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : <span className="text-muted-foreground/20 italic font-bold uppercase text-[9px] tracking-widest">+ {field.label}</span>}
                                              </span>
                                          </div>
                                      );
                                  } catch (e) {
                                      return <span className="text-[9px] font-bold text-muted-foreground">{String(val || '+ Timeline')}</span>;
                                  }
                              })() : isLastInteraction ? (
                                  <span className="text-[10px] font-black uppercase text-muted-foreground/60 italic">
                                      {val ? format(new Date(val), "MMM d, h:mm a") : '-'}
                                  </span>
                              ) : (
                                <span className={cn("text-xs font-bold truncate w-full transition-colors", isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground/80")}>
                                  {field.type === 'date' && val ? format(new Date(val), "PPP") : (val || <span className="text-[9px] font-black uppercase text-muted-foreground/20 italic tracking-widest">+ {field.label}</span>)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-0 text-center w-12 border-l border-border/20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 hover:bg-secondary/50 rounded-xl"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100]">
                          {actions ? actions(entity) : (
                            <>
                              <DropdownMenuItem className="text-[10px] font-black uppercase" onClick={() => onEntityClick(entity)}><Eye size={12} className="mr-2 text-blue-500"/> View</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(entity.id)}><Trash size={12} className="mr-2"/> Delete</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {tempRows.map((row, index) => (
                <tr key={row.id} className="border-b border-border/20 bg-blue-500/[0.01] h-[52px] group/temp">
                  <td className="w-24 p-0 border-r border-border/20 sticky left-0 z-20 bg-card group-hover/temp:bg-blue-500/[0.03] transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: tableColor}} />
                      <div className="flex items-center justify-center h-full pl-3">
                          {row.isSaving ? <Loader2 className="size-4 animate-spin text-blue-500" /> : <div className="size-4 rounded-sm border-2 border-blue-500/20" />}
                      </div>
                  </td>
                  {displayFields.map((field) => {
                    const val = row.data[field.key] || '';
                    const isEditing = editingCell?.id === row.id && editingCell?.fieldKey === field.key;
                    if (field.type === 'select' || field.type === 'label' || field.key === 'company' || field.key === 'organization') {
                        let options = field.options || [];
                        if (field.key === 'company' || field.key === 'organization') {
                            const orgOptions = organizations.map(o => ({ label: o.name, value: o.name, color: 'blue' }));
                            const existingKeys = new Set(options.map(o => o.value));
                            const uniqueOrgOptions = orgOptions.filter(o => !existingKeys.has(o.value));
                            options = [...uniqueOrgOptions, ...options];
                        }
                        const filteredOptions = options.filter(o => o.label.toLowerCase().includes(dropdownSearch.toLowerCase()));

                      return (
                        <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                          <DropdownMenu onOpenChange={(open) => !open && setDropdownSearch("")}>
                            <DropdownMenuTrigger asChild disabled={row.isSaving}>
                              <div className="flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]">
                                <Badge className={cn("px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform active:scale-95 opacity-30", {'bg-blue-500 text-white': field.options?.find(o => o.value === val)?.color === 'blue', 'bg-amber-400 text-black': field.options?.find(o => o.value === val)?.color === 'yellow','bg-purple-500 text-white': field.options?.find(o => o.value === val)?.color === 'purple','bg-emerald-500 text-white': field.options?.find(o => o.value === val)?.color === 'green','bg-rose-500 text-white': field.options?.find(o => o.value === val)?.color === 'red','bg-orange-500 text-white': field.options?.find(o => o.value === val)?.color === 'orange','bg-indigo-500 text-white': field.options?.find(o => o.value === val)?.color === 'indigo','bg-gray-400 text-white': !field.options?.find(o => o.value === val)?.color || field.options?.find(o => o.value === val)?.color === 'gray'})}>{options.find(o => o.value === val)?.label || `+ ${field.label}`}</Badge>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                                <div className="p-1 pb-2">
                                    <div className="relative">
                                        <SearchIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input 
                                            className="h-7 pl-6 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20" 
                                            placeholder="Search..." 
                                            value={dropdownSearch}
                                            onChange={(e) => setDropdownSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                                    <div key={opt.value} className="flex items-center group/opt">
                                        <DropdownMenuItem onClick={() => handleCellSave(row.id, field.key, opt.value)} className="flex-1 items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5">
                                            <div className={cn("size-2 rounded-full", {'bg-blue-500': opt.color === 'blue','bg-amber-400': opt.color === 'yellow','bg-purple-500': opt.color === 'purple','bg-emerald-50': opt.color === 'green','bg-rose-500': opt.color === 'red','bg-orange-500': opt.color === 'orange','bg-indigo-500': opt.color === 'indigo','bg-gray-400': !opt.color || opt.color === 'gray'})} />
                                            {opt.label}
                                        </DropdownMenuItem>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/opt:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleRemoveOption(field.id, opt.value); }}>
                                            <X size={10} />
                                        </Button>
                                    </div>
                                    )) : (
                                        <div className="p-4 text-center text-[9px] font-black uppercase text-muted-foreground/50 italic tracking-widest">No results</div>
                                    )}
                                </div>
                                <DropdownMenuSeparator className="my-1 bg-border/20" />
                                <div className="p-1">
                                    {activeFieldIdForOption === field.id ? (
                                        <div className="flex items-center gap-1">
                                            <Input 
                                                size={1}
                                                className="h-8 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20" 
                                                placeholder="NEW LABEL..."
                                                value={newOptionValue}
                                                onChange={(e) => setNewOptionValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddOption(field.id);
                                                    if (e.key === 'Escape') setActiveFieldIdForOption(null);
                                                }}
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleAddOption(field.id)}>
                                                <Check size={14} />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setActiveFieldIdForOption(null)}>
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full h-8 justify-start text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveFieldIdForOption(field.id);
                                            }}
                                        >
                                            <Plus size={12} className="mr-2" /> Add More
                                        </Button>
                                    )}
                                </div>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      );
                    }
                    if (field.type === 'people') {
                        const assignedEmployee = employees.find(e => e.id === val || e.name === val);
                        return (
                          <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={row.isSaving}>
                                    <div className="flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02] opacity-30">
                                        <Avatar className="h-6 w-6 border border-border/40">
                                            <AvatarImage src={assignedEmployee ? (assignedEmployee.photoURL || assignedEmployee.photoUrl) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${val || 'User'}`} />
                                            <AvatarFallback className="text-[8px] font-black">{String(val || 'U').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="ml-2 text-[10px] font-bold truncate">{assignedEmployee?.name || val || `+ ${field.label}`}</span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <DropdownMenuItem onClick={() => handleCellSave(row.id, field.key, "")} className="text-[10px] font-black uppercase py-2">
                                            Unassigned
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-1 bg-border/20" />
                                        {employees.map((emp) => (
                                            <DropdownMenuItem key={emp.id} onClick={() => handleCellSave(row.id, field.key, emp.id)} className="flex items-center gap-2 text-[10px] font-bold uppercase py-2">
                                                <Avatar className="size-5">
                                                    <AvatarImage src={emp.photoURL || emp.photoUrl} />
                                                    <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {emp.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        );
                    }
                    if (field.type === 'checkbox') {
                      return <td key={field.id} className="p-0 border-r border-border/20 relative group/cell"><div className="flex items-center justify-center h-full w-full opacity-30" onClick={() => !row.isSaving && handleCellSave(row.id, field.key, !val)}><div className={cn("h-6 w-6 rounded-md border-2", val ? "bg-green-500 border-green-500 text-white" : "border-border/40")}>{val && <Check size={14} />}</div></div></td>;
                    }
                    return (
                      <td key={field.id} className="p-0 border-r border-border/20 relative group/cell" onClick={() => !isEditing && !row.isSaving && field.key !== 'lastInteraction' && setEditingCell({ id: row.id, fieldKey: field.key })}>
                        {isEditing ? (
                          <TableCellEditor field={field} value={String(val || '')} onSave={(newVal) => handleCellSave(row.id, field.key, newVal)} onCancel={() => setEditingCell(null)} />
                        ) : (
                          <div className="flex items-center px-4 h-full w-full italic text-[10px] font-black uppercase text-muted-foreground/30">
                              {row.isSaving ? 'Syncing...' : (
                                  field.type === 'timeline' ? (() => {
                                      try {
                                          const range = val ? JSON.parse(val) : null;
                                          return range?.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : <span className="text-muted-foreground/20">+ {field.label}</span>;
                                      } catch (e) { return <span className="text-muted-foreground/20">+ {field.label}</span>; }
                                  })() : field.type === 'date' && val ? format(new Date(val), "PPP") : (val || <span className="text-muted-foreground/20">+ {field.label}</span>)
                              )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-0 text-center border-l border-border/20 bg-card/90 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-1 px-1">
                        <Button variant="ghost" size="icon" disabled={row.isSaving} className="h-8 w-8 text-green-500 hover:bg-green-500/10 rounded-lg" onClick={() => handleSaveTempRow(row.id)}><Check size={16}/></Button>
                        <Button variant="ghost" size="icon" disabled={row.isSaving} className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg" onClick={() => setTempRows(prev => prev.filter(r => r.id !== row.id))}><X size={14}/></Button>
                      </div>
                  </td>
                </tr>
              ))}
              <tr className="h-[52px] border-b border-border/20 bg-muted/5 group/new" onClick={() => {
                  const newTempId = `temp_${Date.now()}`;
                  setTempRows(prev => [...prev, { id: newTempId, data: {} }]);
                  const firstField = displayFields[0];
                  if(firstField) setEditingCell({ id: newTempId, fieldKey: firstField.key });
              }}>
                  <td className="w-24 p-0 border-r border-border/20 sticky left-0 z-20 bg-card group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: lightTableColor}} />
                    <div className="flex items-center justify-center h-full pl-3 opacity-30 group-hover/new:opacity-100 transition-opacity">
                        <Plus size={14} className="text-muted-foreground group-hover/new:text-blue-500" />
                    </div>
                  </td>
                  <td colSpan={displayFields.length} className="p-0 border-r border-border/20 relative cursor-pointer group-hover/new:bg-blue-500/[0.03] transition-colors"><div className="px-4 flex items-center h-full text-[10px] font-black uppercase text-muted-foreground/30 group-hover/new:text-blue-500 transition-colors">Add Item</div></td>
                  <td className="bg-card/90 group-hover/new:bg-blue-500/[0.03] transition-colors"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={!!editingDescriptionFieldId} onOpenChange={(open) => !open && setEditingDescriptionFieldId(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Edit <span className="text-blue-600 italic">Description</span></DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Add help text for this column to guide your team.</p>
            </DialogHeader>
            <div className="p-8 pt-4">
                <Textarea placeholder="E.G. 'THIS COLUMN TRACKS THE INITIAL SOURCE OF THE LEAD...'" value={descriptionValue} onChange={(e) => setDescriptionValue(e.target.value)} className="min-h-[120px] bg-secondary/30 border-none rounded-2xl text-[10px] font-bold uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-blue-500/20 shadow-inner p-4" />
            </div>
            <DialogFooter className="p-8 pt-4 bg-secondary/10 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setEditingDescriptionFieldId(null)} className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                <Button onClick={handleSaveDescription} className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">Save Description</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}