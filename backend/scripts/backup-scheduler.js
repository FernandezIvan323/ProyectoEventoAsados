#!/usr/bin/env node
import { runBackup } from './backup-db.js';

const HOURS = Number(process.env.BACKUP_INTERVAL_HOURS || 24);
const INTERVAL_MS = HOURS * 60 * 60 * 1000;

console.log(`[scheduler] Backup automatico cada ${HOURS}h. Ctrl+C para detener.`);

function tick() {
  try {
    runBackup();
  } catch (error) {
    console.error('[scheduler] Error en backup:', error.message);
  }
}

tick();
setInterval(tick, INTERVAL_MS);
