export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type PatternTag = {
  tag: Tag;
};

export type PatternImage = {
  id: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
};

export type Library = {
  id: string;
  name: string;
  slug: string;
  team: string;
  description: string;
  status: string;
  _count?: { patterns: number };
};

export type Pattern = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  effectiveStatus: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  figmaDeepLink: string;
  featured: boolean;
  libraryId: string | null;
  library?: Library | null;
  createdAt: string;
  tags: PatternTag[];
  images?: PatternImage[];
  _count?: { upvotes: number };
};
