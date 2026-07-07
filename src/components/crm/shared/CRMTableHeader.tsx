'use client';

import React from "react";
import { 
  MoreVertical, Edit2, NotebookPen, ArrowLeft, ArrowRight, Trash, Plus, Search as SearchIcon, ChevronUp, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldConfig, ModuleConfig } from "@/hooks/use-crm";
import { ColumnPicker } from "./ColumnPicker";

interface CRMTableHeaderProps {
  displayFields: FieldConfig[];
  tableColor: string;
  entitiesCount: number;
  selectedCount: number;
  onSelectAll: (checked: boolean) => void;
  renamingFieldId: string | null;
  setRenamingFieldId: (id: string | null) => void;
  handleRenameColumn: (fieldId: string, label: string) => void;
  setEditingDescriptionFieldId: (id: string | null) => void;
  setDescriptionValue: (val: string) => void;
  orderedFieldIds: string[];
  handleMoveColumn: (fieldId: string, direction: 'left' | 'right') => void;
  handleDeleteColumn: (fieldId: string) => void;
  handleAddColumn: (template?: Partial<FieldConfig>, type?: FieldConfig['type']) => void;
  availableTemplates: FieldConfig[];
  canManageColumns?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortToggle?: (fieldId: string) => void;
}

export const CRMTableHeader = ({
  displayFields,
  tableColor,
  entitiesCount,
  selectedCount,
  onSelectAll,
  renamingFieldId,
  setRenamingFieldId,
  handleRenameColumn,
  setEditingDescriptionFieldId,
  setDescriptionValue,
  orderedFieldIds,
  handleMoveColumn,
  handleDeleteColumn,
  handleAddColumn,
  availableTemplates,
  canManageColumns = true,
  sortBy,
  sortDirection,
  onSortToggle
}: CRMTableHeaderProps) => {
  return (
    <thead>
      <tr className="h-12 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
        <th className="w-24 p-0 border-r border-border/50 sticky left-0 top-0 z-[60] bg-slate-100 dark:bg-slate-800">
          <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: tableColor}} />
          <div className="flex items-center justify-start gap-2 h-full pl-4">
            <div className="w-5" /> {/* Spacer for index */}
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                className="rounded-sm border-border bg-background cursor-pointer accent-blue-600 h-4 w-4"
                checked={entitiesCount > 0 && selectedCount === entitiesCount}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </div>
          </div>
        </th>
        {displayFields.map((field) => (
          <th key={field.id} className="p-0 border-r border-border/50 sticky top-0 z-30 bg-slate-100 dark:bg-slate-800 group/th h-12 min-w-[150px]">
            <div className="flex items-center justify-between px-4 h-full">
              {renamingFieldId === field.id ? (
                <Input 
                  className="h-8 bg-background/50 border-blue-500/50 text-xs font-black uppercase tracking-widest px-2"
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
                        <div 
                           className="flex items-center gap-1 cursor-pointer group/sort px-1 -mx-1"
                           onClick={(e) => {
                             e.preventDefault();
                             if (onSortToggle) onSortToggle(field.key);
                           }}
                        >
                          <span className="font-extrabold uppercase tracking-wider text-xs text-muted-foreground group-hover/sort:text-foreground transition-colors whitespace-nowrap select-none">
                              {field.label}
                          </span>
                          {sortBy === field.key && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 text-blue-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-blue-500 shrink-0" />
                          )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-card/95 border-border/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl max-w-xs z-[100]">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-1">{field.label}</p>
                        <p className="text-xs font-bold uppercase tracking-widest leading-relaxed text-foreground/60">{field.description || 'No description provided.'}</p>
                    </TooltipContent>
                </Tooltip>
              )}
              {canManageColumns && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/th:opacity-100 hover:bg-secondary/50 rounded-lg"><MoreVertical size={12} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl">
                    <DropdownMenuItem className="text-xs font-bold uppercase" onClick={() => setRenamingFieldId(field.id)}>
                      <Edit2 size={12} className="mr-2" /> Rename Column
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-bold uppercase" onClick={() => { 
                        setEditingDescriptionFieldId(field.id);
                        setDescriptionValue(field.description || "");
                    }}>
                      <NotebookPen size={12} className="mr-2" /> Edit Description
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs font-bold uppercase" disabled={orderedFieldIds.indexOf(field.id) === 0} onClick={() => handleMoveColumn(field.id, 'left')}>
                      <ArrowLeft size={12} className="mr-2" /> Move Left
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-bold uppercase" disabled={orderedFieldIds.indexOf(field.id) === orderedFieldIds.length - 1} onClick={() => handleMoveColumn(field.id, 'right')}>
                      <ArrowRight size={12} className="mr-2" /> Move Right
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs font-bold uppercase text-red-500" onClick={() => handleDeleteColumn(field.id)}>
                      <Trash size={12} className="mr-2" /> {field.isSystem ? 'Hide Column' : 'Delete Column'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </th>
        ))}
        <th className="w-12 border-l border-border/50 text-center sticky right-0 top-0 z-[60] bg-slate-100 dark:bg-slate-800">
          {canManageColumns && (
            <ColumnPicker 
                onSelect={handleAddColumn}
                availableTemplates={availableTemplates}
            >
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 text-blue-500">
                  <Plus size={16} />
              </Button>
            </ColumnPicker>
          )}
        </th>
      </tr>
    </thead>
  );
};