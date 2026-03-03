// Example usage of the Sail-styled Date Range Picker
// Copy this into your components to see it in action

'use client';

import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker, DatePicker } from './DateRangePicker';
import { Card } from './SailComponents';

export default function DatePickerExample() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = useState<Date | undefined>();

  // Example: Filter patterns by date
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    console.log('Selected range:', range);
    // Here you'd filter your patterns by created date
  };

  return (
    <div className="min-h-screen p-sail-400 bg-background">
      <div className="max-w-4xl mx-auto space-y-sail-400">
        <div>
          <h1 className="text-sail-4xl font-bold text-foreground mb-sail-200">
            Date Picker Examples
          </h1>
          <p className="text-sail-base text-foreground-secondary">
            Sail-styled date pickers for filtering patterns
          </p>
        </div>

        {/* Date Range Picker */}
        <Card>
          <h2 className="text-sail-2xl font-semibold mb-sail-300">
            Date Range Picker
          </h2>

          <div className="max-w-md">
            <DateRangePicker
              label="Filter patterns by date"
              value={dateRange}
              onChange={handleDateRangeChange}
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date()}
            />
          </div>

          {dateRange?.from && (
            <div className="mt-sail-200 p-sail-150 bg-background-secondary rounded-sail-md">
              <p className="text-sail-sm text-foreground-secondary">
                Selected range:{' '}
                <span className="font-medium text-foreground">
                  {dateRange.from.toLocaleDateString()}
                  {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
                </span>
              </p>
            </div>
          )}
        </Card>

        {/* Single Date Picker */}
        <Card>
          <h2 className="text-sail-2xl font-semibold mb-sail-300">
            Single Date Picker
          </h2>

          <div className="max-w-md">
            <DatePicker
              label="Pattern created date"
              value={singleDate}
              onChange={setSingleDate}
              maxDate={new Date()}
            />
          </div>

          {singleDate && (
            <div className="mt-sail-200 p-sail-150 bg-background-secondary rounded-sail-md">
              <p className="text-sail-sm text-foreground-secondary">
                Selected date:{' '}
                <span className="font-medium text-foreground">
                  {singleDate.toLocaleDateString()}
                </span>
              </p>
            </div>
          )}
        </Card>

        {/* Use Case Example: Pattern Filtering */}
        <Card>
          <h2 className="text-sail-2xl font-semibold mb-sail-300">
            Pattern Library Use Case
          </h2>

          <p className="text-sail-base text-foreground-secondary mb-sail-200">
            In your pattern library, you could use the date range picker to:
          </p>

          <ul className="space-y-sail-100 text-sail-sm text-foreground-secondary">
            <li className="flex items-start gap-sail-100">
              <span className="text-primary">•</span>
              <span>Filter patterns created within a specific time period</span>
            </li>
            <li className="flex items-start gap-sail-100">
              <span className="text-primary">•</span>
              <span>Show recent patterns (last 7 days, 30 days, etc.)</span>
            </li>
            <li className="flex items-start gap-sail-100">
              <span className="text-primary">•</span>
              <span>Analytics: patterns created over time</span>
            </li>
            <li className="flex items-start gap-sail-100">
              <span className="text-primary">•</span>
              <span>Export patterns from a specific date range</span>
            </li>
          </ul>

          <div className="mt-sail-300 p-sail-200 bg-background-tertiary rounded-sail-md">
            <code className="text-sail-sm font-mono text-foreground">
              {`// Filter patterns by date range
const filteredPatterns = patterns.filter(pattern => {
  const createdAt = new Date(pattern.createdAt);
  return dateRange?.from && dateRange?.to &&
    createdAt >= dateRange.from &&
    createdAt <= dateRange.to;
});`}
            </code>
          </div>
        </Card>

        {/* Presets Example */}
        <Card>
          <h2 className="text-sail-2xl font-semibold mb-sail-300">
            Quick Date Presets
          </h2>

          <div className="flex flex-wrap gap-sail-100">
            <button
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                setDateRange({ from: lastWeek, to: today });
              }}
              className="px-sail-150 py-sail-75 bg-background-secondary text-foreground text-sail-sm rounded-sail-md border border-border hover:bg-background-tertiary transition-sail-fast"
            >
              Last 7 days
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setDate(today.getDate() - 30);
                setDateRange({ from: lastMonth, to: today });
              }}
              className="px-sail-150 py-sail-75 bg-background-secondary text-foreground text-sail-sm rounded-sail-md border border-border hover:bg-background-tertiary transition-sail-fast"
            >
              Last 30 days
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const lastQuarter = new Date(today);
                lastQuarter.setDate(today.getDate() - 90);
                setDateRange({ from: lastQuarter, to: today });
              }}
              className="px-sail-150 py-sail-75 bg-background-secondary text-foreground text-sail-sm rounded-sail-md border border-border hover:bg-background-tertiary transition-sail-fast"
            >
              Last 90 days
            </button>

            <button
              onClick={() => setDateRange(undefined)}
              className="px-sail-150 py-sail-75 text-foreground-secondary text-sail-sm hover:text-foreground transition-sail-fast"
            >
              Clear
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
