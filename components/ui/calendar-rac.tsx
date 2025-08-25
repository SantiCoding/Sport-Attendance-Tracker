"use client";

import { Calendar as AriaCalendar } from "react-aria-components";
import { getLocalTimeZone, today } from "@internationalized/date";
import { useState } from "react";
import type { DateValue } from "react-aria-components";
import { cn } from "@/lib/utils";

interface CalendarProps {
  value?: DateValue | null;
  onChange?: (date: DateValue | null) => void;
  className?: string;
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const [date, setDate] = useState<DateValue | null>(value || today(getLocalTimeZone()));

  const handleDateChange = (newDate: DateValue | null) => {
    setDate(newDate);
    onChange?.(newDate);
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
