"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, X, Edit2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
  type?: "text" | "number" | "select" | "date" | "currency" | "email" | "phone" | "textarea";
  options?: { label: string; value: string; color?: string }[];
  isSaving?: boolean;
  showButtons?: boolean;
}

export function InlineEdit({ 
  value, 
  onSave, 
  onCancel,
  className, 
  placeholder,
  type = "text",
  options = [],
  isSaving = false,
  showButtons = true
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && type !== 'select') {
      inputRef.current.focus();
      if (type !== 'date') {
        try {
          inputRef.current.select();
        } catch (e) {
          // select() might fail on some input types in some browsers
        }
      }
    }
  }, [isEditing, type]);

  // Click outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isEditing) {
        handleSave();
      }
    };
    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, tempValue]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  if (isEditing) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "flex items-center gap-0 w-full bg-background ring-2 ring-blue-500 rounded-md shadow-lg z-50 overflow-hidden min-h-[40px]",
          className
        )}
      >
        {type === "select" ? (
          <div className="flex-1 px-2">
            <select
              className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-widest h-8"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Input
            ref={inputRef}
            type={type === "currency" ? "number" : type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className="flex-1 h-9 py-1 px-3 text-xs font-bold border-none focus-visible:ring-0 bg-transparent"
            placeholder={placeholder}
          />
        )}
        
        {showButtons && (
          <div className="flex items-center border-l border-border/50 px-1 bg-secondary/10">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-green-500 hover:bg-green-500/10" 
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
            >
              <Check size={14} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 text-red-500 hover:bg-red-500/10" 
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
            >
              <X size={14} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const displayValue = () => {
    if (type === "select") {
      const option = options.find((o) => o.value === value);
      
      const badgeColorMap: Record<string, string> = {
        blue: 'bg-blue-500 text-white',
        yellow: 'bg-amber-400 text-black',
        purple: 'bg-purple-500 text-white',
        green: 'bg-emerald-500 text-white',
        red: 'bg-rose-500 text-white',
        orange: 'bg-orange-500 text-white',
        indigo: 'bg-indigo-500 text-white',
        gray: 'bg-gray-400 text-white',
      };

      const colorClass = badgeColorMap[option?.color || 'gray'] || 'bg-gray-400 text-white';

      return option ? (
        <span 
          className={cn(
            "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm",
            colorClass
          )}
        >
          {option.label}
        </span>
      ) : (
        <span className="text-muted-foreground italic text-xs px-3">Select...</span>
      );
    }
    
    if (type === "currency") {
      return <span className="text-blue-500 font-bold">${Number(value || 0).toLocaleString()}</span>;
    }

    if (!value) return <span className="text-muted-foreground italic text-xs">{placeholder || "Click to add..."}</span>;
    
    return <span className="text-xs font-bold">{value}</span>;
  };

  return (
    <div 
      className={cn(
        "group flex items-center justify-between gap-2 cursor-pointer hover:bg-secondary/20 px-3 py-2 rounded-md transition-all duration-200 min-h-[40px] w-full border border-transparent hover:border-border/40",
        isSaving && "opacity-50 pointer-events-none",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <div className="truncate flex-1">
        {displayValue()}
      </div>
      {isSaving ? (
        <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />
      ) : (
        <Edit2 size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  );
}