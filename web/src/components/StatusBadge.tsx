"use client";

type StatusDef = {
  label: string;
  dark: { bg: string; text: string };
  light: { bg: string; text: string };
};

const statusStyles: Record<string, StatusDef> = {
  official: {
    label: "Official",
    dark: { bg: "bg-[rgba(103,93,255,0.12)]", text: "text-[#675DFF]" },
    light: { bg: "bg-[#675DFF]", text: "text-white" },
  },
  community: {
    label: "In-use",
    dark: { bg: "bg-[rgba(68,207,149,0.12)]", text: "text-[#3ECF8E]" },
    light: { bg: "bg-[#3ECF8E]", text: "text-white" },
  },
  concept: {
    label: "Concept",
    dark: { bg: "bg-[rgba(99,161,255,0.12)]", text: "text-[#5B9BF8]" },
    light: { bg: "bg-[#5B9BF8]", text: "text-white" },
  },
};

export function StatusBadge({
  status,
  variant = "dark",
  className = "",
}: {
  status: string;
  variant?: "dark" | "light";
  className?: string;
}) {
  const normalized = status?.toLowerCase().trim();
  if (!normalized || !(normalized in statusStyles)) return null;

  const def = statusStyles[normalized];
  const styles = def[variant];

  return (
    <span
      className={`inline-flex items-center text-[11px] px-2 py-[2px] font-medium rounded-[3px] whitespace-nowrap ${styles.bg} ${styles.text} ${className}`}
    >
      {def.label}
    </span>
  );
}
