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
    <div className={cn("glass-card rounded-lg border border-white/10 p-4 text-white min-h-[300px] bg-white/8 backdrop-blur-md", className)}>
      <style jsx>{`
        .calendar-container :global(button) {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
          padding: 8px !important;
          min-width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
          backdrop-filter: blur(15px) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        }
        .calendar-container :global(button:hover) {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .calendar-container :global(button:focus) {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
        }
        .calendar-container :global(button[data-selected]) {
          background: rgba(255, 255, 255, 0.3) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2) !important;
        }
        .calendar-container :global(button[data-today]) {
          border-color: rgba(255, 255, 255, 0.6) !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
        }
        .calendar-container :global(button[data-disabled]) {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .calendar-container :global(button[data-disabled]:hover) {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        }
        .calendar-container :global(table) {
          width: 100% !important;
          border-collapse: separate !important;
          border-spacing: 4px !important;
        }
        .calendar-container :global(th) {
          color: rgba(255, 255, 255, 0.8) !important;
          font-weight: 600 !important;
          padding: 8px !important;
          text-align: center !important;
        }
        .calendar-container :global(td) {
          padding: 2px !important;
        }
        .calendar-container :global(thead) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          margin-bottom: 8px !important;
        }
      `}</style>
      <div className="calendar-container">
        <AriaCalendar 
          value={date} 
          onChange={handleDateChange}
          className="w-full"
        />
      </div>
    </div>
  );
}

export { Calendar };
