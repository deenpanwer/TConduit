'use client';

import React from "react";
import { format } from "date-fns";
import { 
  MoreHorizontal, Eye, Trash, Check, Link as LinkIcon, FileText, Clock, Search as SearchIcon, Plus, Mail, Phone, UserPlus
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
import { useAuth } from "@/hooks/use-auth";
import { TableCellEditor } from "./TableCellEditor";
import { CRMPhoneDisplay } from "./CRMPhoneInput";

const getEmployeeAvatarUrl = (emp: any) => {
  if (!emp) return 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=anonymous';
  const photo = emp.photoURL || emp.photoUrl || emp.imageUrl || emp.image;
  if (photo) return photo;
  const seed = emp.email || emp.name || emp.id || 'anonymous';
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;
};

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
  const { user } = useAuth();
  const [assigneeOpen, setAssigneeOpen] = React.useState(false);

  const getFieldValue = (fieldKey: string) => {
    if (!entity) return "";
    if (fieldKey in entity) return (entity as any)[fieldKey];
    return entity.data?.[fieldKey];
  };

  // Resolve Follow-up info
  const followUpField = displayFields.find(f => 
    (f.label.toLowerCase().includes("follow") || f.key.toLowerCase().includes("follow")) &&
    f.type === "date"
  );
  const followUpKey = followUpField ? followUpField.key : null;
  const followUpValue = followUpKey ? getFieldValue(followUpKey) : null;
  
  let isMissed = false;
  let isTomorrow = false;
  if (followUpValue) {
    let fDate: Date | null = null;
    if (typeof followUpValue.toDate === 'function') {
      fDate = followUpValue.toDate();
    } else if (followUpValue.seconds !== undefined) {
      fDate = new Date(followUpValue.seconds * 1000);
    } else {
      const cleanVal = typeof followUpValue === 'string' ? followUpValue.replace(/(\d+)(st|nd|rd|th)/gi, '$1') : followUpValue;
      const parsed = new Date(cleanVal);
      if (!isNaN(parsed.getTime())) {
        fDate = parsed;
      }
    }

    if (fDate) {
      const now = new Date();
      if (fDate.getTime() < now.getTime()) {
        isMissed = true;
      } else {
        // Check if tomorrow (exactly 1 day left)
        const diffTime = fDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > 0 && diffDays <= 1) {
          isTomorrow = true;
        }
      }
    }
  }

  const assignedToVal = getFieldValue("assignedTo");
  const assignedByVal = getFieldValue("assignedBy");
  const isAcknowledged = getFieldValue("acknowledged");

  const handleEmailClick = (email: string) => {
    const emailMethod = (localStorage.getItem("lead_finder_email_method") as "gmail" | "outlook" | "yahoo") || "gmail";
    const subject = encodeURIComponent("CRM Follow Up");
    const body = encodeURIComponent("Hi,\n\nI wanted to follow up on our recent conversation.\n\nBest regards,\n");

    let mailUrl = "";
    if (emailMethod === "outlook") {
      mailUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}&subject=${subject}&body=${body}`;
    } else if (emailMethod === "yahoo") {
      mailUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(email)}&subj=${subject}&body=${body}`;
    } else {
      mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    }

    window.open(mailUrl, "_blank");
  };

  const handlePhoneClick = (phone: string) => {
    const callMethod = (localStorage.getItem("lead_finder_call_method") as "system" | "google-voice" | "justcall" | "ringcentral") || "system";
    let cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.startsWith("1") && !cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    } else if (!cleanPhone.startsWith("+")) {
      if (cleanPhone.length === 10) {
        cleanPhone = "+1" + cleanPhone;
      }
    }

    if (callMethod === "google-voice") {
      const gvUrl = `https://voice.google.com/u/0/calls?a=nc,${encodeURIComponent(cleanPhone)}`;
      window.open(gvUrl, "_blank");
    } else if (callMethod === "justcall") {
      const jcUrl = `https://app.justcall.io/dialer?numbers=${encodeURIComponent(cleanPhone)}`;
      window.open(jcUrl, "newWin", "width=385,height=665,location=no,status=no,menubar=no,toolbar=no");
    } else if (callMethod === "ringcentral") {
      const rcUrl = `rcmobile://call?number=${encodeURIComponent(cleanPhone)}`;
      window.open(rcUrl);
    } else {
      const telUrl = `tel:${cleanPhone}`;
      window.open(telUrl);
    }
  };

  if (!entity) return null;

  return (
    <tr className={cn(
      "border-b border-border/20 transition-all group h-[52px]", 
      isSelected 
        ? "bg-blue-50 dark:bg-[#0c1e3b] hover:bg-blue-100 dark:hover:bg-[#112547]" 
        : (isMissed 
            ? "bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/20 hover:bg-rose-500/15" 
            : "hover:bg-blue-500/[0.03]")
    )}>
      <td className={cn(
        "w-24 p-0 border-r border-border/20 sticky left-0 z-20 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)] h-[52px]", 
        isSelected 
          ? "bg-blue-50 dark:bg-[#0c1e3b]" 
          : (isMissed 
              ? "bg-rose-100/40 dark:bg-[#251016]" 
              : "bg-card group-hover:bg-muted")
      )}>
        <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: tableColor}} />
        <div className="flex items-center justify-start gap-3 h-full pl-6">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <input type="checkbox" className="rounded-sm border-border bg-background cursor-pointer accent-blue-600 h-4 w-4" checked={isSelected} onChange={() => onSelect(entity.id)} />
            </div>
            
            {/* Self-Assign / Acknowledgment / Manager Assign Dropdown */}
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {user && (
                <DropdownMenu open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                  <DropdownMenuTrigger asChild>
                    {assignedToVal ? (
                      (() => {
                        const isMe = assignedToVal === user.uid;
                        const assignedEmployee = isMe 
                          ? { name: user.displayName || "Me", photoURL: user.photoURL || (user as any).imageUrl, email: user.email }
                          : employees.find(e => e.id === assignedToVal || e.name === assignedToVal || e.uid === assignedToVal);
                        
                        const assigner = employees.find(e => e.id === assignedByVal || e.uid === assignedByVal);
                        const assignerName = assignedByVal === user.uid ? "Me" : (assigner?.name || "System");
                        
                        const employeeName = assignedEmployee?.name || "Unknown";
                        
                        return (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "relative h-6 w-6 rounded-md shrink-0 shadow-sm flex items-center justify-center border cursor-pointer p-0",
                              isMe 
                                ? (assignedByVal === user.uid 
                                    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" 
                                    : "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20")
                                : "border-border/40 hover:bg-secondary/50"
                            )}
                            title={isMe 
                              ? (assignedByVal === user.uid 
                                  ? `Self-Assigned to ${employeeName} (Click to change)` 
                                  : `Assigned to ${employeeName} by ${assignerName} (${isAcknowledged ? 'Working on it' : 'Pending Acknowledgment'}) (Click to change)`)
                              : `Assigned to ${employeeName} by ${assignerName} (${isAcknowledged ? 'Working on it' : 'Pending Acknowledgment'}) (Click to change)`
                            }
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={getEmployeeAvatarUrl(assignedEmployee)} />
                              <AvatarFallback className="text-[8px] font-black">{String(employeeName).charAt(0)}</AvatarFallback>
                            </Avatar>
                          </Button>
                        );
                      })()
                    ) : (
                      // Unassigned
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-md shrink-0 opacity-30 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer p-0"
                        title="Unassigned (Click to assign)"
                      >
                        <UserPlus size={14} />
                      </Button>
                    )}
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="start" className="w-56 border-border/40 bg-card/95 backdrop-blur-xl z-[100] rounded-xl shadow-2xl p-2">
                    <>
                      {/* Acknowledge Action if assigned to me and pending */}
                      {assignedToVal === user.uid && !isAcknowledged && (
                        <>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellSave(entity.id, "acknowledged", true);
                            }} 
                            className="text-[10px] font-bold text-amber-500 uppercase py-2 cursor-pointer"
                          >
                            Acknowledge Assignment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/20" />
                        </>
                      )}

                      {/* Self-Assign / Unassign options */}
                      {assignedToVal === user.uid ? (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellSave(entity.id, "assignedTo", "");
                          }} 
                          className="text-[10px] font-bold text-red-500 uppercase py-2 cursor-pointer"
                        >
                          Unassign Self
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellSave(entity.id, "assignedTo", user.uid);
                          }} 
                          className="text-[10px] font-bold uppercase py-2 cursor-pointer"
                        >
                          Assign to Me (Self-Assign)
                        </DropdownMenuItem>
                      )}

                      {assignedToVal && assignedToVal !== user.uid && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellSave(entity.id, "assignedTo", "");
                          }} 
                          className="text-[10px] font-bold text-red-500 uppercase py-2 cursor-pointer"
                        >
                          Unassign Lead
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-1 bg-border/20" />
                      <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Assign to Team</div>
                      
                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {employees.map((emp) => (
                          <DropdownMenuItem 
                            key={emp.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellSave(entity.id, "assignedTo", emp.id);
                            }} 
                            className="flex items-center gap-2 text-[10px] font-bold uppercase py-2 cursor-pointer"
                          >
                            <Avatar className="size-5">
                              <AvatarImage src={getEmployeeAvatarUrl(emp)} />
                              <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate flex-1">{emp.name}</span>
                            {assignedToVal === emp.id && <Check size={12} className="text-blue-500 shrink-0" />}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
                    <div className="flex items-center justify-between w-full pr-1">
                      <CRMPhoneDisplay 
                        value={val} 
                        placeholder={`+ ${field.label}`} 
                        className={cn("text-xs font-bold text-foreground/80 transition-colors w-full", isSelected && "text-blue-700 dark:text-blue-300")}
                      />
                      {val && (
                        <button 
                          className="text-slate-400 hover:text-green-500 transition-colors p-1 shrink-0 ml-1.5 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhoneClick(val);
                          }}
                          title="Call Number"
                        >
                          <Phone className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                ) : field.type === 'email' && val ? (
                    <div className="flex items-center justify-between w-full pr-1">
                      <span className={cn("text-xs font-bold truncate transition-colors", isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground/80")}>
                        {val}
                      </span>
                      <button 
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1 shrink-0 ml-1.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmailClick(val);
                        }}
                        title="Send Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                    </div>
                ) : (
                  <span className={cn(
                    "text-xs font-bold truncate w-full transition-colors", 
                    isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground/80",
                    (field.key === followUpKey && isTomorrow) && "text-rose-600 dark:text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded bg-rose-500/10 font-black animate-pulse"
                  )}>
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
