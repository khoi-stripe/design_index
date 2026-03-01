"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { PatternGrid } from "@/components/PatternGrid";

const CATEGORIES = [
  { value: null, label: "All" },
  { value: "flow", label: "Flows" },
  { value: "screen", label: "Screens" },
  { value: "component", label: "Components" },
  { value: "asset", label: "Assets" },
] as const;

type PatternTag = { tag: { id: string; name: string; slug: string } };
type Pattern = {
  id: string;
  title: string;
  description: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  figmaDeepLink: string;
  featured: boolean;
  createdAt: string;
  category: string;
  tags: PatternTag[];
};

export default function HomePage() {
  const searchParams = useSearchParams();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    setMenuVisible(true);
    setMenuClosing(false);
    setShowFilterMenu(true);
  };

  const closeMenu = () => {
    setMenuClosing(true);
    setTimeout(() => {
      setShowFilterMenu(false);
      setMenuVisible(false);
      setMenuClosing(false);
    }, 150);
  };

  const toggleMenu = () => {
    if (showFilterMenu && !menuClosing) {
      closeMenu();
    } else if (!showFilterMenu) {
      openMenu();
    }
  };

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (search) params.set("search", search);

    const res = await fetch(`/api/patterns?${params}`);
    const data = await res.json();
    setPatterns(data.patterns);
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchPatterns, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchPatterns, search]);

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.value === activeCategory)?.label || "All";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background h-[60px] flex items-center px-6 relative">
        <a
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            setSearch("");
            setActiveCategory(null);
            window.history.pushState({}, "", "/");
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 12L12 9.45516V0L0 2.57459V12Z"
              fill="white"
            />
          </svg>
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Design.Index
          </span>
        </a>

        <div className="absolute left-1/2 -translate-x-1/2 top-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </header>

      <main className="bg-content-bg min-h-[calc(100vh-60px)] p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="relative inline-block">
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 py-1"
              >
                <span className="text-xs font-semibold text-muted tracking-tight">
                  Showing: {activeCategoryLabel}
                </span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4h12M4 8h8M6 12h4"
                    stroke="#667691"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {showFilterMenu && (
              <div
                ref={menuRef}
                className={`absolute top-full left-0 mt-1 bg-background border border-border rounded-lg p-2 z-50 w-48 shadow-lg ${
                  menuClosing ? "menu-spring-exit" : "menu-spring-enter"
                }`}
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => {
                      setActiveCategory(cat.value);
                      closeMenu();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                      activeCategory === cat.value
                        ? "bg-accent text-white font-medium"
                        : "text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
            </div>
            <span className="text-xs text-muted">
              {loading ? "..." : patterns.length}
            </span>
          </div>

          <PatternGrid patterns={patterns} loading={loading} />
        </div>
      </main>
    </div>
  );
}
