"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PatternGrid } from "@/components/PatternGrid";
import type { Library, Pattern } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "community", label: "Community" },
  { value: "concept", label: "Concept" },
] as const;

const PAGE_SIZE = 24;

export default function LibraryDetailPage() {
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
  const [editTeam, setEditTeam] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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
      setEditName(data.name);
      setEditTeam(data.team || "");
      setEditDescription(data.description || "");
      setEditStatus(data.status || "community");
    } catch {
      setError("Failed to load library");
      setLibrary(null);
    }
  }, [slug]);

  const fetchPatterns = useCallback(async (offset = 0) => {
    if (!library?.id) return;
    const params = new URLSearchParams({
      libraryId: library.id,
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    const res = await fetch(`/api/patterns?${params}`);
    const data = await res.json();
    return { patterns: data.patterns, total: data.total };
  }, [library?.id]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetchLibrary().finally(() => setLoading(false));
  }, [slug, fetchLibrary]);

  useEffect(() => {
    if (!library) return;
    setPatterns([]);
    setTotal(0);
    setPatternsLoading(true);
    fetchPatterns(0).then((result) => {
      if (result) {
        setPatterns(result.patterns);
        setTotal(result.total);
      }
    }).finally(() => setPatternsLoading(false));
  }, [library?.id, fetchPatterns]);

  const loadMore = useCallback(async () => {
    if (!library || loadingMore || patterns.length >= total) return;
    setLoadingMore(true);
    try {
      const result = await fetchPatterns(patterns.length);
      if (result) {
        setPatterns((prev) => [...prev, ...result.patterns]);
        setTotal(result.total);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [library, loadingMore, patterns.length, total, fetchPatterns]);

  const startEditing = () => {
    if (!library) return;
    setEditName(library.name);
    setEditTeam(library.team || "");
    setEditDescription(library.description || "");
    setEditStatus(library.status || "community");
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
          team: editTeam.trim(),
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
            <span className="text-muted shrink-0">→</span>
            <Link
              href="/libraries"
              className="text-muted hover:text-foreground transition-colors text-xs"
            >
              Libraries
            </Link>
            <span className="text-muted shrink-0">→</span>
            <span className="text-foreground text-xs font-medium truncate max-w-[200px]">
              {library.name}
            </span>
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
          <section className="mb-10">
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
                    Team
                  </label>
                  <input
                    type="text"
                    value={editTeam}
                    onChange={(e) => setEditTeam(e.target.value)}
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
                    {STATUS_OPTIONS.map((opt) => (
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
                <h1 className="text-2xl font-semibold text-foreground mb-3">{library.name}</h1>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-block px-2.5 py-1 text-xs font-medium bg-surface text-muted rounded-[4px]">
                    {library.team || "—"}
                  </span>
                  <span className="inline-block px-2.5 py-1 text-xs font-medium bg-accent/15 text-accent rounded-[4px] capitalize">
                    {library.status || "community"}
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

          {/* Patterns grid */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-4">Patterns</h2>
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
