"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { toast } from 'sonner';
import { ChevronDown, Check, X, Search, PlusCircle, User as UserIcon } from 'lucide-react';
import { FieldConfig } from '@/hooks/use-crm-module';
import { useTeam } from '@/hooks/use-team';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatar, cn } from '@/lib/utils';

const COMMON_INDUSTRIES = [
    "Technology", "Software", "SaaS", "Hardware", "Healthcare", "Medical Devices", "Pharmaceuticals",
    "Finance", "Banking", "Insurance", "Real Estate", "Education", "E-learning", "Manufacturing",
    "Retail", "E-commerce", "Energy", "Oil & Gas", "Renewables", "Telecommunications", 
    "Transportation", "Logistics", "Media", "Entertainment", "Advertising", "Marketing",
    "Consulting", "Legal", "Construction", "Architecture", "Automotive", "Aerospace",
    "Food & Beverage", "Hospitality", "Tourism", "Agriculture", "Government", "Non-profit"
].sort();

/**
 * A field that you can click to edit directly.
 */
interface InlineEditFieldProps {
  label: string;
  value: any;
  onSave: (newValue: any) => Promise<void>;
  type?: FieldConfig['type'];
  options?: { label: string; value: string; color?: string }[];
  placeholder?: string;
  readOnly?: boolean;
}

