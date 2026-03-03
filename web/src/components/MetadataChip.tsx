"use client";

import Link from "next/link";

const baseClass =
  "inline-block px-2.5 py-1 text-xs font-medium bg-accent/15 text-accent rounded-[4px] lowercase";

export function MetadataChip({
  label,
  href,
  className = "",
}: {
  label: string;
  href?: string;
  className?: string;
}) {
  const classes = `${baseClass} ${className}`.trim();

  if (href) {
    return <Link href={href} className={classes}>{label}</Link>;
  }

  return <span className={classes}>{label}</span>;
}
