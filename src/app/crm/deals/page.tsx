"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useCRM, CRMEntity, FieldConfig, ViewConfig, CRMConfig } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, List as ListIcon, Plus, Search, 
  Filter, Download, MoreHorizontal, ArrowUpDown,
  MoreVertical, Trash2, Edit2, Settings2, X, Check,
  Briefcase, DollarSign, Target, Eye, Loader2, ChevronDown,
  GripHorizontal, GripVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";
import { DealModal } from "@/components/dashboard/crm/DealModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/**
 * INLINE RENAME COMPONENT FOR HEADERS
 */
const InlineHeaderEdit = ({ value, onSave, onCancel }: { value: string, onSave: (val: string) => void, onCancel: () => void }) => {
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex items-center gap-1 bg-background shadow-xl border border-blue-500/50 rounded-lg p-1 absolute inset-0 z-50">
      <Input 
        ref={inputRef}
        value={temp} 
        onChange={e => setTemp(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(temp);
          if (e.key === 'Escape') onCancel();
        }}
        className="h-7 text-[10px] font-black uppercase tracking-widest border-none focus-visible:ring-0"
      />
      <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => onSave(temp)}><Check size={12} /></Button>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={onCancel}><X size={12} /></Button>
    </div>
  );
};

/**
 * COMPOSABLE KANBAN VIEW
 */
const CRMKanbanView = ({ 
  deals, 
  config, 
  updateConfig,
  onDealClick, 
  onAddClick,
  onDropDeal
}: { 
  deals: CRMEntity[], 
  config: CRMConfig, 
  updateConfig: (updates: any) => void,
  onDealClick: (id: string) => void, 
  onAddClick: (status?: string) => void,
  onDropDeal: (dealId: string, status: string) => void
}) => {
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
  const module = config.modules.deals;
  const view = module.views.find((v: ViewConfig) => v.type === 'kanban') || module.views[0];
  const visibleIds = view?.visibleFields || module.fields.map(f => f.id);
  const kanbanFieldId = view?.kanbanFieldId || module.fields.find(f => f.key === 'status')?.id;
  const kanbanField = module.fields.find((f: FieldConfig) => f.id === kanbanFieldId);
  const displayFields = module.fields.filter((f: FieldConfig) => visibleIds.includes(f.id));

  if (!kanbanField || !kanbanField.options) return null;

  const handleRenameStage = (oldValue: string, newLabel: string) => {
    const newOptions = kanbanField.options?.map(o => 
      o.value === oldValue ? { ...o, label: newLabel } : o
    );
    const newFields = module.fields.map(f => 
      f.id === kanbanField.id ? { ...f, options: newOptions } : f
    );
    updateConfig({ fields: newFields });
    setEditingStage(null);
  };

  const handleAddStage = () => {
    const newVal = `stage_${Date.now()}`;
    const newOptions = [...(kanbanField.options || []), { label: 'New Stage', value: newVal, color: 'gray' }];
    const newFields = module.fields.map(f => 
      f.id === kanbanField.id ? { ...f, options: newOptions } : f
    );
    updateConfig({ fields: newFields });
  };

  const handleDeleteStage = (value: string) => {
    if (confirm("Delete this stage? Deals in this stage will lose their status.")) {
      const newOptions = kanbanField.options?.filter(o => o.value !== value);
      const newFields = module.fields.map(f => 
        f.id === kanbanField.id ? { ...f, options: newOptions } : f
      );
      updateConfig({ fields: newFields });
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 h-full min-h-[500px] custom-scrollbar">
      <LayoutGroup>
        {kanbanField.options.map((option) => (
          <div 
            key={option.value} 
            className={cn(
              "flex flex-col w-80 shrink-0 rounded-2xl transition-all duration-300 border-2",
              dragOverStage === option.value ? "bg-blue-500/5 border-blue-500/20 ring-1 ring-blue-500/20" : "bg-transparent border-transparent"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(option.value); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              const dealId = e.dataTransfer.getData("dealId");
              if (dealId) onDropDeal(dealId, option.value);
            }}
          >
            <div className="flex items-center justify-between mb-4 px-2 group/h">
              <div className="flex items-center gap-2 relative flex-1 min-w-0">
                <div className={cn("size-2 rounded-full shrink-0", `bg-${option.color}-500`)} />
                {editingStage === option.value ? (
                  <div className="absolute inset-0 bg-background z-10 flex items-center gap-1">
                     <Input 
                      autoFocus
                      defaultValue={option.label}
                      onBlur={e => handleRenameStage(option.value, e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameStage(option.value, e.currentTarget.value)}
                      className="h-7 text-[10px] font-black uppercase border-blue-500"
                     />
                  </div>
                ) : (
                  <h3 className="font-bold text-sm uppercase tracking-widest truncate">{option.label}</h3>
                )}
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-black">
                  {deals.filter(d => d.data[kanbanField.key] === option.value).length}
                </Badge>
              </div>
              <div className="flex items-center opacity-0 group-hover/h:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Settings2 size={12} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 border-border/40 bg-card/95 backdrop-blur-xl">
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setEditingStage(option.value)}>Rename Stage</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => handleDeleteStage(option.value)}>Delete Stage</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddClick(option.value)}><Plus size={12} /></Button>
              </div>
            </div>
            
            <div className="flex-1 bg-secondary/10 rounded-2xl p-3 space-y-3 min-h-[150px] border border-border/20 backdrop-blur-sm">
              {deals
                .filter(d => d.data[kanbanField.key] === option.value)
                .map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("dealId", deal.id);
                      e.dataTransfer.effectAllowed = "move";
                      const el = e.currentTarget as HTMLElement;
                      setTimeout(() => el.style.opacity = "0.4", 0);
                    }}
                    onDragEnd={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    <motion.div
                      layoutId={deal.id} layout="position" onClick={() => onDealClick(deal.id)}
                      className="p-4 rounded-xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing group select-none cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm group-hover:text-blue-500 transition-colors leading-tight">{deal.name}</h4>
                        <MoreVertical size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                      </div>
                      
                      <div className="space-y-2">
                        {displayFields
                          .filter(f => f.key !== 'name' && f.key !== 'status')
                          .map(field => (
                            <div key={field.id} className="flex justify-between items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate">{field.label}</span>
                              <span className="text-[10px] font-black truncate max-w-[120px]">
                                {field.type === 'currency' ? `PKR ${deal.data[field.key]?.toLocaleString()}` : String(deal.data[field.key] || '-')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  </div>
                ))}
              
              <button 
                onClick={() => onAddClick(option.value)}
                className="w-full py-4 flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
              >
                 <Plus size={16} className="text-muted-foreground group-hover:text-blue-500 mb-1" />
                 <p className="text-[10px] font-bold text-muted-foreground group-hover:text-blue-500 uppercase tracking-widest">Add Deal</p>
              </button>
            </div>
          </div>
        ))}
      </LayoutGroup>
      <button onClick={handleAddStage} className="w-80 shrink-0 border-2 border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center h-[500px] hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group">
        <Plus size={32} className="text-muted-foreground group-hover:text-blue-500 mb-4" />
        <p className="font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-blue-500 text-xs">Add New Stage</p>
      </button>
    </div>
  );
};

