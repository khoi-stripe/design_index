import React, { useState, useEffect, useCallback } from "react";
import { uploadScreenshot, createPattern, fetchTags } from "../api";

type SelectionData = {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  pageName: string;
  existingTags: string[];
  existingMeta: { title: string; description: string } | null;
};

type UserData = {
  name: string;
  photoUrl: string;
};

const SUGGESTED_TAGS = [
  "onboarding", "modal", "dashboard", "form", "checkout",
  "pricing", "settings", "navigation", "empty-state",
  "activity-feed", "card", "table", "multi-step",
];

export function Tagger({
  selection,
  fileKey,
  user,
}: {
  selection: SelectionData;
  fileKey: string;
  user: UserData | null;
}) {
  const [title, setTitle] = useState(selection.existingMeta?.title || selection.name);
  const [description, setDescription] = useState(selection.existingMeta?.description || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(selection.existingTags || []);
  const [customTag, setCustomTag] = useState("");
  const [allTags, setAllTags] = useState<{ slug: string; name: string }[]>([]);
  const [status, setStatus] = useState<"idle" | "capturing" | "uploading" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setTitle(selection.existingMeta?.title || selection.name);
    setDescription(selection.existingMeta?.description || "");
    setSelectedTags(selection.existingTags || []);
  }, [selection]);

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
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;
    if (selectedTags.length === 0) {
      setErrorMsg("Add at least one tag");
      return;
    }

    setStatus("capturing");
    setErrorMsg("");

    try {
      const screenshotUrl = await new Promise<string>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          const msg = event.data.pluginMessage;
          if (!msg) return;
          if (msg.type === "screenshot") {
            window.removeEventListener("message", handler);
            uploadScreenshot(msg.data)
              .then(resolve)
              .catch(reject);
            setStatus("uploading");
          }
          if (msg.type === "screenshot-error") {
            window.removeEventListener("message", handler);
            reject(new Error(msg.error));
          }
        };
        window.addEventListener("message", handler);
        parent.postMessage({ pluginMessage: { type: "capture-screenshot" } }, "*");
      });

      setStatus("saving");

      await createPattern({
        title: title.trim(),
        description: description.trim(),
        figmaFileKey: fileKey,
        figmaNodeId: selection.id,
        figmaPageName: selection.pageName,
        screenshotUrl,
        authorName: user?.name || "",
        authorAvatar: user?.photoUrl || "",
        tags: selectedTags,
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
  }, [title, description, selectedTags, fileKey, selection, user]);

  const suggestedToShow = SUGGESTED_TAGS.filter(
    (t) => !selectedTags.includes(t)
  );
  const existingToShow = allTags.filter(
    (t) => !selectedTags.includes(t.slug) && !SUGGESTED_TAGS.includes(t.slug)
  );

  return (
    <div className="tagger">
      <div className="selection-info">
        <div className="selection-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>
        <div>
          <div className="selection-name">{selection.name}</div>
          <div className="selection-meta">
            {Math.round(selection.width)} × {Math.round(selection.height)} · {selection.pageName}
          </div>
        </div>
      </div>

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

        <div className="tag-input-row">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            className="input small"
            placeholder="Add custom tag..."
          />
          {customTag && (
            <button onClick={addCustomTag} className="btn-small">
              Add
            </button>
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

      {errorMsg && <div className="error">{errorMsg}</div>}

      <button
        onClick={handleSubmit}
        disabled={status !== "idle" && status !== "error" && status !== "done"}
        className={`submit-btn ${status === "done" ? "success" : ""}`}
      >
        {status === "idle" && "Tag & Submit"}
        {status === "capturing" && "Capturing screenshot..."}
        {status === "uploading" && "Uploading..."}
        {status === "saving" && "Saving pattern..."}
        {status === "done" && "Submitted!"}
        {status === "error" && "Retry"}
      </button>
    </div>
  );
}
