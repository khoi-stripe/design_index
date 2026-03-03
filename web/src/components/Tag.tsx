"use client";

import Link from "next/link";

const baseClass =
  "inline-flex items-center shrink-0 gap-1 px-2 py-[2px] text-[11px] font-medium bg-accent text-white rounded-[3px] whitespace-nowrap transition-colors";

export function Tag({
  label,
  href,
  onClick,
  onRemove,
}: {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: () => void;
}) {
  const interactive = href || onClick || onRemove;
  const hoverClass = interactive ? "hover:bg-accent-hover cursor-pointer" : "";

  const content = (
    <>
      {label}
      {onRemove && (
        <span
          role="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-white/60 cursor-pointer"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClass} ${hoverClass}`}>
        {content}
      </Link>
    );
  }

  if (onClick || onRemove) {
    return (
      <button onClick={onClick} className={`${baseClass} ${hoverClass}`}>
        {content}
      </button>
    );
  }

  return <span className={baseClass}>{content}</span>;
}
