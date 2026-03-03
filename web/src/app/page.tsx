"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar, type SearchFilter } from "@/components/SearchBar";
import { PatternGrid } from "@/components/PatternGrid";
import { clearBreadcrumbTrail } from "@/components/Breadcrumb";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import type { Pattern, Library } from "@/lib/types";

const CATEGORIES = [
  { value: null, label: "All" },
  { value: "flow", label: "Flows" },
  { value: "screen", label: "Screens" },
  { value: "component", label: "Components" },
  { value: "asset", label: "Assets" },
] as const;

const STATUS_OPTIONS = [
  { value: null, label: "All" },
  { value: "concept", label: "Concept" },
  { value: "community", label: "Community" },
  { value: "official", label: "Official" },
] as const;

export default function HomePage() {
  const searchParams = useSearchParams();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLibrary, setActiveLibrary] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState<SearchFilter[]>(() => {
    const tagParam = searchParams.get("tag");
    if (!tagParam) return [];
    const label = tagParam.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return [{ type: "tag", label, value: tagParam }];
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 24;
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // undefined = "All time"
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [, setTypeMenuVisible] = useState(false);
  const [typeMenuClosing, setTypeMenuClosing] = useState(false);
  const [showLibraryMenu, setShowLibraryMenu] = useState(false);
  const [, setLibraryMenuVisible] = useState(false);
  const [libraryMenuClosing, setLibraryMenuClosing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [, setStatusMenuVisible] = useState(false);
  const [statusMenuClosing, setStatusMenuClosing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterSticky, setFilterSticky] = useState(true);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const libraryMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const closeAllMenus = () => {
    if (showTypeMenu) closeTypeMenu();
    if (showLibraryMenu) closeLibraryMenu();
    if (showStatusMenu) closeStatusMenu();
  };

  const openTypeMenu = () => {
    setShowDatePicker(false);
    if (showLibraryMenu) closeLibraryMenu();
    if (showStatusMenu) closeStatusMenu();
    setTypeMenuVisible(true);
    setTypeMenuClosing(false);
    setShowTypeMenu(true);
  };

  const closeTypeMenu = () => {
    setTypeMenuClosing(true);
    setTimeout(() => {
      setShowTypeMenu(false);
      setTypeMenuVisible(false);
      setTypeMenuClosing(false);
    }, 150);
  };

  const toggleTypeMenu = () => {
    if (showTypeMenu && !typeMenuClosing) closeTypeMenu();
    else if (!showTypeMenu) openTypeMenu();
  };

  const openLibraryMenu = () => {
    setShowDatePicker(false);
    if (showTypeMenu) closeTypeMenu();
    if (showStatusMenu) closeStatusMenu();
    setLibraryMenuVisible(true);
    setLibraryMenuClosing(false);
    setShowLibraryMenu(true);
  };

  const closeLibraryMenu = () => {
    setLibraryMenuClosing(true);
    setTimeout(() => {
      setShowLibraryMenu(false);
      setLibraryMenuVisible(false);
      setLibraryMenuClosing(false);
    }, 150);
  };

  const toggleLibraryMenu = () => {
    if (showLibraryMenu && !libraryMenuClosing) closeLibraryMenu();
    else if (!showLibraryMenu) openLibraryMenu();
  };

  const openStatusMenu = () => {
    setShowDatePicker(false);
    if (showTypeMenu) closeTypeMenu();
    if (showLibraryMenu) closeLibraryMenu();
    setStatusMenuVisible(true);
    setStatusMenuClosing(false);
    setShowStatusMenu(true);
  };

  const closeStatusMenu = () => {
    setStatusMenuClosing(true);
    setTimeout(() => {
      setShowStatusMenu(false);
      setStatusMenuVisible(false);
      setStatusMenuClosing(false);
    }, 150);
  };

  const toggleStatusMenu = () => {
    if (showStatusMenu && !statusMenuClosing) closeStatusMenu();
    else if (!showStatusMenu) openStatusMenu();
  };

  const handleDatePickerOpenChange = (open: boolean) => {
    if (open) closeAllMenus();
    setShowDatePicker(open);
  };

  useEffect(() => {
    clearBreadcrumbTrail();
  }, []);

  useEffect(() => {
    fetch("/api/libraries")
      .then((r) => r.json())
      .then((data) => setLibraries(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    const tagParam = searchParams.get("tag");
    if (tagParam) {
      const label = tagParam.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      setFilters((prev) => {
        const already = prev.some((f) => f.type === "tag" && f.value === tagParam);
        return already ? prev : [...prev, { type: "tag", label, value: tagParam }];
      });
    }
  }, [searchParams]);

  const buildParams = useCallback((offset = 0) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeLibrary) params.set("libraryId", activeLibrary);
    if (activeStatus) params.set("status", activeStatus);
    if (search) params.set("search", search);
    const tagFilters = filters.filter((f) => f.type === "tag");
    const authorFilter = filters.find((f) => f.type === "author");
    if (tagFilters.length > 0) params.set("tags", tagFilters.map((f) => f.value).join(","));
    if (authorFilter) params.set("author", authorFilter.value);
    if (dateRange?.from) params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    return params;
  }, [activeCategory, activeLibrary, activeStatus, search, filters, dateRange]);

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
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchPatterns();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchPatterns();
    };
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchPatterns]);

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
        setShowTypeMenu(false);
        setTypeMenuVisible(false);
        setTypeMenuClosing(false);
        setShowLibraryMenu(false);
        setLibraryMenuVisible(false);
        setLibraryMenuClosing(false);
        setShowStatusMenu(false);
        setStatusMenuVisible(false);
        setStatusMenuClosing(false);
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
  const activeLibraryLabel = activeLibrary
    ? libraries.find((l) => l.id === activeLibrary)?.name ?? "Library"
    : "All";
  const activeStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === activeStatus)?.label || "All";

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
            <SearchBar value={search} onChange={setSearch} filters={filters} onFiltersChange={setFilters} />
          </div>

          <div className="ml-auto shrink-0 flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-foreground">Khoi Uong</p>
              <p className="text-xs text-muted">khoi@stripe.com</p>
            </div>
            <div
              aria-hidden
              className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-semibold text-muted"
            >
              KU
            </div>
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
            {/* Left: Filters + count */}
            <div className="flex items-center gap-1.5 flex-1">
              {/* Type filter */}
              <div className="relative inline-block order-2">
                <button
                  onClick={toggleTypeMenu}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${showTypeMenu ? "text-foreground bg-background border !border-border" : ""}`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="font-medium tracking-tight">
                    Type: {activeCategoryLabel}
                  </span>
                </button>

                {showTypeMenu && (
                  <div
                    ref={typeMenuRef}
                    className={`absolute top-full left-0 mt-1 bg-background border border-border rounded-lg p-2 z-50 w-48 shadow-lg ${
                      typeMenuClosing ? "menu-spring-exit" : "menu-spring-enter"
                    }`}
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        onClick={() => {
                          setActiveCategory(cat.value);
                          closeTypeMenu();
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

              {/* Library filter */}
              <div className="relative inline-block order-1">
                <button
                  onClick={toggleLibraryMenu}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${showLibraryMenu ? "text-foreground bg-background border !border-border" : ""}`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="font-medium tracking-tight">
                    Library: {activeLibraryLabel}
                  </span>
                </button>

                {showLibraryMenu && (
                  <div
                    ref={libraryMenuRef}
                    className={`absolute top-full left-0 mt-1 bg-background border border-border rounded-lg p-2 z-50 w-56 max-h-64 overflow-y-auto shadow-lg ${
                      libraryMenuClosing ? "menu-spring-exit" : "menu-spring-enter"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveLibrary(null);
                        closeLibraryMenu();
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors ${
                        !activeLibrary ? "bg-accent text-white font-medium" : "text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      All
                    </button>
                    {libraries.map((lib) => (
                      <button
                        key={lib.id}
                        onClick={() => {
                          setActiveLibrary(lib.id);
                          closeLibraryMenu();
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors ${
                          activeLibrary === lib.id ? "bg-accent text-white font-medium" : "text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        {lib.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status filter */}
              <div className="relative inline-block order-3">
                <button
                  onClick={toggleStatusMenu}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${showStatusMenu ? "text-foreground bg-background border !border-border" : ""}`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="font-medium tracking-tight">
                    Status: {activeStatusLabel}
                  </span>
                </button>

                {showStatusMenu && (
                  <div
                    ref={statusMenuRef}
                    className={`absolute top-full left-0 mt-1 bg-background border border-border rounded-lg p-2 z-50 w-48 shadow-lg ${
                      statusMenuClosing ? "menu-spring-exit" : "menu-spring-enter"
                    }`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setActiveStatus(opt.value);
                          closeStatusMenu();
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors ${
                          activeStatus === opt.value
                            ? "bg-accent text-white font-medium"
                            : "text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-xs text-muted py-1 px-2 order-4">
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
