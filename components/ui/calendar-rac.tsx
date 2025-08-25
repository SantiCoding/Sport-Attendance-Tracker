"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  className?: string;
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || new Date());

  useEffect(() => {
    setSelectedDate(value || new Date());
  }, [value]);

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // Simple date picker implementation
  const today = new Date();
  const currentMonth = selectedDate ? selectedDate.getMonth() : today.getMonth();
  const currentYear = selectedDate ? selectedDate.getFullYear() : today.getFullYear();

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    handleDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    handleDateChange(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    handleDateChange(newDate);
  };

  const isToday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className={cn("glass-card rounded-lg border border-white/10 p-2 text-white", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="glass-button p-2 rounded-md hover:bg-white/20"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={goToNextMonth}
          className="glass-button p-2 rounded-md hover:bg-white/20"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-sm text-white/70 p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              className={cn(
                "p-2 rounded-md text-sm transition-colors",
                isToday(day) && "bg-white/20 font-semibold",
                isSelected(day) && "bg-blue-500/50 text-white font-semibold",
                !isToday(day) && !isSelected(day) && "hover:bg-white/10"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
