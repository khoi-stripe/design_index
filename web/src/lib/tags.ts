import { prisma } from "./db";
import { titleFromSlug } from "./utils";

export async function ensureTags(slugs: string[]): Promise<{ tagId: string }[]> {
  const results: { tagId: string }[] = [];
  for (const slug of slugs) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: titleFromSlug(slug), slug },
    });
    results.push({ tagId: tag.id });
  }
  return results;
}
