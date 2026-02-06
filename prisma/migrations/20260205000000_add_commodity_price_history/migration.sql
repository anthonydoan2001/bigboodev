-- CreateTable
CREATE TABLE "commodity_price_history" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commodity_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commodity_price_history_symbol_recorded_at_idx" ON "commodity_price_history"("symbol", "recorded_at");
