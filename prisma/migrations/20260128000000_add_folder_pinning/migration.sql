-- AlterTable
ALTER TABLE "folders" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "folders_is_pinned_idx" ON "folders"("is_pinned");
