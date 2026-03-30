"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Plus, MoreVertical, Check, X, MessageSquare, Paperclip, GripVertical, Search, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CRMEntity, ModuleConfig, ViewConfig, FieldConfig } from "@/hooks/use-crm-module";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Badge } from "@/components/ui/badge";

/**
 * MONDAY-STYLE KANBAN COMPONENT (v2)
 * ----------------------------------
 * Advanced Kanban with vertical column scrolling, horizontal board scrolling,
 * and inline editing. Designed to match Monday.com's high-density interface.
 */

interface CRMKanbanProps {
  entities: CRMEntity[];
  config: ModuleConfig;
  updateEntity: (id: string, updates: any) => Promise<void>;
  addEntity: (payload: { name: string, data: Record<string, any> }) => Promise<string | null>;
  deleteEntity: (id: string) => Promise<void>;
  updateConfig: (updates: Partial<ModuleConfig>) => Promise<void>;
  onEntityClick: (entity: CRMEntity) => void;
  actions?: (entity: CRMEntity) => React.ReactNode;
  onQuickAdd?: (stage: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  blue: '#00a9ff',
  green: '#00ca72',
  yellow: '#ffcb00',
  orange: '#ff7538',
  red: '#ff158a',
  purple: '#a25ddc',
  indigo: '#579bfc',
  gray: '#c4c4c4',
  blank: '#787d8a', // Darker gray for 'Blank'
};

const getStageColor = (colorName?: string) => STAGE_COLORS[colorName || 'gray'] || STAGE_COLORS.gray;

/**
 * INLINE CARD EDITOR
 */
const InlineCardEditor = ({
    initialValue,
    onSave,
    onCancel
}: {
    initialValue: string;
    onSave: (val: string) => void;
    onCancel: () => void;
}) => {
    const [val, setVal] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleConfirm = () => {
        if (val.trim() && val !== initialValue) onSave(val.trim());
        else onCancel();
    };

    return (
        <div className="absolute inset-0 z-50 bg-background flex flex-col p-3 rounded-2xl ring-2 ring-blue-500 shadow-2xl">
            <Input
                ref={inputRef}
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") handleConfirm();
                    if (e.key === "Escape") onCancel();
                }}
                className="text-xs font-black uppercase tracking-widest border-none p-0 focus-visible:ring-0 h-auto mb-2"
            />
            <div className="flex justify-end gap-1 mt-auto">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={handleConfirm}><Check size={14}/></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={onCancel}><X size={14}/></Button>
            </div>
        </div>
    );
};

