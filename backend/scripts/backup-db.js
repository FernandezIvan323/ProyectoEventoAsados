#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, statSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.join(__dirname, '..');
const DB_PATH = path.join(BACKEND_DIR, process.env.DATABASE_URL?.replace(/^file:/, '') || 'dev.db');

const BACKUP_DIR = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.join(BACKEND_DIR, '..', 'backups', 'database');

const MAX_BACKUPS = Number(process.env.BACKUP_KEEP || 30);

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function listBackups() {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter(name => /^asamapp-\d{8}-\d{6}\.db$/.test(name))
    .map(name => ({
      name,
      path: path.join(BACKUP_DIR, name),
      mtime: statSync(path.join(BACKUP_DIR, name)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);
}

function pruneOldBackups() {
  const all = listBackups();
  if (all.length <= MAX_BACKUPS) return [];
  const toRemove = all.slice(MAX_BACKUPS);
  for (const entry of toRemove) {
    try {
      unlinkSync(entry.path);
    } catch (error) {
      console.warn(`[backup] No se pudo eliminar ${entry.name}:`, error.message);
    }
  }
  return toRemove.map(e => e.name);
}

export function runBackup({ silent = false } = {}) {
  ensureDir(BACKUP_DIR);

  if (!existsSync(DB_PATH)) {
    const message = `Base de datos no encontrada en ${DB_PATH}`;
    if (!silent) console.error(`[backup] ${message}`);
    return { ok: false, message };
  }

  const filename = `asamapp-${timestamp()}.db`;
  const target = path.join(BACKUP_DIR, filename);

  try {
    copyFileSync(DB_PATH, target);
  } catch (error) {
    const message = `Error al copiar la base de datos: ${error.message}`;
    if (!silent) console.error(`[backup] ${message}`);
    return { ok: false, message };
  }

  const removed = pruneOldBackups();
  const total = listBackups().length;

  const result = {
    ok: true,
    file: filename,
    path: target,
    sizeBytes: statSync(target).size,
    totalBackups: total,
    removed,
  };

  if (!silent) {
    console.log(`[backup] OK -> ${filename} (${(result.sizeBytes / 1024).toFixed(1)} KB). Total: ${total}, purgados: ${removed.length}`);
  }

  return result;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = new Set(process.argv.slice(2));
  const result = runBackup({ silent: args.has('--silent') });
  process.exit(result.ok ? 0 : 1);
}
