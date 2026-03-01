"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PatternGrid } from "@/components/PatternGrid";

type Tag = { id: string; name: string; slug: string };
type PatternDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  screenshotUrl: string;
  figmaDeepLink: string;
  figmaPageName: string;
  figmaFileKey: string;
  authorName: string;
  authorAvatar: string;
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { tag: Tag }[];
};
type RelatedPattern = {
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
  tags: { tag: Tag }[];
};

export default function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pattern, setPattern] = useState<PatternDetail | null>(null);
  const [related, setRelated] = useState<RelatedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/patterns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPattern(data.pattern);
        setRelated(data.relatedPatterns || []);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-surface rounded w-48" />
            <div className="aspect-[16/10] bg-surface rounded-xl" />
            <div className="h-4 bg-surface rounded w-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">Pattern not found</p>
          <Link href="/" className="text-sm text-accent hover:underline">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to browse
          </Link>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div>
            <div className="rounded-xl border border-border overflow-hidden bg-surface">
              {pattern.screenshotUrl ? (
                <Image
                  src={pattern.screenshotUrl}
                  alt={pattern.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-[16/10] flex items-center justify-center text-muted/30">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {pattern.title}
              </h1>
              {pattern.description && (
                <p className="text-sm text-muted leading-relaxed">
                  {pattern.description}
                </p>
              )}
            </div>

            {pattern.figmaDeepLink && (
              <a
                href={pattern.figmaDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-10 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-light transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 38 57" fill="currentColor">
                  <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
                  <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
                  <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                  <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
                  <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
                </svg>
                Open in Figma
              </a>
            )}

            <div className="space-y-4">
              {pattern.category && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                    Category
                  </h3>
                  <span className="inline-block px-2.5 py-1 text-xs font-medium bg-accent/15 text-accent rounded-md capitalize">
                    {pattern.category}
                  </span>
                </div>
              )}

              {pattern.tags.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pattern.tags.map(({ tag }) => (
                      <Link
                        key={tag.id}
                        href={`/?search=${encodeURIComponent(tag.name)}`}
                        className="px-2.5 py-1 text-xs bg-accent text-white rounded-md hover:bg-accent-light transition-colors"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {pattern.authorName && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                    Added by
                  </h3>
                  <div className="flex items-center gap-2">
                    {pattern.authorAvatar ? (
                      <Image
                        src={pattern.authorAvatar}
                        alt={pattern.authorName}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-medium">
                        {pattern.authorName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm text-foreground">
                      {pattern.authorName}
                    </span>
                  </div>
                </div>
              )}

              {pattern.figmaPageName && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                    Figma page
                  </h3>
                  <p className="text-sm text-foreground">{pattern.figmaPageName}</p>
                </div>
              )}

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-2">
                  Added
                </h3>
                <p className="text-sm text-foreground">
                  {new Date(pattern.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Related patterns
            </h2>
            <PatternGrid patterns={related} />
          </div>
        )}
      </div>
    </div>
  );
}
