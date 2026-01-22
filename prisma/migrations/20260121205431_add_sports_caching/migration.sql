-- CreateTable
CREATE TABLE "game_scores" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "home_score" INTEGER NOT NULL,
    "away_score" INTEGER NOT NULL,
    "home_team_logo" TEXT,
    "away_team_logo" TEXT,
    "status" TEXT NOT NULL,
    "quarter" TEXT,
    "time_remaining" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "playoff_round" TEXT,
    "odds" JSONB,
    "top_scorer" JSONB,
    "expires_at" TIMESTAMP(3),
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_performers" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "image_url" TEXT,
    "stats" JSONB NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_performers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_scores_game_id_sport_date_key" ON "game_scores"("game_id", "sport", "date");

-- CreateIndex
CREATE INDEX "game_scores_sport_date_idx" ON "game_scores"("sport", "date");

-- CreateIndex
CREATE INDEX "game_scores_sport_status_idx" ON "game_scores"("sport", "status");

-- CreateIndex
CREATE INDEX "game_scores_status_expires_at_idx" ON "game_scores"("status", "expires_at");

-- CreateIndex
CREATE INDEX "game_scores_last_updated_idx" ON "game_scores"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "top_performers_sport_date_name_key" ON "top_performers"("sport", "date", "name");

-- CreateIndex
CREATE INDEX "top_performers_sport_date_idx" ON "top_performers"("sport", "date");

-- CreateIndex
CREATE INDEX "top_performers_last_updated_idx" ON "top_performers"("last_updated");

-- CreateIndex
CREATE INDEX "top_performers_sport_last_updated_idx" ON "top_performers"("sport", "last_updated");
