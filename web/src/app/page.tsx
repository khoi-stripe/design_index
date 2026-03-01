"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { PatternGrid } from "@/components/PatternGrid";
import { clearBreadcrumbTrail } from "@/components/Breadcrumb";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

const CATEGORIES = [
  { value: null, label: "All" },
  { value: "flow", label: "Flows" },
  { value: "screen", label: "Screens" },
  { value: "component", label: "Components" },
  { value: "asset", label: "Assets" },
] as const;

type PatternTag = { tag: { id: string; name: string; slug: string } };
type PatternImage = {
  id: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
};
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
  images: PatternImage[];
};

export default function HomePage() {
  const searchParams = useSearchParams();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 24;
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // undefined = "All time"
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterSticky, setFilterSticky] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const openMenu = () => {
    setShowDatePicker(false);
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

  const handleDatePickerOpenChange = (open: boolean) => {
    if (open && showFilterMenu) closeMenu();
    setShowDatePicker(open);
  };

  useEffect(() => {
    clearBreadcrumbTrail();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const buildParams = useCallback((offset = 0) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (search) params.set("search", search);
    if (dateRange?.from) params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    return params;
  }, [activeCategory, search, dateRange]);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/patterns?${buildParams(0)}`);
    const data = await res.json();
    setPatterns(data.patterns);
    setTotal(data.total);
    setLoading(false);
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || patterns.length >= total) return;
    setLoadingMore(true);
    const res = await fetch(`/api/patterns?${buildParams(patterns.length)}`);
    const data = await res.json();
    setPatterns((prev) => [...prev, ...data.patterns]);
    setTotal(data.total);
    setLoadingMore(false);
  }, [buildParams, patterns.length, total, loadingMore]);

  useEffect(() => {
    const timeout = setTimeout(fetchPatterns, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchPatterns, search]);

  useEffect(() => {
    let filterNaturalTop = 0;
    const measure = () => {
      if (filterRef.current) {
        filterNaturalTop = filterRef.current.offsetTop;
      }
    };
    measure();

    const onScroll = () => {
      const y = window.scrollY;
      const isStuck = y + 60 > filterNaturalTop;
      const scrollingUp = y < lastScrollY.current;

      const shouldShow = !isStuck || scrollingUp;
      setFilterSticky(shouldShow);
      if (!shouldShow) {
        setShowFilterMenu(false);
        setMenuVisible(false);
        setMenuClosing(false);
        setShowDatePicker(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.value === activeCategory)?.label || "All";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[1400px] mx-auto px-8 h-[60px] flex items-center relative">
          <a
            href="/"
            className="flex items-center gap-2 shrink-0"
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
        </div>
      </header>

      <main className="bg-content-bg min-h-[calc(100vh-60px)]">
        <div className="max-w-[1400px] mx-auto p-8">
          {/* Filter Bar */}
          <div
            ref={filterRef}
            className={`flex items-center justify-between gap-4 sticky top-[60px] z-40 bg-content-bg -mx-8 px-8 py-2 transition-transform duration-200 ease-out ${
              filterSticky ? "translate-y-0" : "-translate-y-full"
            }`}
          >
            {/* Left: Category filter + count */}
            <div className="flex items-center gap-1.5 flex-1">
              <div className="relative inline-block">
                <button
                  onClick={toggleMenu}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${showFilterMenu ? "text-foreground bg-background border !border-border" : ""}`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 4h12M4 8h8M6 12h4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-medium tracking-tight">
                    Showing: {activeCategoryLabel}
                  </span>
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
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors ${
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

            {/* Right: Date range picker */}
            <div className="flex items-center gap-1.5">
              <DateRangePicker value={dateRange} onChange={setDateRange} open={showDatePicker} onOpenChange={handleDatePickerOpenChange} />
            </div>
          </div>

          <div className="pt-1" />
          <PatternGrid
            patterns={patterns}
            loading={loading}
            hasMore={patterns.length < total}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      </main>
    </div>
  );
}
