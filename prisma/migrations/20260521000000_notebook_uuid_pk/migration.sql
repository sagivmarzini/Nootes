-- Drop dependent FK constraint
ALTER TABLE "Notebook" DROP CONSTRAINT IF EXISTS "Notebook_userId_fkey";

-- Drop old PK
ALTER TABLE "Notebook" DROP CONSTRAINT "Notebook_pkey";

-- Add new UUID column, backfill existing rows, make NOT NULL
ALTER TABLE "Notebook" ADD COLUMN "new_id" TEXT;
UPDATE "Notebook" SET "new_id" = gen_random_uuid()::TEXT;
ALTER TABLE "Notebook" ALTER COLUMN "new_id" SET NOT NULL;
ALTER TABLE "Notebook" ALTER COLUMN "new_id" SET DEFAULT gen_random_uuid()::TEXT;

-- Drop old integer id and its sequence
ALTER TABLE "Notebook" DROP COLUMN "id";
DROP SEQUENCE IF EXISTS "Notebook_id_seq";

-- Rename new column to id and add PK
ALTER TABLE "Notebook" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_pkey" PRIMARY KEY ("id");

-- Re-add FK
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