export const InlineEditField: React.FC<InlineEditFieldProps> = ({
  label,
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = "Click to add",
  readOnly = false,
}) => {
  const { employees } = useTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && !['select', 'date', 'timeline', 'people'].includes(type)) {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

  const handleSave = async (newValue?: any) => {
    const valToSave = newValue !== undefined ? newValue : currentValue;
    if (isSaving || readOnly) return;

    if (valToSave !== value) {
      setIsSaving(true);
      const promise = onSave(valToSave);
      toast.promise(promise, {
        loading: `Saving ${label}...`,
        success: `${label} saved!`,
        error: `Failed to save ${label}.`,
      });
      try {
        await promise;
        setIsEditing(false);
      } catch (error) {
        setCurrentValue(value);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
        e.preventDefault();
        handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const currentOptions = useMemo(() => {
    if (label.toLowerCase().includes('industry')) {
        const merged = Array.from(new Set([...COMMON_INDUSTRIES, ...options.map(o => o.label)]));
        return merged.map(l => ({ label: l, value: l.toLowerCase().replace(/\s+/g, '_') }));
    }
    return options;
  }, [options, label]);

  const renderValue = () => {
    if (!currentValue && currentValue !== 0) {
        return <span className="text-muted-foreground italic font-normal">{placeholder}</span>;
    }

    if (type === 'people') {
        const emp = employees.find(e => e.id === currentValue || e.email === currentValue || e.name === currentValue);
        return (
            <div className="flex items-center gap-2">
                <Avatar className="size-5 border border-border/40">
                    <AvatarImage src={getUserAvatar(emp)} alt={emp?.name || currentValue} />
                    <AvatarFallback className="text-[8px] font-black">{(emp?.name || currentValue || "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{emp?.name || currentValue}</span>
            </div>
        );
    }

    if (type === 'select') {
        const option = currentOptions.find(o => o.value === currentValue || o.label === currentValue);
        return option ? option.label : currentValue;
    }

    if (type === 'date') {
        try {
            return format(new Date(currentValue), "PPP");
        } catch (e) {
            return currentValue;
        }
    }

    if (type === 'timeline') {
        try {
            const range = typeof currentValue === 'string' ? JSON.parse(currentValue) : currentValue;
            if (range.from) {
                return range.to 
                    ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}`
                    : format(new Date(range.from), "MMM d");
            }
        } catch (e) { /* ignore */ }
    }

    if (type === 'currency') {
        return `$${Number(currentValue).toLocaleString()}`;
    }

    return String(currentValue);
  };

  if (isEditing && !readOnly) {
    if (type === 'people' || type === 'select') {
        const searchResults = searchQuery.trim() 
            ? (type === 'people' 
                ? employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase()))
                : currentOptions.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase())))
            : (type === 'people' ? employees : currentOptions);

        return (
            <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
                <Popover open={true} onOpenChange={(open) => !open && setIsEditing(false)}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full h-10 justify-between text-base font-medium">
                            {renderValue()}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command className="rounded-xl">
                            <CommandInput 
                                placeholder={`Search ${label}...`} 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="h-10 border-none focus:ring-0"
                            />
                            <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                <CommandEmpty className="p-2">
                                    <Button 
                                        variant="ghost" 
                                        className="w-full justify-start gap-2 h-10 text-blue-500 font-bold"
                                        onClick={() => {
                                            handleSave(searchQuery);
                                            setSearchQuery("");
                                        }}
                                    >
                                        <PlusCircle size={16} />
                                        Create "{searchQuery}"
                                    </Button>
                                </CommandEmpty>
                                <CommandGroup>
                                    {type === 'people' ? (
                                        (searchResults as any[]).map((emp) => (
                                            <CommandItem
                                                key={emp.id}
                                                value={emp.id}
                                                onSelect={() => {
                                                    handleSave(emp.id);
                                                    setSearchQuery("");
                                                }}
                                                className="flex items-center gap-3 py-2 cursor-pointer"
                                            >
                                                <Avatar className="size-6 border border-border/40">
                                                    <AvatarImage src={getUserAvatar(emp)} />
                                                    <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold">{emp.name}</span>
                                                    <span className="text-[9px] text-muted-foreground">{emp.email}</span>
                                                </div>
                                                <Check className={cn("ml-auto h-4 w-4", currentValue === emp.id ? "opacity-100" : "opacity-0")} />
                                            </CommandItem>
                                        ))
                                    ) : (
                                        (searchResults as any[]).map((opt) => (
                                            <CommandItem
                                                key={opt.value}
                                                value={opt.value}
                                                onSelect={() => {
                                                    handleSave(opt.value);
                                                    setSearchQuery("");
                                                }}
                                                className="flex items-center justify-between py-2 cursor-pointer"
                                            >
                                                <span className="text-[11px] font-bold uppercase tracking-wider">{opt.label}</span>
                                                <Check className={cn("h-4 w-4", (currentValue === opt.value || currentValue === opt.label) ? "opacity-100" : "opacity-0")} />
                                            </CommandItem>
                                        ))
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        );
    }

    if (type === 'date') {
        return (
            <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
                <Popover open={true} onOpenChange={(open) => !open && setIsEditing(false)}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-10 justify-start text-base font-medium">
                            {currentValue ? format(new Date(currentValue), "PPP") : "Select date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={currentValue ? new Date(currentValue) : undefined}
                            onSelect={(date) => {
                                if (date) {
                                    const iso = date.toISOString();
                                    setCurrentValue(iso);
                                    handleSave(iso);
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        );
    }

    if (type === 'timeline') {
        const range = typeof currentValue === 'string' ? JSON.parse(currentValue || '{}') : (currentValue || { from: undefined, to: undefined });
        return (
            <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
                <Popover open={true} onOpenChange={(open) => !open && setIsEditing(false)}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-10 justify-start text-base font-medium">
                            {range.from ? (range.to ? `${format(new Date(range.from), "MMM d")} - ${format(new Date(range.to), "MMM d")}` : format(new Date(range.from), "MMM d")) : "Select range"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                                    const savedStr = JSON.stringify({ from: newRange.from.toISOString(), to: newRange.to?.toISOString() });
                                    setCurrentValue(savedStr);
                                    if (newRange.to) handleSave(savedStr);
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
      <div className="flex flex-col gap-1 w-full relative group">
        <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
            {type === 'textarea' ? (
            <Textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={String(currentValue)}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={() => !isSaving && handleSave()}
                onKeyDown={handleKeyDown}
                className="text-base min-h-[100px]"
                disabled={isSaving}
            />
            ) : (
            <div className="relative flex-1">
                {type === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>}
                <Input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type={type === 'number' || type === 'currency' ? 'number' : type}
                    value={String(currentValue)}
                    onChange={(e) => {
                        const val = e.target.value;
                        if ((type === 'number' || type === 'currency') && val !== "" && Number(val) < 0) return;
                        setCurrentValue(val);
                    }}
                    onBlur={() => !isSaving && handleSave()}
                    onKeyDown={handleKeyDown}
                    className={cn("text-base h-10", type === 'currency' && 'pl-7')}
                    disabled={isSaving}
                />
            </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full transition-all", !readOnly && "cursor-text group")} onClick={() => !isSaving && !readOnly && setIsEditing(true)}>
      <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
      <div className={cn(
        "text-base text-foreground font-medium p-2 rounded-md min-h-[40px] transition-colors flex items-center justify-between",
        !readOnly && "group-hover:bg-muted/50"
      )}>
        <div className="flex-1 truncate">
            {renderValue()}
        </div>
        {!readOnly && <ChevronDown size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />}
      </div>
    </div>
  );
};
