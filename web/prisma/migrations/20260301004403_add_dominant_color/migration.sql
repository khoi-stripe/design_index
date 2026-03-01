-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "figmaFileKey" TEXT NOT NULL DEFAULT '',
    "figmaNodeId" TEXT NOT NULL DEFAULT '',
    "figmaDeepLink" TEXT NOT NULL DEFAULT '',
    "figmaPageName" TEXT NOT NULL DEFAULT '',
    "screenshotUrl" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "dominantColor" TEXT NOT NULL DEFAULT '',
    "authorName" TEXT NOT NULL DEFAULT '',
    "authorAvatar" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'pattern',
    "status" TEXT NOT NULL DEFAULT 'published',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pattern" ("authorAvatar", "authorName", "category", "createdAt", "description", "featured", "figmaDeepLink", "figmaFileKey", "figmaNodeId", "figmaPageName", "id", "screenshotUrl", "status", "thumbnailUrl", "title", "updatedAt") SELECT "authorAvatar", "authorName", "category", "createdAt", "description", "featured", "figmaDeepLink", "figmaFileKey", "figmaNodeId", "figmaPageName", "id", "screenshotUrl", "status", "thumbnailUrl", "title", "updatedAt" FROM "Pattern";
DROP TABLE "Pattern";
ALTER TABLE "new_Pattern" RENAME TO "Pattern";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
