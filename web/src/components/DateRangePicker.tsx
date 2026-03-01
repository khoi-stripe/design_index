"use client";

import { useState, useRef, useEffect } from "react";
import { DateRange } from "react-day-picker";

type PresetOption = {
  label: string;
  value: string;
  days?: number;
};

const PRESET_OPTIONS: PresetOption[] = [
  { label: "All time", value: "all-time" },
  { label: "Last 7 days", value: "last-7-days", days: 7 },
  { label: "Last 4 weeks", value: "last-4-weeks", days: 28 },
  { label: "Last 3 months", value: "last-3-months", days: 90 },
  { label: "Last 12 months", value: "last-12-months", days: 365 },
];

export function DateRangePicker({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [selectedPreset, setSelectedPreset] = useState<string>("all-time");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value?.from) {
      setSelectedPreset("all-time");
      return;
    }
    const diffDays = Math.round((Date.now() - value.from.getTime()) / (1000 * 60 * 60 * 24));
    const match = PRESET_OPTIONS.find((p) => p.days && Math.abs(p.days - diffDays) <= 1);
    setSelectedPreset(match?.value || "custom");
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handlePresetSelect = (preset: PresetOption) => {
    setSelectedPreset(preset.value);

    if (preset.value === "all-time") {
      onChange(undefined);
    } else if (preset.days) {
      const today = new Date();
      const past = new Date(today);
      past.setDate(today.getDate() - preset.days + 1);
      onChange({ from: past, to: today });
    }

    setIsOpen(false);
  };

  const currentLabel = PRESET_OPTIONS.find(p => p.value === selectedPreset)?.label || "All time";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${isOpen ? "text-foreground bg-background border !border-border" : ""}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="font-medium">{currentLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border rounded-lg shadow-lg p-2 min-w-[160px] menu-spring-enter-right">
          {PRESET_OPTIONS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetSelect(preset)}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors ${
                selectedPreset === preset.value
                  ? "bg-accent text-white font-medium"
                  : "text-foreground hover:bg-surface-hover"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
