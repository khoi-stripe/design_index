"use client";

const statusStyles: Record<
  string,
  { bg: string; text: string; border?: string }
> = {
  official: {
    bg: "bg-accent",
    text: "text-white",
  },
  community: {
    bg: "bg-surface",
    text: "text-muted",
  },
  concept: {
    bg: "bg-transparent",
    text: "text-muted",
    border: "border border-dashed border-border",
  },
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const normalized = status?.toLowerCase().trim();
  if (!normalized || !(normalized in statusStyles)) return null;

  const styles = statusStyles[normalized];
  const displayText = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex items-center text-[11px] px-2 py-[1px] font-medium rounded-[3px] whitespace-nowrap ${styles.bg} ${styles.text} ${styles.border ?? ""} ${className}`}
    >
      {displayText}
    </span>
  );
}
