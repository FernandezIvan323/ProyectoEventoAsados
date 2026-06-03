ALTER TABLE "Note" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Pendiente';
ALTER TABLE "Note" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'Media';
ALTER TABLE "Note" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Recordatorio';
ALTER TABLE "Note" ADD COLUMN "dueDate" TEXT;
ALTER TABLE "Note" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Note" ADD COLUMN "linkedType" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "Note" ADD COLUMN "linkedId" TEXT;

UPDATE "Note"
SET "status" = CASE WHEN "done" = 1 THEN 'Realizada' ELSE 'Pendiente' END,
    "priority" = 'Media',
    "type" = 'Recordatorio',
    "linkedType" = 'general';
