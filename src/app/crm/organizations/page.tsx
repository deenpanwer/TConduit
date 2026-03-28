'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCRM, CRMEntity, FieldConfig, ViewConfig, CRMConfig, ModuleConfig } from '@/hooks/use-crm';
import { Button } from '@/components/ui/button';
import {
  List as ListIcon, Plus, Search,
  Filter, Download, MoreHorizontal, ArrowUpDown, MoreVertical,
  Trash2, Edit2, Settings2, X, Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OrganizationForm } from '@/components/dashboard/crm/forms/OrganizationForm'; // New Form component
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

/**
 * REUSED: INLINE RENAME COMPONENT FOR HEADERS
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
 * COMPOSABLE LIST VIEW FOR ORGANIZATIONS
 */
const CRMOrganizationListView = ({
  organizations, config, updateModuleConfig, onOrganizationClick, onAddClick, selectedIds, onSelect, onSelectAll, isLoading
}: {
  organizations: CRMEntity[], config: CRMConfig, updateModuleConfig: (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => void,
  onOrganizationClick: (id: string) => void, onAddClick: () => void,
  selectedIds: string[], onSelect: (id: string) => void, onSelectAll: (ids: string[]) => void, isLoading: boolean
}) => {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const module = config.modules.organizations;
  const view = module.views.find((v: ViewConfig) => v.type === 'list') || module.views[0];
  const displayFields = module.fields.filter((f: FieldConfig) => view?.visibleFields?.includes(f.id));

  const handleRenameField = (fieldId: string, newLabel: string) => {
    const newFields = module.fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
    updateModuleConfig('organizations', { fields: newFields });
    setEditingFieldId(null);
  };

  const handleHideField = (fieldId: string) => {
    const newViews = module.views.map(v =>
      v.type === 'list'
        ? { ...v, visibleFields: v.visibleFields.filter(id => id !== fieldId) }
        : v
    );
    updateModuleConfig('organizations', { views: newViews });
    toast.success("Field hidden from list view");
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Delete this attribute entirely? Data for this field will be lost.")) {
      const newFields = module.fields.filter(f => f.id !== fieldId || f.isSystem);
      const newViews = module.views.map(v => ({
        ...v,
        visibleFields: v.visibleFields.filter(id => id !== fieldId)
      }));
      updateModuleConfig('organizations', { fields: newFields, views: newViews });
      toast.success("Attribute deleted");
    }
  };

  const handleAddField = () => {
    const id = `o_${Date.now()}`; // Use 'o' prefix for organizations
    const newField: FieldConfig = { id, key: `custom_${Date.now()}`, label: 'New Attribute', type: 'text', isSystem: false, isVisible: true, order: module.fields.length };
    updateModuleConfig('organizations', {
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
              <input type="checkbox" className="rounded border-border bg-background cursor-pointer" checked={organizations.length > 0 && selectedIds.length === organizations.length} onChange={(e) => onSelectAll(e.target.checked ? organizations.map(l => l.id) : [])} />
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
                      <DropdownMenuItem className="text-xs font-bold" onClick={() => setEditingFieldId(field.id)}>Rename Field</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-bold" onClick={() => handleHideField(field.id)}>Hide from View</DropdownMenuItem>
                      {!field.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs font-bold text-red-500" onClick={() => handleDeleteField(field.id)}>Delete Field</DropdownMenuItem>
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
          {isLoading ? (
             <tr><td colSpan={displayFields.length + 3} className="p-12 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">Loading Organizations...</td></tr>
          ) : organizations.length === 0 ? (
            <tr><td colSpan={displayFields.length + 3} className="p-12 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">No organizations found. <Button onClick={onAddClick} className="ml-2 bg-blue-500 h-8 rounded-xl font-black">Add First</Button></td></tr>
          ) : (
            organizations.map(org => (
              <tr key={org.id} onClick={() => onOrganizationClick(org.id)} className={cn("border-b border-border/60 hover:bg-secondary/30 transition-colors group cursor-pointer", selectedIds.includes(org.id) && "bg-blue-500/5")}>
                <td className="p-4 border-r border-border/60" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-border bg-background cursor-pointer" checked={selectedIds.includes(org.id)} onChange={() => onSelect(org.id)} />
                </td>
                {displayFields.map(field => (
                  <td key={field.id} className="p-4 border-r border-border/60">
                    {field.type === 'select' ? (
                      <Badge variant="secondary" className={cn("text-[10px] uppercase font-black px-2 border", `bg-${field.options?.find(o => o.value === org.data[field.key])?.color}-500/10 text-${field.options?.find(o => o.value === org.data[field.key])?.color}-500 border-${field.options?.find(o => o.value === org.data[field.key])?.color}-500/20`)}>
                        {field.options?.find(o => o.value === org.data[field.key])?.label || String(org.data[field.key] || '-')}
                      </Badge>
                    ) : field.type === 'currency' ? (
                      <span className="font-bold text-blue-500 text-xs">${Number(org.data[field.key] || 0).toLocaleString()}</span>
                    ) : (
                      <span className={cn(field.key === 'organizationName' ? 'font-bold group-hover:text-blue-500 text-xs' : 'text-muted-foreground font-medium text-xs')}>
                        {String(org.data[field.key] || '-')}
                      </span>
                    )}
                  </td>
                ))}
                <td className="p-4 text-center"><MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100" /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default function OrganizationsPage() {
  const { organizations: crmOrganizations, config, updateEntity, deleteEntity, updateModuleConfig } = useCRM();
  const [organizations, setOrganizations] = useState<CRMEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"organizationName" | "website" | "industry" | "country" | "annualRevenue" | "employeeCount" | "updatedAt">("organizationName");
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null); // Example filter
  const [filterCountry, setFilterCountry] = useState<string | null>(null); // Example filter
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (crmOrganizations) {
      setOrganizations(crmOrganizations);
      setIsLoading(false);
    }
  }, [crmOrganizations]);

  const module = config.modules.organizations; // Use organizations module config

  const filteredOrganizations = useMemo(() => {
    let result = organizations.filter(o => !o.isDeleted);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.name.toLowerCase().includes(q) || // Search by entity name (Organization Name)
        o.data.organizationName?.toLowerCase().includes(q) || // Also search by explicit organizationName field
        o.data.website?.toLowerCase().includes(q) ||
        o.data.industry?.toLowerCase().includes(q) ||
        o.data.country?.toLowerCase().includes(q)
      );
    }
    if (filterIndustry) result = result.filter(o => o.data.industry === filterIndustry);
    if (filterCountry) result = result.filter(o => o.data.country === filterCountry);

    result.sort((a, b) => {
      const valA = a.data[sortBy] ?? a.name; // Fallback to name if field not found for sorting
      const valB = b.data[sortBy] ?? b.name;

      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB);
      if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
      if (sortBy === "updatedAt") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      
      return 0;
    });
    return result;
  }, [organizations, searchQuery, sortBy, filterIndustry, filterCountry]);

  const handleUpdateSortBy = (key: string) => {
    setSortBy(key as any);
  };
  
  const handleOrganizationClick = (id: string) => {
    router.push(`/crm/organizations/${id}`);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} organization(s)?`)) {
      await Promise.all(selectedIds.map(id => deleteEntity(id)));
      setSelectedIds([]);
      toast.success("Organizations deleted successfully.");
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-screen relative">
      <OrganizationForm isOpen={showAddModal} onOpenChange={setShowAddModal} />

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
              <Button variant="outline" size="sm" onClick={handleDeleteSelected} className="h-9 rounded-xl text-red-500 hover:bg-red-500/10 font-bold text-[10px] uppercase">Delete</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-9 rounded-xl font-bold text-[10px] uppercase">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="text-muted-foreground font-medium text-sm">Manage your company contacts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAddModal(true)} className="h-10 px-6 font-bold text-xs uppercase bg-blue-500 hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"><Plus size={16} className="mr-2" /> New Organization</Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
          <Input placeholder="Search organizations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 bg-card/50 border-border/60 rounded-xl text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 rounded-xl border-border/60 font-bold text-[10px] uppercase hover:bg-secondary">
                <ArrowUpDown size={14} className="mr-2" /> Sort: {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              {/* Dynamically populate sort options from organization fields */}
              {module.fields.map(field => (
                <DropdownMenuItem key={field.id} className="text-xs font-bold" onClick={() => handleUpdateSortBy(field.key)}>
                  {field.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs font-bold" onClick={() => handleUpdateSortBy("updatedAt")}>
                Last Updated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 rounded-xl border-border/60 font-bold text-[10px] uppercase hover:bg-secondary">
                <Filter size={14} className="mr-2" /> Filter: All
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-xs font-bold" onClick={() => { setFilterIndustry(null); setFilterCountry(null); }}>Clear Filters</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest">Industry</DropdownMenuLabel>
              {/* This would ideally be populated dynamically from actual organization data or predefined options */}
              {module.fields.find(f => f.key === 'industry')?.options?.map(opt => (
                <DropdownMenuItem key={opt.value} className="text-xs font-bold" onClick={() => setFilterIndustry(opt.value)}>{opt.label}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest">Country</DropdownMenuLabel>
              {/* This would ideally be populated dynamically from actual organization data or predefined options */}
              <DropdownMenuItem className="text-xs font-bold" onClick={() => setFilterCountry('USA')}>USA</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold" onClick={() => setFilterCountry('Canada')}>Canada</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-bold" onClick={() => setFilterCountry('UK')}>UK</DropdownMenuItem>
              {/* Add more country options as needed */}
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
          <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
            <CRMOrganizationListView
              organizations={filteredOrganizations}
              config={config}
              updateModuleConfig={(moduleKey, updates) => updateModuleConfig(moduleKey, updates)}
              onOrganizationClick={handleOrganizationClick}
              onAddClick={() => setShowAddModal(true)}
              selectedIds={selectedIds}
              onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              onSelectAll={(ids) => setSelectedIds(ids)}
              isLoading={isLoading}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
