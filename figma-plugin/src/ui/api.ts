const API_BASE = "http://localhost:3000/api";

export async function uploadScreenshot(
  bytes: Uint8Array
): Promise<{ url: string; thumbnailUrl: string; dominantColor: string }> {
  const blob = new Blob([bytes], { type: "image/png" });
  const formData = new FormData();
  formData.append("file", blob, "screenshot.png");

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return { url: data.url, thumbnailUrl: data.thumbnailUrl, dominantColor: data.dominantColor || "" };
}

export async function createPattern(data: {
  title: string;
  description: string;
  category: string;
  figmaFileKey: string;
  figmaNodeId: string;
  figmaPageName: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  tags: string[];
  libraryId?: string;
  status?: string;
  additionalImages?: {
    screenshotUrl: string;
    thumbnailUrl: string;
    dominantColor: string;
    label: string;
    nodeId: string;
    nodeName: string;
    sortOrder: number;
  }[];
}) {
  const res = await fetch(`${API_BASE}/patterns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create pattern");
  return res.json();
}

export async function fetchLibraries(): Promise<
  { id: string; name: string; slug: string; status: string; description: string }[]
> {
  const res = await fetch(`${API_BASE}/libraries`);
  if (!res.ok) throw new Error("Failed to fetch libraries");
  return res.json();
}

export async function fetchTags(authorName?: string): Promise<
  { id: string; name: string; slug: string; category: string }[]
> {
  const params = new URLSearchParams();
  if (authorName) params.set("authorName", authorName);
  const res = await fetch(`${API_BASE}/tags?${params}`);
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

export async function searchPatterns(query: string): Promise<{
  patterns: {
    id: string;
    title: string;
    description: string;
    screenshotUrl: string;
    thumbnailUrl: string;
    dominantColor: string;
    authorName: string;
    authorAvatar: string;
    category: string;
    createdAt: string;
    tags: { tag: { id: string; name: string; slug: string } }[];
  }[];
  total: number;
}> {
  const params = new URLSearchParams({ search: query, limit: "10" });
  const res = await fetch(`${API_BASE}/patterns?${params}`);
  if (!res.ok) throw new Error("Failed to search patterns");
  return res.json();
}

export async function addVersion(
  patternId: string,
  data: {
    screenshotUrl: string;
    thumbnailUrl: string;
    dominantColor: string;
    description?: string;
    tags?: string[];
    label?: string;
    additionalImages?: {
      screenshotUrl: string;
      thumbnailUrl: string;
      dominantColor: string;
      label: string;
      nodeId: string;
      nodeName: string;
      sortOrder: number;
    }[];
  }
) {
  const res = await fetch(`${API_BASE}/patterns/${patternId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add version");
  return res.json();
}

export async function updatePatternMeta(
  patternId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    libraryId?: string;
    status?: string;
  }
) {
  const res = await fetch(`${API_BASE}/patterns/${patternId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update pattern");
  return res.json();
}
