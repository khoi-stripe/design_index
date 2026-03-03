"use client";

import { useEffect, useRef } from "react";
import { PatternCard } from "./PatternCard";
import type { Pattern } from "@/lib/types";

function LoadingSkeletons({ count = 9 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-[4px] overflow-hidden">
            <div className="aspect-square bg-surface" />
            <div className="bg-card-bg p-4 space-y-2">
              <div className="h-4 bg-surface rounded w-3/4" />
              <div className="flex gap-1">
                <div className="h-5 bg-surface rounded w-16" />
                <div className="h-5 bg-surface rounded w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function PatternGrid({
  patterns,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  patterns: Pattern[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, loading]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <LoadingSkeletons />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/30">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground-bright mb-1">No patterns found</p>
        <p className="text-sm text-muted">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 isolate">
        {patterns.map((pattern, i) => (
          <PatternCard key={pattern.id} pattern={pattern} priority={i < 3} />
        ))}
        {loadingMore && <LoadingSkeletons count={3} />}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-px" />}
    </>
  );
}
