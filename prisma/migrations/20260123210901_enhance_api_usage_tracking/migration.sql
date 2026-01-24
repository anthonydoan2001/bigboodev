-- AlterTable: Add new columns to api_usage (using DO block to check if columns exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='method') THEN
        ALTER TABLE "api_usage" ADD COLUMN "method" TEXT DEFAULT 'GET';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='response_time') THEN
        ALTER TABLE "api_usage" ADD COLUMN "response_time" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='request_size') THEN
        ALTER TABLE "api_usage" ADD COLUMN "request_size" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='response_size') THEN
        ALTER TABLE "api_usage" ADD COLUMN "response_size" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='error_type') THEN
        ALTER TABLE "api_usage" ADD COLUMN "error_type" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='error_message') THEN
        ALTER TABLE "api_usage" ADD COLUMN "error_message" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='cost_credits') THEN
        ALTER TABLE "api_usage" ADD COLUMN "cost_credits" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='cached') THEN
        ALTER TABLE "api_usage" ADD COLUMN "cached" BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='api_usage' AND column_name='user_id') THEN
        ALTER TABLE "api_usage" ADD COLUMN "user_id" TEXT;
    END IF;
END $$;

-- Drop old indexes
DROP INDEX IF EXISTS "api_usage_api_name_timestamp_idx";
DROP INDEX IF EXISTS "api_usage_timestamp_idx";

-- Create new optimized indexes
CREATE INDEX IF NOT EXISTS "api_usage_api_name_timestamp_idx" ON "api_usage"("api_name", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "api_usage_timestamp_idx" ON "api_usage"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "api_usage_api_name_success_timestamp_idx" ON "api_usage"("api_name", "success", "timestamp");
CREATE INDEX IF NOT EXISTS "api_usage_success_timestamp_idx" ON "api_usage"("success", "timestamp");
CREATE INDEX IF NOT EXISTS "api_usage_api_name_endpoint_timestamp_idx" ON "api_usage"("api_name", "endpoint", "timestamp");

-- CreateTable: api_usage_aggregates
CREATE TABLE IF NOT EXISTS "api_usage_aggregates" (
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
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: api_alerts
CREATE TABLE IF NOT EXISTS "api_alerts" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: api_usage_aggregates
CREATE UNIQUE INDEX IF NOT EXISTS "api_usage_aggregates_api_name_aggregation_type_period_start_key" ON "api_usage_aggregates"("api_name", "aggregation_type", "period_start");
CREATE INDEX IF NOT EXISTS "api_usage_aggregates_api_name_aggregation_type_period_start_idx" ON "api_usage_aggregates"("api_name", "aggregation_type", "period_start");
CREATE INDEX IF NOT EXISTS "api_usage_aggregates_period_start_aggregation_type_idx" ON "api_usage_aggregates"("period_start", "aggregation_type");

-- CreateIndex: api_alerts
CREATE UNIQUE INDEX IF NOT EXISTS "api_alerts_api_name_alert_type_period_key" ON "api_alerts"("api_name", "alert_type", "period");
CREATE INDEX IF NOT EXISTS "api_alerts_api_name_enabled_idx" ON "api_alerts"("api_name", "enabled");
