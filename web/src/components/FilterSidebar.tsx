"use client";

import Link from "next/link";

type TagWithCount = {
  id: string;
  name: string;
  slug: string;
  category: string;
  _count: { patterns: number };
};

export function FilterSidebar({
  tags,
  activeTag,
  onTagChange,
}: {
  tags: TagWithCount[];
  activeTag: string | null;
  onTagChange: (slug: string | null) => void;
}) {
  return (
    <aside className="w-52 shrink-0 border-r border-border h-screen overflow-y-auto p-4 space-y-4">
      <Link href="/" className="flex items-center gap-2.5">
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

      <div className="space-y-0.5">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() =>
              onTagChange(activeTag === tag.slug ? null : tag.slug)
            }
            className={`w-full text-left px-3 py-1.5 text-sm rounded-[4px] transition-colors flex items-center justify-between ${
              activeTag === tag.slug
                ? "bg-accent text-white font-medium"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <span>{tag.name}</span>
            <span
              className={`text-xs ${
                activeTag === tag.slug ? "text-white/70" : "text-muted/40"
              }`}
            >
              {tag._count.patterns}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
