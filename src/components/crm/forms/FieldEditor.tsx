"use client";

import React, { useState } from 'react';
import { FieldConfig } from '@/hooks/use-crm-module';
import { GripVertical, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface FieldEditorProps {
  fields: FieldConfig[];
  onFieldsChange: (fields: FieldConfig[]) => void;
}

// A simple utility to create a URL-friendly key from a label
const generateKey = (label: string) => {
    return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export function FieldEditor({ fields, onFieldsChange }: FieldEditorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newField, setNewField] = useState({ label: '', type: 'text' as FieldConfig['type'] });

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

    const handleAddField = () => {
        if (!newField.label) {
            alert("Field Label is required.");
            return;
        }

        const newFieldConfig: FieldConfig = {
            id: `custom_${new Date().getTime()}`,
            key: generateKey(newField.label),
            label: newField.label,
            type: newField.type,
            isSystem: false,
            isVisible: true,
            order: fields.length, // Add to the end
        };
        
        onFieldsChange([...fields, newFieldConfig]);
        setNewField({ label: '', type: 'text' });
        setIsAdding(false);
    };

  return (
    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
      <p className="text-sm text-muted-foreground px-2">
        Drag and drop to reorder fields. Click on a field to edit it, or add a new one.
      </p>
      
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <Card className="p-3 bg-secondary/30 border-border/20 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <div>
                                <p className="font-bold text-sm">{field.label}</p>
                                <p className="text-xs text-muted-foreground">Type: <span className="font-mono bg-primary-foreground p-1 rounded-md text-[10px]">{field.type}</span>
                                {field.isSystem && (<span className="ml-2 text-blue-500 text-[10px] font-bold uppercase">(System)</span>)}
                                </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!field.isSystem && (
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {isAdding ? (
        <Card className="p-4 bg-secondary/30 border-dashed border-border/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Input 
                    placeholder="Field Label (e.g., 'Birthday')" 
                    value={newField.label}
                    onChange={(e) => setNewField({...newField, label: e.target.value})}
                />
                <Select value={newField.type} onValueChange={(v) => setNewField({...newField, type: v as FieldConfig['type']})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleAddField}>Add Field</Button>
            </div>
        </Card>
      ) : (
        <Button variant="outline" className="w-full h-12 mt-4 border-dashed" onClick={() => setIsAdding(true)}>
            <PlusCircle className="h-4 w-4 mr-2"/>
            Add New Field
        </Button>
      )}
    </div>
  );
}
