-- CreateTable
CREATE TABLE "stock_quotes" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "current_price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "percent_change" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "previous_close" DOUBLE PRECISION NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_quotes_symbol_idx" ON "stock_quotes"("symbol");

-- CreateIndex
CREATE INDEX "stock_quotes_last_updated_idx" ON "stock_quotes"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "stock_quotes_symbol_key" ON "stock_quotes"("symbol");
