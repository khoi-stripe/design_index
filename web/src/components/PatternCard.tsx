"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Pattern = {
  id: string;
  title: string;
  description: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  figmaDeepLink: string;
  featured: boolean;
  createdAt: string;
  tags: { tag: { id: string; name: string; slug: string } }[];
};

export function PatternCard({
  pattern,
  index = 0,
  priority = false,
}: {
  pattern: Pattern;
  index?: number;
  priority?: boolean;
}) {
  const imgSrc = pattern.thumbnailUrl || pattern.screenshotUrl;
  const router = useRouter();
  const [showAvatarTooltip, setShowAvatarTooltip] = useState(false);

  return (
    <Link href={`/patterns/${pattern.id}`} className="group block relative">
      <div
        className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, #675DFFcc 0%, #675DFF40 50%, transparent 75%)",
          filter: "blur(32px)",
        }}
      />
      <div className="relative rounded-[6px] overflow-hidden transition-all duration-200 group-hover:-translate-y-1">
        <div
          className="relative aspect-square flex items-center justify-center p-5"
          style={{ backgroundColor: pattern.dominantColor || "#131318" }}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={pattern.title}
              fill
              className="object-contain p-5 group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center text-muted/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
        <div className="bg-black p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
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
                  className="px-2 py-[2px] text-[11px] font-medium bg-accent text-white rounded-[2px] hover:bg-[#5248d9] transition-colors cursor-pointer"
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
          {(pattern.authorAvatar || pattern.authorName) && (
            <div
              className="relative shrink-0"
              onMouseEnter={() => setShowAvatarTooltip(true)}
              onMouseLeave={() => setShowAvatarTooltip(false)}
            >
              {pattern.authorAvatar ? (
                <Image
                  src={pattern.authorAvatar}
                  alt={pattern.authorName}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-medium">
                  {pattern.authorName.charAt(0)}
                </div>
              )}
              {showAvatarTooltip && pattern.authorName && (
                <div className="absolute bottom-full right-0 mb-2 menu-spring-enter" style={{ transformOrigin: "bottom right" }}>
                  <div className="bg-background border border-border rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                    <span className="text-xs font-medium text-foreground">{pattern.authorName}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
