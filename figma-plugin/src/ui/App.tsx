import { useEffect, useState } from "react";
import { Tagger } from "./components/Tagger";
import { Updater } from "./components/Updater";
import { ModeChooser } from "./components/ModeChooser";
import type { UserData } from "./shared/types";
import "./styles.css";

export type SelectionNode = {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  pageName: string;
  existingTags: string[];
  existingMeta: { title: string; description: string } | null;
};

function extractFileKey(url: string): string | null {
  const match = url.match(
    /figma\.com\/(?:design|file|proto)\/([a-zA-Z0-9]+)/
  );
  return match ? match[1] : null;
}

export default function App() {
  const [selections, setSelections] = useState<SelectionNode[]>([]);
  const [fileKey, setFileKey] = useState<string>("");
  const [user, setUser] = useState<UserData | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState("");
  const [fileKeyError, setFileKeyError] = useState("");
  const [mode, setMode] = useState<"choose" | "add" | "update">("choose");

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "selection") {
        if (msg.data === null) {
          setSelections([]);
        } else if (Array.isArray(msg.data)) {
          setSelections(msg.data);
        } else {
          setSelections([msg.data]);
        }
      }
      if (msg.type === "file-key") {
        setFileKey(msg.data || "");
      }
      if (msg.type === "user") {
        setUser(msg.data);
      }
    };

    window.addEventListener("message", handler);

    parent.postMessage({ pluginMessage: { type: "get-selection" } }, "*");
    parent.postMessage({ pluginMessage: { type: "get-file-key" } }, "*");
    parent.postMessage({ pluginMessage: { type: "get-user" } }, "*");

    return () => window.removeEventListener("message", handler);
  }, []);

  const handleFileUrl = () => {
    const key = extractFileKey(fileUrlInput.trim());
    if (!key) {
      setFileKeyError("Paste a valid Figma file URL");
      return;
    }
    setFileKeyError("");
    parent.postMessage(
      { pluginMessage: { type: "set-file-key", data: key } },
      "*"
    );
  };

  const hasSelection = selections.length > 0;
  const showFileKeyPrompt = !fileKey && hasSelection;

  return (
    <div className="app">
      {!hasSelection ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 128 128" fill="white">
            <path fillRule="evenodd" clipRule="evenodd" d="M36 96L92 82.56V32L36 45.72V96Z" />
          </svg>
          <p className="empty-title">Select frames</p>
          <p className="empty-desc">
            Select one or more frames to tag as a pattern
          </p>
        </div>
      ) : showFileKeyPrompt ? (
        <div className="file-key-prompt">
          <div className="file-key-prompt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#533AFD" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <p className="file-key-prompt-title">Link this file</p>
          <p className="file-key-prompt-desc">
            Paste this file's Figma URL so patterns link back to the source.
            You only need to do this once per file.
          </p>
          <div className="file-key-input-row">
            <input
              type="text"
              value={fileUrlInput}
              onChange={(e) => { setFileUrlInput(e.target.value); setFileKeyError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleFileUrl()}
              className="input"
              placeholder="https://figma.com/design/..."
            />
            <button onClick={handleFileUrl} className="btn-small">
              Save
            </button>
          </div>
          {fileKeyError && <div className="error">{fileKeyError}</div>}
        </div>
      ) : mode === "choose" ? (
        <ModeChooser
          onAdd={() => setMode("add")}
          onUpdate={() => setMode("update")}
        />
      ) : (
        <>
          <div className="flow-header">
            <button className="back-button" onClick={() => setMode("choose")}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.6187 0.381282C11.9604 0.72299 11.9604 1.27701 11.6187 1.61872L5.23744 8L11.6187 14.3813C11.9604 14.723 11.9604 15.277 11.6187 15.6187C11.277 15.9604 10.723 15.9604 10.3813 15.6187L3.38128 8.61872C3.03957 8.27701 3.03957 7.72299 3.38128 7.38128L10.3813 0.381282C10.723 0.0395728 11.277 0.0395728 11.6187 0.381282Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <span className="flow-title">
              {mode === "add" ? "Add new" : "Update existing"}
            </span>
          </div>
          {mode === "add" ? (
            <Tagger
              selections={selections}
              fileKey={fileKey}
              user={user}
            />
          ) : (
            <Updater
              selections={selections}
              user={user}
            />
          )}
        </>
      )}
    </div>
  );
}
