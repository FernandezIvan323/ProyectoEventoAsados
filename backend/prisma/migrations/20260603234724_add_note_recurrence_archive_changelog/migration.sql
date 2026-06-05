-- CreateTable
CREATE TABLE "NoteChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "noteId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteChangeLog_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "priority" TEXT NOT NULL DEFAULT 'Media',
    "type" TEXT NOT NULL DEFAULT 'Recordatorio',
    "dueDate" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "linkedType" TEXT NOT NULL DEFAULT 'general',
    "linkedId" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT NOT NULL DEFAULT 'none',
    "recurrenceParentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Note" ("content", "createdAt", "done", "dueDate", "id", "linkedId", "linkedType", "pinned", "priority", "status", "tags", "title", "type", "updatedAt") SELECT "content", "createdAt", "done", "dueDate", "id", "linkedId", "linkedType", "pinned", "priority", "status", "tags", "title", "type", "updatedAt" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
