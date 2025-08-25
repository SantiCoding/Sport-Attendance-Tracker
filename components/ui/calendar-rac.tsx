"use client";

import { Calendar as AriaCalendar } from "react-aria-components";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { useState, useEffect } from "react";
import type { DateValue } from "react-aria-components";
import { cn } from "@/lib/utils";
import "react-aria-components/styles.css";

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
    <div className={cn("glass-card rounded-lg border border-white/10 p-4 text-white", className)}>
      <style jsx>{`
        :global(.react-aria-Calendar) {
          color: white;
        }
        :global(.react-aria-Calendar .react-aria-CalendarCell) {
          color: white;
          border-radius: 8px;
          padding: 8px;
          margin: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        :global(.react-aria-Calendar .react-aria-CalendarCell:hover) {
          background: rgba(255, 255, 255, 0.1);
        }
        :global(.react-aria-Calendar .react-aria-CalendarCell[data-selected]) {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        :global(.react-aria-Calendar .react-aria-CalendarCell[data-outside-month]) {
          color: rgba(255, 255, 255, 0.3);
        }
        :global(.react-aria-Calendar .react-aria-CalendarGrid) {
          color: white;
        }
        :global(.react-aria-Calendar .react-aria-CalendarHeader) {
          color: white;
        }
        :global(.react-aria-Calendar .react-aria-CalendarHeader button) {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        :global(.react-aria-Calendar .react-aria-CalendarHeader button:hover) {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <AriaCalendar 
        value={date} 
        onChange={handleDateChange}
        className="w-full"
      />
    </div>
  );
}

export { Calendar };
