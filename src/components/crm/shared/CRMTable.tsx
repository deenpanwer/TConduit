'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCRM, FieldConfig, ModuleConfig } from "@/hooks/use-crm";
import { useTeam } from "@/hooks/use-team";
import { toast } from "sonner";
import { useCRMStore } from "@/store/use-crm-store";

// Sub-components
import { CRMTableHeader } from "./CRMTableHeader";
import { CRMTableRow } from "./CRMTableRow";
import { CRMSimpleDraftRow } from "./CRMSimpleDraftRow";
import { useAuth } from "@/hooks/use-auth";

const STRIP_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

const lightenHexColor = (hex: string, percent: number) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r + (255 - r) * (percent / 100));
    g = Math.floor(g + (255 - g) * (percent / 100));
    b = Math.floor(b + (255 - b) * (percent / 100));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

interface CRMTableProps {
  entities: any[]; // These come from context (filtered/searched)
  config: ModuleConfig;
  updateEntity: (id: string, updates: any) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<ModuleConfig>) => Promise<void>;
  onEntityClick: (entity: any) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  addEntity: (data: any) => Promise<string | null>;
  pageSize: number;
  setPageSize: (size: number) => void;
  actions?: (entity: any) => React.ReactNode;
}

export function CRMTable({
  entities, config, updateEntity, deleteEntity, updateConfig, 
  onEntityClick, selectedIds, onSelect, onSelectAll, addEntity,
  pageSize, setPageSize, actions
}: CRMTableProps) {
  const { employees } = useTeam();
  const { organizations, contacts } = useCRM();
  const { user } = useAuth();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const UI_PAGE_SIZE = 50;

  const paginatedEntities = useMemo(() => {
    const start = (currentPage - 1) * UI_PAGE_SIZE;
    return entities.slice(start, start + UI_PAGE_SIZE);
  }, [entities, currentPage, UI_PAGE_SIZE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [entities.length]);

  // Keyboard layout scrolling listener (velocity-based requestAnimationFrame scroller)
  useEffect(() => {
    const activeKeys = new Set<string>();
    let animationFrameId: number | null = null;

    const scrollLoop = () => {
      const container = tableContainerRef.current;
      if (!container) {
        activeKeys.clear();
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        return;
      }

      let dx = 0;
      let dy = 0;
      const speed = 10; // pixels per frame

      if (activeKeys.has("ArrowRight")) dx += speed;
      if (activeKeys.has("ArrowLeft")) dx -= speed;
      if (activeKeys.has("ArrowDown")) dy += speed;
      if (activeKeys.has("ArrowUp")) dy -= speed;

      if (dx !== 0 || dy !== 0) {
        container.scrollBy({ left: dx, top: dy });
        animationFrameId = requestAnimationFrame(scrollLoop);
      } else {
        animationFrameId = null;
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!tableContainerRef.current) {
        return;
      }

      // Exit immediately for non-arrow keys to avoid any DOM query overhead
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
        return;
      }

      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      e.preventDefault(); // Prevent default page scrolling
      activeKeys.add(e.key);
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (!tableContainerRef.current) {
        return;
      }

      if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
        activeKeys.delete(e.key);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("keyup", handleGlobalKeyUp);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("keyup", handleGlobalKeyUp);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  const [editingCell, setEditingCell] = useState<{ id: string, fieldKey: string } | null>(null);
  const [renamingFieldId, setRenamingFieldId] = useState<string | null>(null);
  const [editingDescriptionFieldId, setEditingDescriptionFieldId] = useState<string | null>(null);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [quickAddValue, setQuickAddValue] = useState("");
  const [draftRow, setDraftRow] = useState<any | null>(null);

  const [tableColor] = useState(() => STRIP_COLORS[Math.floor(Math.random() * STRIP_COLORS.length)]);
  const lightTableColor = useMemo(() => lightenHexColor(tableColor, 75), [tableColor]);

  const [newOptionValue, setNewOptionValue] = useState("");
  const [activeFieldIdForOption, setActiveFieldIdForOption] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const view = useMemo(() => config.views.find(v => v.type === 'list') || config.views[0], [config.views]);
  
  // DRIVE UI DIRECTLY FROM STORE CONFIG
  const displayFields = useMemo(() => {
    return view.visibleFields
      .map(id => {
        const field = config.fields.find(f => f.id === id);
        if (!field || !field.isVisible) return null;
        return field;
      })
      .filter((f): f is FieldConfig => !!f);
  }, [config.fields, view.visibleFields]);

  const moveToNextCell = (id: string, currentFieldKey: string) => {
    const currentIndex = displayFields.findIndex(f => f.key === currentFieldKey);
    if (currentIndex > -1 && currentIndex < displayFields.length - 1) {
      const nextField = displayFields[currentIndex + 1];
      setEditingCell({ id, fieldKey: nextField.key });
      
      if (['select', 'people', 'label'].includes(nextField.type) || nextField.key === 'company' || nextField.key === 'organization') {
        setOpenDropdownId(`${id}-${nextField.key}`);
      }
    } else {
      setEditingCell(null);
      setOpenDropdownId(null);
    }
  };

  const handleCellSave = async (id: string, fieldKey: string, value: any) => {
    await updateEntity(id, { [fieldKey]: value });
  };

  const isCreatingRef = useRef(false);

  const handleQuickAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickAddValue(e.target.value);
  };

  const handleQuickAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickAddValue.trim().length > 0 && !isCreatingRef.current) {
      isCreatingRef.current = true;
      const firstField = displayFields[0];
      const singularType = config.name.toLowerCase().endsWith('s') ? config.name.toLowerCase().slice(0, -1) : config.name.toLowerCase();
      const val = quickAddValue.trim();
      
      setQuickAddValue("");

      addEntity({ 
        name: val, 
        type: singularType as any,
        data: { [firstField.key]: val } 
      }).then(id => {
          if (id) {
            setEditingCell({ id, fieldKey: firstField.key });
          }
          isCreatingRef.current = false;
      }).catch(() => {
          isCreatingRef.current = false;
      });
    }
  };

  const handleAddDraft = () => {
    if (draftRow) return; // Only one draft at a time
    const singularType = config.name.toLowerCase().endsWith('s') ? config.name.toLowerCase().slice(0, -1) : config.name.toLowerCase();
    setDraftRow({
      _isDraft: true,
      name: "",
      type: singularType,
      data: {}
    });
  };

  const handleSaveDraft = async (draft: any) => {
    if (isCreatingRef.current) return;
    const firstField = displayFields[0];
    const nameVal = draft.name || draft.data?.[firstField?.key] || "";
    if (!nameVal.trim()) {
      toast.error("Please fill in at least the first field before saving.");
      return;
    }
    isCreatingRef.current = true;
    try {
      const id = await addEntity({
        name: nameVal.trim(),
        type: draft.type,
        data: { ...draft.data, [firstField.key]: nameVal.trim() }
      });
      if (id) {
        toast.success("Item added successfully");
      }
      setDraftRow(null);
    } catch (err) {
      toast.error("Failed to add item");
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleMoveColumn = (fieldId: string, direction: 'left' | 'right') => {
    const currentIndex = view.visibleFields.indexOf(fieldId);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= view.visibleFields.length) return;
    const newOrder = [...view.visibleFields];
    [newOrder[currentIndex], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[currentIndex]];
    
    updateConfig({ views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newOrder } : v) });
  };

  const handleRenameColumn = (fieldId: string, newLabel: string) => {
    setRenamingFieldId(null);
    if (!newLabel) return;
    const newFields = config.fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
    updateConfig({ fields: newFields });
  };

  const handleAddOption = (fieldId: string) => {
    if (!newOptionValue) return;
    const value = newOptionValue.toLowerCase().replace(/\s+/g, '_');
    const field = config.fields.find(f => f.id === fieldId);
    if (field?.options?.some(o => o.value === value)) {
        setNewOptionValue("");
        setActiveFieldIdForOption(null);
        return;
    }
    const newFields = config.fields.map(f => {
        if (f.id === fieldId) {
            const options = [...(f.options || []), { label: newOptionValue, value, color: 'gray' }];
            return { ...f, options };
        }
        return f;
    });
    updateConfig({ fields: newFields });
    setNewOptionValue("");
    setActiveFieldIdForOption(null);
  };

  const handleAddColumn = (template?: Partial<FieldConfig>, type?: FieldConfig['type']) => {
    let finalField: FieldConfig;
    let newFields = [...config.fields];
    if (template) {
        const existing = config.fields.find(f => f.key === template.key);
        if (existing) {
            if (view.visibleFields.includes(existing.id)) {
                toast.error("Column already exists in this view");
                return;
            }
            finalField = existing;
            newFields = newFields.map(f => f.id === existing.id ? { ...f, isVisible: true } : f);
        } else {
            finalField = {
                id: `f_${Date.now()}`,
                isSystem: true,
                isVisible: true,
                order: config.fields.length,
                ...template
            } as FieldConfig;
            newFields.push(finalField);
        }
    } else {
        const newId = `c_${Date.now()}`;
        const typeLabel = type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Column';
        finalField = {
            id: newId,
            key: `custom_${Date.now()}`,
            label: typeLabel,
            type: type || 'text',
            isSystem: false,
            isVisible: true,
            order: config.fields.length
        };
        newFields.push(finalField);
    }
    const newVisible = [...view.visibleFields, finalField.id];
    updateConfig({ 
        fields: newFields,
        views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
    });
  };

  const handleDeleteColumn = (fieldId: string) => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field) return;
    if (confirm(`Remove "${field.label}" from this view?`)) {
        const newVisible = view.visibleFields.filter(id => id !== fieldId);
        const updates: Partial<ModuleConfig> = {
            views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
        };
        if (!field.isSystem) updates.fields = config.fields.filter(f => f.id !== fieldId);
        updateConfig(updates);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-0 text-foreground bg-background h-full flex flex-col overflow-hidden">
        <div ref={tableContainerRef} className="rounded-[1.25rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar relative">
          <table className="w-full text-left text-sm min-w-full border-collapse">
            <CRMTableHeader 
              displayFields={displayFields}
              tableColor={tableColor}
              entitiesCount={entities.length}
              selectedCount={selectedIds.length}
              onSelectAll={(checked) => onSelectAll(checked ? entities.map(l => l.id) : [])}
              renamingFieldId={renamingFieldId}
              setRenamingFieldId={setRenamingFieldId}
              handleRenameColumn={handleRenameColumn}
              setEditingDescriptionFieldId={setEditingDescriptionFieldId}
              setDescriptionValue={setDescriptionValue}
              orderedFieldIds={view.visibleFields}
              handleMoveColumn={handleMoveColumn}
              handleDeleteColumn={handleDeleteColumn}
              handleAddColumn={handleAddColumn}
              availableTemplates={config.fields.filter(f => f.isSystem && !view.visibleFields.includes(f.id))}
            />
            <tbody>
              {paginatedEntities.map((entity) => (
                <CRMTableRow 
                  key={entity.id}
                  entityId={entity.id}
                  isSelected={selectedIds.includes(entity.id)}
                  onSelect={onSelect}
                  displayFields={displayFields}
                  tableColor={tableColor}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  dropdownSearch={dropdownSearch}
                  setDropdownSearch={setDropdownSearch}
                  handleCellSave={handleCellSave}
                  moveToNextCell={moveToNextCell}
                  employees={employees}
                  organizations={organizations}
                  activeFieldIdForOption={activeFieldIdForOption}
                  setActiveFieldIdForOption={setActiveFieldIdForOption}
                  newOptionValue={newOptionValue}
                  setNewOptionValue={setNewOptionValue}
                  handleAddOption={handleAddOption}
                  onEntityClick={onEntityClick}
                  deleteEntity={deleteEntity}
                  actions={actions}
                />
              ))}
              {draftRow && (
                <CRMSimpleDraftRow
                  draft={draftRow}
                  onChange={setDraftRow}
                  onSave={handleSaveDraft}
                  onDelete={() => setDraftRow(null)}
                  displayFields={displayFields}
                  tableColor={tableColor}
                  employees={employees}
                  organizations={organizations}
                  contacts={contacts || []}
                  currentUser={user}
                  configName={config.name}
                />
              )}
              <tr className="h-[52px] border-b border-border/20 bg-muted/5 group/new cursor-pointer" onClick={handleAddDraft}>
                  <td className="w-24 p-0 border-r border-border/20 sticky left-0 z-20 bg-card group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: lightTableColor}} />
                    <div className="flex items-center justify-center h-full pl-3 opacity-30 group-hover/new:opacity-100 transition-opacity">
                        <Plus size={14} className="text-muted-foreground group-hover/new:text-blue-500" />
                    </div>
                  </td>
                  <td colSpan={displayFields.length} className="p-0 border-r border-border/20 relative group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="px-4 flex items-center h-full w-full">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/30 group-hover/new:text-blue-500 transition-colors tracking-widest">+ Add Item</span>
                    </div>
                  </td>
                  <td className="bg-card/90 group-hover/new:bg-blue-500/[0.03] transition-colors"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Action Bar */}
        {entities.length > UI_PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-card/60 border-t border-border/20 shrink-0 select-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Showing {Math.min((currentPage - 1) * UI_PAGE_SIZE + 1, entities.length)} - {Math.min(currentPage * UI_PAGE_SIZE, entities.length)} of {entities.length} items
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border border-border/40 text-foreground bg-card px-4 shadow-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                Page {currentPage} of {Math.ceil(entities.length / UI_PAGE_SIZE)}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(entities.length / UI_PAGE_SIZE)))}
                disabled={currentPage >= Math.ceil(entities.length / UI_PAGE_SIZE)}
                className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border border-border/40 text-foreground bg-card px-4 shadow-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
