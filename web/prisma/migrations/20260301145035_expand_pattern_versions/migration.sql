/*
  Warnings:

  - Added the required column `versionNumber` to the `PatternVersion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PatternVersionTag" (
    "versionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("versionId", "tagId"),
    CONSTRAINT "PatternVersionTag_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PatternVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatternVersionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PatternVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "figmaUrl" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "dominantColor" TEXT NOT NULL DEFAULT '',
    "authorName" TEXT NOT NULL DEFAULT '',
    "authorAvatar" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatternVersion_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatternVersion" ("createdAt", "figmaUrl", "id", "label", "patternId", "versionNumber") SELECT "createdAt", "figmaUrl", "id", "label", "patternId", 1 FROM "PatternVersion";
DROP TABLE "PatternVersion";
ALTER TABLE "new_PatternVersion" RENAME TO "PatternVersion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
