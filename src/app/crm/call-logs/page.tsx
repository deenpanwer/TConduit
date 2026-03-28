'use client';

import React, { useState, useMemo, useCallback } from "react";
import { useCRM, FieldConfig, CRMEntity, ModuleConfig } from "@/hooks/use-crm";
import { 
  PhoneCall, ArrowUpRight, ArrowDownRight, 
  Clock, Plus, Search, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogCallForm } from "@/components/dashboard/crm/forms/LogCallForm";
import { EditableDataTable } from "@/components/dashboard/crm/EditableDataTable";
import { FilterBar, FilterCondition } from "@/components/dashboard/crm/FilterBar";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CallLogsPage() {
  const { calls, config, addEntity, updateEntity, deleteEntity, updateModuleConfig } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<CRMEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sort, setSort] = useState<{key: string; dir: 'asc' | 'desc'} | null>({ key: 'createdAt', dir: 'desc' });

  const moduleConfig = config.modules.calls;

  const visibleFields = useMemo(() => {
    const view = moduleConfig.views.find(v => v.type === 'list') || moduleConfig.views[0];
    const visibleIds = view?.visibleFields || moduleConfig.fields.map(f => f.id);
    return moduleConfig.fields
        .filter(f => visibleIds.includes(f.id))
        .sort((a,b) => a.order - b.order);
  }, [moduleConfig]);

  const sortedCalls = useMemo(() => {
    let sorted = [...calls];
    if (sort) {
      sorted.sort((a, b) => {
        const aVal = a.data[sort.key];
        const bVal = b.data[sort.key];
        if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [calls, sort]);

  const filteredLogs = useMemo(() => {
    return sortedCalls.filter(log => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === "" || Object.values(log.data).some(val => 
            String(val).toLowerCase().includes(searchLower)
        );

        if (!matchesSearch) return false;

        return filters.every(condition => {
            const fieldVal = String((log.data as any)[condition.field] || "").toLowerCase();
            const condVal = condition.value.toLowerCase();

            switch (condition.operator) {
                case 'is': return fieldVal === condVal;
                case 'is not': return fieldVal !== condVal;
                case 'contains': return fieldVal.includes(condVal);
                default: return true;
            }
        });
    });
  }, [sortedCalls, searchQuery, filters]);

  const handleSort = (key: string) => {
    setSort(prev => {
        if (prev?.key === key) {
            return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
        }
        return { key, dir: 'desc' };
    });
  };

  const columns = useMemo(() => visibleFields.map(field => ({
    id: field.id,
    key: field.key,
    label: field.label,
    cellRenderer: (item: CRMEntity) => {
        const value = item.data[field.key];
        if (field.key === 'type') {
            return (
                <div className="flex items-center gap-2">
                    {value === 'Incoming' ? (
                        <div className="bg-green-500/10 p-1 rounded-full">
                            <ArrowDownRight className="h-3 w-3 text-green-500" />
                        </div>
                    ) : (
                        <div className="bg-purple-500/10 p-1 rounded-full">
                            <ArrowUpRight className="h-3 w-3 text-purple-500" />
                        </div>
                    )}
                    <span className="text-xs font-medium">{value}</span>
                </div>
            )
        }
        if (field.key === 'status') {
            const statusConfig = field.options?.find(o => o.value === value);
            return (
                <Badge variant="secondary" className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                    value === 'completed' && "bg-green-500/10 text-green-500 border-green-500/20",
                    value === 'busy' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                    value === 'no-answer' && "bg-red-500/10 text-red-500 border-red-500/20",
                    value === 'failed' && "bg-gray-500/10 text-gray-500 border-gray-500/20"
                )}>
                    {statusConfig?.label || value}
                </Badge>
            )
        }
        if (field.key === 'related_to') {
             return (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-blue-500">{value || '-'}</span>
                </div>
            )
        }
        if (field.key === 'createdAt') return <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, 'yy")}</span>
        return <span className="text-xs font-medium">{String(value || '-')}</span>
    }
  })), [visibleFields]);

  const handleFormSubmit = async (data: any) => {
    if (editingCall) {
      await updateEntity(editingCall.id, data);
      toast.success("Call log updated!");
    } else {
      await addEntity('call', data);
      toast.success("Call logged successfully!");
    }
    setIsModalOpen(false);
    setEditingCall(null);
  };

  const handleOpenModal = (call: CRMEntity | null = null) => {
      setEditingCall(call);
      setIsModalOpen(true);
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this log?")) {
      await deleteEntity(id);
      toast.success("Call log deleted.");
    }
  };

  const handleAddColumn = () => {
    const newField: FieldConfig = {
      id: `f_${Date.now()}`,
      key: `custom_${Date.now()}`,
      label: 'New Column',
      type: 'text',
      isSystem: false,
      isVisible: true,
      order: moduleConfig.fields.length
    };
    const newConfig = { 
        ...moduleConfig, 
        fields: [...moduleConfig.fields, newField],
        views: moduleConfig.views.map(v => ({...v, visibleFields: [...v.visibleFields, newField.id]}))
    };
    updateModuleConfig('calls', newConfig);
  }

  return (
    <main className="p-6 space-y-6">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingCall ? 'Edit Call Log' : 'Log a New Call'}</DialogTitle>
                </DialogHeader>
                <LogCallForm 
                    initialData={editingCall?.data} 
                    onSubmit={handleFormSubmit} 
                    onCancel={() => setIsModalOpen(false)} 
                />
            </DialogContent>
        </Dialog>

        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                 <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <PhoneCall size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
                    <p className="text-muted-foreground font-medium">Manage all customer interactions in a spreadsheet-like view.</p>
                </div>
            </div>
            <Button className="font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95" onClick={() => handleOpenModal()}>
                <Plus size={16} className="mr-2" /> Log a Call
            </Button>
        </div>

        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  placeholder="Search by summary, contact, etc..." 
                  value={searchQuery} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} 
                  className="pl-10 h-10 bg-card/50 border-border/60 rounded-xl" 
                />
            </div>
             <FilterBar 
                onFilterChange={setFilters}
                availableColumns={moduleConfig.fields.map(f => ({id: f.key, label: f.label}))}
                visibleColumns={[]}
                onColumnToggle={() => {}}
                searchPlaceholder="" 
                onSearch={() => {}} 
            />
        </div>

        <EditableDataTable<CRMEntity> 
            data={filteredLogs}
            columns={columns}
            config={moduleConfig}
            onUpdateConfig={(updates) => updateModuleConfig('calls', updates)}
            onAddColumn={handleAddColumn}
            onRowClick={(row) => console.log(row)}
            onEditRow={handleOpenModal}
            onDeleteRow={handleDelete}
            onSort={handleSort}
            currentSort={sort}
        />
    </main>
  );
}