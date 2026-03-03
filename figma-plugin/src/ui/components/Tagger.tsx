import { useState, useEffect, useCallback, useRef } from "react";
import { uploadScreenshot, createPattern, fetchLibraries } from "../api";
import { CATEGORIES } from "../shared/constants";
import { useTags } from "../hooks/useTags";
import type { SelectionNode } from "../App";
import type { UserData, CapturedImage } from "../shared/types";

type Library = { id: string; name: string; slug: string; team: string; status: string; description: string };

export function Tagger({
  selections,
  fileKey,
  user,
  libraryId: savedLibraryId,
  onBack,
}: {
  selections: SelectionNode[];
  fileKey: string;
  user: UserData | null;
  libraryId?: string;
  onBack?: () => void;
}) {
  const primary = selections[0];
  const [title, setTitle] = useState(primary.existingMeta?.title || primary.name);
  const [description, setDescription] = useState(primary.existingMeta?.description || "");
  const [category, setCategory] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState("");
  const [patternStatus, setPatternStatus] = useState("");
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [status, setStatus] = useState<"idle" | "capturing" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [captureProgress, setCaptureProgress] = useState("");

  const tags = useTags(user?.name);

  useEffect(() => {
    return () => clearTimeout(statusTimeoutRef.current);
  }, []);

  useEffect(() => {
    fetchLibraries().then(setLibraries).catch(() => setLibraries([]));
  }, []);

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "get-library-id" } }, "*");
  }, []);

  useEffect(() => {
    if (savedLibraryId) setSelectedLibraryId(savedLibraryId);
  }, [savedLibraryId]);

  useEffect(() => {
    setTitle(primary.existingMeta?.title || primary.name);
    setDescription(primary.existingMeta?.description || "");
    tags.setSelectedTags(primary.existingTags || []);
  }, [primary]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    if (!category) {
      setErrorMsg("Choose a type");
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
        tags: tags.selectedTags,
        libraryId: selectedLibraryId || undefined,
        status: patternStatus || undefined,
        additionalImages,
      });

      parent.postMessage({
        pluginMessage: {
          type: "save-tags",
          tags: tags.selectedTags,
          metadata: { title: title.trim(), description: description.trim() },
        },
      }, "*");

      setStatus("done");
      statusTimeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [title, description, category, tags.selectedTags, fileKey, selections, primary, user, selectedLibraryId, patternStatus]);

  return (
    <div className="tagger">
      <div className="tagger-scroll">
        {onBack && (
          <button className="back-button" onClick={onBack}>
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
            onChange={(e) => {
              const id = e.target.value;
              setSelectedLibraryId(id);
              parent.postMessage({ pluginMessage: { type: "set-library-id", data: id } }, "*");
            }}
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
          <label className="label">Type</label>
          <select
            className="input"
            value={category || ""}
            onChange={(e) => {
              const v = e.target.value;
              setCategory(v || null);
              setErrorMsg("");
            }}
          >
            <option value="" disabled>Select type...</option>
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
            <option value="community">In-use</option>
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
              <button key={slug} className="tag active" onClick={() => tags.toggleTag(slug)}>
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
                    className={`typeahead-item ${i === tags.typeaheadIndex ? "active" : ""}`}
                    onMouseDown={(e) => { e.preventDefault(); tags.selectTypeaheadItem(t.slug); }}
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
                <button key={t.slug} className="tag" onClick={() => tags.toggleTag(t.slug)}>
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
