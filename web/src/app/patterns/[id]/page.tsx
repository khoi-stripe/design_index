"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PatternGrid } from "@/components/PatternGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MetadataChip, LibraryIcon } from "@/components/MetadataChip";
import { StatusBadge } from "@/components/StatusBadge";
import { UpvoteButton } from "@/components/UpvoteButton";
import { slugify } from "@/lib/utils";
import { Tag } from "@/components/Tag";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Tag = { id: string; name: string; slug: string };
type PatternVersion = {
  id: string;
  versionNumber: number;
  label: string;
  description: string;
  figmaUrl: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  tags: { tag: Tag }[];
};
type PatternImage = {
  id: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  label: string;
  nodeName: string;
  sortOrder: number;
};
type Library = { id: string; name: string; slug: string; team: string; description: string; status: string };
type PatternDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  screenshotUrl: string;
  dominantColor: string;
  figmaDeepLink: string;
  figmaPageName: string;
  figmaFileKey: string;
  authorName: string;
  authorAvatar: string;
  status: string;
  effectiveStatus: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { tag: Tag }[];
  versions: PatternVersion[];
  images: PatternImage[];
  library: Library | null;
  _count?: { upvotes: number };
  upvotedByVisitor?: boolean;
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
  category: string;
  status: string;
  effectiveStatus: string;
  libraryId: string | null;
  library?: Library | null;
  createdAt: string;
  tags: { tag: Tag }[];
  images?: PatternImage[];
  _count?: { upvotes: number };
};

type OrderableImage = {
  id: string;
  url: string;
  label: string;
  dominantColor: string;
};

