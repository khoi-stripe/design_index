"use client";

import { useState, useCallback, useEffect, useRef } from "react";

function ControlIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5 8C13.433 8 15 9.567 15 11.5C15 13.433 13.433 15 11.5 15C9.82456 15 8.42548 13.8224 8.08203 12.25H2.625C2.21079 12.25 1.875 11.9142 1.875 11.5C1.875 11.0858 2.21079 10.75 2.625 10.75H8.08203C8.42548 9.17757 9.82456 8.00001 11.5 8ZM11.5 9.5C10.3954 9.50001 9.5 10.3954 9.5 11.5C9.5 12.6046 10.3954 13.5 11.5 13.5C12.6046 13.5 13.5 12.6046 13.5 11.5C13.5 10.3954 12.6046 9.5 11.5 9.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 1C2.567 1 1 2.567 1 4.5C1 6.433 2.567 8 4.5 8C6.17544 8 7.57452 6.82243 7.91797 5.25H13.375C13.7892 5.25 14.125 4.91421 14.125 4.5C14.125 4.08579 13.7892 3.75 13.375 3.75H7.91797C7.57452 2.17757 6.17544 1 4.5 1ZM4.5 2.5C5.60457 2.5 6.5 3.39543 6.5 4.5C6.5 5.60457 5.60457 6.5 4.5 6.5C3.39543 6.5 2.5 5.60457 2.5 4.5C2.5 3.39543 3.39543 2.5 4.5 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function usePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsClosing(true);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 120);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen && !isClosing) close();
    else open();
  }, [isOpen, isClosing, open, close]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    isVisible: isOpen,
    animationClass: isClosing ? "menu-spring-exit" : "menu-spring-enter",
    open,
    close,
    toggle,
  };
}

export type ProtoLayout = "current" | "planned";

const STORAGE_KEY = "proto-layout";

export function useProtoLayout(): [ProtoLayout, (v: ProtoLayout) => void] {
  const [layout, setLayout] = useState<ProtoLayout>("current");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ProtoLayout | null;
    if (stored && stored !== "current") setLayout(stored);
  }, []);

  const update = useCallback((v: ProtoLayout) => {
    setLayout(v);
    localStorage.setItem(STORAGE_KEY, v);
  }, []);

  return [layout, update];
}

export function ProtoControls({
  layout,
  onLayoutChange,
}: {
  layout: ProtoLayout;
  onLayoutChange: (v: ProtoLayout) => void;
}) {
  const popover = usePopover();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popover.isVisible) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        popover.close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popover.isVisible, popover.close]);

  return (
    <div ref={popoverRef} className="fixed bottom-4 right-4 z-50">
      {popover.isVisible && (
        <div
          className={`absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden whitespace-nowrap ${popover.animationClass}`}
          style={{ transformOrigin: "bottom right" }}
        >
          <div className="p-2 flex flex-col min-w-[240px]">
            <div className="px-2 py-1.5">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Prototype controls
              </span>
            </div>

            <div className="h-px bg-border my-1" />

            <div className="flex items-center justify-between gap-6 px-2 py-1.5">
              <span className="text-xs text-foreground">Layout</span>
              <div className="flex bg-surface rounded-md p-0.5 gap-0.5">
                {(["current", "planned"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onLayoutChange(v)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-[4px] transition-colors capitalize ${
                      layout === v
                        ? "bg-accent text-white"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => popover.toggle()}
        className="w-8 h-8 rounded-full bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-center shadow-lg"
        title="Prototype controls"
      >
        <ControlIcon className="w-4 h-4 text-muted" />
      </button>
    </div>
  );
}
