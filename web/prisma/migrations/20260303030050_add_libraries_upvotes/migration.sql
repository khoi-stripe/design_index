-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "team" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'community',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Upvote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upvote_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "category" TEXT NOT NULL DEFAULT 'flow',
    "status" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "libraryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pattern_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pattern" ("authorAvatar", "authorName", "category", "createdAt", "description", "dominantColor", "featured", "figmaDeepLink", "figmaFileKey", "figmaNodeId", "figmaPageName", "id", "screenshotUrl", "status", "thumbnailUrl", "title", "updatedAt") SELECT "authorAvatar", "authorName", "category", "createdAt", "description", "dominantColor", "featured", "figmaDeepLink", "figmaFileKey", "figmaNodeId", "figmaPageName", "id", "screenshotUrl", "status", "thumbnailUrl", "title", "updatedAt" FROM "Pattern";
DROP TABLE "Pattern";
ALTER TABLE "new_Pattern" RENAME TO "Pattern";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Library_slug_key" ON "Library"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_patternId_visitorId_key" ON "Upvote"("patternId", "visitorId");
