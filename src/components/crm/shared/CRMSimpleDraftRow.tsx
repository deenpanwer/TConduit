import React, { useState } from "react";
import { Trash, Check, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CRMPhoneInput } from "./CRMPhoneInput";
import { FieldConfig } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CRMSimpleDraftRowProps {
  draft: any;
  onChange: (draft: any) => void;
  onSave: (draft: any) => void;
  onDelete: () => void;
  displayFields: FieldConfig[];
  tableColor: string;
  employees: any[];
  organizations: any[];
  contacts: any[];
  currentUser: any;
  configName?: string;
}

export const CRMSimpleDraftRow = React.memo(function CRMSimpleDraftRow({
  draft,
  onChange,
  onSave,
  onDelete,
  displayFields,
  tableColor,
  employees,
  organizations,
  contacts,
  currentUser,
  configName
}: CRMSimpleDraftRowProps) {
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const getFieldValue = (fieldKey: string) => {
    if (fieldKey === 'name') return draft.name || "";
    return draft.data?.[fieldKey] || "";
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    const firstKey = displayFields[0]?.key;
    const isNameField = fieldKey === 'name' || fieldKey === firstKey;
    onChange({
      ...draft,
      name: isNameField ? value : (draft.name || ""),
      data: {
        ...draft.data,
        [fieldKey]: value
      }
    });
  };

  return (
    <tr className="border-b border-border/20 bg-blue-500/[0.01] hover:bg-blue-500/[0.03] transition-all h-[52px]">
      {/* Discard Actions Strip */}
      <td className="w-24 p-0 border-r border-border/20 sticky left-0 z-20 bg-card transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-[52px]">
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-amber-500" />
        <div className="flex items-center justify-start gap-3 h-full pl-8">
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-md flex items-center justify-center" 
              onClick={onDelete}
              title="Discard Draft"
            >
              <Trash size={12} />
            </Button>
          </div>
        </div>
      </td>

      {/* Fields */}
      {displayFields.map((field) => {
        const val = getFieldValue(field.key);
        const isLastInteraction = field.key === 'lastInteraction';
        const isTimeline = field.type === 'timeline';

        if (isLastInteraction) {
          return (
            <td key={field.id} className="p-0 border-r border-border/20 relative h-[52px]">
              <div className="h-full w-full flex items-center px-4 bg-background/10">
                <span className="text-[9px] font-black uppercase text-muted-foreground/40 italic tracking-widest">Auto (on save)</span>
              </div>
            </td>
          );
        }

        if (isTimeline) {
          return (
            <td key={field.id} className="p-0 border-r border-border/20 relative h-[52px]">
              <div className="h-full w-full flex items-center gap-1.5 px-4 bg-background/10 cursor-not-allowed">
                <Clock size={10} className="text-pink-400/50 shrink-0" />
                <span className="text-[9px] font-black uppercase text-muted-foreground/40 italic tracking-widest">Set after save</span>
              </div>
            </td>
          );
        }

        return (
          <td key={field.id} className="p-0 border-r border-border/20 relative group/cell h-[52px]">
            <div className="h-full w-full flex items-center bg-background/20">
              {field.type === "select" || field.type === "label" || field.key === "company" || field.key === "organization" ? (
                <div className={cn(
                  "w-full h-full flex items-center relative",
                  (field.key === "company" || field.key === "organization") && "border-l-2 border-cyan-500/40"
                )}>
                  {(() => {
                    const isDropdownOpen = openDropdownId === field.id;
                    const selectedOptionLabel = (() => {
                      if (val) {
                        const directOpt = (field.options || []).find(o => o.value === val);
                        if (directOpt) return directOpt.label;
                        if (field.key === 'company' || field.key === 'organization') {
                          const org = (organizations || []).find(o => o.name === val);
                          if (org) return org.name;
                        }
                        return val;
                      }
                      return "Select...";
                    })();

                    let options: any[] = [];
                    let filteredOptions: any[] = [];

                    if (isDropdownOpen) {
                      let opts = field.options || [];
                      if (field.key === 'company' || field.key === 'organization') {
                        const orgOptions = (organizations || []).map(o => ({ label: o.name, value: o.name, color: 'blue' }));
                        const existingKeys = new Set(opts.map(o => o.value));
                        const uniqueOrgOptions = orgOptions.filter(o => !existingKeys.has(o.value));
                        opts = [...uniqueOrgOptions, ...opts];
                      }
                      options = opts;
                      filteredOptions = opts.filter(o => o && typeof o.label === 'string' && o.label.toLowerCase().includes(dropdownSearch.toLowerCase()));
                    } else {
                      options = field.options || [];
                    }

                    const matchedOpt = options.find(o => o && (o.value === val || o.value?.toLowerCase() === String(val || '').toLowerCase() || o.label?.toLowerCase() === String(val || '').toLowerCase()));
                    const matchedColor = matchedOpt?.color;

                    const renderButton = () => (
                      <button
                        type="button"
                        className={cn(
                          "w-full bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider px-4 h-full cursor-pointer text-left focus:ring-0 focus-visible:ring-0 focus:outline-none flex items-center justify-between",
                          (field.key === "company" || field.key === "organization")
                            ? "text-cyan-600 dark:text-cyan-300 placeholder:text-cyan-600/50 dark:placeholder:text-cyan-400/50"
                            : val ? "text-foreground" : "text-muted-foreground/50"
                        )}
                        onClick={() => setOpenDropdownId(field.id)}
                      >
                        {(field.key === "company" || field.key === "organization") ? (
                          <span className="truncate">{selectedOptionLabel}</span>
                        ) : val ? (
                          <Badge className={cn(
                            "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm",
                            {
                              'bg-blue-500 text-white': matchedColor === 'blue', 
                              'bg-amber-400 text-black': matchedColor === 'yellow', 
                              'bg-purple-500 text-white': matchedColor === 'purple', 
                              'bg-emerald-500 text-white': matchedColor === 'green', 
                              'bg-rose-500 text-white': matchedColor === 'red', 
                              'bg-orange-500 text-white': matchedColor === 'orange', 
                              'bg-indigo-500 text-white': matchedColor === 'indigo', 
                              'bg-muted text-muted-foreground': !matchedColor || matchedColor === 'gray'
                            }
                          )}>
                            {selectedOptionLabel}
                          </Badge>
                        ) : (
                          <span className="truncate">{selectedOptionLabel}</span>
                        )}
                      </button>
                    );

                    return isDropdownOpen ? (
                      <DropdownMenu 
                        open={isDropdownOpen}
                        onOpenChange={(open) => {
                          if (!open) {
                            setDropdownSearch("");
                            if (openDropdownId === field.id) setOpenDropdownId(null);
                          } else {
                            setOpenDropdownId(field.id);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          {renderButton()}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="center" 
                          className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2"
                        >
                          <div className="p-1 pb-2">
                            <div className="relative">
                              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input 
                                className="h-7 pl-6 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20 text-foreground" 
                                placeholder="Search..." 
                                value={dropdownSearch}
                                onChange={(e) => setDropdownSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
                              <DropdownMenuItem 
                                key={opt.value} 
                                onClick={() => handleFieldChange(field.key, opt.value)} 
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-2.5 cursor-pointer"
                              >
                                <div className={cn("size-2 rounded-full", {'bg-blue-500': opt.color === 'blue', 'bg-amber-400': opt.color === 'yellow', 'bg-purple-500': opt.color === 'purple', 'bg-emerald-500': opt.color === 'green', 'bg-rose-500': opt.color === 'red', 'bg-orange-500': opt.color === 'orange', 'bg-indigo-500': opt.color === 'indigo', 'bg-gray-400': !opt.color || opt.color === 'gray'})} />
                                {opt.label}
                              </DropdownMenuItem>
                            )) : (
                              <div className="p-4 text-center text-[9px] font-black uppercase text-muted-foreground/50 italic tracking-widest">No results</div>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      renderButton()
                    );
                  })()}
                </div>
              ) : field.type === "people" ? (
                <div className="w-full h-full flex items-center relative">
                  {(() => {
                    const isReadOnly = ((configName === 'Notes' || configName === 'Calls') && field.key === 'assignedTo') || field.key === 'createdBy';

                    if (isReadOnly) {
                      const displayVal = currentUser?.displayName || currentUser?.email || "Me";
                      return (
                        <div className="px-4 text-xs font-bold text-muted-foreground/60 select-none">
                          {displayVal}
                        </div>
                      );
                    }

                    const isOrgOwner = (configName === 'Organizations' || configName === 'Deals') && field.key === 'contactId';

                    const selectedEmployeeName = (() => {
                      if (val) {
                        if (isOrgOwner) {
                          const contact = (contacts || []).find(c => c.id === val || c.name === val);
                          return contact ? contact.name : val;
                        }
                        if (currentUser && val === currentUser.uid) return currentUser.displayName || "Me";
                        const emp = (employees || []).find(e => e.id === val || e.uid === val);
                        return emp ? emp.name : val;
                      }
                      return "Unassigned";
                    })();

                    const isDropdownOpen = openDropdownId === field.id;
                    const listToUse = isOrgOwner ? contacts : employees;
                    const filteredEmployees = isDropdownOpen
                      ? [{ id: "", name: "Unassigned" }, ...(listToUse || [])]
                          .filter(emp => emp && typeof emp.name === 'string' && emp.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                      : [];

                    const renderPeopleButton = () => (
                      <button
                        type="button"
                        className={cn(
                          "w-full bg-transparent border-none outline-none text-xs font-bold px-4 h-full cursor-pointer text-left focus:ring-0 focus-visible:ring-0 focus:outline-none flex items-center justify-between",
                          val ? "text-foreground" : "text-muted-foreground/50"
                        )}
                        onClick={() => setOpenDropdownId(field.id)}
                      >
                        <span>{selectedEmployeeName}</span>
                      </button>
                    );

                    return isDropdownOpen ? (
                      <DropdownMenu 
                        open={isDropdownOpen}
                        onOpenChange={(open) => {
                          if (!open) {
                            setDropdownSearch("");
                            if (openDropdownId === field.id) setOpenDropdownId(null);
                          } else {
                            setOpenDropdownId(field.id);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          {renderPeopleButton()}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="center" 
                          className="w-48 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2"
                        >
                          <div className="p-1 pb-2">
                            <div className="relative">
                              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input 
                                className="h-7 pl-6 text-[9px] font-black uppercase bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-blue-500/20 text-foreground" 
                                placeholder="Search..." 
                                value={dropdownSearch}
                                onChange={(e) => setDropdownSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            {filteredEmployees.map((emp) => (
                              <DropdownMenuItem 
                                  key={emp.id} 
                                  onClick={() => handleFieldChange(field.key, emp.id)} 
                                  className="text-[10px] font-black uppercase tracking-widest py-2.5 cursor-pointer"
                                >
                                  {emp.name}
                                </DropdownMenuItem>
                              ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      renderPeopleButton()
                    );
                  })()}
                </div>
              ) : field.type === "date" ? (
                <div className="w-full h-full flex items-center relative">
                  {(() => {
                    const formattedDate = (() => {
                      if (!val) return `Select date...`;
                      try {
                        const d = new Date(val);
                        if (isNaN(d.getTime())) return `Select date...`;
                        return format(d, "PPP");
                      } catch (e) {
                        return `Select date...`;
                      }
                    })();

                    const isPopoverOpen = openDropdownId === `${field.id}-date`;

                    const renderTrigger = () => (
                      <button
                        type="button"
                        className="w-full bg-transparent border-none outline-none text-xs font-bold px-4 h-full cursor-pointer text-left focus:ring-0 focus-visible:ring-0 focus:outline-none flex items-center justify-between text-foreground"
                        onClick={() => setOpenDropdownId(`${field.id}-date`)}
                      >
                        <span>{formattedDate}</span>
                      </button>
                    );

                    return isPopoverOpen ? (
                      <Popover open={isPopoverOpen} onOpenChange={(open) => !open && setOpenDropdownId(null)}>
                        <PopoverTrigger asChild>
                          {renderTrigger()}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[100]" align="start">
                          <Calendar
                            mode="single"
                            selected={(() => {
                              if (!val) return undefined;
                              const d = new Date(val);
                              return isNaN(d.getTime()) ? undefined : d;
                            })()}
                            onSelect={(date) => {
                              if (date) {
                                handleFieldChange(field.key, date.toISOString());
                                setOpenDropdownId(null);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      renderTrigger()
                    );
                  })()}
                </div>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center justify-center h-full w-full">
                  <input
                    type="checkbox"
                    className="rounded border-border/40 bg-background cursor-pointer accent-blue-600 h-4 w-4"
                    checked={!!val}
                    onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                  />
                </div>
              ) : field.type === "phone" ? (
                <CRMPhoneInput
                  value={val}
                  onChange={(v) => handleFieldChange(field.key, v)}
                  context="table-cell"
                  placeholder={`+ ${field.label}`}
                />
              ) : (
                <div className="flex-grow h-full flex items-center relative">
                  {field.type === "currency" && <span className="pl-4 text-xs font-black text-blue-500">$</span>}
                  <Input
                    type={field.type === "number" || field.type === "currency" ? "number" : "text"}
                    value={val}
                    onChange={(e) => {
                      let valueStr = e.target.value;
                      if ((field.type === "number" || field.type === "currency") && valueStr !== "") {
                        const num = Number(valueStr);
                        if (num < 0) {
                          valueStr = "0";
                        }
                      }
                      handleFieldChange(field.key, valueStr);
                    }}
                    placeholder={`Enter ${field.label}...`}
                    className={cn(
                      "flex-1 h-full py-0 text-xs font-bold border-none focus-visible:ring-0 bg-transparent rounded-none text-foreground focus:outline-none focus:ring-0",
                      field.type === "currency" ? "pl-1" : "px-4"
                    )}
                  />
                </div>
              )}
            </div>
          </td>
        );
      })}

      {/* Sticky Right Action Column (Save Draft) */}
      <td className="p-0 text-center w-12 border-l border-border/20 sticky right-0 z-20 bg-card shadow-[-2px_0_5px_rgba(0,0,0,0.05)] h-[52px]">
        <div className="flex items-center justify-center h-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 rounded-xl"
            onClick={() => onSave(draft)}
            title="Save Lead to Database"
          >
            <Check size={16} strokeWidth={3} />
          </Button>
        </div>
      </td>
    </tr>
  );
});
