-- CreateTable
CREATE TABLE "daily_quotes" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "author_slug" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "tags" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'quotable',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_quotes_date_key" ON "daily_quotes"("date");

-- CreateIndex
CREATE INDEX "daily_quotes_date_idx" ON "daily_quotes"("date");
