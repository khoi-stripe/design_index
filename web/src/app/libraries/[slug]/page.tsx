"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SearchBar, type SearchFilter } from "@/components/SearchBar";
import { PatternGrid } from "@/components/PatternGrid";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { setBreadcrumbOrigin } from "@/components/Breadcrumb";
import { LibraryIcon } from "@/components/MetadataChip";
import type { Library, Pattern } from "@/lib/types";

const CATEGORIES = [
  { value: null, label: "All" },
  { value: "flow", label: "Flows" },
  { value: "screen", label: "Screens" },
  { value: "component", label: "Components" },
  { value: "asset", label: "Assets" },
] as const;

const STATUS_OPTIONS = [
  { value: null, label: "All", color: "#FFFFFF" },
  { value: "concept", label: "Concept", color: "#5B9BF8" },
  { value: "in-use", label: "In-use", color: "#3ECF8E" },
  { value: "official", label: "Official", color: "#675DFF" },
] as const;

const EDIT_STATUS_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "in-use", label: "In-use" },
  { value: "concept", label: "Concept" },
] as const;

const PAGE_SIZE = 24;

export default function LibraryDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [library, setLibrary] = useState<Library | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Menu state
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [, setTypeMenuVisible] = useState(false);
  const [typeMenuClosing, setTypeMenuClosing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [, setStatusMenuVisible] = useState(false);
  const [statusMenuClosing, setStatusMenuClosing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const closeAllMenus = () => {
    if (showTypeMenu) closeTypeMenu();
    if (showStatusMenu) closeStatusMenu();
  };

  const openTypeMenu = () => {
    setShowDatePicker(false);
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

  const openStatusMenu = () => {
    setShowDatePicker(false);
    if (showTypeMenu) closeTypeMenu();
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

  const fetchLibrary = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/libraries/${slug}`);
      if (!res.ok) {
        if (res.status === 404) setError("Library not found");
        else setError("Failed to load library");
        setLibrary(null);
        return;
      }
      const data = await res.json();
      setLibrary(data);
      setBreadcrumbOrigin(`/libraries/${slug}`, data.name);
      setEditName(data.name);
      setEditDescription(data.description || "");
      setEditStatus(data.status || "concept");
    } catch {
      setError("Failed to load library");
      setLibrary(null);
    }
  }, [slug]);

  const buildParams = useCallback(
    (offset = 0) => {
      if (!library?.id) return null;
      const params = new URLSearchParams();
      params.set("libraryId", library.id);
      if (activeCategory) params.set("category", activeCategory);
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
    },
    [library?.id, activeCategory, activeStatus, search, filters, dateRange]
  );

  const fetchPatterns = useCallback(async () => {
    const params = buildParams(0);
    if (!params) return;
    setPatternsLoading(true);
    const res = await fetch(`/api/patterns?${params}`);
    const data = await res.json();
    setPatterns(data.patterns);
    setTotal(data.total);
    setPatternsLoading(false);
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || patterns.length >= total) return;
    const params = buildParams(patterns.length);
    if (!params) return;
    setLoadingMore(true);
    const res = await fetch(`/api/patterns?${params}`);
    const data = await res.json();
    setPatterns((prev) => [...prev, ...data.patterns]);
    setTotal(data.total);
    setLoadingMore(false);
  }, [buildParams, patterns.length, total, loadingMore]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetchLibrary().finally(() => setLoading(false));
  }, [slug, fetchLibrary]);

  useEffect(() => {
    if (!library) return;
    const timeout = setTimeout(fetchPatterns, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [library?.id, fetchPatterns, search]);

  const startEditing = () => {
    if (!library) return;
    setEditName(library.name);
    setEditDescription(library.description || "");
    setEditStatus(library.status || "concept");
    setFormError(null);
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveChanges = async () => {
    if (!library) return;
    if (!editName.trim()) {
      setFormError("Name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/libraries/${library.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setEditing(false);
      fetchLibrary();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const deleteLibrary = async () => {
    if (!library) return;
    if (!window.confirm(`Delete "${library.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/libraries/${library.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  };

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.value === activeCategory)?.label || "All";
  const activeStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === activeStatus)?.label || "All";

  const hasActiveFilters = !!(activeCategory || activeStatus || search || filters.length > 0 || dateRange);

  const clearAllFilters = () => {
    setActiveCategory(null);
    setActiveStatus(null);
    setSearch("");
    setFilters([]);
    setDateRange(undefined);
  };

  const clearButton = hasActiveFilters ? (
    <button
      onClick={clearAllFilters}
      className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted hover:text-foreground transition-colors"
    >
      Clear
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </button>
  ) : null;

  const typeFilterMenu = (
    <div className="relative inline-block">
      <button
        onClick={toggleTypeMenu}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${showTypeMenu ? "text-foreground bg-background border !border-border" : ""}`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span className="font-medium tracking-tight">Type: {activeCategoryLabel}</span>
      </button>
      {showTypeMenu && (
        <div ref={typeMenuRef} className={`absolute top-full left-0 mt-1 bg-background border border-border rounded-lg p-2 z-50 w-48 shadow-lg ${typeMenuClosing ? "menu-spring-exit" : "menu-spring-enter"}`}>
          {CATEGORIES.map((cat) => (
            <button key={cat.label} onClick={() => { setActiveCategory(cat.value); closeTypeMenu(); }} className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors ${activeCategory === cat.value ? "bg-accent text-white font-medium" : "text-foreground hover:bg-surface-hover"}`}>{cat.label}</button>
          ))}
        </div>
      )}
    </div>
  );

  const statusFilterMenu = (
    <div className="relative inline-block">
      <button
        onClick={toggleStatusMenu}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-[4px] text-muted hover:text-foreground hover:bg-background hover:border hover:border-border transition-colors border border-transparent ${showStatusMenu ? "text-foreground bg-background border !border-border" : ""}`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span className="font-medium tracking-tight">Status: {activeStatusLabel}</span>
      </button>
      {showStatusMenu && (
        <div ref={statusMenuRef} className={`absolute top-full left-0 mt-1 bg-background border border-border rounded-lg p-2 z-50 w-48 shadow-lg ${statusMenuClosing ? "menu-spring-exit" : "menu-spring-enter"}`}>
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.label} onClick={() => { setActiveStatus(opt.value); closeStatusMenu(); }} className={`w-full text-left px-3 py-1.5 text-xs rounded-[4px] transition-colors flex items-center gap-2 ${activeStatus === opt.value ? "bg-accent text-white font-medium" : "text-foreground hover:bg-surface-hover"}`}>
              <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const dateRangeControl = (
    <DateRangePicker value={dateRange} onChange={setDateRange} open={showDatePicker} onOpenChange={handleDatePickerOpenChange} />
  );

  const countBadge = (
    <span className="text-xs text-neutral-400 py-1 px-2 bg-neutral-900 rounded-[3px]">
      {patternsLoading ? "..." : patterns.length}
    </span>
  );

  if (loading && !library) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-surface rounded w-48" />
            <div className="h-8 bg-surface rounded w-64" />
            <div className="h-4 bg-surface rounded w-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">{error || "Library not found"}</p>
          <Link href="/libraries" className="text-sm text-accent hover:underline">
            Back to libraries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[1400px] mx-auto px-8 h-[60px] flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            {editing ? (
              <button
                onClick={deleteLibrary}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-[4px] transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete library"}
              </button>
            ) : (
              <>
                <Link
                  href="/"
                  className="flex items-center gap-2 text-muted hover:text-foreground transition-colors shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0 12L12 9.45516V0L0 2.57459V12Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-xs font-semibold tracking-tight">Design.Index</span>
                </Link>
                <span className="text-muted shrink-0">&rarr;</span>
                <span className="text-foreground text-xs font-medium truncate max-w-[200px]">
                  {library.name}
                </span>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={cancelEditing}
                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="bg-content-bg min-h-[calc(100vh-60px)]">
        <div className="max-w-[1400px] mx-auto p-8">
          {/* Library info section */}
          <section className="mb-6">
            {editing ? (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                  >
                    {EDIT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formError && <p className="text-xs text-red-400">{formError}</p>}
              </div>
            ) : (
              <>
                <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground mb-3">
                  <LibraryIcon className="w-4 h-4 text-foreground" />
                  {library.name}
                </h1>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-block px-2.5 py-1 text-xs font-medium bg-accent/15 text-accent rounded-[4px] capitalize">
                    {library.status || "concept"}
                  </span>
                  <span className="text-xs text-muted self-center">
                    {library._count?.patterns ?? 0} pattern{(library._count?.patterns ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                {library.description && (
                  <p className="text-sm text-muted leading-relaxed max-w-2xl">{library.description}</p>
                )}
              </>
            )}
          </section>

          {/* Search and filter bar */}
          <section className="mb-6">
            <div className="flex items-center gap-6">
              <div className="flex-1 min-w-0">
                <SearchBar value={search} onChange={setSearch} filters={filters} onFiltersChange={setFilters} className="w-full" />
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                {typeFilterMenu}
                {statusFilterMenu}
                {dateRangeControl}
                {countBadge}
                {clearButton}
              </div>
            </div>
          </section>

          {/* Patterns grid */}
          <section>
            <PatternGrid
              patterns={patterns}
              loading={patternsLoading}
              hasMore={patterns.length < total}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
