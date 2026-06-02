'use client';

import React from "react";
import { format } from "date-fns";
import { 
  MoreHorizontal, Eye, Trash, Check, Link as LinkIcon, FileText, Clock, Search as SearchIcon, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { FieldConfig, useCRM } from "@/hooks/use-crm";
import { useCRMStore } from "@/store/use-crm-store";
import { TableCellEditor } from "./TableCellEditor";
import { CRMPhoneDisplay } from "./CRMPhoneInput";

interface CRMTableRowProps {
  entityId: string; // ONLY pass the ID
  isSelected: boolean;
  onSelect: (id: string) => void;
  displayFields: FieldConfig[];
  tableColor: string;
  editingCell: { id: string, fieldKey: string } | null;
  setEditingCell: (cell: { id: string, fieldKey: string } | null) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  dropdownSearch: string;
  setDropdownSearch: (val: string) => void;
  handleCellSave: (id: string, fieldKey: string, value: any) => Promise<void>;
  moveToNextCell: (id: string, fieldKey: string) => void;
  employees: any[];
  organizations: any[];
  activeFieldIdForOption: string | null;
  setActiveFieldIdForOption: (id: string | null) => void;
  newOptionValue: string;
  setNewOptionValue: (val: string) => void;
  handleAddOption: (fieldId: string) => void;
  onEntityClick: (entity: any) => void;
  deleteEntity: (id: string) => Promise<void>;
  actions?: (entity: any) => React.ReactNode;
}

export const CRMTableRow = React.memo(({
  entityId,
  isSelected,
  onSelect,
  displayFields,
  tableColor,
  editingCell,
  setEditingCell,
  openDropdownId,
  setOpenDropdownId,
  dropdownSearch,
  setDropdownSearch,
  handleCellSave,
  moveToNextCell,
  employees,
  organizations,
  activeFieldIdForOption,
  setActiveFieldIdForOption,
  newOptionValue,
  setNewOptionValue,
  handleAddOption,
  onEntityClick,
  deleteEntity,
  actions
}: CRMTableRowProps) => {
  // ATOMIC SUBSCRIPTION: This row ONLY re-renders if its specific entity changes
  const entity = useCRMStore(state => state.entities[entityId]);
  
  if (!entity) return null;

  const getFieldValue = (fieldKey: string) => {
    if (fieldKey in entity) return (entity as any)[fieldKey];
    return entity.data?.[fieldKey];
  };

  return (
    <tr className={cn(
      "border-b border-border/20 transition-all group h-[52px]", 
      isSelected ? "bg-blue-600/[0.12] hover:bg-blue-600/[0.18]" : "hover:bg-blue-500/[0.03]"
    )}>
      <td className={cn("w-24 p-0 border-r border-border/20 sticky left-0 z-20 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)]", isSelected ? "bg-blue-600/[0.05]" : "bg-card group-hover:bg-muted")}>
        <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: tableColor}} />
        <div className="flex items-center justify-center h-full pl-6 pr-3">
            <input type="checkbox" className="rounded-sm border-border bg-background cursor-pointer accent-blue-600 h-4 w-4" checked={isSelected} onChange={() => onSelect(entity.id)} />
        </div>
      </td>
      {displayFields.map((field) => {
        const val = getFieldValue(field.key);
        const isEditing = editingCell?.id === entity.id && editingCell?.fieldKey === field.key;
        const isLastInteraction = field.key === 'lastInteraction';
        
        if (field.type === 'select' || field.type === 'label' || field.key === 'company' || field.key === 'organization') {
          let options = field.options || [];
          if (field.key === 'company' || field.key === 'organization') {
              const orgOptions = (organizations || []).map(o => ({ label: o.name, value: o.name, color: 'blue' }));
              const existingKeys = new Set(options.map(o => o.value));
              const uniqueOrgOptions = orgOptions.filter(o => !existingKeys.has(o.value));
              options = [...uniqueOrgOptions, ...options];
          }
          const filteredOptions = options.filter(o => o.label.toLowerCase().includes(dropdownSearch.toLowerCase()));

          return (
            <td key={field.id} className="p-0 border-r border-border/20 relative group/cell">
              <DropdownMenu 
                open={openDropdownId === `${entity.id}-${field.key}`}
                onOpenChange={(open) => {
                  if (!open) {
                    setDropdownSearch("");
                    if (openDropdownId === `${entity.id}-${field.key}`) setOpenDropdownId(null);
                  } else {
                    setOpenDropdownId(`${entity.id}-${field.key}`);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <div 
                    className={cn(
                      "flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]",
                      isEditing && "ring-2 ring-blue-500 z-10 bg-background shadow-xl"
                    )}
                    onClick={() => setEditingCell({ id: entity.id, fieldKey: field.key })}
                  >
                    <Badge className={cn(
                      "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform active:scale-95",
                      {'bg-blue-500 text-white': field.options?.find(o => o.value === val)?.color === 'blue', 'bg-amber-400 text-black': field.options?.find(o => o.value === val)?.color === 'yellow', 'bg-purple-500 text-white': field.options?.find(o => o.value === val)?.color === 'purple', 'bg-emerald-500 text-white': field.options?.find(o => o.value === val)?.color === 'green', 'bg-rose-500 text-white': field.options?.find(o => o.value === val)?.color === 'red', 'bg-orange-500 text-white': field.options?.find(o => o.value === val)?.color === 'orange', 'bg-indigo-500 text-white': field.options?.find(o => o.value === val)?.color === 'indigo', 'bg-muted text-muted-foreground': !field.options?.find(o => o.value === val)?.color || field.options?.find(o => o.value === val)?.color === 'gray'}
                    )}>
                      {options.find(o => o.value === val)?.label || val || <span className="text-[9px] font-black uppercase text-muted-foreground italic tracking-widest">+ {field.label}</span>}
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
                          <DropdownMenuItem onClick={() => {
                            handleCellSave(entity.id, field.key, opt.value);
                            moveToNextCell(entity.id, field.key);
                          }} className="flex-1 items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5">
                              <div className={cn("size-2 rounded-full", {'bg-blue-500': opt.color === 'blue', 'bg-amber-400': opt.color === 'yellow', 'bg-purple-500': opt.color === 'purple', 'bg-emerald-500': opt.color === 'green', 'bg-rose-500': opt.color === 'red', 'bg-orange-500': opt.color === 'orange', 'bg-indigo-500': opt.color === 'indigo', 'bg-gray-400': !opt.color || opt.color === 'gray'})} />
                              {opt.label}
                          </DropdownMenuItem>
                      </div>
                      )) : (
                          <div className="p-4 text-center text-[9px] font-black uppercase text-muted-foreground/50 italic tracking-widest">No results</div>
                      )}
                  </div>
                  <DropdownMenuSeparator className="my-1 bg-border/20" />
                  <div className="p-1">
                      {activeFieldIdForOption === field.id ? (
                          <div className="flex items-center gap-1 p-1">
                              <Input 
                                  className="h-8 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20" 
                                  placeholder="NEW LABEL..."
                                  value={newOptionValue}
                                  onChange={(e) => setNewOptionValue(e.target.value)}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddOption(field.id);
                                      if (e.key === 'Escape') {
                                          setActiveFieldIdForOption(null);
                                          setNewOptionValue("");
                                      }
                                  }}
                                  onBlur={() => {
                                      if (newOptionValue.trim()) {
                                          handleAddOption(field.id);
                                      } else {
                                          setActiveFieldIdForOption(null);
                                      }
                                  }}
                                  autoFocus
                              />
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
              <DropdownMenu
                open={openDropdownId === `${entity.id}-${field.key}`}
                onOpenChange={(open) => {
                  if (!open) {
                    if (openDropdownId === `${entity.id}-${field.key}`) setOpenDropdownId(null);
                  } else {
                    setOpenDropdownId(`${entity.id}-${field.key}`);
                  }
                }}
              >
                  <DropdownMenuTrigger asChild>
                      <div 
                        className={cn(
                          "flex items-center px-4 h-full w-full cursor-pointer group-hover/cell:bg-blue-500/[0.02]",
                          isEditing && "ring-2 ring-blue-500 z-10 bg-background shadow-xl"
                        )}
                        onClick={() => setEditingCell({ id: entity.id, fieldKey: field.key })}
                      >
                          <Avatar className={cn("h-6 w-6 border border-border/40")}>
                              <AvatarImage src={assignedEmployee ? (assignedEmployee.photoURL || assignedEmployee.photoUrl) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${val || 'User'}`} />
                              <AvatarFallback className="text-[8px] font-black">{String(val || 'U').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className={cn("ml-2 text-[10px] font-bold truncate")}>{assignedEmployee?.name || val || 'Unassigned'}</span>
                      </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          <DropdownMenuItem onClick={() => {
                            handleCellSave(entity.id, field.key, "");
                            moveToNextCell(entity.id, field.key);
                          }} className="text-[10px] font-black uppercase py-2">
                              Unassigned
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/20" />
                          {(employees || []).map((emp) => (
                              <DropdownMenuItem key={emp.id} onClick={() => {
                                handleCellSave(entity.id, field.key, emp.id);
                                moveToNextCell(entity.id, field.key);
                              }} className="flex items-center gap-2 text-[10px] font-bold uppercase py-2">
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-5 w-5 rounded border-2 transition-colors", 
                    val ? "bg-blue-600 border-blue-600 text-white" : "border-border/40 hover:border-blue-500/50"
                  )} 
                  onClick={(e) => { e.stopPropagation(); handleCellSave(entity.id, field.key, !val); }}
                >
                  {val && <Check size={12} strokeWidth={4} />}
                </Button>
              </div>
            </td>
          );
        }
        if (field.type === 'link' || field.type === 'file') {
          return (
            <td key={field.id} className="p-0 border-r border-border/20 relative group/cell" onClick={() => !isEditing && setEditingCell({ id: entity.id, fieldKey: field.key })}>
              {isEditing ? (
                  <TableCellEditor 
                    field={field} 
                    value={String(val || '')} 
                    onSave={(newVal) => handleCellSave(entity.id, field.key, newVal)} 
                    onCancel={() => setEditingCell(null)} 
                    onNext={() => moveToNextCell(entity.id, field.key)} 
                  />
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
              <TableCellEditor 
                field={field} 
                value={String(val || '')} 
                onSave={(newVal) => handleCellSave(entity.id, field.key, newVal)} 
                onCancel={() => setEditingCell(null)} 
                onNext={() => moveToNextCell(entity.id, field.key)} 
              />
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
                                    {range?.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : <span className="text-muted-foreground italic font-bold uppercase text-[9px] tracking-widest">+ {field.label}</span>}
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
                ) : field.type === 'phone' ? (
                    <CRMPhoneDisplay 
                      value={val} 
                      placeholder={`+ ${field.label}`} 
                      className={cn("text-xs font-bold text-foreground/80 transition-colors w-full", isSelected && "text-blue-700 dark:text-blue-300")}
                    />
                ) : (
                  <span className={cn("text-xs font-bold truncate w-full transition-colors", isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground/80")}>
                    {field.type === 'date' && val ? format(new Date(val), "PPP") : (val || <span className="text-[9px] font-black uppercase text-muted-foreground italic tracking-widest">+ {field.label}</span>)}
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
});
