-- AlterTable: Add new columns to api_usage table
ALTER TABLE "api_usage" ADD COLUMN "method" TEXT DEFAULT 'GET';
ALTER TABLE "api_usage" ADD COLUMN "response_time" INTEGER;
ALTER TABLE "api_usage" ADD COLUMN "request_size" INTEGER;
ALTER TABLE "api_usage" ADD COLUMN "response_size" INTEGER;
ALTER TABLE "api_usage" ADD COLUMN "error_type" TEXT;
ALTER TABLE "api_usage" ADD COLUMN "error_message" TEXT;
ALTER TABLE "api_usage" ADD COLUMN "cost_credits" DOUBLE PRECISION;
ALTER TABLE "api_usage" ADD COLUMN "cached" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "api_usage" ADD COLUMN "user_id" TEXT;

-- Drop old indexes
DROP INDEX IF EXISTS "api_usage_api_name_timestamp_idx";
DROP INDEX IF EXISTS "api_usage_timestamp_idx";

-- Create optimized indexes for common queries
CREATE INDEX "api_usage_api_name_timestamp_idx" ON "api_usage"("api_name", "timestamp" DESC);
CREATE INDEX "api_usage_timestamp_idx" ON "api_usage"("timestamp" DESC);
CREATE INDEX "api_usage_api_name_success_timestamp_idx" ON "api_usage"("api_name", "success", "timestamp");
CREATE INDEX "api_usage_success_timestamp_idx" ON "api_usage"("success", "timestamp");
CREATE INDEX "api_usage_api_name_endpoint_timestamp_idx" ON "api_usage"("api_name", "endpoint", "timestamp");

-- CreateTable: api_usage_aggregates
CREATE TABLE "api_usage_aggregates" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "endpoint" TEXT,
    "aggregation_type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_requests" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL,
    "error_count" INTEGER NOT NULL,
    "cached_count" INTEGER NOT NULL,
    "avg_response_time" DOUBLE PRECISION,
    "max_response_time" INTEGER,
    "min_response_time" INTEGER,
    "rate_limit_errors" INTEGER NOT NULL DEFAULT 0,
    "timeout_errors" INTEGER NOT NULL DEFAULT 0,
    "server_errors" INTEGER NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_usage_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_aggregates_api_name_aggregation_type_period_st_key" ON "api_usage_aggregates"("api_name", "aggregation_type", "period_start");
CREATE INDEX "api_usage_aggregates_api_name_aggregation_type_period_st_idx" ON "api_usage_aggregates"("api_name", "aggregation_type", "period_start");
CREATE INDEX "api_usage_aggregates_period_start_aggregation_type_idx" ON "api_usage_aggregates"("period_start", "aggregation_type");

-- CreateTable: api_alerts
CREATE TABLE "api_alerts" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_alerts_api_name_alert_type_period_key" ON "api_alerts"("api_name", "alert_type", "period");
CREATE INDEX "api_alerts_api_name_enabled_idx" ON "api_alerts"("api_name", "enabled");
