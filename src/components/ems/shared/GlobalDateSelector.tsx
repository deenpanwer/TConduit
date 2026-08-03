'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface GlobalDateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  minDate?: Date; // Optional: To grey out dates before this
}

export const GlobalDateSelector: React.FC<GlobalDateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  minDate,
}) => {
  const displayDate = format(selectedDate, 'MMMM dd, yyyy');
  const isToday = isSameDay(selectedDate, new Date());

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  /**
   * SCHEMA COMPATIBILITY NOTICE:
   * The minDate prop allows greying out dates in the calendar based on the earliest
   * available data (e.g., organization creation date, employee join date).
   * This is crucial for both Legacy and Modern schemas where data might not exist
   * before a certain timestamp.
   *
   * PHASE-OUT GUIDE (For Future Maintainers):
   * This component should remain schema-agnostic. The minDate logic is handled by
   * the consuming components (MasterDashboard, EmployeeDetailPage) that pass the
   * appropriate minDate based on their data context. No direct schema-specific
   * logic should be implemented here.
   */
  const earliestSelectableDate = minDate ? new Date(minDate.setHours(0,0,0,0)) : undefined;

  return (
    <div className="flex items-center space-x-0.5 sm:space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousDay}
        className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-primary transition-colors shrink-0"
      >
        <ChevronLeft className="size-4 sm:size-5" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 rounded-xl h-8 sm:h-10 px-2.5 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest border-2",
              "border-transparent bg-white/5 shadow-inner hover:border-primary/20 hover:bg-white/10 transition-all shrink-0",
            )}
          >
            <CalendarIcon className="size-3.5 sm:size-4 shrink-0 text-primary" />
            <span className="hidden md:inline">Change Date: </span>
            <span className="text-primary hidden sm:inline">{isToday ? 'Today' : displayDate}</span>
            <span className="text-primary sm:hidden">{isToday ? 'Today' : format(selectedDate, 'MMM dd')}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-[2rem] border-border bg-card shadow-2xl" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            initialFocus
            fromDate={earliestSelectableDate} // Grey out dates before this
            className="p-4"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-primary transition-colors shrink-0"
      >
        <ChevronRight className="size-4 sm:size-5" />
      </Button>
    </div>
  );
};