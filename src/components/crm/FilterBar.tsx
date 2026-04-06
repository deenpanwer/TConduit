'use client';

import { useState } from "react";
import { Search, Filter as FilterIcon, Settings2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterCondition {
  field: string;
  operator: 'is' | 'is not' | 'contains';
  value: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch: (query: string) => void;
  availableColumns: { id: string; label: string }[];
  visibleColumns: string[];
  onColumnToggle: (columnId: string) => void;
  onFilterChange: (conditions: FilterCondition[]) => void;
}

export function FilterBar({
  searchPlaceholder = "Search...",
  onSearch,
  availableColumns,
  visibleColumns,
  onColumnToggle,
  onFilterChange
}: FilterBarProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      field: availableColumns[0].id,
      operator: 'is',
      value: ''
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    onFilterChange(updated);
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onFilterChange(updated);
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const updated = conditions.map((c, i) => i === index ? { ...c, ...updates } : c);
    setConditions(updated);
    onFilterChange(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder={searchPlaceholder}
          className="pl-9 h-10 bg-card/50 border-border/40 focus-visible:ring-primary/20"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="default" className={cn(
            "h-10 gap-2",
            conditions.length > 0 && "border-dashed border-primary/50 bg-primary/5 text-primary"
          )}>
            <FilterIcon className="size-4" />
            <span>Filter</span>
            {conditions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground">
                {conditions.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl" align="start">
          <div className="p-4 border-b border-border/40">
            <h4 className="font-bold text-sm">Filter Conditions</h4>
          </div>
          <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
            {conditions.map((condition, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-background/50 rounded-lg border border-border/40 relative group">
                 <button 
                    onClick={() => removeCondition(index)}
                    className="absolute -top-2 -right-2 size-5 bg-background border rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="size-3" />
                  </button>
                <select 
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                >
                  {availableColumns.map(col => (
                    <option key={col.id} value={col.id}>{col.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select 
                    className="bg-background border rounded px-1 py-1 text-[10px] outline-none"
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                  >
                    <option value="is">is</option>
                    <option value="contains">contains</option>
                    <option value="is not">is not</option>
                  </select>
                  <input 
                    className="flex-1 bg-background border rounded px-2 py-1 text-xs outline-none focus:border-primary/50"
                    placeholder="Value..."
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border/40 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={addCondition}>
              <Plus className="size-3" /> Add Filter
            </Button>
            {conditions.length > 0 && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive/10" onClick={() => setConditions([])}>
                Clear All
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="default" className="h-10 gap-2">
            <Settings2 className="size-4" />
            <span>View</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card/80 backdrop-blur-xl border-border/50">
          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={visibleColumns.includes(column.id)}
              onCheckedChange={() => onColumnToggle(column.id)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}