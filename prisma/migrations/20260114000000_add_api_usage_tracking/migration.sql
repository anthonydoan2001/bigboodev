-- CreateTable
CREATE TABLE "api_usage" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "endpoint" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "status_code" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_usage_api_name_timestamp_idx" ON "api_usage"("api_name", "timestamp");

-- CreateIndex
CREATE INDEX "api_usage_timestamp_idx" ON "api_usage"("timestamp");
