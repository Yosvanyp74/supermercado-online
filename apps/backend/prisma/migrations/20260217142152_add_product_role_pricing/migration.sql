-- CreateEnum
CREATE TYPE "ProductRole" AS ENUM ('ANCLA', 'CONVENIENCIA', 'IMPULSO', 'PREMIUM');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "applied_margin" DOUBLE PRECISION,
ADD COLUMN     "pricing_rule_version" TEXT,
ADD COLUMN     "product_role" "ProductRole";
