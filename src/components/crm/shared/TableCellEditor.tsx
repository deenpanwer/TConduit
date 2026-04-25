'use client';

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TableCellEditorProps {
  field: any;
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  onNext?: () => void;
}

export const TableCellEditor = ({ 
  field, 
  value, 
  onSave, 
  onCancel,
  onNext
}: TableCellEditorProps) => {
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync temp state with value prop when it changes (essential for Zustand instant updates)
  useEffect(() => {
    setTemp(value);
  }, [value]);

  useEffect(() => {
    if (field.type !== 'select' && field.type !== 'date' && field.type !== 'timeline') {
      const frame = requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [field.type]);

  const handleConfirm = () => {
    onSave(temp);
    if (onNext) onNext();
  };

  const handleBlur = () => {
    onSave(temp);
    // Tiny delay to check if next click was another cell
    setTimeout(() => {
        onCancel();
    }, 150);
  };

  if (field.type === 'date') {
      return (
        <div className="absolute inset-0 z-50 flex items-center bg-background ring-2 ring-blue-500 shadow-xl overflow-hidden h-full">
            <Popover open={true} onOpenChange={(open) => !open && onCancel()}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full h-full justify-start text-[10px] font-black uppercase tracking-widest px-4">
                        {temp ? format(new Date(temp), "PPP") : "Select date"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                        mode="single"
                        selected={temp ? new Date(temp) : undefined}
                        onSelect={(date) => {
                            if (date) {
                                const iso = date.toISOString();
                                setTemp(iso);
                                onSave(iso);
                                if (onNext) onNext();
                            }
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
      );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center bg-background ring-2 ring-blue-500 shadow-xl overflow-hidden h-full">
      {field.type === "select" ? (
        <div className="flex-1 h-full relative">
            <select
                className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs font-black uppercase tracking-widest px-4 h-full cursor-pointer appearance-none"
                value={temp}
                onChange={(e) => {
                  setTemp(e.target.value);
                  onSave(e.target.value);
                  if (onNext) onNext();
                }}
                onBlur={handleBlur}
                autoFocus
            >
                <option value="">Select...</option>
                {field.options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      ) : field.type === "textarea" ? (
        <textarea
            className="flex-1 h-full py-2 px-4 text-xs font-bold border-none focus-visible:ring-0 bg-transparent rounded-none resize-none overflow-hidden"
            value={temp}
            onChange={(e) => {
                setTemp(e.target.value);
                onSave(e.target.value); // INSTANT STORE UPDATE
            }}
            onBlur={handleBlur}
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirm();
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  handleConfirm();
                }
                if (e.key === "Escape") onCancel();
            }}
            autoFocus
        />
      ) : (
        <div className="flex-1 h-full flex items-center relative">
          {field.type === "currency" && <span className="pl-4 text-xs font-black text-blue-500">$</span>}
          <Input
            ref={inputRef}
            type={field.type === "number" || field.type === "currency" ? "number" : field.type === "email" ? "email" : "text"}
            value={temp}
            onChange={(e) => {
                const val = e.target.value;
                setTemp(val);
                onSave(val); // INSTANT STORE UPDATE
            }}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleConfirm();
              }
              if (e.key === "Escape") onCancel();
            }}
            className={cn(
                "flex-1 h-full py-0 text-xs font-bold border-none focus-visible:ring-0 bg-transparent rounded-none",
                field.type === "currency" ? "pl-1" : "px-4"
            )}
          />
        </div>
      )}
    </div>
  );
};
