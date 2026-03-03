// Sail-styled Date Range Picker for your Pattern Library
// Built with react-day-picker and styled with Sail tokens

import React, { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import clsx from 'clsx';
import 'react-day-picker/dist/style.css';

export type DateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};

export function DateRangePicker({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  disabled,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(value);

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onChange?.(newRange);
  };

  const formatDateRange = () => {
    if (!range?.from) return 'Select date range';
    if (!range.to) return format(range.from, 'MMM dd, yyyy');
    return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sail-sm font-medium text-foreground mb-sail-50">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full px-sail-150 py-sail-100 text-left',
          'bg-background text-foreground text-sail-base',
          'border border-border rounded-sail-md',
          'hover:border-border-hover',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'transition-sail-fast',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-between'
        )}
      >
        <span className={clsx(!range?.from && 'text-foreground-tertiary')}>
          {formatDateRange()}
        </span>
        <svg
          className="w-5 h-5 text-foreground-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-dropdown"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Popover */}
          <div
            className={clsx(
              'absolute z-popover mt-sail-50',
              'bg-background border border-border rounded-sail-md shadow-sail-lg',
              'p-sail-200'
            )}
          >
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              className="sail-date-picker"
            />

            {/* Action buttons */}
            <div className="flex justify-end gap-sail-100 mt-sail-150 pt-sail-150 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setRange(undefined);
                  onChange?.(undefined);
                }}
                className="px-sail-150 py-sail-75 text-sail-sm text-foreground-secondary hover:text-foreground transition-sail-fast"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-sail-150 py-sail-75 bg-primary text-white rounded-sail-md text-sail-sm font-medium hover:bg-primary-hover transition-sail-fast"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================
   Single Date Picker (Bonus)
   ============================================ */

export type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
};

export function DatePicker({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onChange?.(date);
    if (date) setIsOpen(false); // Auto-close on selection
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sail-sm font-medium text-foreground mb-sail-50">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full px-sail-150 py-sail-100 text-left',
          'bg-background text-foreground text-sail-base',
          'border border-border rounded-sail-md',
          'hover:border-border-hover',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'transition-sail-fast',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-between'
        )}
      >
        <span className={clsx(!selectedDate && 'text-foreground-tertiary')}>
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select date'}
        </span>
        <svg
          className="w-5 h-5 text-foreground-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-dropdown"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Popover */}
          <div
            className={clsx(
              'absolute z-popover mt-sail-50',
              'bg-background border border-border rounded-sail-md shadow-sail-lg',
              'p-sail-200'
            )}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              className="sail-date-picker"
            />
          </div>
        </>
      )}
    </div>
  );
}
