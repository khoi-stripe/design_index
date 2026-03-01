"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Crumb = { id: string; title: string };

const STORAGE_KEY = "breadcrumb-trail";

function readTrail(): Crumb[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTrail(trail: Crumb[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trail));
}

export function clearBreadcrumbTrail() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function Breadcrumb({
  currentId,
  currentTitle,
}: {
  currentId: string;
  currentTitle: string;
}) {
  const router = useRouter();
  const [trail, setTrail] = useState<Crumb[]>([]);
  const [expanded, setExpanded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let existing = readTrail();
    const idx = existing.findIndex((c) => c.id === currentId);

    if (idx !== -1) {
      existing = existing.slice(0, idx + 1);
      existing[idx] = { id: currentId, title: currentTitle };
    } else {
      existing.push({ id: currentId, title: currentTitle });
    }

    writeTrail(existing);
    setTrail(existing);
  }, [currentId, currentTitle]);

  const handleCrumbClick = (crumb: Crumb) => {
    const existing = readTrail();
    const idx = existing.findIndex((c) => c.id === crumb.id);
    if (idx !== -1) {
      const truncated = existing.slice(0, idx + 1);
      writeTrail(truncated);
    }
    router.push(`/patterns/${crumb.id}`);
  };

  const handleRootClick = () => {
    clearBreadcrumbTrail();
    router.push("/");
  };

  const previousCrumbs = trail.slice(0, -1);
  const currentCrumb = trail[trail.length - 1];
  const needsCollapse = previousCrumbs.length > 2 && !expanded;

  let visiblePrevious: (Crumb | "ellipsis")[];
  if (needsCollapse) {
    visiblePrevious = [previousCrumbs[0], "ellipsis", previousCrumbs[previousCrumbs.length - 1]];
  } else {
    visiblePrevious = previousCrumbs;
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm min-w-0">
      <button
        onClick={handleRootClick}
        className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors shrink-0"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 12L12 9.45516V0L0 2.57459V12Z"
            fill="currentColor"
          />
        </svg>
        <span className="text-xs font-semibold">Design.Index</span>
      </button>

      {visiblePrevious.map((item, i) => (
        <span key={item === "ellipsis" ? "ellipsis" : item.id} className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted/40 shrink-0">/</span>
          {item === "ellipsis" ? (
            <button
              onClick={() => setExpanded(true)}
              className="text-muted hover:text-foreground transition-colors text-xs px-1"
            >
              ...
            </button>
          ) : (
            <button
              onClick={() => handleCrumbClick(item)}
              className="text-muted hover:text-foreground transition-colors text-xs truncate max-w-[160px]"
            >
              {item.title}
            </button>
          )}
        </span>
      ))}

      {currentCrumb && (
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted/40 shrink-0">/</span>
          <span className="text-foreground text-xs font-medium truncate max-w-[200px]">
            {currentCrumb.title}
          </span>
        </span>
      )}
    </nav>
  );
}
