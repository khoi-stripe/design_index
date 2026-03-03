/**
 * Dumps the current SQLite database to a JSON fixtures file
 * that can be used for static demo mode (no DB required).
 *
 * Usage: npx tsx scripts/export-fixtures.ts
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const prisma = new PrismaClient();

  const [libraries, patterns, tags, patternTags, patternImages, patternVersions, patternVersionTags, upvotes] =
    await Promise.all([
      prisma.library.findMany({ orderBy: { name: "asc" } }),
      prisma.pattern.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
      prisma.patternTag.findMany(),
      prisma.patternImage.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.patternVersion.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.patternVersionTag.findMany(),
      prisma.upvote.findMany(),
    ]);

  const fixtures = {
    libraries,
    patterns,
    tags,
    patternTags,
    patternImages,
    patternVersions,
    patternVersionTags,
    upvotes,
  };

  const outPath = join(__dirname, "../src/data/fixtures.json");
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2));

  console.log(`Exported fixtures to ${outPath}`);
  console.log(
    `  ${libraries.length} libraries, ${patterns.length} patterns, ${tags.length} tags, ` +
    `${patternImages.length} images, ${patternVersions.length} versions, ${upvotes.length} upvotes`
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
