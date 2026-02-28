"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { FilterSidebar } from "@/components/FilterSidebar";
import { PatternGrid } from "@/components/PatternGrid";

type Tag = {
  id: string;
  name: string;
  slug: string;
  category: string;
  _count: { patterns: number };
};

type PatternTag = { tag: { id: string; name: string; slug: string } };
type Pattern = {
  id: string;
  title: string;
  description: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  authorName: string;
  authorAvatar: string;
  figmaDeepLink: string;
  featured: boolean;
  createdAt: string;
  tags: PatternTag[];
};

export default function HomePage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (search) params.set("search", search);

    const res = await fetch(`/api/patterns?${params}`);
    const data = await res.json();
    setPatterns(data.patterns);
    setLoading(false);
  }, [activeTag, search]);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTags);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchPatterns, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchPatterns, search]);

  return (
    <div className="min-h-screen bg-background">
      <Header search={search} onSearchChange={setSearch} />
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          <FilterSidebar
            tags={tags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
          />
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {activeTag
                    ? tags.find((t) => t.slug === activeTag)?.name || "Patterns"
                    : "All patterns"}
                </h1>
                <p className="text-sm text-muted mt-0.5">
                  {loading ? "Loading..." : `${patterns.length} patterns`}
                </p>
              </div>
            </div>
            <PatternGrid patterns={patterns} loading={loading} />
          </main>
        </div>
      </div>
    </div>
  );
}
