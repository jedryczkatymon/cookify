-- AlterTable: add order, backfill, drop unique + mealType
ALTER TABLE "MealPlanEntry" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "date"
      ORDER BY "id" ASC
    ) - 1 AS new_order
  FROM "MealPlanEntry"
)
UPDATE "MealPlanEntry" AS m
SET "order" = ranked.new_order
FROM ranked
WHERE m."id" = ranked."id";

DROP INDEX IF EXISTS "MealPlanEntry_userId_date_mealType_key";

ALTER TABLE "MealPlanEntry" DROP COLUMN "mealType";
