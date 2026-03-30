"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MoreVertical, MoreHorizontal, Plus, X, Edit2, 
  Eye, Briefcase, PhoneCall, NotebookPen, Trash, 
  ExternalLink, Loader2, Check, ChevronDown,
  ArrowLeft,
  ArrowRight
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

// Stable Monday-style colors for row strips
const STRIP_COLORS = [
    '#ffcb00', '#00ca72', '#037f4c', '#00a9ff', 
    '#579bfc', '#a25ddc', '#ff5ac4', '#ff158a', 
    '#bb3354', '#7f5347', '#ff7538'
];

// Helper to generate a lighter shade of a given hex color.
const lightenHexColor = (hex: string, percent: number) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};


/**
 * INTEGRATED CELL EDIT COMPONENT
 */
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
    if (field.type !== 'select') {
      inputRef.current?.focus();
      if (field.type !== 'date') inputRef.current?.select();
    }
  }, [field.type]);

  const handleConfirm = () => {
    if (temp !== value) onSave(temp);
    else onCancel();
  };

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
      ) : (
        <Input
          ref={inputRef}
          type={field.type === "currency" ? "number" : field.type === "email" ? "email" : "text"}
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") onCancel();
          }}
          className="flex-1 h-full py-0 px-4 text-xs font-bold border-none focus-visible:ring-0 bg-transparent rounded-none"
        />
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
  
  const [editingCell, setEditingCell] = useState<{ id: string, fieldKey: string } | null>(null);
  const [tempRows, setTempRows] = useState<{ id: string, data: any, isSaving?: boolean }[]>([]);
  
  /**
   * UNIFIED TABLE COLOR LOGIC
   * --------------------------
   * A single random color is chosen for the entire table instance to create a 
   * cohesive, Monday.com-like appearance. A lighter shade is generated for the 
   * "Add Item" row for a two-tone effect.
   */
  const [tableColor] = useState(() => STRIP_COLORS[Math.floor(Math.random() * STRIP_COLORS.length)]);
  const lightTableColor = useMemo(() => lightenHexColor(tableColor, 75), [tableColor]);

  /**
   * ZERO-LATENCY OPTIMISTIC UI PATTERN
   * ----------------------------------
   * To achieve a "Monday.com" feel, we must bypass the Firestore round-trip delay.
   * 1. optimisticValues: Stores cell data the moment the user clicks "tick".
   * 2. orderedFieldIds: Stores column sequence for instant reordering.
   * 
   * The 'getFieldValue' and 'displayFields' helpers prioritize these local caches
   * over the server-synced 'entities' and 'config' props.
   */
  const [optimisticValues, setOptimisticValues] = useState<Record<string, string>>({});
  const [orderedFieldIds, setOrderedFieldIds] = useState<string[]>([]);

  const view = useMemo(() => config.views.find(v => v.type === 'list') || config.views[0], [config.views]);
  
  // Sync local reordering state when the master config changes from the cloud
  useEffect(() => {
    setOrderedFieldIds(view.visibleFields);
  }, [view.visibleFields]);

  const displayFields = useMemo(() => {
    const ids = orderedFieldIds.length > 0 ? orderedFieldIds : view.visibleFields;
    return ids
      .map(id => {
        const field = config.fields.find(f => f.id === id);
        if (!field) return null;
        return { ...field, label: field.label };
      })
      .filter((f): f is FieldConfig => !!f);
  }, [config.fields, view.visibleFields, orderedFieldIds]);

  const handleCellSave = async (id: string, fieldKey: string, value: any) => {
    setEditingCell(null);
    
    // CAUTION: Do not remove this. It's the key to the instant UI update.
    setOptimisticValues(prev => ({ ...prev, [`${id}-${fieldKey}`]: value }));

    if (id.startsWith('temp_')) {
      const row = tempRows.find(r => r.id === id);
      const newData = { ...row?.data, [fieldKey]: value };
      if (newData.firstName || newData.lastName || newData.name || newData.company) {
        setTempRows(prev => prev.map(r => r.id === id ? { ...r, data: newData, isSaving: true } : r));
        const newId = await addEntity(newData);
        if (newId) setTempRows(prev => prev.filter(r => r.id !== id));
        else setTempRows(prev => prev.map(r => r.id === id ? { ...r, data: newData, isSaving: false } : r));
      } else {
        setTempRows(prev => prev.map(r => r.id === id ? { ...r, data: newData } : r));
      }
    } else {
      await updateEntity(id, { [fieldKey]: value });
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

  const handleAddColumn = () => {
    const newFieldId = `f_${Date.now()}`;
    const newField: FieldConfig = {
        id: newFieldId,
        key: `custom_${Date.now()}`,
        label: 'New Column',
        type: 'text',
        isSystem: false,
        isVisible: true,
        order: config.fields.length
    };
    const newFields = [...config.fields, newField];
    const newVisible = [...orderedFieldIds, newFieldId];
    setOrderedFieldIds(newVisible);
    updateConfig({ 
        fields: newFields,
        views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
    });
  };

  const handleDeleteColumn = (fieldId: string) => {
    if (confirm("Delete this column permanently?")) {
        const newVisible = orderedFieldIds.filter(id => id !== fieldId);
        setOrderedFieldIds(newVisible);
        updateConfig({ 
            views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
        });
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
    <div className="space-y-0">
      <div className="rounded-[1.25rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-x-auto custom-scrollbar relative">
        <table className="w-full text-left text-sm min-w-[1200px] border-collapse table-fixed">
          <thead>
            <tr className="h-12 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
              <th style={{borderLeft: `8px solid ${tableColor}`}} className="w-10 p-0 border-r border-border/50 sticky left-0 z-30 bg-slate-100 dark:bg-slate-800"></th>
              <th className="w-12 p-0 border-r border-border/50 sticky left-10 z-30 bg-slate-100 dark:bg-slate-800">
                <div className="flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="rounded-sm border-border bg-background cursor-pointer accent-blue-600" 
                    checked={entities.length > 0 && selectedIds.length === entities.length}
                    onChange={(e) => onSelectAll(e.target.checked ? entities.map(l => l.id) : [])}
                  />
                </div>
              </th>
              {displayFields.map((field) => (
                <th key={field.id} className="p-0 border-r border-border/50 relative group/th h-12">
                  <div className="flex items-center justify-between px-4">
                    <span className="font-black uppercase tracking-[0.1em] text-[10px] text-muted-foreground truncate">{field.label}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/th:opacity-100 hover:bg-secondary/50 rounded-lg"><MoreVertical size={12} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 border-border/40 bg-card/95 backdrop-blur-xl z-[100]">
                        <DropdownMenuItem className="text-[10px] font-bold uppercase" disabled={orderedFieldIds.indexOf(field.id) === 0} onClick={() => handleMoveColumn(field.id, 'left')}>
                          <ArrowLeft size={12} className="mr-2" /> Move Left
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase" disabled={orderedFieldIds.indexOf(field.id) === orderedFieldIds.length - 1} onClick={() => handleMoveColumn(field.id, 'right')}>
                          <ArrowRight size={12} className="mr-2" /> Move Right
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => handleDeleteColumn(field.id)}>
                          <Trash size={12} className="mr-2" /> Delete Column
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              ))}
              <th className="w-12 bg-secondary/20 border-l border-border/50 text-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 text-blue-500" onClick={handleAddColumn}>
                    <Plus size={16} />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity, index) => {
              const isSelected = selectedIds.includes(entity.id);
              return (
                <tr 
                  key={entity.id} 
                  className={cn(
                    "border-b border-border/20 transition-all group h-[52px]",
                    isSelected ? "bg-blue-600/[0.12] hover:bg-blue-600/[0.18]" : "hover:bg-blue-500/[0.03]"
                  )}
                >
                  <td 
                    style={{borderLeft: `8px solid ${tableColor}`}}
                    className="p-0 border-r border-border/20 sticky left-0 z-10 bg-card/80 backdrop-blur-sm text-center text-xs text-muted-foreground font-mono transition-colors">
                    {index + 1}
                  </td>
                  <td className={cn(
                    "p-0 border-r border-border/20 sticky left-10 z-20 backdrop-blur-sm transition-colors",
                    isSelected ? "bg-blue-600/[0.05]" : "bg-card/90"
                  )}>
                    <div className="flex items-center justify-center h-full">
                      <input 
                          type="checkbox" 
                          className="rounded-sm border-border bg-background cursor-pointer accent-blue-600" 
                          checked={isSelected} 
                          onChange={() => onSelect(entity.id)} 
                      />
                    </div>
                  </td>
                  {displayFields.map((field) => {
                    const val = getFieldValue(entity, field.key);
                    const isEditing = editingCell?.id === entity.id && editingCell?.fieldKey === field.key;
                    if (field.type === 'select') {
                      return (
                        <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]">
                                <Badge className={cn(
                                  "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform active:scale-95",
                                  {'bg-blue-500 text-white': field.options?.find(o => o.value === val)?.color === 'blue', 'bg-amber-400 text-black': field.options?.find(o => o.value === val)?.color === 'yellow', 'bg-purple-500 text-white': field.options?.find(o => o.value === val)?.color === 'purple', 'bg-emerald-500 text-white': field.options?.find(o => o.value === val)?.color === 'green', 'bg-rose-500 text-white': field.options?.find(o => o.value === val)?.color === 'red', 'bg-orange-500 text-white': field.options?.find(o => o.value === val)?.color === 'orange', 'bg-indigo-500 text-white': field.options?.find(o => o.value === val)?.color === 'indigo', 'bg-gray-400 text-white': !field.options?.find(o => o.value === val)?.color || field.options?.find(o => o.value === val)?.color === 'gray'}
                                )}>
                                  {field.options?.find(o => o.value === val)?.label || val || 'Select...'}
                                </Badge>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl">
                              {field.options?.map((opt) => (
                                <DropdownMenuItem key={opt.value} onClick={() => handleCellSave(entity.id, field.key, opt.value)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-3">
                                  <div className={cn("size-2 rounded-full", {'bg-blue-500': opt.color === 'blue', 'bg-amber-400': opt.color === 'yellow', 'bg-purple-500': opt.color === 'purple', 'bg-emerald-50': opt.color === 'green', 'bg-rose-500': opt.color === 'red', 'bg-orange-500': opt.color === 'orange', 'bg-indigo-500': opt.color === 'indigo', 'bg-gray-400': !opt.color || opt.color === 'gray'})} />
                                  {opt.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      );
                    }

                    return (
                      <td key={field.id} className="p-0 border-r border-border/20 relative group/cell" onClick={() => !isEditing && setEditingCell({ id: entity.id, fieldKey: field.key })}>
                        {isEditing ? (
                          <TableCellEditor field={field} value={String(val || '')} onSave={(newVal) => handleCellSave(entity.id, field.key, newVal)} onCancel={() => setEditingCell(null)} />
                        ) : (
                          <div className="flex items-center px-4 h-full w-full group-hover/cell:bg-blue-500/[0.02]">
                            {field.type === 'currency' ? (
                              <span className="text-blue-600 font-black text-xs">${Number(val || 0).toLocaleString()}</span>
                            ) : (
                              <span className={cn("text-xs font-bold truncate w-full transition-colors", isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground/80")}>
                                {String(val || '-')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-0 text-center w-12 border-l border-border/20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 hover:bg-secondary/50 rounded-xl"><MoreHorizontal size={14} /></Button>
                      </DropdownMenuTrigger>
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
            
            {/* Monday-style integrated "Add Row" rows */}
            {tempRows.map((row, index) => (
              <tr key={row.id} className="border-b border-border/20 bg-blue-500/[0.01] h-[52px] group/temp">
                 <td 
                    style={{borderLeft: `8px solid ${tableColor}`}}
                    className="p-0 border-r border-border/20 sticky left-0 z-10 bg-card/90 backdrop-blur-sm text-center text-xs text-muted-foreground/50 font-mono">
                    {entities.length + index + 1}
                 </td>
                 <td className="p-0 border-r border-border/20 sticky left-10 z-20 bg-card/90 backdrop-blur-sm">
                   <div className="flex items-center justify-center h-full">
                     {row.isSaving ? <Loader2 className="size-4 animate-spin text-blue-500" /> : <div className="size-4 rounded-sm border-2 border-blue-500/20" />}
                   </div>
                </td>
                {displayFields.map((field) => {
                  const val = row.data[field.key] || '';
                  const isEditing = editingCell?.id === row.id && editingCell?.fieldKey === field.key;
                  if (field.type === 'select') {
                    return (
                      <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild disabled={row.isSaving}>
                            <div className="flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]">
                              <Badge className={cn("px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform active:scale-95 opacity-30", {'bg-blue-500 text-white': field.options?.find(o => o.value === val)?.color === 'blue', 'bg-amber-400 text-black': field.options?.find(o => o.value === val)?.color === 'yellow','bg-purple-500 text-white': field.options?.find(o => o.value === val)?.color === 'purple','bg-emerald-500 text-white': field.options?.find(o => o.value === val)?.color === 'green','bg-rose-500 text-white': field.options?.find(o => o.value === val)?.color === 'red','bg-orange-500 text-white': field.options?.find(o => o.value === val)?.color === 'orange','bg-indigo-500 text-white': field.options?.find(o => o.value === val)?.color === 'indigo','bg-gray-400 text-white': !field.options?.find(o => o.value === val)?.color || field.options?.find(o => o.value === val)?.color === 'gray'})}>
                                {field.options?.find(o => o.value === val)?.label || `+ ${field.label}`}
                              </Badge>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl">
                            {field.options?.map((opt) => (
                              <DropdownMenuItem key={opt.value} onClick={() => handleCellSave(row.id, field.key, opt.value)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-3">
                                <div className={cn("size-2 rounded-full", {'bg-blue-500': opt.color === 'blue','bg-amber-400': opt.color === 'yellow','bg-purple-500': opt.color === 'purple','bg-emerald-50': opt.color === 'green','bg-rose-500': opt.color === 'red','bg-orange-500': opt.color === 'orange','bg-indigo-500': opt.color === 'indigo','bg-gray-400': !opt.color || opt.color === 'gray'})} />
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    );
                  }

                  return (
                    <td key={field.id} className="p-0 border-r border-border/20 relative group/cell" onClick={() => !isEditing && !row.isSaving && setEditingCell({ id: row.id, fieldKey: field.key })}>
                      {isEditing ? (
                        <TableCellEditor field={field} value={String(val || '')} onSave={(newVal) => handleCellSave(row.id, field.key, newVal)} onCancel={() => setEditingCell(null)} />
                      ) : (
                        <div className="flex items-center px-4 h-full w-full italic text-[10px] font-black uppercase text-muted-foreground/30">
                          {row.isSaving ? 'Syncing...' : val || `+ ${field.label}`}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="p-0 text-center border-l border-border/20 bg-card/90 backdrop-blur-sm">
                  <Button variant="ghost" size="icon" disabled={row.isSaving} className="h-10 w-10 text-muted-foreground hover:text-red-500 rounded-xl" onClick={() => setTempRows(prev => prev.filter(r => r.id !== row.id))}><X size={14}/></Button>
                </td>
              </tr>
            ))}

            {/* THE PERSISTENT "ADD ROW" PLACEHOLDER */}
            <tr className="h-[52px] border-b border-border/20 bg-muted/5 group/new" onClick={() => {
                const newTempId = `temp_${Date.now()}`;
                setTempRows(prev => [...prev, { id: newTempId, data: {} }]);
                const firstField = displayFields[0];
                if(firstField) setEditingCell({ id: newTempId, fieldKey: firstField.key });
            }}>
                <td 
                    style={{borderLeft: `8px solid ${lightTableColor}`}}
                    className="p-0 border-r border-border/20 sticky left-0 z-10 bg-card/80 group-hover/new:bg-blue-500/[0.03] transition-colors">
                </td>
                <td className="p-0 border-r border-border/20 sticky left-10 z-10 bg-card/80 group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="flex items-center justify-center h-full opacity-30 group-hover/new:opacity-100 transition-opacity">
                        <Plus size={14} className="text-muted-foreground group-hover/new:text-blue-500" />
                    </div>
                </td>
                <td colSpan={displayFields.length} className="p-0 border-r border-border/20 relative cursor-pointer group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="px-4 flex items-center h-full text-[10px] font-black uppercase text-muted-foreground/30 group-hover/new:text-blue-500 transition-colors">
                        Add Item
                    </div>
                </td>
                <td className="bg-card/90 group-hover/new:bg-blue-500/[0.03] transition-colors"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
