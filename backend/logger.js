import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const ENV_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const ACTIVE_LEVEL = LEVELS[ENV_LEVEL] ?? LEVELS.info;
const LOG_TO_FILE = process.env.LOG_TO_FILE !== 'false';

if (LOG_TO_FILE) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function serializeError(err) {
  if (!(err instanceof Error)) return err;
  return { name: err.name, message: err.message, stack: err.stack };
}

function format(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: typeof message === 'string' ? message : JSON.stringify(message),
  };
  if (meta instanceof Error) {
    entry.error = serializeError(meta);
  } else if (meta && typeof meta === 'object') {
    for (const [key, value] of Object.entries(meta)) {
      entry[key] = value instanceof Error ? serializeError(value) : value;
    }
  }
  return JSON.stringify(entry);
}

function write(level, message, meta) {
  if (LEVELS[level] < ACTIVE_LEVEL) return;

  const line = format(level, message, meta);
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  stream.write(line + '\n');

  if (LOG_TO_FILE) {
    const file = path.join(LOG_DIR, level === 'error' ? 'error.log' : 'app.log');
    try {
      fs.appendFileSync(file, line + '\n');
    } catch {
      // ignore file write errors (e.g., permission issues)
    }
  }
}

export const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('http', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });
  next();
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const isServer = status >= 500;
  const payload = isServer
    ? { error: 'Error interno del servidor' }
    : { error: err.message || 'Error' };

  if (isServer) {
    logger.error('http_error', { method: req.method, path: req.path, status, err });
  } else {
    logger.warn('http_client_error', { method: req.method, path: req.path, status, message: err.message });
  }

  res.status(status).json(payload);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
