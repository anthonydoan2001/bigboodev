-- CreateTable
CREATE TABLE "gas_prices" (
    "station_id" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "regular" DOUBLE PRECISION NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gas_prices_pkey" PRIMARY KEY ("station_id")
);
