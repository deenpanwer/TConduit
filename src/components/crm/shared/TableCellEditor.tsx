'use client';

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FieldConfig } from "@/hooks/use-crm";

interface TableCellEditorProps {
  field: FieldConfig;
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

  useEffect(() => {
    if (field.type !== 'select' && field.type !== 'date' && field.type !== 'timeline') {
      // requestAnimationFrame ensures the DOM has settled and focus is reliable
      const frame = requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
          // Move cursor to end of text
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

  const handleBlur = (e: React.FocusEvent) => {
    onSave(temp);
    // Use a small timeout to allow next cell focus to "win"
    const timer = setTimeout(() => {
        onCancel();
    }, 100);
    return () => clearTimeout(timer);
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

  if (field.type === 'timeline') {
      const range = temp ? JSON.parse(temp) : { from: undefined, to: undefined };
      return (
          <div className="absolute inset-0 z-50 flex items-center bg-background ring-2 ring-blue-500 shadow-xl overflow-hidden h-full">
              <Popover open={true} onOpenChange={(open) => !open && onCancel()}>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" className="w-full h-full justify-start text-[10px] font-black uppercase tracking-widest px-4 truncate">
                          {range.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : "Select range"}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={range.from ? new Date(range.from) : new Date()}
                          selected={{ 
                              from: range.from ? new Date(range.from) : undefined, 
                              to: range.to ? new Date(range.to) : undefined 
                          }}
                          onSelect={(newRange) => {
                              if (newRange?.from) {
                                  const saved = JSON.stringify({ from: newRange.from.toISOString(), to: newRange.to?.toISOString() });
                                  setTemp(saved);
                                  if (newRange.to) {
                                    onSave(saved);
                                    if (onNext) onNext();
                                  }
                              }
                          }}
                          numberOfMonths={2}
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
                {field.options?.map((opt) => (
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
                onSave(e.target.value);
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
                if ((field.type === "number" || field.type === "currency") && val !== "" && Number(val) < 0) return;
                if (field.type === "phone" && val !== "" && !/^\d*$/.test(val)) return;
                setTemp(val);
                onSave(val);
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