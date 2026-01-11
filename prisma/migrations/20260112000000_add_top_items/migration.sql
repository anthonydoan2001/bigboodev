-- CreateTable
CREATE TABLE "top_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "year" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL,
    "episodes" INTEGER,
    "external_id" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "top_items_type_idx" ON "top_items"("type");

-- CreateIndex
CREATE INDEX "top_items_last_updated_idx" ON "top_items"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "top_items_external_id_type_key" ON "top_items"("external_id", "type");
