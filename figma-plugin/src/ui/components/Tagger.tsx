import React, { useState, useEffect, useCallback, useRef } from "react";
import { uploadScreenshot, createPattern, fetchTags } from "../api";
import type { SelectionNode } from "../App";

type UserData = {
  name: string;
  photoUrl: string;
};

const CATEGORIES = [
  { value: "flow", label: "Flow", desc: "Multi-step sequence or journey" },
  { value: "screen", label: "Screen", desc: "Whole page or surface" },
  { value: "component", label: "Component", desc: "Individual UI piece" },
  { value: "asset", label: "Asset", desc: "Icons, illustrations, graphics" },
] as const;

const SUGGESTED_TAGS = [
  "onboarding", "modal", "dashboard", "form", "checkout",
  "pricing", "settings", "navigation", "empty-state",
  "activity-feed", "card", "table", "multi-step",
];

type CapturedImage = {
  nodeId: string;
  nodeName: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
};

export function Tagger({
  selections,
  fileKey,
  user,
}: {
  selections: SelectionNode[];
  fileKey: string;
  user: UserData | null;
}) {
  const primary = selections[0];
  const [title, setTitle] = useState(primary.existingMeta?.title || primary.name);
  const [description, setDescription] = useState(primary.existingMeta?.description || "");
  const [category, setCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(primary.existingTags || []);
  const [customTag, setCustomTag] = useState("");
  const [allTags, setAllTags] = useState<{ slug: string; name: string }[]>([]);
  const [typeaheadIndex, setTypeaheadIndex] = useState(-1);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "capturing" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captureProgress, setCaptureProgress] = useState("");

  useEffect(() => {
    setTitle(primary.existingMeta?.title || primary.name);
    setDescription(primary.existingMeta?.description || "");
    setSelectedTags(primary.existingTags || []);
  }, [primary]);

  useEffect(() => {
    fetchTags()
      .then((tags) => setAllTags(tags.map((t) => ({ slug: t.slug, name: t.name }))))
      .catch(() => {});
  }, []);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const addCustomTag = () => {
    const slug = customTag.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (slug && !selectedTags.includes(slug)) {
      setSelectedTags((prev) => [...prev, slug]);
    }
    setCustomTag("");
    setShowTypeahead(false);
    setTypeaheadIndex(-1);
  };

  const typeaheadMatches = customTag.trim().length > 0
    ? [
        ...allTags.filter(
          (t) =>
            !selectedTags.includes(t.slug) &&
            (t.name.toLowerCase().includes(customTag.toLowerCase()) ||
              t.slug.includes(customTag.toLowerCase().replace(/\s+/g, "-")))
        ),
        ...SUGGESTED_TAGS
          .filter(
            (s) =>
              !selectedTags.includes(s) &&
              !allTags.some((t) => t.slug === s) &&
              s.includes(customTag.toLowerCase().replace(/\s+/g, "-"))
          )
          .map((s) => ({ slug: s, name: s.replace(/-/g, " ") })),
      ].slice(0, 6)
    : [];

  const selectTypeaheadItem = (slug: string) => {
    if (!selectedTags.includes(slug)) {
      setSelectedTags((prev) => [...prev, slug]);
    }
    setCustomTag("");
    setShowTypeahead(false);
    setTypeaheadIndex(-1);
    tagInputRef.current?.focus();
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setTypeaheadIndex((i) => Math.min(i + 1, typeaheadMatches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTypeaheadIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (typeaheadIndex >= 0 && typeaheadMatches[typeaheadIndex]) {
        selectTypeaheadItem(typeaheadMatches[typeaheadIndex].slug);
      } else {
        addCustomTag();
      }
    } else if (e.key === "Escape") {
      setShowTypeahead(false);
      setTypeaheadIndex(-1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    if (!category) {
      setErrorMsg("Choose a category");
      return;
    }
    if (selectedTags.length === 0) {
      setErrorMsg("Add at least one tag");
      return;
    }

    setStatus("capturing");
    setErrorMsg("");
    setCaptureProgress(`Capturing 1 of ${selections.length}...`);

    try {
      const captured: CapturedImage[] = [];

      await new Promise<void>((resolve, reject) => {
        const handler = async (event: MessageEvent) => {
          const msg = event.data.pluginMessage;
          if (!msg) return;

          if (msg.type === "capture-single") {
            if (msg.error) {
              setCaptureProgress(`Skipped: ${msg.nodeName}`);
            } else {
              setCaptureProgress(`Uploading ${captured.length + 1} of ${selections.length}...`);
              setStatus("uploading");
              try {
                const upload = await uploadScreenshot(msg.data);
                captured.push({
                  nodeId: msg.nodeId,
                  nodeName: msg.nodeName,
                  screenshotUrl: upload.url,
                  thumbnailUrl: upload.thumbnailUrl,
                  dominantColor: upload.dominantColor,
                });
              } catch {
                // Upload failed for this node, continue
              }
              setCaptureProgress(`Captured ${captured.length} of ${selections.length}`);
              setStatus("capturing");
            }
            parent.postMessage(
              { pluginMessage: { type: "capture-next" } },
              "*"
            );
          }

          if (msg.type === "capture-all-done") {
            window.removeEventListener("message", handler);
            if (captured.length === 0) {
              reject(new Error("No screenshots could be captured"));
            } else {
              resolve();
            }
          }
        };

        window.addEventListener("message", handler);
        parent.postMessage(
          { pluginMessage: { type: "capture-all-screenshots" } },
          "*"
        );
      });

      setStatus("saving");
      setCaptureProgress("");

      const primaryImage = captured[0];
      const additionalImages = captured.slice(1).map((img, i) => ({
        screenshotUrl: img.screenshotUrl,
        thumbnailUrl: img.thumbnailUrl,
        dominantColor: img.dominantColor,
        label: img.nodeName,
        nodeId: img.nodeId,
        nodeName: img.nodeName,
        sortOrder: i + 1,
      }));

      await createPattern({
        title: title.trim(),
        description: description.trim(),
        category,
        figmaFileKey: fileKey,
        figmaNodeId: primary.id,
        figmaPageName: primary.pageName,
        screenshotUrl: primaryImage.screenshotUrl,
        thumbnailUrl: primaryImage.thumbnailUrl,
        dominantColor: primaryImage.dominantColor,
        authorName: user?.name || "",
        authorAvatar: user?.photoUrl || "",
        tags: selectedTags,
        additionalImages,
      });

      parent.postMessage({
        pluginMessage: {
          type: "save-tags",
          tags: selectedTags,
          metadata: { title: title.trim(), description: description.trim() },
        },
      }, "*");

      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [title, description, category, selectedTags, fileKey, selections, primary, user]);

  const suggestedToShow = SUGGESTED_TAGS.filter(
    (t) => !selectedTags.includes(t)
  );
  const existingToShow = allTags.filter(
    (t) => !selectedTags.includes(t.slug) && !SUGGESTED_TAGS.includes(t.slug)
  );

  return (
    <div className="tagger">
      {/* Scrollable top section */}
      <div className="tagger-scroll">
        <div className="field">
          <label className="label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Pattern name"
          />
        </div>

        <div className="field">
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input textarea"
            placeholder="What is this pattern? When is it used?"
            rows={2}
          />
        </div>

        <div className="field">
          <label className="label">Category</label>
          <div className="category-selector">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setErrorMsg(""); }}
                className={`category-option ${category === cat.value ? "active" : ""}`}
              >
                <span className="category-label">{cat.label}</span>
                <span className="category-desc">{cat.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">
            Tags
            {selectedTags.length > 0 && (
              <span className="tag-count">{selectedTags.length}</span>
            )}
          </label>
          <div className="tags-selected">
            {selectedTags.map((slug) => (
              <button key={slug} className="tag active" onClick={() => toggleTag(slug)}>
                {slug.replace(/-/g, " ")}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>

          <div className="tag-input-wrapper">
            <div className="tag-input-row">
              <input
                ref={tagInputRef}
                type="text"
                value={customTag}
                onChange={(e) => {
                  setCustomTag(e.target.value);
                  setShowTypeahead(e.target.value.trim().length > 0);
                  setTypeaheadIndex(-1);
                }}
                onFocus={() => customTag.trim().length > 0 && setShowTypeahead(true)}
                onBlur={() => setTimeout(() => setShowTypeahead(false), 150)}
                onKeyDown={handleTagInputKeyDown}
                className="input small"
                placeholder="Search or add tag..."
              />
              {customTag && (
                <button onClick={addCustomTag} className="btn-small">
                  Add
                </button>
              )}
            </div>
            {showTypeahead && typeaheadMatches.length > 0 && (
              <div className="typeahead-dropdown">
                {typeaheadMatches.map((t, i) => (
                  <button
                    key={t.slug}
                    className={`typeahead-item ${i === typeaheadIndex ? "active" : ""}`}
                    onMouseDown={(e) => { e.preventDefault(); selectTypeaheadItem(t.slug); }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {suggestedToShow.length > 0 && (
            <div className="tags-suggestions">
              {suggestedToShow.map((slug) => (
                <button key={slug} className="tag" onClick={() => toggleTag(slug)}>
                  {slug.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          )}

          {existingToShow.length > 0 && (
            <div className="tags-suggestions">
              {existingToShow.slice(0, 8).map((t) => (
                <button key={t.slug} className="tag" onClick={() => toggleTag(t.slug)}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pinned bottom bar */}
      <div className="tagger-bottom">
        <div className="selection-info">
          <div className="selection-icon">
            {selections.length > 1 ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 38 57" fill="currentColor">
                <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
                <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
                <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
                <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
              </svg>
            )}
          </div>
          <div>
            <div className="selection-name">
              {selections.length === 1
                ? primary.name
                : `${selections.length} frames selected`}
            </div>
            <div className="selection-meta">
              {selections.length === 1 ? (
                <>{primary.pageName}</>
              ) : (
                <span className="selection-list">
                  {selections.map((s) => s.name).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {errorMsg && <div className="error">{errorMsg}</div>}

        <button
          onClick={handleSubmit}
          disabled={status !== "idle" && status !== "error" && status !== "done"}
          className={`submit-btn ${status === "done" ? "success" : ""}`}
        >
          {status === "idle" && (selections.length > 1 ? `Tag & Submit (${selections.length} frames)` : "Tag & Submit")}
          {status === "capturing" && (captureProgress || "Capturing...")}
          {status === "uploading" && (captureProgress || "Uploading...")}
          {status === "saving" && "Saving pattern..."}
          {status === "done" && "Submitted!"}
          {status === "error" && "Retry"}
        </button>
      </div>
    </div>
  );
}
