"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Suggestion = {
  type: string;
  label: string;
  value: string;
  avatar?: string;
};

export type SearchFilter = {
  type: "tag" | "author";
  label: string;
  value: string;
};

const TYPE_LABELS: Record<string, string> = {
  tag: "Tag",
  pattern: "Pattern",
  author: "Contributor",
};

export function SearchBar({
  value,
  onChange,
  filters = [],
  onFiltersChange,
}: {
  value: string;
  onChange: (value: string) => void;
  filters?: SearchFilter[];
  onFiltersChange?: (filters: SearchFilter[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchSuggestions(value), 200);
    return () => clearTimeout(timeout);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeFilter = (index: number) => {
    onFiltersChange?.(filters.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  const addFilter = (s: Suggestion) => {
    if (s.type === "tag" || s.type === "author") {
      const already = filters.some((f) => f.type === s.type && f.value === s.value);
      if (!already) {
        onFiltersChange?.([...filters, { type: s.type as "tag" | "author", label: s.label, value: s.value }]);
      }
      onChange("");
    } else {
      onChange(s.value);
    }
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && value === "" && filters.length > 0) {
      removeFilter(filters.length - 1);
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      addFilter(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="w-[600px] max-w-full relative" ref={containerRef}>
      <div
        className="flex items-center gap-1.5 min-h-[36px] bg-surface rounded-lg transition-all border border-transparent focus-within:bg-black focus-within:border-border cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <svg
          className="ml-3 shrink-0 text-muted pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.88334 9.08539C7.06854 9.6615 6.0738 10 5 10C2.23858 10 0 7.76142 0 5C0 2.23858 2.23858 0 5 0C7.76142 0 10 2.23858 10 5C10 6.07379 9.66151 7.06852 9.08542 7.88331L11.7511 10.549C11.9187 10.7166 12.0017 10.9368 12 11.1564C11.9984 11.3718 11.9154 11.5867 11.7511 11.751C11.5847 11.9174 11.3665 12.0004 11.1485 12C10.9315 11.9996 10.7146 11.9166 10.549 11.751L7.88334 9.08539ZM8.3 5C8.3 6.82254 6.82254 8.3 5 8.3C3.17746 8.3 1.7 6.82254 1.7 5C1.7 3.17746 3.17746 1.7 5 1.7C6.82254 1.7 8.3 3.17746 8.3 5Z"
            fill="currentColor"
          />
        </svg>

        {filters.map((f, i) => (
          <button
            key={`${f.type}-${f.value}`}
            onClick={(e) => {
              e.stopPropagation();
              removeFilter(i);
            }}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] font-medium bg-accent text-white rounded-[4px] shrink-0 whitespace-nowrap hover:bg-accent-light transition-colors cursor-pointer"
          >
            {f.label}
            <svg width="10" height="10" viewBox="0 0 10 10" className="ml-0.5">
              <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={filters.length > 0 ? "Add more..." : "Search patterns, tags, contributors..."}
          className="flex-1 min-w-[120px] h-9 pr-9 text-sm bg-transparent text-foreground outline-none placeholder:text-muted/60"
        />

        {(value || filters.length > 0) && (
          <button
            onClick={() => {
              onChange("");
              onFiltersChange?.([]);
              setOpen(false);
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.25628 1.25628C1.59799 0.914573 2.15201 0.914573 2.49372 1.25628L8 6.76256L13.5063 1.25628C13.848 0.914573 14.402 0.914573 14.7437 1.25628C15.0854 1.59799 15.0854 2.15201 14.7437 2.49372L9.23744 8L14.7437 13.5063C15.0854 13.848 15.0854 14.402 14.7437 14.7437C14.402 15.0854 13.848 15.0854 13.5063 14.7437L8 9.23744L2.49372 14.7437C2.15201 15.0854 1.59799 15.0854 1.25628 14.7437C0.914573 14.402 0.914573 13.848 1.25628 13.5063L6.76256 8L1.25628 2.49372C0.914573 2.15201 0.914573 1.59799 1.25628 1.25628Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-2">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.value}`}
              onMouseDown={() => addFilter(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm rounded-[4px] transition-colors ${
                i === activeIndex
                  ? "bg-surface-hover text-foreground"
                  : "text-foreground"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                {s.avatar ? (
                  <img src={s.avatar} alt="" className="w-5 h-5 rounded-full shrink-0" />
                ) : s.type === "author" ? (
                  <span className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-medium shrink-0">
                    {s.label.charAt(0)}
                  </span>
                ) : null}
                <span className="truncate">{s.label}</span>
              </span>
              <span className="text-[10px] font-medium text-muted ml-3 shrink-0">
                {TYPE_LABELS[s.type] || s.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
