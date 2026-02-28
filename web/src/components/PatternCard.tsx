"use client";

import Link from "next/link";
import Image from "next/image";

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
  tags: { tag: { id: string; name: string; slug: string } }[];
};

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const imgSrc = pattern.thumbnailUrl || pattern.screenshotUrl;

  return (
    <Link href={`/patterns/${pattern.id}`} className="group block">
      <div className="rounded-xl border border-border overflow-hidden bg-card-bg hover:shadow-lg hover:shadow-accent/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80">
        <div className="relative aspect-[4/3] bg-surface overflow-hidden">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={pattern.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          {pattern.featured && (
            <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent text-white rounded-md">
              Featured
            </div>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="font-medium text-sm text-foreground leading-tight mb-1.5 group-hover:text-accent transition-colors">
            {pattern.title}
          </h3>
          {pattern.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pattern.tags.slice(0, 3).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-[11px] bg-tag-bg text-tag-text rounded-md"
                >
                  {tag.name}
                </span>
              ))}
              {pattern.tags.length > 3 && (
                <span className="px-2 py-0.5 text-[11px] text-muted/50">
                  +{pattern.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
