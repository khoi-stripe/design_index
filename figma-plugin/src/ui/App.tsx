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

export default function App() {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [fileKey, setFileKey] = useState<string>("");
  const [user, setUser] = useState<UserData | null>(null);

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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
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
