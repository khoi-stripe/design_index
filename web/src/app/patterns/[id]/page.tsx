"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PatternGrid } from "@/components/PatternGrid";

type Tag = { id: string; name: string; slug: string };
type PatternDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  screenshotUrl: string;
  figmaDeepLink: string;
  figmaPageName: string;
  figmaFileKey: string;
  authorName: string;
  authorAvatar: string;
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { tag: Tag }[];
};
type RelatedPattern = {
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
  tags: { tag: Tag }[];
};

const CATEGORIES = [
  { value: "screen", label: "Screen" },
  { value: "pattern", label: "Pattern" },
  { value: "component", label: "Component" },
];

export default function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pattern, setPattern] = useState<PatternDetail | null>(null);
  const [related, setRelated] = useState<RelatedPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const fetchPattern = useCallback(() => {
    fetch(`/api/patterns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPattern(data.pattern);
        setRelated(data.relatedPatterns || []);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchPattern();
  }, [fetchPattern]);

  const startEditing = () => {
    if (!pattern) return;
    setEditTitle(pattern.title);
    setEditDescription(pattern.description);
    setEditCategory(pattern.category);
    setEditTags(pattern.tags.map(({ tag }) => tag.slug));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveChanges = async () => {
    if (!pattern) return;
    setSaving(true);
    try {
      await fetch(`/api/patterns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          tags: editTags,
        }),
      });
      setEditing(false);
      fetchPattern();
    } finally {
      setSaving(false);
    }
  };

  const deletePattern = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/patterns/${id}`, { method: "DELETE" });
      router.refresh();
      router.push("/");
    } finally {
      setDeleting(false);
    }
  };

  const removeTag = (slug: string) => {
    setEditTags((prev) => prev.filter((t) => t !== slug));
  };

  const addTag = () => {
    const slug = newTag
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (slug && !editTags.includes(slug)) {
      setEditTags((prev) => [...prev, slug]);
    }
    setNewTag("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-surface rounded w-48" />
            <div className="aspect-[16/10] bg-surface rounded-xl" />
            <div className="h-4 bg-surface rounded w-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">
            Pattern not found
          </p>
          <Link href="/" className="text-sm text-accent hover:underline">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </Link>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button
                  onClick={startEditing}
                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-md transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-400 bg-surface hover:bg-red-500/10 rounded-md transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 w-[400px] space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Delete this pattern?
            </h3>
            <p className="text-sm text-muted">
              This will permanently remove &ldquo;{pattern.title}&rdquo; and
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deletePattern}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            <div className="rounded-xl border border-border overflow-hidden bg-surface">
              {pattern.screenshotUrl ? (
                <Image
                  src={pattern.screenshotUrl}
                  alt={pattern.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-[16/10] flex items-center justify-center text-muted/30">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            {editing ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-md outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-md outline-none focus:border-accent resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Category
                    </label>
                    <div className="flex gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setEditCategory(cat.value)}
                          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                            editCategory === cat.value
                              ? "bg-accent text-white font-medium"
                              : "bg-surface text-foreground border border-border hover:bg-surface-hover"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {editTags.map((slug) => (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-accent text-white rounded-md"
                        >
                          {slug.replace(/-/g, " ")}
                          <button
                            onClick={() => removeTag(slug)}
                            className="hover:text-white/60"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                            >
                              <path
                                d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                        placeholder="Add tag..."
                        className="flex-1 px-3 py-1.5 text-xs bg-surface text-foreground border border-border rounded-md outline-none focus:border-accent"
                      />
                      {newTag && (
                        <button
                          onClick={addTag}
                          className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-md"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex-1 h-10 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-4 h-10 text-sm font-medium text-foreground bg-surface hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h1 className="text-xl font-semibold text-foreground mb-2">
                    {pattern.title}
                  </h1>
                  {pattern.description && (
                    <p className="text-sm text-muted leading-relaxed">
                      {pattern.description}
                    </p>
                  )}
                </div>

                {pattern.figmaDeepLink && (
                  <a
                    href={pattern.figmaDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-10 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-light transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 38 57"
                      fill="currentColor"
                    >
                      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
                      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
                      <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
                      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
                    </svg>
                    Open in Figma
                  </a>
                )}

                <div className="space-y-4">
                  {pattern.category && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                        Category
                      </h3>
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-accent/15 text-accent rounded-md capitalize">
                        {pattern.category}
                      </span>
                    </div>
                  )}

                  {pattern.tags.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.tags.map(({ tag }) => (
                          <Link
                            key={tag.id}
                            href={`/?search=${encodeURIComponent(tag.name)}`}
                            className="px-2.5 py-1 text-xs bg-accent text-white rounded-md hover:bg-accent-light transition-colors"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {pattern.authorName && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                        Added by
                      </h3>
                      <div className="flex items-center gap-2">
                        {pattern.authorAvatar ? (
                          <Image
                            src={pattern.authorAvatar}
                            alt={pattern.authorName}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-medium">
                            {pattern.authorName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-foreground">
                          {pattern.authorName}
                        </span>
                      </div>
                    </div>
                  )}

                  {pattern.figmaPageName && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                        Figma page
                      </h3>
                      <p className="text-sm text-foreground">
                        {pattern.figmaPageName}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                      Added
                    </h3>
                    <p className="text-sm text-foreground">
                      {new Date(pattern.createdAt).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>

        {!editing && related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Related patterns
            </h2>
            <PatternGrid patterns={related} />
          </div>
        )}
      </div>
    </div>
  );
}