function SortableThumbnail({
  image,
  isActive,
  onClick,
}: {
  image: OrderableImage;
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden transition-all cursor-grab active:cursor-grabbing ${
        isActive
          ? "border-accent ring-1 ring-accent"
          : "border-border opacity-60 hover:opacity-100"
      }`}
    >
      <Image src={image.url} alt={image.label} width={64} height={64} className="w-full h-full object-cover" />
    </button>
  );
}

const CATEGORIES = [
  { value: "flow", label: "Flow" },
  { value: "screen", label: "Screen" },
  { value: "component", label: "Component" },
  { value: "asset", label: "Asset" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isLightColor(color: string) {
  if (!color) return false;
  const normalized = color.trim().toLowerCase();
  let r = 0;
  let g = 0;
  let b = 0;

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return false;
    }
  } else if (normalized.startsWith("rgb")) {
    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return false;
    r = Number(match[1]);
    g = Number(match[2]);
    b = Number(match[3]);
  } else {
    return false;
  }

  // Relative luminance approximation for contrast decisions.
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62;
}

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
  const [editLibraryId, setEditLibraryId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [newTag, setNewTag] = useState("");
  const [libraries, setLibraries] = useState<Library[]>([]);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [versionUrl, setVersionUrl] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [versionDescription, setVersionDescription] = useState("");
  const [versionTags, setVersionTags] = useState<string[]>([]);
  const [newVersionTag, setNewVersionTag] = useState("");
  const [addingVersion, setAddingVersion] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editImageOrder, setEditImageOrder] = useState<OrderableImage[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getVisitorId = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("index_visitor_id") || "";
  };

  const fetchPattern = useCallback(() => {
    const visitorId = getVisitorId();
    const url = visitorId ? `/api/patterns/${id}?visitorId=${encodeURIComponent(visitorId)}` : `/api/patterns/${id}`;
    fetch(url)
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

  useEffect(() => {
    fetch("/api/libraries")
      .then((r) => r.json())
      .then((data) => setLibraries(Array.isArray(data) ? data : []));
  }, []);

  const activeVersion = useMemo(() => {
    if (!pattern?.versions?.length) return null;
    if (selectedVersionId) {
      return pattern.versions.find((v) => v.id === selectedVersionId) || pattern.versions[0];
    }
    return pattern.versions[0];
  }, [pattern, selectedVersionId]);

  const displayScreenshot = activeVersion?.screenshotUrl || pattern?.screenshotUrl || "";
  const displayDescription = activeVersion?.description || pattern?.description || "";
  const displayFigmaUrl = activeVersion?.figmaUrl || pattern?.figmaDeepLink || "";
  const displayTags = activeVersion?.tags?.length ? activeVersion.tags : pattern?.tags || [];

  const allImagesWithIds = useMemo(() => {
    const imgs: OrderableImage[] = [];
    if (displayScreenshot) {
      imgs.push({
        id: "primary",
        url: displayScreenshot,
        label: "Primary",
        dominantColor: activeVersion?.dominantColor || pattern?.dominantColor || "",
      });
    }
    if (pattern?.images?.length) {
      for (const img of pattern.images) {
        imgs.push({
          id: img.id,
          url: img.screenshotUrl,
          label: img.label || img.nodeName || `Image ${img.sortOrder + 1}`,
          dominantColor: img.dominantColor || "",
        });
      }
    }
    return imgs;
  }, [displayScreenshot, pattern, activeVersion]);

  const allImages = editing && editImageOrder.length > 0 ? editImageOrder : allImagesWithIds;
  const useDarkArrows = useMemo(() => isLightColor(allImages[activeImageIndex]?.dominantColor || ""), [allImages, activeImageIndex]);
  const mainArrowClass = useDarkArrows
    ? "bg-white/70 text-black hover:bg-white/85 hover:border-black/20"
    : "bg-black/40 text-white hover:bg-black/60 hover:border-white/40";

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveImageIndex((i) => (i + 1) % allImages.length);
      if (e.key === "ArrowLeft") setActiveImageIndex((i) => (i - 1 + allImages.length) % allImages.length);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, allImages.length]);

  const startEditing = () => {
    if (!pattern) return;
    setEditTitle(pattern.title);
    setEditDescription(pattern.description);
    setEditCategory(pattern.category);
    setEditTags(pattern.tags.map(({ tag }) => tag.slug));
    setEditLibraryId(pattern.library?.id ?? null);
    setEditStatus(pattern.status ?? "");
    setEditImageOrder([...allImagesWithIds]);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditImageOrder([]);
    setEditing(false);
  };

  const saveChanges = async () => {
    if (!pattern) return;
    setSaving(true);
    try {
      const orderChanged =
        editImageOrder.length > 0 &&
        editImageOrder.some((img, i) => img.id !== allImagesWithIds[i]?.id);
      if (orderChanged) {
        await fetch(`/api/patterns/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageOrder: editImageOrder.map((img) => img.id) }),
        });
      }
      await fetch(`/api/patterns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          tags: editTags,
          libraryId: editLibraryId,
          status: editStatus,
        }),
      });
      setEditImageOrder([]);
      setEditing(false);
      fetchPattern();
    } finally {
      setSaving(false);
    }
  };

  const deletePattern = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/patterns/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleting(false);
        return;
      }
      window.location.replace("/");
    } catch {
      setDeleting(false);
    }
  };

  const addVersion = async () => {
    if (!versionUrl.trim()) return;
    setAddingVersion(true);
    try {
      await fetch(`/api/patterns/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl: versionUrl.trim(),
          label: versionLabel.trim(),
          description: versionDescription.trim(),
          tags: versionTags.length ? versionTags : undefined,
        }),
      });
      setVersionUrl("");
      setVersionLabel("");
      setVersionDescription("");
      setVersionTags([]);
      setShowAddVersion(false);
      setSelectedVersionId(null);
      fetchPattern();
    } finally {
      setAddingVersion(false);
    }
  };

  const removeVersion = async (versionId: string) => {
    await fetch(`/api/patterns/${id}/versions?versionId=${versionId}`, { method: "DELETE" });
    if (selectedVersionId === versionId) setSelectedVersionId(null);
    fetchPattern();
  };

  const removeTag = (slug: string) => setEditTags((prev) => prev.filter((t) => t !== slug));

  const addTag = () => {
    const slug = slugify(newTag);
    if (slug && !editTags.includes(slug)) setEditTags((prev) => [...prev, slug]);
    setNewTag("");
  };

  const addVersionTag = () => {
    const slug = slugify(newVersionTag);
    if (slug && !versionTags.includes(slug)) setVersionTags((prev) => [...prev, slug]);
    setNewVersionTag("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditImageOrder((items) => {
      const oldIndex = items.findIndex((img) => img.id === active.id);
      const newIndex = items.findIndex((img) => img.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
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
          <p className="text-lg font-medium text-foreground mb-2">Pattern not found</p>
          <Link href="/" className="text-sm text-accent hover:underline">Home</Link>
        </div>
      </div>
    );
  }

  const hasVersions = pattern.versions?.length > 0;
  const isLatest = !selectedVersionId || activeVersion?.id === pattern.versions[0]?.id;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-8 h-[60px] flex items-center justify-between">
          {editing ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-surface hover:bg-red-500/10 rounded-[4px] transition-colors"
            >
              Delete
            </button>
          ) : (
            <Breadcrumb currentId={pattern.id} currentTitle={pattern.title} />
          )}
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
              <>
                <button
                  onClick={startEditing}
                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 w-[400px] space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Delete this pattern?</h3>
            <p className="text-sm text-muted">
              This will permanently remove &ldquo;{pattern.title}&rdquo; and cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-surface hover:bg-surface-hover rounded-[4px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deletePattern}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-[4px] transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div className="space-y-3 min-w-0">
            <div
              className="relative rounded-xl border border-border overflow-hidden group w-full h-[70vh] max-h-[800px] transition-colors duration-300"
              style={{ backgroundColor: allImages[activeImageIndex]?.dominantColor || "var(--surface)" }}
            >
              {pattern.category && (
                <div className="absolute top-3 left-3 z-10">
                  <span className={`px-2 py-[2px] text-[11px] font-medium rounded-[3px] whitespace-nowrap capitalize ${useDarkArrows ? "bg-black/60 text-white" : "bg-white/70 text-black"}`}>
                    {pattern.category}
                  </span>
                </div>
              )}
              {allImages.length > 0 ? (
                <Image
                  src={allImages[activeImageIndex]?.url || displayScreenshot}
                  alt={allImages[activeImageIndex]?.label || pattern.title}
                  fill
                  className="object-contain cursor-zoom-in p-6"
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="aspect-[16/10] flex items-center justify-center text-muted/30">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg border border-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${mainArrowClass}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6.38128 1.38128C6.72299 1.03957 7.27701 1.03957 7.61872 1.38128C7.96043 1.72299 7.96043 2.27701 7.61872 2.61872L3.11244 7.125H15C15.4833 7.125 15.875 7.51675 15.875 8C15.875 8.48325 15.4833 8.875 15 8.875H3.11244L7.61872 13.3813C7.96043 13.723 7.96043 14.277 7.61872 14.6187C7.27701 14.9604 6.72299 14.9604 6.38128 14.6187L0.381282 8.61872C0.210427 8.44786 0.125 8.22393 0.125 8C0.125 7.77607 0.210427 7.55214 0.381282 7.38128L6.38128 1.38128Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((i) => (i + 1) % allImages.length)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg border border-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${mainArrowClass}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M9.61872 1.38128C9.27701 1.03957 8.72299 1.03957 8.38128 1.38128C8.03957 1.72299 8.03957 2.27701 8.38128 2.61872L12.8876 7.125H1C0.516751 7.125 0.125 7.51675 0.125 8C0.125 8.48325 0.516751 8.875 1 8.875H12.8876L8.38128 13.3813C8.03957 13.723 8.03957 14.277 8.38128 14.6187C8.72299 14.9604 9.27701 14.9604 9.61872 14.6187L15.6187 8.61872C15.7896 8.44786 15.875 8.22393 15.875 8C15.875 7.77607 15.7896 7.55214 15.6187 7.38128L9.61872 1.38128Z" fill="currentColor" />
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-full">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === activeImageIndex ? "bg-white" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              editing ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={editImageOrder.map((img) => img.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {editImageOrder.map((img, i) => (
                        <SortableThumbnail
                          key={img.id}
                          image={img}
                          isActive={i === activeImageIndex}
                          onClick={() => setActiveImageIndex(i)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <p className="text-[11px] text-muted mt-1.5">Drag to reorder components</p>
                </DndContext>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden transition-all ${
                        i === activeImageIndex
                          ? "border-accent ring-1 ring-accent"
                          : "border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={img.label}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          <aside className="space-y-6">
            {editing ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">Type</label>
                    <div className="flex gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setEditCategory(cat.value)}
                          className={`px-3 py-1.5 text-xs rounded-[4px] transition-colors ${
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
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">Library</label>
                    <select
                      value={editLibraryId ?? ""}
                      onChange={(e) => setEditLibraryId(e.target.value || null)}
                      className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                    >
                      <option value="">None</option>
                      {libraries.map((lib) => (
                        <option key={lib.id} value={lib.id}>
                          {lib.team ? `${lib.team} / ` : ""}{lib.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                    >
                      <option value="">Inherit from library</option>
                      <option value="official">Official</option>
                      <option value="in-use">In-use</option>
                      <option value="concept">Concept</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {editTags.map((slug) => (
                        <Tag key={slug} label={slug.replace(/-/g, " ")} onRemove={() => removeTag(slug)} />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                        placeholder="Add tag..."
                        className="flex-1 px-3 py-1.5 text-xs bg-surface text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                      />
                      {newTag && (
                        <button onClick={addTag} className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-[4px]">
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  {pattern.effectiveStatus && (
                    <div><StatusBadge status={pattern.effectiveStatus} /></div>
                  )}
                  <h1 className="text-xl font-semibold text-foreground">{pattern.title}</h1>
                  {displayDescription && (
                    <p className="text-sm text-muted leading-relaxed mt-1">{displayDescription}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Version selector */}
                  {hasVersions && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">Version</h3>
                      <div className="relative">
                        <button
                          onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                          className="flex items-center justify-between w-full px-3 h-9 bg-surface hover:bg-surface-hover text-sm text-foreground rounded-lg border border-border transition-colors"
                        >
                          <span>
                            v{activeVersion?.versionNumber}
                            {isLatest ? " (Latest)" : ""}
                            {activeVersion?.label ? ` — ${activeVersion.label}` : ""}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`text-muted transition-transform ${showVersionDropdown ? "rotate-180" : ""}`}>
                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>

                        {showVersionDropdown && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                            <button
                              onClick={() => {
                                setShowAddVersion(true);
                                setShowVersionDropdown(false);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left text-foreground hover:bg-surface transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-muted">
                                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                              <span>Add version</span>
                            </button>
                            <div className="h-px bg-border" />
                            {pattern.versions.map((v, i) => (
                              <button
                                key={v.id}
                                onClick={() => {
                                  setSelectedVersionId(v.id);
                                  setShowVersionDropdown(false);
                                }}
                                className={`flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors ${
                                  v.id === activeVersion?.id
                                    ? "bg-accent/10 text-accent"
                                    : "text-foreground hover:bg-surface"
                                }`}
                              >
                                <span className="truncate">
                                  v{v.versionNumber}
                                  {i === 0 ? " (Latest)" : ""}
                                  {v.label ? ` — ${v.label}` : ""}
                                </span>
                                <span className="text-xs text-muted ml-2 shrink-0">{formatDate(v.createdAt)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {showAddVersion ? (
                        <div className="mt-3 space-y-2 p-3 bg-surface rounded-lg border border-border">
                          <input
                            type="text"
                            placeholder="Paste Figma link..."
                            value={versionUrl}
                            onChange={(e) => setVersionUrl(e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-background text-foreground border border-border rounded-[4px] focus:outline-none focus:border-accent"
                            autoFocus
                          />
                          <input
                            type="text"
                            placeholder="Label (optional, e.g. 'Dark mode variant')"
                            value={versionLabel}
                            onChange={(e) => setVersionLabel(e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-background text-foreground border border-border rounded-[4px] focus:outline-none focus:border-accent"
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={versionDescription}
                            onChange={(e) => setVersionDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-background text-foreground border border-border rounded-[4px] focus:outline-none focus:border-accent resize-y"
                          />
                          <div>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {versionTags.map((slug) => (
                                <Tag key={slug} label={slug.replace(/-/g, " ")} onRemove={() => setVersionTags((prev) => prev.filter((t) => t !== slug))} />
                              ))}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={newVersionTag}
                                onChange={(e) => setNewVersionTag(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addVersionTag()}
                                placeholder="Add tag..."
                                className="flex-1 px-2 py-1 text-xs bg-background text-foreground border border-border rounded-[4px] outline-none focus:border-accent"
                              />
                              {newVersionTag && (
                                <button onClick={addVersionTag} className="px-2 py-1 text-xs font-medium bg-accent text-white rounded-[4px]">
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={addVersion}
                              disabled={addingVersion || !versionUrl.trim()}
                              className="flex-1 h-8 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors disabled:opacity-50"
                            >
                              {addingVersion ? "Fetching screenshot..." : "Add version"}
                            </button>
                            <button
                              onClick={() => { setShowAddVersion(false); setVersionUrl(""); setVersionLabel(""); setVersionDescription(""); setVersionTags([]); }}
                              className="px-3 h-8 text-xs font-medium text-muted hover:text-foreground rounded-[4px] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* No versions yet — just show add version */}
                  {!hasVersions && (
                    <div>
                      {showAddVersion ? (
                        <div className="space-y-2 p-3 bg-surface rounded-lg border border-border">
                          <input
                            type="text"
                            placeholder="Paste Figma link..."
                            value={versionUrl}
                            onChange={(e) => setVersionUrl(e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-background text-foreground border border-border rounded-[4px] focus:outline-none focus:border-accent"
                            autoFocus
                          />
                          <input
                            type="text"
                            placeholder="Label (optional)"
                            value={versionLabel}
                            onChange={(e) => setVersionLabel(e.target.value)}
                            className="w-full h-9 px-3 text-sm bg-background text-foreground border border-border rounded-[4px] focus:outline-none focus:border-accent"
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={versionDescription}
                            onChange={(e) => setVersionDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-background text-foreground border border-border rounded-[4px] focus:outline-none focus:border-accent resize-y"
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={addVersion}
                              disabled={addingVersion || !versionUrl.trim()}
                              className="flex-1 h-8 text-xs font-medium bg-accent text-white rounded-[4px] hover:bg-accent-hover transition-colors disabled:opacity-50"
                            >
                              {addingVersion ? "Fetching screenshot..." : "Add version"}
                            </button>
                            <button
                              onClick={() => { setShowAddVersion(false); setVersionUrl(""); setVersionLabel(""); setVersionDescription(""); }}
                              className="px-3 h-8 text-xs font-medium text-muted hover:text-foreground rounded-[4px] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddVersion(true)}
                          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Add version
                        </button>
                      )}
                    </div>
                  )}

                  {/* Open in Figma */}
                  {displayFigmaUrl && (
                    <a
                      href={displayFigmaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-9 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 38 57" fill="currentColor">
                        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
                        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
                        <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
                        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
                      </svg>
                      Open in Figma
                    </a>
                  )}
                </div>

                <div className="space-y-4">
                  {(pattern.library || displayTags.length > 0) && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.library && (
                          <MetadataChip label={pattern.library.name} href={`/libraries/${pattern.library.slug}`} icon={<LibraryIcon />} />
                        )}
                        {displayTags.map(({ tag }) => (
                          <Tag key={tag.id} label={tag.name} href={`/?tag=${encodeURIComponent(tag.slug)}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">Upvotes</h3>
                    <UpvoteButton
                      patternId={pattern.id}
                      initialCount={pattern._count?.upvotes ?? 0}
                      initialUpvoted={pattern.upvotedByVisitor ?? false}
                      compact={false}
                    />
                  </div>

                  {pattern.authorName && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">Added by</h3>
                      <div className="flex items-center gap-2">
                        {pattern.authorAvatar ? (
                          <Image src={pattern.authorAvatar} alt={pattern.authorName} width={24} height={24} className="rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-medium">
                            {pattern.authorName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-foreground">{pattern.authorName}</span>
                      </div>
                    </div>
                  )}

                  {pattern.figmaPageName && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">Figma page</h3>
                      <p className="text-sm text-foreground">{pattern.figmaPageName}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                      {pattern.updatedAt && pattern.updatedAt !== pattern.createdAt ? "Updated" : "Added"}
                    </h3>
                    <p className="text-sm text-foreground">
                      {new Date(pattern.updatedAt || pattern.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>

        {!editing && related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-6">Related patterns</h2>
            <PatternGrid patterns={related} />
          </div>
        )}
      </div>

      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative w-[90vw] h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[activeImageIndex]?.url || displayScreenshot}
              alt={allImages[activeImageIndex]?.label || pattern.title}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Prev / Next */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => (i - 1 + allImages.length) % allImages.length);
                }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg border border-transparent flex items-center justify-center transition-all ${mainArrowClass}`}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M6.38128 1.38128C6.72299 1.03957 7.27701 1.03957 7.61872 1.38128C7.96043 1.72299 7.96043 2.27701 7.61872 2.61872L3.11244 7.125H15C15.4833 7.125 15.875 7.51675 15.875 8C15.875 8.48325 15.4833 8.875 15 8.875H3.11244L7.61872 13.3813C7.96043 13.723 7.96043 14.277 7.61872 14.6187C7.27701 14.9604 6.72299 14.9604 6.38128 14.6187L0.381282 8.61872C0.210427 8.44786 0.125 8.22393 0.125 8C0.125 7.77607 0.210427 7.55214 0.381282 7.38128L6.38128 1.38128Z" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((i) => (i + 1) % allImages.length);
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg border border-transparent flex items-center justify-center transition-all ${mainArrowClass}`}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M9.61872 1.38128C9.27701 1.03957 8.72299 1.03957 8.38128 1.38128C8.03957 1.72299 8.03957 2.27701 8.38128 2.61872L12.8876 7.125H1C0.516751 7.125 0.125 7.51675 0.125 8C0.125 8.48325 0.516751 8.875 1 8.875H12.8876L8.38128 13.3813C8.03957 13.723 8.03957 14.277 8.38128 14.6187C8.72299 14.9604 9.27701 14.9604 9.61872 14.6187L15.6187 8.61872C15.7896 8.44786 15.875 8.22393 15.875 8C15.875 7.77607 15.7896 7.55214 15.6187 7.38128L9.61872 1.38128Z" fill="currentColor" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-black/60 rounded-xl backdrop-blur-sm">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(i);
                  }}
                  className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImageIndex
                      ? "border-white opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.label}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
