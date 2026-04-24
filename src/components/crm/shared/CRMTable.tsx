'use client';

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCRM, CRMEntity, FieldConfig, ModuleConfig } from "@/hooks/use-crm";
import { useTeam } from "@/hooks/use-team";
import { toast } from "sonner";

// Sub-components
import { CRMTableHeader } from "./CRMTableHeader";
import { CRMTableRow } from "./CRMTableRow";

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
  entities: CRMEntity[];
  config: ModuleConfig;
  updateEntity: (id: string, updates: any) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<ModuleConfig>) => Promise<void>;
  onEntityClick: (entity: CRMEntity) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  addEntity: (data: any) => Promise<string | null>;
  pageSize: number;
  setPageSize: (size: number) => void;
  actions?: (entity: CRMEntity) => React.ReactNode;
}

export function CRMTable({
  entities, config, updateEntity, deleteEntity, updateConfig, 
  onEntityClick, selectedIds, onSelect, onSelectAll, addEntity,
  pageSize, setPageSize, actions
}: CRMTableProps) {
  const { employees } = useTeam();
  const { organizations } = useCRM();
  
  const [editingCell, setEditingCell] = useState<{ id: string, fieldKey: string } | null>(null);
  const [renamingFieldId, setRenamingFieldId] = useState<string | null>(null);
  const [editingDescriptionFieldId, setEditingDescriptionFieldId] = useState<string | null>(null);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [quickAddValue, setQuickAddValue] = useState("");

  const [tableColor] = useState(() => STRIP_COLORS[Math.floor(Math.random() * STRIP_COLORS.length)]);
  const lightTableColor = useMemo(() => lightenHexColor(tableColor, 75), [tableColor]);

  const [orderedFieldIds, setOrderedFieldIds] = useState<string[]>([]);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [activeFieldIdForOption, setActiveFieldIdForOption] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const view = useMemo(() => config.views.find(v => v.type === 'list') || config.views[0], [config.views]);
  
  useEffect(() => {
    setOrderedFieldIds(view.visibleFields);
  }, [view.visibleFields]);

  const displayFields = useMemo(() => {
    const ids = orderedFieldIds.length > 0 ? orderedFieldIds : view.visibleFields;
    return ids
      .map(id => {
        const field = config.fields.find(f => f.id === id);
        if (!field || !field.isVisible) return null;
        return field;
      })
      .filter((f): f is FieldConfig => !!f);
  }, [config.fields, view.visibleFields, orderedFieldIds]);

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
    const val = e.target.value;
    
    // BIRTH: The moment any character is typed, a real (optimistic) row is born.
    if (val.length > 0 && !isCreatingRef.current) {
      isCreatingRef.current = true;
      const firstField = displayFields[0];
      const singularType = config.name.toLowerCase().endsWith('s') ? config.name.toLowerCase().slice(0, -1) : config.name.toLowerCase();
      
      // CLEAR INPUT SYNCHRONOUSLY: Stops the browser from triggering more change events
      setQuickAddValue("");

      // INSTANT BIRTH: addEntity now returns the ID immediately
      addEntity({ 
        name: val, 
        type: singularType as any,
        data: { [firstField.key]: val } 
      }).then(id => {
          if (id) {
            // FOCUS THE NEW ROW IMMEDIATELY
            setEditingCell({ id, fieldKey: firstField.key });
          }
          isCreatingRef.current = false;
      }).catch(() => {
          isCreatingRef.current = false;
      });
    } else {
      setQuickAddValue(val);
    }
  };

  const handleMoveColumn = (fieldId: string, direction: 'left' | 'right') => {
    const currentIndex = orderedFieldIds.indexOf(fieldId);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= orderedFieldIds.length) return;
    const newOrder = [...orderedFieldIds];
    [newOrder[currentIndex], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[currentIndex]];
    setOrderedFieldIds(newOrder);
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
            if (orderedFieldIds.includes(existing.id)) {
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
    const newVisible = [...orderedFieldIds, finalField.id];
    setOrderedFieldIds(newVisible);
    updateConfig({ 
        fields: newFields,
        views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
    });
  };

  const handleDeleteColumn = (fieldId: string) => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field) return;
    if (confirm(`Remove "${field.label}" from this view?`)) {
        const newVisible = orderedFieldIds.filter(id => id !== fieldId);
        setOrderedFieldIds(newVisible);
        const updates: Partial<ModuleConfig> = {
            views: config.views.map(v => v.id === view.id ? { ...v, visibleFields: newVisible } : v)
        };
        if (!field.isSystem) updates.fields = config.fields.filter(f => f.id !== fieldId);
        updateConfig(updates);
    }
  };

  const getFieldValue = (entity: CRMEntity, fieldKey: string) => {
    if (fieldKey in entity) return (entity as any)[fieldKey];
    return entity.data?.[fieldKey];
  };

  return (
    <TooltipProvider>
      <div className="space-y-0">
        <div className="rounded-[1.25rem] border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-x-auto custom-scrollbar relative">
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
              orderedFieldIds={orderedFieldIds}
              handleMoveColumn={handleMoveColumn}
              handleDeleteColumn={handleDeleteColumn}
              handleAddColumn={handleAddColumn}
              availableTemplates={config.fields.filter(f => f.isSystem && !orderedFieldIds.includes(f.id))}
            />
            <tbody>
              {entities.map((entity) => (
                <CRMTableRow 
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedIds.includes(entity.id)}
                  onSelect={onSelect}
                  displayFields={displayFields}
                  tableColor={tableColor}
                  getFieldValue={getFieldValue}
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
              <tr className="h-[52px] border-b border-border/20 bg-muted/5 group/new">
                  <td className="w-24 p-0 border-r border-border/20 sticky left-0 z-20 bg-card group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-3" style={{backgroundColor: lightTableColor}} />
                    <div className="flex items-center justify-center h-full pl-3 opacity-30 group-hover/new:opacity-100 transition-opacity">
                        <Plus size={14} className="text-muted-foreground group-hover/new:text-blue-500" />
                    </div>
                  </td>
                  <td colSpan={displayFields.length} className="p-0 border-r border-border/20 relative group-hover/new:bg-blue-500/[0.03] transition-colors">
                    <div className="px-4 flex items-center h-full w-full">
                      <input 
                        autoFocus
                        className="w-full h-full bg-transparent border-none outline-none text-[10px] font-black uppercase text-muted-foreground/30 focus:text-blue-500 placeholder:text-muted-foreground/30 transition-colors"
                        placeholder="Add Item"
                        value={quickAddValue}
                        onChange={handleQuickAddChange}
                      />
                    </div>
                  </td>
                  <td className="bg-card/90 group-hover/new:bg-blue-500/[0.03] transition-colors"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}