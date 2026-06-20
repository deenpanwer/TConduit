"use client";

import React, { useState, useEffect } from 'react';
import { FieldConfig } from '@/hooks/use-crm-module';
import { GripVertical, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Reorder, useDragControls } from 'framer-motion';
import { ColumnPicker } from '../shared/ColumnPicker';
import { cn } from '@/lib/utils';

interface FieldEditorProps {
  fields: FieldConfig[];
  onFieldsChange: (fields: FieldConfig[]) => void;
  availableTemplates?: FieldConfig[];
}

const generateKey = (label: string) => {
    return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const EditorFieldItem = ({
  field,
  onRemove,
  draggedId,
  setDraggedId
}: {
  field: FieldConfig;
  onRemove: (id: string) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
}) => {
  const dragControls = useDragControls();
  const isDragging = draggedId === field.id;

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setDraggedId(field.id)}
      onDragEnd={() => setDraggedId(null)}
      whileDrag={{ 
        scale: 1.02, 
        zIndex: 9999,
        backgroundColor: "hsl(var(--card))",
        boxShadow: "0 15px 30px -5px rgba(0,0,0,0.3)",
        borderColor: "hsl(var(--primary) / 0.3)"
      }}
      className={cn(
        "transition-shadow relative",
        isDragging && "z-[9999]"
      )}
    >
      <Card className={cn(
        "p-3 bg-card border-border/20 shadow-sm hover:border-primary/20 transition-all",
        isDragging && "shadow-2xl ring-2 ring-blue-500 bg-card rotate-1"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
              className="p-1 -ml-1 hover:bg-secondary/80 rounded transition-colors cursor-grab active:cursor-grabbing"
            >
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
              <Button variant="ghost" size="icon" onClick={() => onRemove(field.id)} className="h-8 w-8 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Reorder.Item>
  );
};

export function FieldEditor({ fields, onFieldsChange, availableTemplates = [] }: FieldEditorProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleRemoveField = (id: string) => {
        const updatedFields = fields.filter(field => field.id !== id);
        onFieldsChange(updatedFields.map((field, index) => ({ ...field, order: index })));
    };

    const handleReorder = (newFields: FieldConfig[]) => {
        const updatedFields = newFields.map((field, index) => ({ ...field, order: index }));
        onFieldsChange(updatedFields);
    };

    const handleAddField = (template?: Partial<FieldConfig>, type?: FieldConfig['type']) => {
        const label = template?.label || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "New Field");
        const key = template?.key || generateKey(label);
        
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

    return (
        <div className={cn(
            "p-6 space-y-4 max-h-[60vh] custom-scrollbar",
            draggedId ? "overflow-hidden select-none" : "overflow-y-auto"
        )}>
            <p className="text-xs text-muted-foreground px-2 font-medium uppercase tracking-wider">
                Drag and drop handle to reorder fields. Use the Column Picker to add specialized data modules.
            </p>
            
            {isMounted && (
                <Reorder.Group axis="y" values={fields} onReorder={handleReorder} className="space-y-3">
                    {fields.map((field) => (
                        <EditorFieldItem
                            key={field.id}
                            field={field}
                            onRemove={handleRemoveField}
                            draggedId={draggedId}
                            setDraggedId={setDraggedId}
                        />
                    ))}
                </Reorder.Group>
            )}

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
