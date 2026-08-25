'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, addMonths, startOfMonth } from 'date-fns';

interface MonthPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function MonthPicker({ selectedDate, onChange, className }: MonthPickerProps) {
  // Generate a list of available months (last 12 months + next 2 months)
  const months = React.useMemo(() => {
    const list: Date[] = [];
    const now = new Date();
    // 2 months in future to 12 months in past
    for (let i = 2; i >= -12; i--) {
      list.push(startOfMonth(addMonths(now, i)));
    }
    return list;
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 px-3.5 gap-2.5 font-bold uppercase tracking-wider text-[11px] bg-card hover:bg-secondary/40 border-border/60 shadow-sm rounded-xl transition-all ${className || ''}`}
        >
          <Calendar size={13} className="text-primary" />
          <span>{format(selectedDate, 'MMMM yyyy')}</span>
          <ChevronDown size={13} className="text-muted-foreground/60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-72 overflow-y-auto p-1.5 rounded-xl">
        {months.map((m) => {
          const isSelected = format(m, 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
          return (
            <DropdownMenuItem
              key={m.toISOString()}
              onClick={() => onChange(m)}
              className={`text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between ${
                isSelected ? 'bg-primary/10 text-primary font-bold' : ''
              }`}
            >
              <span>{format(m, 'MMMM yyyy')}</span>
              {isSelected && <span className="size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
