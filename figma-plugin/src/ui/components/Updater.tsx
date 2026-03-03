import { useState, useEffect, useCallback, useRef } from "react";
import {
  searchPatterns,
  uploadScreenshot,
  addVersion,
  updatePatternMeta,
  fetchLibraries,
} from "../api";
import { CATEGORIES, IMG_BASE } from "../shared/constants";
import { useTags } from "../hooks/useTags";
import type { SelectionNode } from "../App";
import type { UserData, CapturedImage } from "../shared/types";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  category: string;
  createdAt: string;
  libraryId?: string | null;
  status?: string | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function Updater({
  selections,
  user,
}: {
  selections: SelectionNode[];
  user: UserData | null;
}) {
  const primary = selections[0];

  const [phase, setPhase] = useState<"search" | "edit">("search");

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected pattern
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<{ id: string; name: string; slug: string; team: string; status: string; description: string }[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  const [patternStatus, setPatternStatus] = useState("");
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const tags = useTags(user?.name);

  // Submit state
  const [status, setStatus] = useState<
    "idle" | "capturing" | "uploading" | "saving" | "done" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captureProgress, setCaptureProgress] = useState("");

  useEffect(() => {
    return () => clearTimeout(statusTimeoutRef.current);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchPatterns(query.trim());
        setResults(data.patterns);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    fetchLibraries().then(setLibraries).catch(() => setLibraries([]));
  }, []);

  const selectPattern = (pattern: SearchResult) => {
    setSelected(pattern);
    setTitle(pattern.title);
    setDescription(pattern.description);
    setCategory(pattern.category);
    setSelectedLibraryId(pattern.libraryId || "");
    setPatternStatus(pattern.status || "");
    tags.setSelectedTags(pattern.tags.map((t) => t.tag.slug));
    setPhase("edit");
  };

  const handleSubmit = useCallback(async () => {
    if (!selected) return;
    if (!category) {
      setErrorMsg("Choose a category");
      return;
    }
    if (tags.selectedTags.length === 0) {
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
              setCaptureProgress(
                `Uploading ${captured.length + 1} of ${selections.length}...`
              );
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
                // Upload failed, continue
              }
              setCaptureProgress(
                `Captured ${captured.length} of ${selections.length}`
              );
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

      await addVersion(selected.id, {
        screenshotUrl: primaryImage.screenshotUrl,
        thumbnailUrl: primaryImage.thumbnailUrl,
        dominantColor: primaryImage.dominantColor,
        description: description.trim(),
        tags: tags.selectedTags,
        additionalImages,
      });

      const metaChanged =
        title.trim() !== selected.title ||
        description.trim() !== selected.description ||
        category !== selected.category ||
        selectedLibraryId !== (selected.libraryId || "") ||
        patternStatus !== (selected.status || "") ||
        JSON.stringify([...tags.selectedTags].sort()) !==
          JSON.stringify(
            selected.tags.map((t) => t.tag.slug).sort()
          );

      if (metaChanged) {
        await updatePatternMeta(selected.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          tags: tags.selectedTags,
          libraryId: selectedLibraryId || undefined,
          status: patternStatus || undefined,
        });
      }

      parent.postMessage(
        {
          pluginMessage: {
            type: "save-tags",
            tags: tags.selectedTags,
            metadata: {
              title: title.trim(),
              description: description.trim(),
            },
          },
        },
        "*"
      );

      setStatus("done");
      statusTimeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [selected, title, description, category, tags.selectedTags, selections, selectedLibraryId, patternStatus]);

  // --- SEARCH PHASE ---
  if (phase === "search") {
    return (
      <div className="tagger">
        <div className="tagger-scroll">
          <button className="back-button" onClick={() => setPhase("search")}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.6187 0.381282C11.9604 0.72299 11.9604 1.27701 11.6187 1.61872L5.23744 8L11.6187 14.3813C11.9604 14.723 11.9604 15.277 11.6187 15.6187C11.277 15.9604 10.723 15.9604 10.3813 15.6187L3.38128 8.61872C3.03957 8.27701 3.03957 7.72299 3.38128 7.38128L10.3813 0.381282C10.723 0.0395728 11.277 0.0395728 11.6187 0.381282Z"
                fill="currentColor"
              />
            </svg>
            Back
          </button>

          <div className="field">
            <label className="label">Find pattern</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input"
              placeholder="Search by name, tag, or author..."
              autoFocus
            />
          </div>

          {searching && (
            <div className="search-status">Searching...</div>
          )}

          {!searching && query.trim() && results.length === 0 && (
            <div className="search-status">No patterns found</div>
          )}

          {results.length > 0 && (
            <div className="search-results">
              {results.map((p) => (
                <button
                  key={p.id}
                  className="search-result-item"
                  onClick={() => selectPattern(p)}
                >
                  <div
                    className="search-result-thumb"
                    style={{
                      backgroundColor: p.dominantColor || "#131318",
                    }}
                  >
                    {(p.thumbnailUrl || p.screenshotUrl) && (
                      <img
                        src={`${IMG_BASE}${p.thumbnailUrl || p.screenshotUrl}`}
                        alt=""
                      />
                    )}
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-title">{p.title}</div>
                    <div className="search-result-meta">
                      {p.authorName && (
                        <span>{p.authorName}</span>
                      )}
                      <span className="search-result-badge">
                        {p.category}
                      </span>
                      <span>{timeAgo(p.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- EDIT PHASE ---
  return (
    <div className="tagger">
      <div className="tagger-scroll">
        <button
          className="back-button"
          onClick={() => setPhase("search")}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.6187 0.381282C11.9604 0.72299 11.9604 1.27701 11.6187 1.61872L5.23744 8L11.6187 14.3813C11.9604 14.723 11.9604 15.277 11.6187 15.6187C11.277 15.9604 10.723 15.9604 10.3813 15.6187L3.38128 8.61872C3.03957 8.27701 3.03957 7.72299 3.38128 7.38128L10.3813 0.381282C10.723 0.0395728 11.277 0.0395728 11.6187 0.381282Z"
              fill="currentColor"
            />
          </svg>
          Back to search
        </button>

        {selected && (
          <div className="update-target">
            <div
              className="update-target-thumb"
              style={{
                backgroundColor:
                  selected.dominantColor || "#131318",
              }}
            >
              {(selected.thumbnailUrl || selected.screenshotUrl) && (
                <img
                  src={`${IMG_BASE}${selected.thumbnailUrl || selected.screenshotUrl}`}
                  alt=""
                />
              )}
            </div>
            <div className="update-target-label">Updating</div>
          </div>
        )}

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
          <label className="label">Library <span style={{ fontWeight: "normal", color: "var(--color-text-secondary)" }}>optional</span></label>
          <select
            className="input"
            value={selectedLibraryId}
            onChange={(e) => setSelectedLibraryId(e.target.value)}
          >
            <option value="">None</option>
            {Array.from(new Set(libraries.map((l) => l.team)))
              .filter(Boolean)
              .sort()
              .map((team) => (
                <optgroup key={team} label={team}>
                  {libraries
                    .filter((l) => l.team === team)
                    .map((lib) => (
                      <option key={lib.id} value={lib.id}>
                        {lib.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            {libraries.some((l) => !l.team) && (
              <optgroup label="Other">
                {libraries
                  .filter((l) => !l.team)
                  .map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="field">
          <label className="label">Category</label>
          <select
            className="input"
            value={category || ""}
            onChange={(e) => {
              const v = e.target.value;
              setCategory(v || null);
              setErrorMsg("");
            }}
          >
            <option value="" disabled>Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Status <span style={{ fontWeight: "normal", color: "var(--color-text-secondary)" }}>optional</span></label>
          <select
            className="input"
            value={patternStatus}
            onChange={(e) => setPatternStatus(e.target.value)}
          >
            <option value="">Inherit from library</option>
            <option value="official">Official</option>
            <option value="community">Community</option>
            <option value="concept">Concept</option>
          </select>
        </div>

        <div className="field">
          <label className="label">
            Tags
            {tags.selectedTags.length > 0 && (
              <span className="tag-count">{tags.selectedTags.length}</span>
            )}
          </label>
          <div className="tags-selected">
            {tags.selectedTags.map((slug) => (
              <button
                key={slug}
                className="tag active"
                onClick={() => tags.toggleTag(slug)}
              >
                {slug.replace(/-/g, " ")}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="currentColor"
                >
                  <path
                    d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ))}
          </div>

          <div className="tag-input-wrapper">
            <div className="tag-input-row">
              <input
                ref={tags.tagInputRef}
                type="text"
                value={tags.customTag}
                onChange={(e) => tags.handleInputChange(e.target.value)}
                onFocus={tags.handleInputFocus}
                onBlur={tags.handleInputBlur}
                onKeyDown={tags.handleTagInputKeyDown}
                className="input small"
                placeholder="Search or add tag..."
              />
              {tags.customTag && (
                <button onClick={tags.addCustomTag} className="btn-small">
                  Add
                </button>
              )}
            </div>
            {tags.showTypeahead && tags.typeaheadMatches.length > 0 && (
              <div className="typeahead-dropdown">
                {tags.typeaheadMatches.map((t, i) => (
                  <button
                    key={t.slug}
                    className={`typeahead-item ${
                      i === tags.typeaheadIndex ? "active" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      tags.selectTypeaheadItem(t.slug);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tags.recentToShow.length > 0 && (
            <div className="tags-suggestions">
              {tags.recentToShow.map((t) => (
                <button
                  key={t.slug}
                  className="tag"
                  onClick={() => tags.toggleTag(t.slug)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tagger-bottom">
        <div className="selection-info">
          <div className="selection-icon">
            {selections.length > 1 ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 38 57"
                fill="currentColor"
              >
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
          disabled={
            status !== "idle" &&
            status !== "error" &&
            status !== "done"
          }
          className={`submit-btn ${status === "done" ? "success" : ""}`}
        >
          {status === "idle" &&
            (selections.length > 1
              ? `Update (${selections.length} frames)`
              : "Update")}
          {status === "capturing" && (captureProgress || "Capturing...")}
          {status === "uploading" && (captureProgress || "Uploading...")}
          {status === "saving" && "Saving version..."}
          {status === "done" && "Updated!"}
          {status === "error" && "Retry"}
        </button>
      </div>
    </div>
  );
}
