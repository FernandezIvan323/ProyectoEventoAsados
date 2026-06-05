import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let ftsInitialized = false;

function escapeFts(query) {
  return query.replace(/"/g, '""').replace(/[*()]/g, ' ');
}

function tokenize(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(token => `"${escapeFts(token)}"*`)
    .join(' ');
}

export { escapeFts, tokenize };

export async function ensureFtsTable() {
  if (ftsInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE VIRTUAL TABLE IF NOT EXISTS event_fts USING fts5(
        title, client, location, menuNotes,
        content='Event', content_rowid='rowid'
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS event_fts_ai AFTER INSERT ON Event BEGIN
        INSERT INTO event_fts(rowid, title, client, location, menuNotes)
        VALUES (new.rowid, new.title, COALESCE(new.client, ''), COALESCE(new.location, ''), COALESCE(new.menuNotes, ''));
      END;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS event_fts_ad AFTER DELETE ON Event BEGIN
        INSERT INTO event_fts(event_fts, rowid, title, client, location, menuNotes)
        VALUES ('delete', old.rowid, old.title, COALESCE(old.client, ''), COALESCE(old.location, ''), COALESCE(old.menuNotes, ''));
      END;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER IF NOT EXISTS event_fts_au AFTER UPDATE ON Event BEGIN
        INSERT INTO event_fts(event_fts, rowid, title, client, location, menuNotes)
        VALUES ('delete', old.rowid, old.title, COALESCE(old.client, ''), COALESCE(old.location, ''), COALESCE(old.menuNotes, ''));
        INSERT INTO event_fts(rowid, title, client, location, menuNotes)
        VALUES (new.rowid, new.title, COALESCE(new.client, ''), COALESCE(new.location, ''), COALESCE(new.menuNotes, ''));
      END;
    `);
    ftsInitialized = true;
  } catch (error) {
    console.error('No se pudo inicializar FTS5:', error.message);
  }
}

export async function ftsSearchEvents(query, limit = 8) {
  if (!query || query.length < 2) return [];
  const tokens = tokenize(query);
  if (!tokens) return [];

  try {
    await ensureFtsTable();
    const rows = await prisma.$queryRawUnsafe(`
      SELECT e.id, e.title, e.client, e.status, e.date
      FROM event_fts f
      JOIN Event e ON e.rowid = f.rowid
      WHERE event_fts MATCH ?
      ORDER BY rank
      LIMIT ?;
    `, tokens, limit);
    return rows;
  } catch (error) {
    console.error('FTS5 query failed, fallback to LIKE:', error.message);
    return prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { client: { contains: query } },
          { location: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, client: true, status: true, date: true },
    });
  }
}