export function CRMKanban({
  entities, config, updateEntity, addEntity, deleteEntity, updateConfig, 
  onEntityClick, actions, onQuickAdd
}: CRMKanbanProps) {
  
  const [addingToStage, setAddingToStage] = useState<string | null>(null);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [renamingStageId, setRenamingStageId] = useState<string | null>(null);
  const [tempStageName, setTempStageName] = useState("");
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, string>>({});
  
  const view = useMemo(() => config.views.find(v => v.type === 'kanban') || config.views[0], [config.views]);
  const kanbanField = useMemo(() => config.fields.find(f => f.id === view.kanbanFieldId), [config.fields, view.kanbanFieldId]);

  if (!kanbanField) return <div className="p-8 text-center text-muted-foreground font-black uppercase tracking-widest">Kanban field not configured</div>;

  // MONDAY FIX: Ensure 'Blank' stage is always present first
  const stages = useMemo(() => {
    const baseStages = kanbanField.options || [];
    return [
      { label: 'Blank', value: '__blank__', color: 'blank' },
      ...baseStages
    ];
  }, [kanbanField.options]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    setOptimisticMoves(prev => ({ ...prev, [draggableId]: destination.droppableId }));
    
    try {
        const stageValue = destination.droppableId === '__blank__' ? null : destination.droppableId;
        await updateEntity(draggableId, { [kanbanField.key]: stageValue });
    } catch (error) {
        setOptimisticMoves(prev => {
            const next = { ...prev };
            delete next[draggableId];
            return next;
        });
    }
  };

  const handleQuickAdd = async (stageValue: string, name: string) => {
    setAddingToStage(null);
    const value = stageValue === '__blank__' ? null : stageValue;
    await addEntity({ name, data: { [kanbanField.key]: value } });
  };

  const handleRenameStage = async (stageValue: string) => {
    if (!tempStageName.trim()) {
        setRenamingStageId(null);
        return;
    }
    
    // IMMUTABLE UPDATE: Create a new options array
    const newOptions = (kanbanField.options || []).map(o => 
        o.value === stageValue ? { ...o, label: tempStageName.trim() } : o
    );
    
    // IMMUTABLE UPDATE: Create a new fields array
    const newFields = config.fields.map(f => 
        f.id === kanbanField.id ? { ...f, options: newOptions } : f
    );
    
    await updateConfig({ fields: newFields });
    setRenamingStageId(null);
    setTempStageName("");
  };

  const handleAddStage = async () => {
    const newStageValue = `stage_${Date.now()}`;
    const newOptions = [
        ...(kanbanField.options || []), 
        { label: 'New Stage', value: newStageValue, color: 'blue' }
    ];
    
    const newFields = config.fields.map(f => 
        f.id === kanbanField.id ? { ...f, options: newOptions } : f
    );
    
    await updateConfig({ fields: newFields });
  };

  const handleDeleteStage = async (stageValue: string) => {
    if (confirm("Delete this stage? Items will move to Blank.")) {
        const newOptions = (kanbanField.options || []).filter(o => o.value !== stageValue);
        const newFields = config.fields.map(f => 
            f.id === kanbanField.id ? { ...f, options: newOptions } : f
        );
        await updateConfig({ fields: newFields });
    }
  };

  const groupedEntities = useMemo(() => {
    const groups: Record<string, CRMEntity[]> = {};
    stages.forEach(s => groups[s.value] = []);

    entities.forEach(entity => {
      const stageValue = optimisticMoves[entity.id] || entity.status || entity.data[kanbanField.key] || '__blank__';
      const finalStage = stageValue === null ? '__blank__' : stageValue;
      if (!groups[finalStage]) groups[finalStage] = [];
      groups[finalStage].push(entity);
    });
    return groups;
  }, [entities, stages, kanbanField.key, optimisticMoves]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-280px)] min-h-[500px] custom-scrollbar px-2 bg-background/50 rounded-3xl p-2 border border-border/20">
      <DragDropContext onDragEnd={handleDragEnd}>
        {stages.map((stage) => (
          <div key={stage.value} className="flex flex-col w-[300px] shrink-0 bg-[#f5f6f8] dark:bg-slate-900/40 rounded-2xl border border-border/40 overflow-hidden shadow-sm">
            {/* STAGE HEADER - Monday Style Flush */}
            <div 
              style={{ backgroundColor: getStageColor(stage.color) }}
              className="p-3 shadow-md flex items-center justify-between min-h-[48px]"
            >
              {renamingStageId === stage.value ? (
                <div className="flex items-center gap-1 w-full bg-white/20 rounded-md px-1 py-0.5">
                    <Input
                        autoFocus
                        value={tempStageName}
                        onChange={e => setTempStageName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleRenameStage(stage.value);
                            if (e.key === "Escape") setRenamingStageId(null);
                        }}
                        className="h-6 text-[10px] font-black uppercase bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/50 p-0 pl-1"
                    />
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-white hover:bg-white/10" onClick={() => handleRenameStage(stage.value)}><Check size={12}/></Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-white hover:bg-white/10" onClick={() => setRenamingStageId(null)}><X size={12}/></Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 max-w-[180px]">
                    <h3 
                        className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-sm truncate cursor-text"
                        onDoubleClick={() => { if(stage.value !== '__blank__') { setRenamingStageId(stage.value); setTempStageName(stage.label); }}}
                    >
                        {stage.label}
                    </h3>
                    <span className="text-[9px] font-black bg-black/10 text-white px-2 py-0.5 rounded-full shrink-0">
                      {groupedEntities[stage.value]?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10 rounded-md" onClick={() => setAddingToStage(stage.value)}>
                        <Plus size={14} />
                     </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10 rounded-md"><MoreVertical size={14}/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 z-[100]">
                            <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setAddingToStage(stage.value)}>Quick Add</DropdownMenuItem>
                            {stage.value !== '__blank__' && (
                                <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => { setRenamingStageId(stage.value); setTempStageName(stage.label); }}>
                                    Rename Stage
                                </DropdownMenuItem>
                            )}
                            {stage.value !== '__blank__' && (
                                <DropdownMenuItem className="text-[10px] font-bold uppercase text-red-500" onClick={() => handleDeleteStage(stage.value)}>
                                    Delete Stage
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
                </>
              )}
            </div>

            {/* SCROLLABLE DROPPABLE AREA */}
            <Droppable droppableId={stage.value}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 flex flex-col gap-2 p-3 overflow-y-auto custom-scrollbar transition-colors",
                    snapshot.isDraggingOver ? "bg-blue-500/[0.05]" : ""
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {addingToStage === stage.value && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border-2 border-blue-500 rounded-xl p-3 shadow-xl mb-2">
                            <Input
                                autoFocus
                                placeholder="New Lead Name..."
                                className="text-[10px] font-black uppercase tracking-widest border-none p-0 focus-visible:ring-0 h-auto mb-2"
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleQuickAdd(stage.value, (e.target as HTMLInputElement).value);
                                    if (e.key === "Escape") setAddingToStage(null);
                                }}
                            />
                            <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[8px] font-black uppercase" onClick={() => setAddingToStage(null)}>Cancel</Button>
                                <Button size="sm" className="h-6 px-3 text-[8px] font-black uppercase bg-blue-600" onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                    handleQuickAdd(stage.value, input.value);
                                }}>Add</Button>
                            </div>
                        </motion.div>
                    )}

                    {groupedEntities[stage.value]?.map((entity, index) => (
                      <Draggable key={entity.id} draggableId={entity.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "group relative bg-card border border-border/40 rounded-xl p-3 shadow-sm hover:shadow-md transition-all select-none",
                              snapshot.isDragging ? "shadow-2xl ring-2 ring-blue-500 scale-[1.03] z-[1000] rotate-1" : ""
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                                {editingEntityId === entity.id ? (
                                    <InlineCardEditor
                                        initialValue={entity.name}
                                        onSave={(name) => { updateEntity(entity.id, { name }); setEditingEntityId(null); }}
                                        onCancel={() => setEditingEntityId(null)}
                                    />
                                ) : (
                                    <h4
                                        className="text-[11px] font-black uppercase tracking-widest text-foreground truncate flex-1 pr-2 cursor-text hover:text-blue-600 transition-colors"
                                        onDoubleClick={(e) => { e.stopPropagation(); setEditingEntityId(entity.id); }}
                                    >
                                        {entity.name}
                                    </h4>
                                )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 rounded-lg">
                                    <MoreVertical size={12}/>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 z-[100]">
                                    <DropdownMenuItem className="text-[10px] font-black uppercase" onClick={() => onEntityClick(entity)}>
                                        <ExternalLink size={12} className="mr-2 text-blue-500" /> Open Lead
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-[10px] font-black uppercase" onClick={() => setEditingEntityId(entity.id)}>
                                        <GripVertical size={12} className="mr-2 text-muted-foreground" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {actions && actions(entity)}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* FIELDS DISPLAY */}
                            <div className="space-y-1.5 opacity-70">
                                {view.visibleFields.slice(0, 3).map(fieldId => {
                                    const field = config.fields.find(f => f.id === fieldId);
                                    if (!field || field.key === 'status') return null;
                                    const val = entity.data[field.key];
                                    if (!val) return null;
                                    return (
                                        <div key={fieldId} className="flex items-center gap-2">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground/40 w-14 shrink-0 truncate">{field.label}</span>
                                            <span className="text-[9px] font-bold truncate text-foreground/80">{String(val)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-3 pt-2 border-t border-border/10 flex items-center justify-between">
                                <div className="flex -space-x-1">
                                    <div className="size-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[7px] font-black text-blue-500">AI</div>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground/30">
                                    <MessageSquare size={10} />
                                    <Paperclip size={10} />
                                </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Integrated Add Button at bottom of column */}
            <button
                className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 border-t border-border/10"
                onClick={() => setAddingToStage(stage.value)}
            >
                <Plus size={12} /> Add Contact
            </button>
          </div>
        ))}

        {/* VERTICAL ADD STAGE BUTTON */}
        <button
            onClick={handleAddStage}
            className="w-12 shrink-0 rounded-2xl border-2 border-dashed border-border/20 hover:border-blue-500/20 hover:bg-blue-500/[0.02] transition-all flex flex-col items-center justify-center gap-4 text-muted-foreground/30 hover:text-blue-500 group py-8 h-full min-h-[400px]"
        >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-black uppercase tracking-[0.2em]">Add Stage</span>
        </button>
      </DragDropContext>
    </div>
  );
}

