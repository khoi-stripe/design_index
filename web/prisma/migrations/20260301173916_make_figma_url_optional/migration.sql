-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PatternVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "figmaUrl" TEXT NOT NULL DEFAULT '',
    "screenshotUrl" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "dominantColor" TEXT NOT NULL DEFAULT '',
    "authorName" TEXT NOT NULL DEFAULT '',
    "authorAvatar" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatternVersion_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PatternVersion" ("authorAvatar", "authorName", "createdAt", "description", "dominantColor", "figmaUrl", "id", "label", "patternId", "screenshotUrl", "thumbnailUrl", "versionNumber") SELECT "authorAvatar", "authorName", "createdAt", "description", "dominantColor", "figmaUrl", "id", "label", "patternId", "screenshotUrl", "thumbnailUrl", "versionNumber" FROM "PatternVersion";
DROP TABLE "PatternVersion";
ALTER TABLE "new_PatternVersion" RENAME TO "PatternVersion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
