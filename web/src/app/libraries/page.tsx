"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Library } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "official", label: "Official" },
  { value: "in-use", label: "In-use" },
  { value: "concept", label: "Concept" },
] as const;

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length <= len ? str : str.slice(0, len) + "…";
}

export default function LibrariesPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Library | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTeam, setFormTeam] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<string>("concept");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLibraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/libraries");
      if (!res.ok) throw new Error("Failed to fetch libraries");
      const data = await res.json();
      setLibraries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  const openCreate = () => {
    setEditingLibrary(null);
    setFormName("");
    setFormTeam("");
    setFormDescription("");
    setFormStatus("concept");
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (lib: Library) => {
    setEditingLibrary(lib);
    setFormName(lib.name);
    setFormTeam(lib.team || "");
    setFormDescription(lib.description || "");
    setFormStatus(lib.status || "concept");
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLibrary(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingLibrary) {
        const res = await fetch(`/api/libraries/${editingLibrary.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            team: formTeam.trim(),
            description: formDescription.trim(),
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update");
      } else {
        const res = await fetch("/api/libraries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            team: formTeam.trim(),
            description: formDescription.trim(),
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create");
      }
      closeModal();
      fetchLibraries();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/libraries/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteTarget(null);
      fetchLibraries();
    } catch {
      setFormError("Failed to delete library");
    } finally {
      setDeleting(false);
    }
  };

  const groupedByTeam = libraries.reduce<Record<string, Library[]>>((acc, lib) => {
    const team = lib.team || "Other";
    if (!acc[team]) acc[team] = [];
    acc[team].push(lib);
    return acc;
  }, {});

  const sortedTeams = Object.keys(groupedByTeam).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[1400px] mx-auto px-8 h-[60px] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 text-foreground hover:text-foreground-bright transition-colors"
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
          <button
            onClick={openCreate}
            className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors"
          >
            New library
          </button>
        </div>
      </header>

      <main className="bg-content-bg min-h-[calc(100vh-60px)]">
        <div className="max-w-[1400px] mx-auto p-8">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-surface rounded w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-[4px] border border-border bg-card-bg p-4 space-y-3">
                    <div className="h-5 bg-surface rounded w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-surface rounded w-16" />
                      <div className="h-5 bg-surface rounded w-20" />
                    </div>
                    <div className="h-4 bg-surface rounded w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground-bright mb-1">Failed to load libraries</p>
              <p className="text-sm text-muted mb-4">{error}</p>
              <button
                onClick={fetchLibraries}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors"
              >
                Retry
              </button>
            </div>
          ) : libraries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/30">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground-bright mb-1">No libraries yet</p>
              <p className="text-sm text-muted mb-4">Create your first library to get started</p>
              <button
                onClick={openCreate}
                className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors"
              >
                New library
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {sortedTeams.map((team) => (
                <section key={team}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">{team}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedByTeam[team].map((lib) => (
                      <div
                        key={lib.id}
                        className="group rounded-[4px] border border-border bg-card-bg p-4 hover:border-border/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link
                            href={`/libraries/${lib.slug}`}
                            className="font-medium text-sm text-foreground hover:text-foreground-bright transition-colors truncate flex-1 min-w-0"
                          >
                            {lib.name}
                          </Link>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(lib)}
                              className="px-2 py-1 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(lib)}
                              className="px-2 py-1 text-xs font-medium text-red-400 bg-surface hover:bg-red-500/10 rounded-[4px] transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium bg-surface text-muted rounded-[4px]">
                            {lib.team || "—"}
                          </span>
                          <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium bg-accent/15 text-accent rounded-[4px] capitalize">
                            {lib.status || "concept"}
                          </span>
                          <span className="text-xs text-muted">
                            {lib._count?.patterns ?? 0} pattern{(lib._count?.patterns ?? 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {lib.description && (
                          <p className="text-xs text-muted line-clamp-2">{truncate(lib.description, 120)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {editingLibrary ? "Edit library" : "New library"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Library name"
                  className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                  Team
                </label>
                <input
                  type="text"
                  value={formTeam}
                  onChange={(e) => setFormTeam(e.target.value)}
                  placeholder="e.g. Design Systems"
                  className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent resize-y"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {formError && (
                <p className="text-xs text-red-400">{formError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 w-[400px] space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Delete this library?</h3>
            <p className="text-sm text-muted">
              This will permanently remove &ldquo;{deleteTarget.name}&rdquo; and cannot be undone.
              Patterns in this library will not be deleted but will no longer be associated with it.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-[4px] transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
