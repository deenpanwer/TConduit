"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FieldConfig } from '@/hooks/use-crm-module';
import { GripVertical, Trash2, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { ColumnPicker } from '../shared/ColumnPicker';
import { cn } from '@/lib/utils';

interface FieldEditorProps {
  fields: FieldConfig[];
  onFieldsChange: (fields: FieldConfig[]) => void;
  availableTemplates?: FieldConfig[];
}

// A simple utility to create a URL-friendly key from a label
const generateKey = (label: string) => {
    return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export function FieldEditor({ fields, onFieldsChange, availableTemplates = [] }: FieldEditorProps) {
    const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalNode(document.body);
    }, []);

    const handleRemoveField = (id: string) => {
        const updatedFields = fields.filter(field => field.id !== id);
        onFieldsChange(updatedFields.map((field, index) => ({ ...field, order: index })));
    };

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedFields = items.map((field, index) => ({ ...field, order: index }));
        onFieldsChange(updatedFields);
    };

    const handleAddField = (template?: Partial<FieldConfig>, type?: FieldConfig['type']) => {
        const label = template?.label || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "New Field");
        const key = template?.key || generateKey(label);
        
        // Avoid duplicate keys
        let finalKey = key;
        let counter = 1;
        while (fields.some(f => f.key === finalKey)) {
            finalKey = `${key}_${counter++}`;
        }

        const newFieldConfig: FieldConfig = {
            id: template?.id || `custom_${new Date().getTime()}`,
            key: finalKey,
            label: label,
            type: type || template?.type || 'text',
            isSystem: template?.isSystem || false,
            isVisible: true,
            order: fields.length,
            options: template?.options,
            description: template?.description
        };
        
        onFieldsChange([...fields, newFieldConfig]);
    };

  const renderDraggableField = (field: FieldConfig, index: number) => (
    <Draggable key={field.id} draggableId={field.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
        const child = (
          <div 
            ref={provided.innerRef} 
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              // If dragging, we might need to adjust width if it's in a portal
              width: snapshot.isDragging ? '450px' : provided.draggableProps.style?.width,
            }}
            className={cn(
                "transition-shadow",
                snapshot.isDragging && "z-[9999]"
            )}
          >
            <Card className={cn(
                "p-3 bg-card border-border/20 shadow-sm hover:border-primary/20 transition-all",
                snapshot.isDragging && "shadow-2xl ring-2 ring-blue-500 bg-card rotate-1"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div {...provided.dragHandleProps} className="p-1 -ml-1 hover:bg-secondary/80 rounded transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                      <p className="font-bold text-[11px] uppercase tracking-widest">{field.label}</p>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
                          Type: <span className="text-primary">{field.type}</span>
                          {field.isSystem && (<span className="ml-2 text-blue-500 font-black tracking-widest">(System)</span>)}
                      </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!field.isSystem && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)} className="h-8 w-8 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        );

        if (snapshot.isDragging && portalNode) {
          return createPortal(child, portalNode);
        }

        return child;
      }}
    </Draggable>
  );

  return (
    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
      <p className="text-xs text-muted-foreground px-2 font-medium uppercase tracking-wider">
        Drag and drop handle to reorder fields. Use the Column Picker to add specialized data modules.
      </p>
      
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {fields.map((field, index) => renderDraggableField(field, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="pt-4 px-2">
        <ColumnPicker 
            onSelect={handleAddField} 
            availableTemplates={availableTemplates.filter(t => !fields.some(f => f.key === t.key))}
        >
            <Button variant="outline" className="w-full h-14 border-dashed rounded-2xl border-border/40 hover:bg-secondary/50 group transition-all">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                        <Sparkles size={18} />
                    </div>
                    <div className="text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest">Add New Field</span>
                        <span className="block text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Open Column Center</span>
                    </div>
                </div>
            </Button>
        </ColumnPicker>
      </div>
    </div>
  );
}
