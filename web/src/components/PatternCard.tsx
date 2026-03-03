"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Pattern } from "@/lib/types";
import { Tag } from "@/components/Tag";
import { MetadataChip, LibraryIcon } from "@/components/MetadataChip";
const STATUS_COLORS: Record<string, string> = {
  official: "#675DFF",
  "in-use": "#3ECF8E",
  concept: "#5B9BF8",
};

function isLightColor(color: string) {
  if (!color) return false;
  const normalized = color.trim().toLowerCase();
  let r = 0;
  let g = 0;
  let b = 0;

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return false;
    }
  } else if (normalized.startsWith("rgb")) {
    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return false;
    r = Number(match[1]);
    g = Number(match[2]);
    b = Number(match[3]);
  } else {
    return false;
  }

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62;
}

export function PatternCard({
  pattern,
  priority = false,
}: {
  pattern: Pattern;
  priority?: boolean;
}) {
  const router = useRouter();
  const [showAvatarTooltip, setShowAvatarTooltip] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const allImages = useMemo(() => {
    const primary = {
      src: pattern.thumbnailUrl || pattern.screenshotUrl,
      dominantColor: pattern.dominantColor,
    };
    const additional = (pattern.images || []).map((img) => ({
      src: img.thumbnailUrl || img.screenshotUrl,
      dominantColor: img.dominantColor,
    }));
    return primary.src ? [primary, ...additional] : additional;
  }, [pattern]);

  const hasMultiple = allImages.length > 1;
  const currentImage = allImages[activeIndex] || allImages[0];
  const imgSrc = currentImage?.src;
  const bgColor = currentImage?.dominantColor || "var(--surface)";
  const useDarkArrows = useMemo(() => isLightColor(bgColor), [bgColor]);
  const cardArrowClass = useDarkArrows
    ? "bg-white/70 text-black hover:bg-white/85 hover:border-black/20"
    : "bg-black/40 text-white hover:bg-black/60 hover:border-white/40";

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setActiveIndex((i) => (i + 1) % allImages.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };

  return (
    <Link href={`/patterns/${pattern.id}`} className="group block relative hover:z-10">
      <div
        className="absolute -inset-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, color-mix(in srgb, var(--accent) 80%, transparent) 0%, color-mix(in srgb, var(--accent) 25%, transparent) 50%, transparent 75%)",
          filter: "blur(32px)",
        }}
      />
      <div
        className="relative rounded-[4px] overflow-hidden transition-all duration-200 group-hover:-translate-y-1"
      >
        <div
          className="relative aspect-square flex items-center justify-center p-5 transition-colors duration-300"
          style={{ backgroundColor: bgColor }}
        >
          {!imageLoaded && imgSrc && (
            <div className="absolute inset-0 bg-surface animate-pulse" />
          )}
          {pattern.category && (
            <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="px-2 py-[2px] text-[11px] font-medium bg-black/60 text-white rounded-[3px] whitespace-nowrap capitalize">
                {pattern.category}
              </span>
            </div>
          )}
          {imgSrc ? (
            <Image
              key={imgSrc}
              src={imgSrc}
              alt={pattern.title}
              fill
              className={`object-contain p-5 group-hover:scale-[1.02] transition-all duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority && activeIndex === 0}
              onLoad={() => setImageLoaded(true)}
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

          {hasMultiple && (
            <>
              <button
                onClick={goPrev}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border border-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 ${cardArrowClass}`}
                aria-label="Previous image"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6.38128 1.38128C6.72299 1.03957 7.27701 1.03957 7.61872 1.38128C7.96043 1.72299 7.96043 2.27701 7.61872 2.61872L3.11244 7.125H15C15.4833 7.125 15.875 7.51675 15.875 8C15.875 8.48325 15.4833 8.875 15 8.875H3.11244L7.61872 13.3813C7.96043 13.723 7.96043 14.277 7.61872 14.6187C7.27701 14.9604 6.72299 14.9604 6.38128 14.6187L0.381282 8.61872C0.210427 8.44786 0.125 8.22393 0.125 8C0.125 7.77607 0.210427 7.55214 0.381282 7.38128L6.38128 1.38128Z" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border border-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 ${cardArrowClass}`}
                aria-label="Next image"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M9.61872 1.38128C9.27701 1.03957 8.72299 1.03957 8.38128 1.38128C8.03957 1.72299 8.03957 2.27701 8.38128 2.61872L12.8876 7.125H1C0.516751 7.125 0.125 7.51675 0.125 8C0.125 8.48325 0.516751 8.875 1 8.875H12.8876L8.38128 13.3813C8.03957 13.723 8.03957 14.277 8.38128 14.6187C8.72299 14.9604 9.27701 14.9604 9.61872 14.6187L15.6187 8.61872C15.7896 8.44786 15.875 8.22393 15.875 8C15.875 7.77607 15.7896 7.55214 15.6187 7.38128L9.61872 1.38128Z" fill="currentColor" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveIndex(i);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      i === activeIndex
                        ? "bg-white scale-125"
                        : "bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="bg-card-bg p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {pattern.effectiveStatus && STATUS_COLORS[pattern.effectiveStatus] && (
                <span
                  className="shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[pattern.effectiveStatus] }}
                />
              )}
              <h3 className="font-medium text-sm text-foreground leading-tight tracking-tight min-w-0 truncate">
                {pattern.title}
              </h3>
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
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-medium">
                    {pattern.authorName.charAt(0)}
                  </div>
                )}
                {showAvatarTooltip && pattern.authorName && (
                  <div
                    className="absolute bottom-full right-0 mb-2 menu-spring-enter bg-background border border-border rounded-[3px] shadow-lg whitespace-nowrap flex items-center"
                    style={{ transformOrigin: "bottom right", height: 20, paddingInline: 8, fontSize: 11, fontWeight: 500, color: "var(--foreground)" }}
                  >
                    {pattern.authorName}
                  </div>
                )}
              </div>
            )}
          </div>
          {(pattern.library || pattern.tags.length > 0) && (
            <div className="flex items-center gap-1 overflow-hidden pr-8">
              {pattern.library && (
                <MetadataChip
                  label={pattern.library.name}
                  icon={<LibraryIcon />}
                  className="shrink-0"
                  href={`/libraries/${pattern.library.slug}`}
                  onClick={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();
                    router.push(`/libraries/${pattern.library!.slug}`);
                  }}
                />
              )}
              {pattern.tags.map(({ tag }) => (
                <Tag
                  key={tag.id}
                  label={tag.name}
                  onClick={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();
                    router.push(`/?tag=${encodeURIComponent(tag.slug)}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
