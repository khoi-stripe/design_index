"use client";

import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Header({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-white"
            >
              <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] text-foreground">
            Index
          </span>
        </Link>

        <SearchBar value={search} onChange={onSearchChange} />

      </div>
    </header>
  );
}
