"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const baseClass =
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-brand-600/20 text-brand-200 rounded-[4px] transition-colors hover:bg-brand-600/30 hover:text-brand-100";

export function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 2.75C0 1.7835 0.783502 1 1.75 1H5.5C6.50522 1 7.40385 1.45637 8 2.17322C8.59615 1.45637 9.49478 1 10.5 1H14.25C15.2165 1 16 1.7835 16 2.75V13.25C16 14.2165 15.2165 15 14.25 15H1.75C0.783502 15 0 14.2165 0 13.25V2.75ZM7.25 13.5V4.25C7.25 3.2835 6.4665 2.5 5.5 2.5H1.75C1.61193 2.5 1.5 2.61193 1.5 2.75V13.25C1.5 13.3881 1.61193 13.5 1.75 13.5H7.25ZM8.75 13.5H14.25C14.3881 13.5 14.5 13.3881 14.5 13.25V2.75C14.5 2.61193 14.3881 2.5 14.25 2.5H12.4961V6.25C12.4961 6.66421 12.1603 7 11.7461 7C11.3319 7 10.9961 6.66421 10.9961 6.25V2.5H10.5C9.5335 2.5 8.75 3.2835 8.75 4.25V13.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MetadataChip({
  label,
  href,
  icon,
  className = "",
}: {
  label: string;
  href?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const classes = `${baseClass} ${className}`.trim();

  const content = (
    <>
      {icon}
      {label}
    </>
  );

  if (href) {
    return <Link href={href} className={classes}>{content}</Link>;
  }

  return <span className={classes}>{content}</span>;
}