/**
 * COMPOSABLE LIST VIEW (GRID STYLE)
 */
const CRMListView = ({ 
  deals, config, updateConfig, onDealClick, onAddClick, selectedIds, onSelect, onSelectAll, onDelete, onEdit, onPreview
}: { 
  deals: CRMEntity[], config: CRMConfig, updateConfig: (updates: any) => void,
  onDealClick: (id: string) => void, onAddClick: () => void,
  selectedIds: string[], onSelect: (id: string) => void, onSelectAll: (ids: string[]) => void,
  onDelete: (id: string) => void, onEdit: (id: string) => void, onPreview: (id: string) => void
}) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const module = config.modules.deals;
  const view = module.views.find((v: ViewConfig) => v.type === 'list') || module.views[1] || module.views[0];
  const visibleIds = view?.visibleFields || module.fields.map(f => f.id);
  const displayFields = module.fields.filter((f: FieldConfig) => visibleIds.includes(f.id));

  const handleRenameField = (fieldId: string, newLabel: string) => {
    const newFields = module.fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
    updateConfig({ fields: newFields });
    setEditingFieldId(null);
  };

  const handleHideField = (fieldId: string) => {
    const newViews = module.views.map(v => 
      v.type === 'list' 
        ? { ...v, visibleFields: v.visibleFields.filter(id => id !== fieldId) } 
        : v
    );
    updateConfig({ views: newViews });
    toast.success("Field hidden from list view");
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Delete this attribute entirely? Data for this field will be lost.")) {
      const newFields = module.fields.filter(f => f.id !== fieldId || f.isSystem);
      const newViews = module.views.map(v => ({
        ...v,
        visibleFields: v.visibleFields.filter(id => id !== fieldId)
      }));
      updateConfig({ fields: newFields, views: newViews });
      toast.success("Attribute deleted");
    }
  };

  const handleAddField = () => {
    const id = `f_${Date.now()}`;
    const newField: FieldConfig = { id, key: `custom_${Date.now()}`, label: 'New Attribute', type: 'text', isSystem: false, isVisible: true, order: module.fields.length };
    updateConfig({ 
      fields: [...module.fields, newField],
      views: module.views.map(v => v.type === 'list' ? { ...v, visibleFields: [...v.visibleFields, id] } : v)
    });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden backdrop-blur-sm overflow-x-auto shadow-2xl shadow-blue-500/5">
      <table className="w-full text-left text-sm min-w-[1000px] border-collapse">
        <thead>
          <tr className="bg-secondary/40">
            <th className="p-4 w-12 border-r border-border/60">
              <input type="checkbox" className="rounded border-border bg-background cursor-pointer" checked={deals.length > 0 && selectedIds.length === deals.length} onChange={(e) => onSelectAll(e.target.checked ? deals.map(d => d.id) : [])} />
            </th>
            {displayFields.map(field => (
              <th key={field.id} className="p-0 border-r border-border/60 relative group/th">
                <div className="flex items-center justify-between px-4 py-3 h-full">
                  <span className="font-black uppercase tracking-widest text-[10px] truncate">{field.label}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/th:opacity-100 hover:bg-secondary/50"><MoreVertical size={10} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40 border-border bg-card/95 backdrop-blur-xl">
                      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setEditingFieldId(field.id)}>Rename Field</DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => handleHideField(field.id)}>Hide from View</DropdownMenuItem>
                      {!field.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => handleDeleteField(field.id)}>Delete Field</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {editingFieldId === field.id && (
                  <InlineHeaderEdit value={field.label} onSave={(val) => handleRenameField(field.id, val)} onCancel={() => setEditingFieldId(null)} />
                )}
              </th>
            ))}
            <th className="p-0 w-12 bg-secondary/20 hover:bg-blue-500/10 transition-colors cursor-pointer" onClick={handleAddField}>
              <div className="flex items-center justify-center h-full"><Plus size={14} className="text-muted-foreground" /></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {deals.length === 0 ? (
            <tr><td colSpan={displayFields.length + 3} className="p-12 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">No deals found. <Button onClick={onAddClick} className="ml-2 bg-blue-500 h-8 rounded-xl font-black">Add First</Button></td></tr>
          ) : (
            deals.map(deal => (
              <tr key={deal.id} onClick={() => onDealClick(deal.id)} className={cn("border-b border-border/60 hover:bg-secondary/30 transition-colors group cursor-pointer", selectedIds.includes(deal.id) && "bg-blue-500/5")}>
                <td className="p-4 border-r border-border/60" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-border bg-background cursor-pointer" checked={selectedIds.includes(deal.id)} onChange={() => onSelect(deal.id)} />
                </td>
                {displayFields.map(field => (
                  <td key={field.id} className="p-4 border-r border-border/60">
                    {field.type === 'select' ? (
                      <Badge variant="secondary" className={cn("text-[9px] uppercase font-black px-2 border", `bg-${field.options?.find(o => o.value === deal.data[field.key])?.color}-500/10 text-${field.options?.find(o => o.value === deal.data[field.key])?.color}-500 border-${field.options?.find(o => o.value === deal.data[field.key])?.color}-500/20`)}>
                        {field.options?.find(o => o.value === deal.data[field.key])?.label || deal.data[field.key]}
                      </Badge>
                    ) : field.type === 'currency' ? (
                      <span className="font-bold text-green-500 text-xs">PKR {Number(deal.data[field.key] || 0).toLocaleString()}</span>
                    ) : (
                      <span className={cn(field.key === 'organization' || field.key === 'name' ? 'font-bold group-hover:text-blue-500 text-xs' : 'text-muted-foreground font-medium text-xs')}>
                        {String(deal.data[field.key] || '-')}
                      </span>
                    )}
                  </td>
                ))}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={(e) => { e.stopPropagation(); onPreview(deal.id); }}><Eye size={12} /></Button>
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={(e) => { e.stopPropagation(); onEdit(deal.id); }}><Edit2 size={12} /></Button>
                    <Button variant="ghost" size="icon" className="size-7 rounded-lg text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}><Trash2 size={12} /></Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default function DealsPage() {
  const { deals, config, loading, updateEntity, deleteEntity, updateModuleConfig, updateEntityField } = useCRM();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "value" | "updated">("updated");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>();
  const [initialStatus, setInitialStatus] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const moduleConfig = config.modules.deals;

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "list" || view === "kanban") setActiveView(view as any);
  }, [searchParams]);

  const setView = (view: "list" | "kanban") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSelectedIds([]);
  };

  const filteredDeals = useMemo(() => {
    let result = deals.filter(d => !d.isDeleted);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.data.email?.toLowerCase().includes(q) || 
        d.data.organization?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "value") return (Number(b.data.annualRevenue) || 0) - (Number(a.data.annualRevenue) || 0);
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });
    return result;
  }, [deals, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const total = filteredDeals.length;
    const value = filteredDeals.reduce((sum, d) => sum + (Number(d.data.annualRevenue) || 0), 0);
    const won = filteredDeals.filter(d => d.data.status === 'won').length;
    return { total, value, won };
  }, [filteredDeals]);

  const handleDropDeal = async (dealId: string, status: string) => {
    await updateEntity(dealId, { status }, "stage_change_drag");
    toast.success("Deal pipeline updated");
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'preview', id?: string) => {
    setModalMode(mode);
    setSelectedDealId(id);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen relative bg-background/50">
      <DealModal 
        isOpen={showAddModal} 
        onOpenChange={setShowAddModal} 
        mode={modalMode} 
        dealId={selectedDealId}
        initialStatus={initialStatus}
      />
      
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border border-border/40 shadow-2xl rounded-2xl p-4 flex items-center gap-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 px-2 border-r border-border/20 mr-2">
              <span className="bg-blue-500 text-white size-6 rounded-full flex items-center justify-center text-xs font-black">{selectedIds.length}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={async () => { if (confirm(`Delete ${selectedIds.length}?`)) { await Promise.all(selectedIds.map(id => deleteEntity(id))); setSelectedIds([]); }}} className="h-9 rounded-xl text-red-500 hover:bg-red-500/10 font-bold text-[10px] uppercase">Delete</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-9 rounded-xl font-bold text-[10px] uppercase">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Deals</h1>
          <p className="text-muted-foreground font-medium text-sm">Manage business opportunities and revenue growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl border border-border/40 backdrop-blur-md">
            <Button variant={activeView === "list" ? "secondary" : "ghost"} size="sm" className="h-8 text-[10px] font-black uppercase rounded-lg" onClick={() => setView("list")}><ListIcon size={12} className="mr-2" /> List</Button>
            <Button variant={activeView === "kanban" ? "secondary" : "ghost"} size="sm" className="h-8 text-[10px] font-black uppercase rounded-lg" onClick={() => setView("kanban")}><LayoutGrid size={12} className="mr-2" /> Kanban</Button>
          </div>
          <Button onClick={() => handleOpenModal('create')} className="h-10 px-6 font-bold text-xs uppercase bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"><Plus size={16} className="mr-2" /> Add Deal</Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
          <Input placeholder="Search deals, companies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 bg-card/50 border-border/60 rounded-xl text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-10 rounded-xl border-border/60 font-bold text-[10px] uppercase hover:bg-secondary"><ArrowUpDown size={14} className="mr-2" /> Sort: {sortBy}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-xs font-bold" onClick={() => setSortBy("name")}>Organization</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold" onClick={() => setSortBy("value")}>Value</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold" onClick={() => setSortBy("updated")}>Updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" disabled className="h-10 rounded-xl border-border/60 font-bold text-[10px] uppercase opacity-50 relative overflow-hidden">
            <Download size={14} className="mr-2" /> Export
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border/40 bg-[linear-gradient(90deg,transparent_0%,transparent_20%,#888_20%,#888_40%,transparent_40%,transparent_60%,#888_60%,#888_80%,transparent_80%,transparent_100%)] bg-[length:10px_1px]" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeView === "kanban" ? (
            <motion.div key="kanban" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <CRMKanbanView deals={filteredDeals} config={config} updateConfig={(upd) => updateModuleConfig('deals', upd)} onDealClick={id => router.push(`/crm/deals/${id}`)} onAddClick={s => { setInitialStatus(s); setShowAddModal(true); }} onDropDeal={handleDropDeal} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CRMListView 
                deals={filteredDeals} 
                config={config} 
                updateConfig={(upd) => updateModuleConfig('deals', upd)} 
                onDealClick={id => router.push(`/crm/deals/${id}`)} 
                onAddClick={() => setShowAddModal(true)} 
                selectedIds={selectedIds} 
                onSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} 
                onSelectAll={setSelectedIds} 
                onDelete={id => deleteEntity(id)}
                onEdit={id => handleOpenModal('edit', id)}
                onPreview={id => handleOpenModal('preview', id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
