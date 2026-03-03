'use client';

import React, { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { PatternFilterBar, FilterOptions } from './PatternFilterBar';
import { PatternCard, PatternGrid } from './SailComponents';

// Mock data for demonstration
const mockPatterns = [
  {
    id: '1',
    title: 'Onboarding Modal Flow',
    description: 'Multi-step modal for new user onboarding',
    thumbnailUrl: 'https://via.placeholder.com/400x300/635BFF/FFFFFF?text=Onboarding+Modal',
    tags: ['modal', 'onboarding', 'form'],
    sailComponents: ['Modal', 'Button', 'TextField'],
    author: 'Jane Doe',
    createdAt: new Date(2026, 1, 15),
  },
  {
    id: '2',
    title: 'Dashboard Header',
    description: 'Main dashboard navigation and header',
    thumbnailUrl: 'https://via.placeholder.com/400x300/00D924/FFFFFF?text=Dashboard+Header',
    tags: ['dashboard', 'navigation'],
    sailComponents: ['Card', 'Button'],
    author: 'John Smith',
    createdAt: new Date(2026, 2, 1),
  },
  {
    id: '3',
    title: 'Pricing Table',
    description: 'Comparison table for pricing tiers',
    thumbnailUrl: 'https://via.placeholder.com/400x300/FFA000/FFFFFF?text=Pricing+Table',
    tags: ['pricing', 'table'],
    sailComponents: ['Table', 'Card', 'Badge'],
    author: 'Alice Johnson',
    createdAt: new Date(2026, 1, 28),
  },
  {
    id: '4',
    title: 'Empty State Pattern',
    description: 'Friendly empty state with call to action',
    thumbnailUrl: 'https://via.placeholder.com/400x300/DF1B41/FFFFFF?text=Empty+State',
    tags: ['empty-state', 'illustration'],
    sailComponents: ['Button'],
    author: 'Bob Wilson',
    createdAt: new Date(2026, 1, 20),
  },
  {
    id: '5',
    title: 'Settings Form',
    description: 'Account settings form with validation',
    thumbnailUrl: 'https://via.placeholder.com/400x300/0074D4/FFFFFF?text=Settings+Form',
    tags: ['form', 'settings'],
    sailComponents: ['TextField', 'Button', 'Card'],
    author: 'Sarah Lee',
    createdAt: new Date(2026, 2, 5),
  },
  {
    id: '6',
    title: 'Payment Method Card',
    description: 'Card component for displaying payment methods',
    thumbnailUrl: 'https://via.placeholder.com/400x300/635BFF/FFFFFF?text=Payment+Card',
    tags: ['payment', 'card'],
    sailComponents: ['Card', 'Badge'],
    author: 'Mike Chen',
    createdAt: new Date(2026, 1, 10),
  },
];

export default function PatternLibraryPage() {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    tags: [],
    dateRange: undefined,
    sailComponents: [],
    authors: [],
  });

  // Filter patterns based on current filters
  const filteredPatterns = useMemo(() => {
    return mockPatterns.filter((pattern) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          pattern.title.toLowerCase().includes(searchLower) ||
          pattern.description?.toLowerCase().includes(searchLower) ||
          pattern.tags.some((tag) => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => pattern.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Sail components filter
      if (filters.sailComponents.length > 0) {
        const hasMatchingComponent = filters.sailComponents.some((comp) =>
          pattern.sailComponents.includes(comp)
        );
        if (!hasMatchingComponent) return false;
      }

      // Date range filter
      if (filters.dateRange?.from) {
        const patternDate = pattern.createdAt;
        const from = filters.dateRange.from;
        const to = filters.dateRange.to || new Date();

        if (patternDate < from || patternDate > to) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  // Extract unique tags and components from all patterns
  const allTags = Array.from(new Set(mockPatterns.flatMap((p) => p.tags))).sort();
  const allComponents = Array.from(new Set(mockPatterns.flatMap((p) => p.sailComponents))).sort();

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="px-sail-400 py-sail-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sail-4xl font-bold text-foreground">Pattern Library</h1>
              <p className="text-sail-base text-foreground-secondary mt-sail-50">
                Browse and discover UI patterns from Stripe's Sail design system
              </p>
            </div>
            <button className="px-sail-200 py-sail-100 bg-primary text-white rounded-sail-md text-sail-base font-medium hover:bg-primary-hover transition-sail-fast">
              + Add Pattern
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <PatternFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={allTags}
        availableSailComponents={allComponents}
      />

      {/* Results */}
      <main className="px-sail-400 py-sail-400">
        {/* Results header */}
        <div className="flex items-center justify-between mb-sail-300">
          <div className="text-sail-base text-foreground-secondary">
            {filteredPatterns.length} {filteredPatterns.length === 1 ? 'pattern' : 'patterns'}
            {filters.search && (
              <span>
                {' '}
                for "<span className="text-foreground font-medium">{filters.search}</span>"
              </span>
            )}
          </div>

          <select className="px-sail-150 py-sail-75 bg-background-secondary text-foreground text-sail-sm border border-border rounded-sail-md hover:border-border-hover transition-sail-fast">
            <option>Most recent</option>
            <option>Most popular</option>
            <option>Alphabetical</option>
          </select>
        </div>

        {/* Pattern Grid */}
        {filteredPatterns.length > 0 ? (
          <PatternGrid>
            {filteredPatterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                onClick={() => console.log('Open pattern:', pattern.id)}
              />
            ))}
          </PatternGrid>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-sail-800 text-center">
            <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mb-sail-300">
              <svg
                className="w-12 h-12 text-foreground-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-sail-xl font-semibold text-foreground mb-sail-100">
              No patterns found
            </h3>
            <p className="text-sail-base text-foreground-secondary mb-sail-300 max-w-md">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  tags: [],
                  dateRange: undefined,
                  sailComponents: [],
                  authors: [],
                })
              }
              className="px-sail-200 py-sail-100 bg-background-secondary text-foreground rounded-sail-md text-sail-sm font-medium border border-border hover:bg-background-tertiary transition-sail-fast"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
