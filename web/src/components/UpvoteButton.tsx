"use client";

import { useState, useCallback } from "react";

const VISITOR_ID_KEY = "index_visitor_id";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

const ArrowUpIcon = ({ className }: { className?: string }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    className={className}
    aria-hidden
  >
    <path d="M5 1L9 9H1Z" fill="currentColor" />
  </svg>
);

export function UpvoteButton({
  patternId,
  initialCount = 0,
  initialUpvoted = false,
  compact = false,
}: {
  patternId: string;
  initialCount?: number;
  initialUpvoted?: boolean;
  compact?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;

      const visitorId = getVisitorId();
      if (!visitorId) return;

      const prevCount = count;
      const prevUpvoted = upvoted;

      setLoading(true);
      setUpvoted(!upvoted);
      setCount(upvoted ? count - 1 : count + 1);

      try {
        const res = await fetch(`/api/patterns/${patternId}/upvote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upvote failed");

        setCount(data.count);
        setUpvoted(data.upvoted);
      } catch {
        setCount(prevCount);
        setUpvoted(prevUpvoted);
      } finally {
        setLoading(false);
      }
    },
    [patternId, count, upvoted, loading]
  );

  const iconColor = upvoted ? "text-accent" : "text-muted";
  const textColor = upvoted ? "text-accent" : "text-muted";

  const baseClass =
    "inline-flex items-center gap-1 shrink-0 rounded-[3px] transition-colors hover:opacity-80";
  const compactClass = "px-1.5 py-[2px] text-[11px]";
  const normalClass = "px-2 py-1 text-[13px]";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${baseClass} ${compact ? compactClass : normalClass}`}
      aria-label={upvoted ? "Remove upvote" : "Upvote"}
    >
      <ArrowUpIcon className={iconColor} />
      <span className={`font-medium ${textColor}`}>{count}</span>
    </button>
  );
}
