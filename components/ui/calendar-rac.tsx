"use client";

import { Calendar as AriaCalendar } from "react-aria-components";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { useState, useEffect } from "react";
import type { DateValue } from "react-aria-components";
import { cn } from "@/lib/utils";

interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  className?: string;
}

function Calendar({ value, onChange, className }: CalendarProps) {
  // Convert Date to CalendarDate for React Aria
  const convertToCalendarDate = (date: Date | null): DateValue | null => {
    if (!date) return null;
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  // Convert CalendarDate back to Date
  const convertToDate = (calendarDate: DateValue | null): Date | null => {
    if (!calendarDate) return null;
    return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
  };

  const [date, setDate] = useState<DateValue | null>(
    value ? convertToCalendarDate(value) : today(getLocalTimeZone())
  );

  // Update internal state when prop changes
  useEffect(() => {
    setDate(value ? convertToCalendarDate(value) : today(getLocalTimeZone()));
  }, [value]);

  const handleDateChange = (newDate: DateValue | null) => {
    setDate(newDate);
    const convertedDate = convertToDate(newDate);
    onChange?.(convertedDate);
  };

  return (
    <div className={cn("glass-card rounded-lg border border-white/10 p-2 text-white", className)}>
      <AriaCalendar 
        value={date} 
        onChange={handleDateChange}
        className="w-full"
      />
    </div>
  );
}

export { Calendar };
