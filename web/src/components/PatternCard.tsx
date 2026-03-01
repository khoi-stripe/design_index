"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Pattern } from "@/lib/types";

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
  const bgColor = currentImage?.dominantColor || "#131318";

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
          background: "radial-gradient(circle at center, #533AFDcc 0%, #533AFD40 50%, transparent 75%)",
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
            <span className="absolute top-2 left-2 z-10 px-2.5 py-1 text-xs font-medium bg-black/70 text-white rounded-[4px] capitalize opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {pattern.category}
            </span>
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
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 z-10"
                aria-label="Previous image"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.6187 0.381282C11.9604 0.72299 11.9604 1.27701 11.6187 1.61872L5.23744 8L11.6187 14.3813C11.9604 14.723 11.9604 15.277 11.6187 15.6187C11.277 15.9604 10.723 15.9604 10.3813 15.6187L3.38128 8.61872C3.03957 8.27701 3.03957 7.72299 3.38128 7.38128L10.3813 0.381282C10.723 0.0395728 11.277 0.0395728 11.6187 0.381282Z" fill="#474E5A" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 z-10"
                aria-label="Next image"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.38128 0.381282C4.03957 0.72299 4.03957 1.27701 4.38128 1.61872L10.7626 8L4.38128 14.3813C4.03957 14.723 4.03957 15.277 4.38128 15.6187C4.72299 15.9604 5.27701 15.9604 5.61872 15.6187L12.6187 8.61872C12.9604 8.27701 12.9604 7.72299 12.6187 7.38128L5.61872 0.381282C5.27701 0.0395728 4.72299 0.0395728 4.38128 0.381282Z" fill="#474E5A" />
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
        <div className="bg-black p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3 className="font-medium text-sm text-foreground leading-tight tracking-tight">
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
                  className="px-2 py-[2px] text-[11px] font-medium bg-accent text-white rounded-[2px] hover:bg-accent-light transition-colors cursor-pointer"
                >
                  {tag.name}
                </span>
              ))}
              {pattern.tags.length > 3 && (
                <span className="px-2 py-[2px] text-[11px] text-muted shrink-0 whitespace-nowrap">
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
