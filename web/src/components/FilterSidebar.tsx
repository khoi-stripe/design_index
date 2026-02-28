"use client";

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
  const grouped = tags.reduce<Record<string, TagWithCount[]>>((acc, tag) => {
    const cat = tag.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  const categoryOrder = ["pattern", "component", "page", "general"];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) ?? 99) - (categoryOrder.indexOf(b) ?? 99)
  );

  return (
    <aside className="w-56 shrink-0 pr-6 border-r border-border">
      <div className="sticky top-20">
        <button
          onClick={() => onTagChange(null)}
          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-1 ${
            activeTag === null
              ? "bg-accent text-white font-medium"
              : "text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          All patterns
        </button>

        {sortedCategories.map((category) => (
          <div key={category} className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 px-3 mb-1.5">
              {category}
            </h3>
            {grouped[category].map((tag) => (
              <button
                key={tag.id}
                onClick={() =>
                  onTagChange(activeTag === tag.slug ? null : tag.slug)
                }
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between ${
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
        ))}
      </div>
    </aside>
  );
}
