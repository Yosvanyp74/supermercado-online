-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "unit_cost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_gross_margin_amount" DOUBLE PRECISION,
ADD COLUMN     "order_gross_margin_percent" DOUBLE PRECISION,
ADD COLUMN     "order_total_cost" DOUBLE PRECISION,
ADD COLUMN     "order_total_revenue" DOUBLE PRECISION,
ADD COLUMN     "pricing_rule_version_applied" TEXT;

-- CreateTable
CREATE TABLE "daily_margin_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_margin_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_margin_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_margin_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_margin_stats_date_key" ON "daily_margin_stats"("date");

-- CreateIndex
CREATE INDEX "daily_margin_stats_date_idx" ON "daily_margin_stats"("date");
