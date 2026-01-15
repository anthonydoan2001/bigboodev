-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLAN_TO_PLAY',
    "external_id" TEXT NOT NULL,
    "image_url" TEXT,
    "rating" DOUBLE PRECISION,
    "released" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_games" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "released" TEXT,
    "external_id" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_status_idx" ON "games"("status");

-- CreateIndex
CREATE INDEX "games_created_at_idx" ON "games"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "games_external_id_key" ON "games"("external_id");

-- CreateIndex
CREATE INDEX "top_games_last_updated_idx" ON "top_games"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "top_games_external_id_key" ON "top_games"("external_id");
