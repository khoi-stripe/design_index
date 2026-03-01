const API_BASE = "http://localhost:3000/api";

export async function uploadScreenshot(
  bytes: Uint8Array
): Promise<{ url: string; thumbnailUrl: string }> {
  const blob = new Blob([bytes], { type: "image/png" });
  const formData = new FormData();
  formData.append("file", blob, "screenshot.png");

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return { url: data.url, thumbnailUrl: data.thumbnailUrl };
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
  authorName: string;
  authorAvatar: string;
  tags: string[];
}) {
  const res = await fetch(`${API_BASE}/patterns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create pattern");
  return res.json();
}

export async function fetchTags(): Promise<
  { id: string; name: string; slug: string; category: string }[]
> {
  const res = await fetch(`${API_BASE}/tags`);
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}
