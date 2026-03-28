"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, X, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, className, placeholder }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1 w-full", className)}>
        <Input
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-8 py-1 text-sm bg-secondary/30 border-blue-500/50"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={handleSave}>
          <Check size={14} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={handleCancel}>
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 cursor-pointer hover:bg-secondary/20 p-1 -m-1 rounded transition-colors min-h-[2rem] w-full",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className={cn("text-sm font-medium truncate", !value && "text-muted-foreground italic")}>
        {value || placeholder || "Click to add..."}
      </span>
      <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}
