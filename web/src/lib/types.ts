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

export type Pattern = {
  id: string;
  title: string;
  description: string;
  category: string;
  screenshotUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  authorName: string;
  authorAvatar: string;
  figmaDeepLink: string;
  featured: boolean;
  createdAt: string;
  tags: PatternTag[];
  images?: PatternImage[];
};
