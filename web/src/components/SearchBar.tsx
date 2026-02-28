"use client";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex-1 max-w-xl relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10.7 11.4a6 6 0 1 1 .7-.7l3.15 3.15a.5.5 0 0 1-.7.7L10.7 11.4Z"
          fill="currentColor"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search patterns..."
        className="w-full h-9 pl-9 pr-4 text-sm bg-surface text-foreground border border-border rounded-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-muted/60"
      />
    </div>
  );
}
