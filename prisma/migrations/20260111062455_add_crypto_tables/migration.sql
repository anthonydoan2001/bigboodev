-- CreateTable
CREATE TABLE "crypto_ids" (
    "symbol" TEXT NOT NULL,
    "cmc_id" INTEGER NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_ids_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "crypto_metadata" (
    "cmc_id" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "website" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_metadata_pkey" PRIMARY KEY ("cmc_id")
);

-- CreateTable
CREATE TABLE "crypto_quotes" (
    "cmc_id" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "volume_24h" DOUBLE PRECISION,
    "market_cap" DOUBLE PRECISION,
    "percent_change_1h" DOUBLE PRECISION,
    "percent_change_24h" DOUBLE PRECISION,
    "percent_change_7d" DOUBLE PRECISION,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_quotes_pkey" PRIMARY KEY ("cmc_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_ids_cmc_id_key" ON "crypto_ids"("cmc_id");

-- CreateIndex
CREATE INDEX "crypto_metadata_symbol_idx" ON "crypto_metadata"("symbol");

-- CreateIndex
CREATE INDEX "crypto_metadata_last_updated_idx" ON "crypto_metadata"("last_updated");

-- CreateIndex
CREATE INDEX "crypto_quotes_symbol_idx" ON "crypto_quotes"("symbol");

-- CreateIndex
CREATE INDEX "crypto_quotes_last_updated_idx" ON "crypto_quotes"("last_updated");
