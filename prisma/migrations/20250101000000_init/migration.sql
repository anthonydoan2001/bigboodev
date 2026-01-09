-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLAN_TO_WATCH',
    "externalId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "rating" DOUBLE PRECISION,
    "year" INTEGER,
    "episodes" INTEGER,
    "progress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameListItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "platform" TEXT,
    "externalId" TEXT,
    "coverImage" TEXT,
    "description" TEXT,
    "rating" INTEGER,
    "hoursPlayed" INTEGER,
    "completionPercent" INTEGER,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportPreference" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "teams" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_externalId_type_key" ON "WatchlistItem"("externalId", "type");

-- CreateIndex
CREATE INDEX "WatchlistItem_type_idx" ON "WatchlistItem"("type");

-- CreateIndex
CREATE INDEX "WatchlistItem_status_idx" ON "WatchlistItem"("status");

-- CreateIndex
CREATE INDEX "WatchlistItem_createdAt_idx" ON "WatchlistItem"("createdAt");

-- CreateIndex
CREATE INDEX "GameListItem_status_idx" ON "GameListItem"("status");

-- CreateIndex
CREATE INDEX "GameListItem_platform_idx" ON "GameListItem"("platform");

-- CreateIndex
CREATE INDEX "GameListItem_addedAt_idx" ON "GameListItem"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SportPreference_sport_key" ON "SportPreference"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_key_key" ON "UserSettings"("key");
