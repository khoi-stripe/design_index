import React, { useEffect, useState } from "react";
import { Tagger } from "./components/Tagger";
import "./styles.css";

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

function extractFileKey(url: string): string | null {
  const match = url.match(
    /figma\.com\/(?:design|file|proto)\/([a-zA-Z0-9]+)/
  );
  return match ? match[1] : null;
}

export default function App() {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [fileKey, setFileKey] = useState<string>("");
  const [user, setUser] = useState<UserData | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState("");
  const [fileKeyError, setFileKeyError] = useState("");

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "selection") {
        setSelection(msg.data);
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

  const showFileKeyPrompt = !fileKey && selection;

  return (
    <div className="app">
      <div className="header">
        <div className="header-logo">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="#635BFF" />
            <rect x="9" y="2" width="5" height="5" rx="1" fill="#635BFF" opacity="0.6" />
            <rect x="2" y="9" width="5" height="5" rx="1" fill="#635BFF" opacity="0.6" />
            <rect x="9" y="9" width="5" height="5" rx="1" fill="#635BFF" opacity="0.3" />
          </svg>
          <span className="header-title">Index</span>
        </div>
      </div>

      {!selection ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#667691" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p className="empty-title">Select a frame</p>
          <p className="empty-desc">
            Select a frame or component to tag it as a pattern
          </p>
        </div>
      ) : showFileKeyPrompt ? (
        <div className="file-key-prompt">
          <div className="file-key-prompt-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#675DFF" strokeWidth="1.5">
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
      ) : (
        <Tagger
          selection={selection}
          fileKey={fileKey}
          user={user}
        />
      )}
    </div>
  );
}
