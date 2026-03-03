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
    <div className="flex items-center space-x-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousDay}
        className="text-gray-400 hover:text-primary transition-colors"
      >
        <ChevronLeft size={20} />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 rounded-xl h-10 px-4 text-xs font-black uppercase tracking-widest border-2",
              "border-transparent bg-white/5 shadow-inner hover:border-primary/20 hover:bg-white/10 transition-all",
            )}
          >
            <CalendarIcon size={16} />
            Change Date: <span className="text-primary">{isToday ? 'Today' : displayDate}</span>
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
        className="text-gray-400 hover:text-primary transition-colors"
      >
        <ChevronRight size={20} />
      </Button>
    </div>
  );
};