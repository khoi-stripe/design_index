import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { fetchTags } from "../api";
import { MAX_SUGGESTED } from "../shared/constants";
import type { TagItem } from "../shared/types";

export function useTags(userName: string | undefined) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [recentTags, setRecentTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [typeaheadIndex, setTypeaheadIndex] = useState(-1);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  useEffect(() => {
    async function loadTags() {
      try {
        const all = await fetchTags();
        const mapped = all.map((t) => ({ slug: t.slug, name: t.name }));
        setAllTags(mapped);

        if (userName) {
          const userTags = await fetchTags(userName);
          if (userTags.length > 0) {
            setRecentTags(userTags.map((t) => ({ slug: t.slug, name: t.name })));
            return;
          }
        }

        setRecentTags(mapped);
      } catch {
        // API unavailable
      }
    }
    loadTags();
  }, [userName]);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const addCustomTag = () => {
    const slug = customTag.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (slug && !selectedTags.includes(slug)) {
      setSelectedTags((prev) => [...prev, slug]);
    }
    setCustomTag("");
    setShowTypeahead(false);
    setTypeaheadIndex(-1);
  };

  const typeaheadMatches = customTag.trim().length > 0
    ? allTags
        .filter(
          (t) =>
            !selectedTags.includes(t.slug) &&
            (t.name.toLowerCase().includes(customTag.toLowerCase()) ||
              t.slug.includes(customTag.toLowerCase().replace(/\s+/g, "-")))
        )
        .slice(0, 6)
    : [];

  const selectTypeaheadItem = (slug: string) => {
    if (!selectedTags.includes(slug)) {
      setSelectedTags((prev) => [...prev, slug]);
    }
    setCustomTag("");
    setShowTypeahead(false);
    setTypeaheadIndex(-1);
    tagInputRef.current?.focus();
  };

  const handleTagInputKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setTypeaheadIndex((i) => Math.min(i + 1, typeaheadMatches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTypeaheadIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (typeaheadIndex >= 0 && typeaheadMatches[typeaheadIndex]) {
        selectTypeaheadItem(typeaheadMatches[typeaheadIndex].slug);
      } else {
        addCustomTag();
      }
    } else if (e.key === "Escape") {
      setShowTypeahead(false);
      setTypeaheadIndex(-1);
    }
  };

  const recentToShow = recentTags.filter(
    (t) => !selectedTags.includes(t.slug)
  ).slice(0, MAX_SUGGESTED);

  const handleInputChange = (value: string) => {
    setCustomTag(value);
    setShowTypeahead(value.trim().length > 0);
    setTypeaheadIndex(-1);
  };

  const handleInputFocus = () => {
    if (customTag.trim().length > 0) setShowTypeahead(true);
  };

  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setShowTypeahead(false), 150);
  };

  return {
    selectedTags,
    setSelectedTags,
    customTag,
    showTypeahead,
    typeaheadIndex,
    typeaheadMatches,
    recentToShow,
    tagInputRef,
    toggleTag,
    addCustomTag,
    selectTypeaheadItem,
    handleTagInputKeyDown,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
  };
}
