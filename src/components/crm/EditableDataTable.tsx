'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MoreVertical, Plus, Check, X, Trash2, 
  Edit, ArrowUpDown, GripVertical 
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ModuleConfig, FieldConfig } from "@/hooks/use-crm-module";

const InlineHeaderEdit = ({ value, onSave, onCancel }: { value: string, onSave: (val: string) => void, onCancel: () => void }) => {
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex items-center bg-background p-1 border shadow-lg rounded-md">
      <Input 
        ref={inputRef}
        value={temp} 
        onChange={e => setTemp(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(temp);
          if (e.key === 'Escape') onCancel();
        }}
        className="h-7 border-blue-500 focus-visible:ring-blue-500"
      />
      <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => onSave(temp)}><Check size={14} /></Button>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={onCancel}><X size={14} /></Button>
    </div>
  );
};

// Define interfaces for props
interface DataItem {
  id: string;
  [key: string]: any;
}

interface ColumnDef<T> {
  id: string;
  key: string;
  label: string;
  cellRenderer: (item: T) => React.ReactNode;
}

interface SortConfig {
  key: string;
  dir: 'asc' | 'desc';
}

interface EditableDataTableProps<T extends DataItem> {
  data: T[];
  columns: ColumnDef<T>[];
  config: ModuleConfig;
  onUpdateConfig: (newConfig: Partial<ModuleConfig>) => void;
  onAddColumn: () => void;
  onRowClick: (item: T) => void;
  onEditRow: (item: T) => void;
  onDeleteRow: (id: string) => void;
  onSort: (key: string) => void;
  currentSort: SortConfig | null;
}

export const EditableDataTable = <T extends DataItem>({
  data,
  columns,
  config,
  onUpdateConfig,
  onAddColumn,
  onRowClick,
  onEditRow,
  onDeleteRow,
  onSort,
  currentSort,
}: EditableDataTableProps<T>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      const allIds = data.map((item) => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleHideColumn = (fieldId: string) => {
    const newViews = config.views.map((v) => ({
      ...v,
      visibleFields: v.visibleFields.filter((id) => id !== fieldId)
    }));
    onUpdateConfig({ ...config, views: newViews });
  };

  const handleRenameColumn = (fieldId: string, newLabel: string) => {
    const newFields = config.fields.map((f) => f.id === fieldId ? { ...f, label: newLabel } : f);
    onUpdateConfig({ ...config, fields: newFields });
    setEditingHeader(null);
  };

  return (
    <div className="rounded-xl border bg-card/60 border-border/40 backdrop-blur-sm overflow-hidden">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="bg-secondary/40 hover:bg-secondary/40">
            <TableHead className="w-12 border-r border-border/40">
              <Checkbox 
                checked={data.length > 0 && selectedIds.length === data.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            {columns.map((col) => (
              <TableHead key={col.id} className="border-r border-border/40 relative group px-0 py-0 h-12">
                {editingHeader === col.id ? (
                  <InlineHeaderEdit 
                    value={col.label}
                    onSave={(val) => handleRenameColumn(col.id, val)}
                    onCancel={() => setEditingHeader(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between h-full px-3">
                    <button onClick={() => onSort(col.key)} className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
                      {col.label}
                      {currentSort?.key === col.key && (
                        <ArrowUpDown size={10} className={cn(currentSort.dir === 'desc' && 'rotate-180')} />
                      )}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                           <GripVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setEditingHeader(col.id)}>Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleHideColumn(col.id)}>Hide Column</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </TableHead>
            ))}
            <TableHead className="w-14 text-center border-l border-border/40">
              <Button variant="ghost" size="icon" onClick={onAddColumn} className="h-8 w-8">
                <Plus size={16} />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={item.id} 
              className={cn(
                "hover:bg-secondary/30 transition-colors group",
                selectedIds.includes(item.id) && 'bg-blue-500/10 hover:bg-blue-500/20'
              )}
            >
              <TableCell className="border-r border-border/40">
                <Checkbox 
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => handleSelectRow(item.id)}
                />
              </TableCell>
              {columns.map((col) => (
                <TableCell key={col.id} className="border-r border-border/40 py-3" onClick={() => onRowClick(item)}>
                  {col.cellRenderer(item)}
                </TableCell>
              ))}
              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditRow(item)}> 
                        <Edit size={12} className="mr-2"/> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500" onClick={() => onDeleteRow(item.id)}>
                        <Trash2 size={12} className="mr-2"/> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
