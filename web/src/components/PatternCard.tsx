"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <Link href={`/patterns/${pattern.id}`} className="group block">
      <div className="relative aspect-square rounded-[6px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 bg-surface">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={pattern.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-sm text-foreground leading-tight tracking-tight">
            {pattern.title}
          </h3>
          {pattern.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pattern.tags.slice(0, 3).map(({ tag }) => (
                <span
                  key={tag.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/?search=${encodeURIComponent(tag.name)}`);
                  }}
                  className="px-2 py-[2px] text-[11px] font-medium bg-accent text-white rounded-[4px] hover:bg-accent-light transition-colors cursor-pointer"
                >
                  {tag.name}
                </span>
              ))}
              {pattern.tags.length > 3 && (
                <span className="px-2 py-[2px] text-[11px] text-muted">
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
