"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useCRM, CRMEntity, FieldConfig, ViewConfig, CRMConfig } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, Filter, Download, MoreHorizontal, 
  ArrowUpDown, MoreVertical, Trash2, Edit2, Settings2, 
  X, Check, Eye, List as ListIcon, Loader2, ArrowLeft, ArrowRight,
  Trash, PhoneCall, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CallModal } from "@/components/crm/forms/CallModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * INLINE EDIT COMPONENT FOR CELLS
 */
const InlineEdit = ({ 
  value, 
  onSave, 
  onCancel, 
  type = "text",
  options = []
}: { 
  value: string, 
  onSave: (val: string) => void, 
  onCancel: () => void,
  type?: string,
  options?: { label: string, value: string, color?: string }[]
}) => {
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); if (type !== 'select') inputRef.current?.select(); }, []);

  const handleConfirm = () => {
    if (temp !== value) onSave(temp);
    else onCancel();
  };

  if (type === 'select') {
    return (
      <div className="flex items-center gap-1 bg-background shadow-xl border-2 border-blue-500 rounded-xl p-1 absolute inset-0 z-50 animate-in fade-in zoom-in-95">
        <select 
          className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest bg-transparent outline-none px-2"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex gap-1 border-l border-border/50 pl-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={handleConfirm}><Check size={14} /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={onCancel}><X size={14} /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-background shadow-xl border-2 border-blue-500 rounded-xl p-1 absolute inset-0 z-50 animate-in fade-in zoom-in-95">
      <Input 
        ref={inputRef}
        value={temp} 
        onChange={e => setTemp(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleConfirm();
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 h-8 text-xs font-bold border-none focus-visible:ring-0 bg-transparent"
      />
      <div className="flex gap-1 border-l border-border/50 pl-1">
        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={handleConfirm}><Check size={14} /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={onCancel}><X size={14} /></Button>
      </div>
    </div>
  );
};

/**
 * COMPOSABLE LIST VIEW (EXCEL STYLE)
 */
const CRMListView = ({ 
  calls, config, updateConfig, onCallClick, onCallEdit, onAddClick, selectedIds, onSelect, onSelectAll, updateEntity, deleteEntity,
  pageSize, setPageSize, addEntity
}: { 
  calls: CRMEntity[], config: CRMConfig, updateConfig: (updates: any) => void,
  onCallClick: (call: CRMEntity) => void, 
  onCallEdit: (call: CRMEntity) => void,
  onAddClick: () => void,
  selectedIds: string[], onSelect: (id: string) => void, onSelectAll: (ids: string[]) => void,
  updateEntity: (id: string, updates: any) => void,
  deleteEntity: (id: string) => void,
  pageSize: number,
  setPageSize: (size: number) => void,
  addEntity: (type: 'call', data: any) => Promise<string | null>
}) => {
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string, fieldId: string } | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number, colIndex: number }>({ rowIndex: 0, colIndex: 0 });
  const [tempRows, setTempRows] = useState<{ id: string, data: any }[]>([]);

  const module = config.modules.calls;
  const view = module.views.find((v: ViewConfig) => v.type === 'list') || module.views[0];
  const displayFields = module.fields.filter((f: FieldConfig) => view?.visibleFields?.includes(f.id));

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell || editingHeaderId) return;
      
      const rowCount = calls.length + tempRows.length;
      const colCount = displayFields.length;

      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedCell(prev => ({ ...prev, rowIndex: Math.max(0, prev.rowIndex - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedCell(prev => ({ ...prev, rowIndex: Math.min(rowCount - 1, prev.rowIndex + 1) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedCell(prev => ({ ...prev, colIndex: Math.max(0, prev.colIndex - 1) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedCell(prev => ({ ...prev, colIndex: Math.min(colCount - 1, prev.colIndex + 1) }));
          break;
        case 'Enter':
          const combinedRows = [...calls, ...tempRows];
          const target = combinedRows[focusedCell.rowIndex];
          const field = displayFields[focusedCell.colIndex];
          if (target && field) setEditingCell({ id: target.id, fieldId: field.id });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calls, tempRows, displayFields, editingCell, editingHeaderId, focusedCell]);

  const handleRenameField = (fieldId: string, newLabel: string) => {
    const newFields = module.fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
    updateConfig({ fields: newFields });
    setEditingHeaderId(null);
  };

  const handleHideField = (fieldId: string) => {
    const newViews = module.views.map(v => 
      v.type === 'list' 
        ? { ...v, visibleFields: (v.visibleFields || []).filter(id => id !== fieldId) } 
        : v
    );
    updateConfig({ views: newViews });
    toast.success("Hidden Column");
  };

  const handleMoveField = (fieldId: string, direction: 'left' | 'right') => {
    const visibleFields = [...(view.visibleFields || [])];
    const index = visibleFields.indexOf(fieldId);
    if (index === -1) return;

    if (direction === 'left' && index > 0) {
      [visibleFields[index], visibleFields[index - 1]] = [visibleFields[index - 1], visibleFields[index]];
    } else if (direction === 'right' && index < visibleFields.length - 1) {
      [visibleFields[index], visibleFields[index + 1]] = [visibleFields[index + 1], visibleFields[index]];
    }

    const newViews = module.views.map(v => 
      v.type === 'list' ? { ...v, visibleFields } : v
    );
    updateConfig({ views: newViews });
  };

  const handleCellSave = async (id: string, fieldKey: string, value: any) => {
    if (id.startsWith('temp_')) {
      const loadingToast = toast.loading("Logging new call...");
      const newId = await addEntity('call', { [fieldKey]: value });
      if (newId) {
        setTempRows(prev => prev.filter(r => r.id !== id));
        toast.dismiss(loadingToast);
        toast.success("New call logged!");
      }
    } else {
      await updateEntity(id, { [fieldKey]: value });
    }
    setEditingCell(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Permanently delete this column and its data?")) {
      const newFields = module.fields.filter(f => f.id !== fieldId || f.isSystem);
      const newViews = module.views.map(v => ({
        ...v,
        visibleFields: (v.visibleFields || []).filter(id => id !== fieldId)
      }));
      updateConfig({ fields: newFields, views: newViews });
      toast.success("Deleted Column");
    }
  };

  const handleAddField = () => {
    const id = `f_${Date.now()}`;
    const newField: FieldConfig = { id, key: `custom_${Date.now()}`, label: 'New Attribute', type: 'text', isSystem: false, isVisible: true, order: module.fields.length };
    updateConfig({ 
      fields: [...module.fields, newField],
      views: module.views.map(v => v.type === 'list' ? { ...v, visibleFields: [...(v.visibleFields || []), id] } : v)
    });
    toast.success("Added New Column");
  };

  const handleAddRow = () => {
    const newTempId = `temp_${Date.now()}`;
    setTempRows(prev => [...prev, { id: newTempId, data: {} }]);
    setFocusedCell({ rowIndex: calls.length + tempRows.length, colIndex: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden backdrop-blur-sm shadow-2xl overflow-x-auto relative">
        <table className="w-full text-left text-sm min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border/60">
              <th className="p-4 w-12 border-r border-border/60">
                <input 
                  type="checkbox" 
                  className="rounded border-border bg-background cursor-pointer" 
                  checked={calls.length > 0 && selectedIds.length === calls.length} 
                  onChange={(e) => onSelectAll(e.target.checked ? calls.map(c => c.id) : [])} 
                />
              </th>
              {displayFields.map((field, colIdx) => (
                <th key={field.id} className="p-0 border-r border-border/60 relative group/th h-12">
                  <div className="flex items-center justify-between px-4 py-3 h-full">
                    <span className="font-black uppercase tracking-widest text-[10px] truncate">{field.label}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/th:opacity-100 hover:bg-secondary/50"><MoreVertical size={12} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setEditingHeaderId(field.id)}><Edit2 size={12} className="mr-2"/> Rename Column</DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleHideField(field.id)}><X size={12} className="mr-2"/> Hide Column</DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleMoveField(field.id, 'left')} disabled={colIdx === 0}><ArrowLeft size={12} className="mr-2"/> Move Left</DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleMoveField(field.id, 'right')} disabled={colIdx === displayFields.length - 1}><ArrowRight size={12} className="mr-2"/> Move Right</DropdownMenuItem>
                        {!field.isSystem && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => handleDeleteField(field.id)}><Trash size={12} className="mr-2"/> Delete Field</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {editingHeaderId === field.id && (
                    <InlineEdit value={field.label} onSave={(val) => handleRenameField(field.id, val)} onCancel={() => setEditingHeaderId(null)} />
                  )}
                </th>
              ))}
              <th className="p-0 w-12 bg-secondary/20 border-l border-border/60 text-center">
                <Button variant="ghost" size="icon" className="h-full w-full rounded-none hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500" onClick={handleAddField}>
                  <Plus size={16} />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 && tempRows.length === 0 ? (
              <tr><td colSpan={displayFields.length + 3} className="p-12 text-center font-black text-muted-foreground uppercase tracking-widest text-xs">No entries found.</td></tr>
            ) : (
              <>
                {calls.map((call, rowIndex) => (
                  <tr 
                    key={call.id} 
                    className={cn(
                      "border-b border-border/40 hover:bg-secondary/10 transition-colors group cursor-default h-12",
                      selectedIds.includes(call.id) && "bg-blue-500/5"
                    )}
                  >
                    <td className="p-4 border-r border-border/40" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-border bg-background cursor-pointer" checked={selectedIds.includes(call.id)} onChange={() => onSelect(call.id)} />
                    </td>
                    {displayFields.map((field, colIdx) => (
                      <td 
                        key={field.id} 
                        className={cn(
                          "p-0 border-r border-border/40 relative group/cell",
                          focusedCell.rowIndex === rowIndex && focusedCell.colIndex === colIdx && "ring-2 ring-inset ring-blue-500/50 bg-blue-500/5"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedCell({ rowIndex, colIndex: colIdx });
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          onCallClick(call);
                        }}
                      >
                        {editingCell?.id === call.id && editingCell?.fieldId === field.id ? (
                          <InlineEdit 
                            value={String(call.data[field.key] || '')} 
                            onSave={(val) => handleCellSave(call.id, field.key, val)} 
                            onCancel={() => setEditingCell(null)}
                            type={field.type}
                            options={field.options}
                          />
                        ) : (
                          <div className="flex items-center px-4 h-full min-h-[48px]">
                            {field.type === 'select' ? (
                              <Badge variant="secondary" className={cn("text-[9px] uppercase font-black px-2 py-0 border shrink-0", `bg-${field.options?.find(o => o.value === call.data[field.key])?.color || 'gray'}-500/10 text-${field.options?.find(o => o.value === call.data[field.key])?.color || 'gray'}-500 border-${field.options?.find(o => o.value === call.data[field.key])?.color || 'gray'}-500/20`)}>
                                {field.options?.find(o => o.value === call.data[field.key])?.label || call.data[field.key] || 'None'}
                              </Badge>
                            ) : field.key === 'createdAt' ? (
                              <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(call.createdAt), "MMM d, 'yy")}</span>
                            ) : (
                              <div className="flex items-center gap-2 truncate">
                                {field.key === 'type' && (
                                  call.data[field.key] === 'Incoming' ? <ArrowDownRight className="size-3 text-green-500 shrink-0" /> : <ArrowUpRight className="size-3 text-purple-500 shrink-0" />
                                )}
                                <span className={cn("text-xs truncate max-w-[200px]", field.key === 'summary' ? 'font-black text-foreground uppercase tracking-tight' : 'text-muted-foreground font-bold')}>
                                  {String(call.data[field.key] || '-')}
                                </span>
                              </div>
                            )}
                            <button className="ml-auto opacity-0 group-hover/cell:opacity-100 p-1 text-muted-foreground hover:text-blue-500 transition-opacity" onClick={() => setEditingCell({ id: call.id, fieldId: field.id })}>
                              <Edit2 size={10} />
                            </button>
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="p-0 text-center w-12 border-l border-border/40">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 hover:bg-secondary/50 rounded-none"><MoreHorizontal size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 border-border/40 bg-card/95 backdrop-blur-xl">
                          <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => onCallClick(call)}><Eye size={12} className="mr-2"/> View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => onCallEdit(call)}><Edit2 size={12} className="mr-2"/> Edit Log</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => deleteEntity(call.id)}><Trash size={12} className="mr-2"/> Delete Log</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {tempRows.map((row, idx) => {
                  const rowIndex = calls.length + idx;
                  return (
                    <tr key={row.id} className="border-b border-border/40 bg-blue-500/5 h-12 group/temp">
                      <td className="p-4 border-r border-border/40"><div className="size-4 rounded border-2 border-blue-500/20" /></td>
                      {displayFields.map((field, colIdx) => (
                        <td 
                          key={field.id} 
                          className={cn(
                            "p-0 border-r border-border/40 relative group/cell",
                            focusedCell.rowIndex === rowIndex && focusedCell.colIndex === colIdx && "ring-2 ring-inset ring-blue-500/50 bg-blue-500/10"
                          )}
                          onClick={() => {
                            setFocusedCell({ rowIndex, colIndex: colIdx });
                            setEditingCell({ id: row.id, fieldId: field.id });
                          }}
                        >
                          {editingCell?.id === row.id && editingCell?.fieldId === field.id ? (
                            <InlineEdit 
                              value="" 
                              onSave={(val) => handleCellSave(row.id, field.key, val)} 
                              onCancel={() => setEditingCell(null)}
                              type={field.type}
                              options={field.options}
                            />
                          ) : (
                            <div className="flex items-center px-4 h-full min-h-[48px] italic text-[10px] font-bold uppercase text-muted-foreground/50">
                              <span>Enter {field.label}...</span>
                              <button className="ml-auto opacity-0 group-hover/cell:opacity-100 p-1 text-muted-foreground hover:text-blue-500 transition-opacity">
                                <Edit2 size={10} />
                              </button>
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="p-0 text-center border-l border-border/40">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-red-500" onClick={() => setTempRows(prev => prev.filter(r => r.id !== row.id))}><X size={14}/></Button>
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
          <tfoot className="bg-secondary/20 border-t border-border/60">
            <tr>
              <td colSpan={displayFields.length + 3} className="p-0">
                <div className="flex items-center justify-between px-4 h-12">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                    Showing <span className="text-foreground">{calls.length}</span> logs in your active history
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rows per fetch</span>
                    <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl border border-border/40">
                      {[30, 50, 150].map((size) => (
                        <Button 
                          key={size} 
                          variant={pageSize === size ? "secondary" : "ghost"} 
                          size="sm" 
                          className="h-7 w-10 text-[10px] font-black rounded-lg"
                          onClick={() => setPageSize(size)}
                        >
                          {size}
                        </Button>
                      ))}
                      <div className="relative group/custom h-7 w-16">
                        <Input 
                          placeholder="Custom" 
                          type="number" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt(e.currentTarget.value);
                              if (val > 0) setPageSize(val);
                            }
                          }}
                          className="h-full w-full bg-transparent border-none text-[10px] font-black text-center focus-visible:ring-0 placeholder:text-[10px] placeholder:text-muted-foreground"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-border/50 group-hover/custom:bg-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <Button 
        variant="outline" 
        onClick={handleAddRow}
        className="w-full h-12 border-dashed border-2 border-border/40 bg-transparent hover:bg-blue-500/5 hover:border-blue-500/20 text-muted-foreground hover:text-blue-500 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
      >
        <Plus size={16} className="mr-2" /> Log New Row
      </Button>
    </div>
  );
};

export default function CallLogsPage() {
  const { calls, leads, config, loading, updateEntity, deleteEntity, updateModuleConfig, pageSize, setPageSize, addEntity } = useCRM();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedCall, setSelectedCall] = useState<CRMEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredLogs = useMemo(() => {
    let result = calls.filter(c => !c.isDeleted);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.data.summary?.toLowerCase().includes(q) ||
        c.data.from?.toLowerCase().includes(q) ||
        c.data.to?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Date.now() + 10000;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Date.now() + 10000;
      return timeB - timeA;
    });
    return result;
  }, [calls, searchQuery]);

  const handleOpenCall = (call: CRMEntity) => {
    setSelectedCall(call);
    setModalMode('preview');
    setShowAddModal(true);
  };

  const handleEditCall = (call: CRMEntity) => {
    setSelectedCall(call);
    setModalMode('edit');
    setShowAddModal(true);
  };

  const handleCreateCall = () => {
    setSelectedCall(null);
    setModalMode('create');
    setShowAddModal(true);
  };

  const handleCallSubmit = async (data: any) => {
    if (modalMode === 'create') {
      await addEntity('call', data);
      toast.success("Call logged successfully");
    } else if (modalMode === 'edit' && selectedCall) {
      await updateEntity(selectedCall.id, data);
      toast.success("Call log updated");
    }
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen relative max-w-[1600px] mx-auto">
      <CallModal 
        isOpen={showAddModal} 
        onOpenChange={setShowAddModal} 
        mode={modalMode}
        call={selectedCall}
        leads={leads}
        onSubmit={handleCallSubmit}
      />

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-blue-500/20 shadow-2xl rounded-[2rem] p-4 flex items-center gap-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 px-4 border-r border-border/20 mr-2">
              <span className="bg-blue-500 text-white size-7 rounded-full flex items-center justify-center text-[10px] font-black">{selectedIds.length}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">Entries Selected</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={async () => { if (confirm(`Delete ${selectedIds.length} items?`)) { await Promise.all(selectedIds.map(id => deleteEntity(id))); setSelectedIds([]); }}} className="h-10 rounded-2xl text-red-500 hover:bg-red-500/10 border-red-500/20 font-black text-[10px] uppercase px-6">Delete Selected</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-10 rounded-2xl font-black text-[10px] uppercase px-6">Deselect All</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Active History</span>
             <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Call Logs</h1>
          <p className="text-muted-foreground font-medium text-sm italic">Trace every interaction with high-fidelity records.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreateCall} className="h-12 px-8 font-black text-[10px] uppercase tracking-[0.1em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"><Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" /> Log Call</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input placeholder="SEARCH SUMMARIES, NUMBERS, OR CONTACTS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 bg-background/50 border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/20" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" size="sm" disabled className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest opacity-40 px-6"><Download size={14} className="mr-2 text-blue-500" /> Export</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
            <CRMListView 
              calls={filteredLogs} 
              config={config} 
              updateConfig={(upd) => updateModuleConfig('calls', upd)} 
              onCallClick={handleOpenCall} 
              onCallEdit={handleEditCall} 
              onAddClick={handleCreateCall} 
              selectedIds={selectedIds} 
              onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} 
              onSelectAll={setSelectedIds} 
              updateEntity={updateEntity} 
              deleteEntity={deleteEntity} 
              pageSize={pageSize} 
              setPageSize={setPageSize} 
              addEntity={addEntity} 
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
