ALTER TABLE "Service"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_services AS (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) - 1 AS "nextOrder"
    FROM "Service"
)
UPDATE "Service" AS s
SET "sortOrder" = o."nextOrder"
FROM ordered_services AS o
WHERE s."id" = o."id";
