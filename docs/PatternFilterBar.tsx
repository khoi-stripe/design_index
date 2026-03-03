'use client';

import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from './DateRangePicker';
import { Badge, Input } from './SailComponents';
import clsx from 'clsx';

export type FilterOptions = {
  search: string;
  tags: string[];
  dateRange?: DateRange;
  sailComponents: string[];
  authors: string[];
};

export type PatternFilterBarProps = {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTags?: string[];
  availableSailComponents?: string[];
};

export function PatternFilterBar({
  filters,
  onFiltersChange,
  availableTags = ['modal', 'form', 'onboarding', 'dashboard', 'pricing'],
  availableSailComponents = ['Button', 'Card', 'Modal', 'TextField', 'Table'],
}: PatternFilterBarProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllComponents, setShowAllComponents] = useState(false);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const toggleComponent = (component: string) => {
    const newComponents = filters.sailComponents.includes(component)
      ? filters.sailComponents.filter((c) => c !== component)
      : [...filters.sailComponents, component];
    updateFilters({ sailComponents: newComponents });
  };

  // Date range presets
  const getDatePreset = (days: number): DateRange => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(today.getDate() - days);
    return { from: past, to: today };
  };

  const datePresets = [
    { label: 'Last 7 days', value: getDatePreset(7) },
    { label: 'Last 30 days', value: getDatePreset(30) },
    { label: 'Last 90 days', value: getDatePreset(90) },
    { label: 'This year', value: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() } },
  ];

  const isPresetActive = (preset: DateRange) => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) return false;
    return (
      filters.dateRange.from.toDateString() === preset.from?.toDateString() &&
      filters.dateRange.to.toDateString() === preset.to?.toDateString()
    );
  };

  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, 5);
  const visibleComponents = showAllComponents ? availableSailComponents : availableSailComponents.slice(0, 5);

  return (
    <div className="dark bg-background border-b border-border">
      {/* Main filter bar */}
      <div className="px-sail-400 py-sail-300">
        <div className="flex items-center justify-between gap-sail-300">
          {/* Left side: Search + quick filters */}
          <div className="flex-1 flex items-center gap-sail-200">
            {/* Search */}
            <div className="w-80">
              <Input
                placeholder="Search patterns..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="bg-background-secondary border-border"
              />
            </div>

            {/* Active filter count */}
            {(filters.tags.length > 0 || filters.sailComponents.length > 0 || filters.dateRange) && (
              <div className="flex items-center gap-sail-100">
                <span className="text-sail-sm text-foreground-secondary">
                  {filters.tags.length + filters.sailComponents.length + (filters.dateRange ? 1 : 0)} filters
                </span>
                <button
                  onClick={() => updateFilters({ tags: [], sailComponents: [], dateRange: undefined })}
                  className="text-sail-sm text-primary hover:text-primary-hover transition-sail-fast"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Right side: Date range picker with presets */}
          <div className="flex items-center gap-sail-150">
            {/* Date presets */}
            <div className="flex gap-sail-50">
              {datePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => updateFilters({ dateRange: preset.value })}
                  className={clsx(
                    'px-sail-150 py-sail-75 rounded-sail-md text-sail-sm font-medium transition-sail-fast',
                    isPresetActive(preset.value)
                      ? 'bg-primary text-white'
                      : 'bg-background-secondary text-foreground hover:bg-background-tertiary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date range picker */}
            <div className="w-72">
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) => updateFilters({ dateRange: range })}
                maxDate={new Date()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary filter bar: Tags and components */}
      <div className="px-sail-400 py-sail-200 bg-background-secondary border-t border-border">
        <div className="space-y-sail-200">
          {/* Tags filter */}
          <div className="flex items-start gap-sail-150">
            <span className="text-sail-sm font-medium text-foreground-secondary mt-sail-50 min-w-[80px]">
              Tags:
            </span>
            <div className="flex-1 flex flex-wrap gap-sail-100">
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={clsx(
                    'transition-sail-fast',
                    filters.tags.includes(tag) && 'ring-2 ring-primary ring-offset-2 ring-offset-background-secondary'
                  )}
                >
                  <Badge
                    variant={filters.tags.includes(tag) ? 'primary' : 'default'}
                    className="cursor-pointer hover:opacity-80"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
              {availableTags.length > 5 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-sail-sm text-primary hover:text-primary-hover transition-sail-fast"
                >
                  {showAllTags ? 'Show less' : `+${availableTags.length - 5} more`}
                </button>
              )}
            </div>
          </div>

          {/* Sail components filter */}
          <div className="flex items-start gap-sail-150">
            <span className="text-sail-sm font-medium text-foreground-secondary mt-sail-50 min-w-[80px]">
              Components:
            </span>
            <div className="flex-1 flex flex-wrap gap-sail-100">
              {visibleComponents.map((component) => (
                <button
                  key={component}
                  onClick={() => toggleComponent(component)}
                  className={clsx(
                    'px-sail-150 py-sail-50 rounded-sail-md text-sail-sm font-mono transition-sail-fast',
                    filters.sailComponents.includes(component)
                      ? 'bg-primary text-white'
                      : 'bg-background-tertiary text-foreground hover:bg-border'
                  )}
                >
                  {component}
                </button>
              ))}
              {availableSailComponents.length > 5 && (
                <button
                  onClick={() => setShowAllComponents(!showAllComponents)}
                  className="text-sail-sm text-primary hover:text-primary-hover transition-sail-fast"
                >
                  {showAllComponents ? 'Show less' : `+${availableSailComponents.length - 5} more`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
