-- CreateTable
CREATE TABLE "note_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_sections_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "folders" ADD COLUMN "section_id" TEXT;
ALTER TABLE "folders" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "note_sections_position_idx" ON "note_sections"("position");

-- CreateIndex
CREATE INDEX "folders_section_id_idx" ON "folders"("section_id");

-- CreateIndex
CREATE INDEX "folders_position_idx" ON "folders"("position");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "note_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
