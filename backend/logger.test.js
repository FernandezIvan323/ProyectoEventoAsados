import test from 'node:test';
import assert from 'node:assert/strict';
import { logger, asyncHandler, errorHandler, notFoundHandler, requestLogger } from './logger.js';

test('logger expone los 4 niveles', () => {
  assert.equal(typeof logger.debug, 'function');
  assert.equal(typeof logger.info, 'function');
  assert.equal(typeof logger.warn, 'function');
  assert.equal(typeof logger.error, 'function');
});

test('logger.info escribe linea JSON valida', () => {
  const orig = process.stdout.write.bind(process.stdout);
  let captured = '';
  process.stdout.write = (chunk) => { captured += chunk; return true; };
  try {
    logger.info('test_event', { foo: 'bar' });
  } finally {
    process.stdout.write = orig;
  }
  const line = captured.trim();
  const parsed = JSON.parse(line);
  assert.equal(parsed.level, 'info');
  assert.equal(parsed.msg, 'test_event');
  assert.equal(parsed.foo, 'bar');
  assert.ok(parsed.ts);
});

test('asyncHandler propaga errores a next()', async () => {
  const failingHandler = asyncHandler(async () => {
    throw new Error('boom');
  });
  let nextErr = null;
  await new Promise((resolve) => {
    failingHandler({}, {}, (err) => { nextErr = err; resolve(); });
  });
  assert.ok(nextErr instanceof Error);
  assert.equal(nextErr.message, 'boom');
});

test('errorHandler oculta detalles en errores 5xx', () => {
  const req = { method: 'GET', path: '/x' };
  const res = { statusCode: 0, status(c) { this.statusCode = c; return this; }, json(payload) { this.payload = payload; } };
  errorHandler(new Error('secret internals'), req, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.error, 'Error interno del servidor');
});

test('errorHandler expone mensaje en errores 4xx', () => {
  const req = { method: 'GET', path: '/x' };
  const res = { statusCode: 0, status(c) { this.statusCode = c; return this; }, json(payload) { this.payload = payload; } };
  errorHandler(Object.assign(new Error('input invalido'), { status: 400 }), req, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.error, 'input invalido');
});

test('notFoundHandler responde 404 con la ruta', () => {
  const req = { method: 'POST', path: '/api/no-existe' };
  const res = { statusCode: 0, status(c) { this.statusCode = c; return this; }, json(payload) { this.payload = payload; } };
  notFoundHandler(req, res);
  assert.equal(res.statusCode, 404);
  assert.match(res.payload.error, /POST \/api\/no-existe/);
});

test('requestLogger mide duracion y emite log al finish', () => {
  const req = { method: 'GET', path: '/api/test', ip: '127.0.0.1' };
  const res = { on(event, cb) { if (event === 'finish') setImmediate(cb); } };
  const orig = process.stdout.write.bind(process.stdout);
  let captured = '';
  process.stdout.write = (chunk) => { captured += chunk; return true; };
  try {
    requestLogger(req, res, () => {});
  } finally {
    process.stdout.write = orig;
  }
  return new Promise((resolve) => {
    setImmediate(() => {
      const line = captured.trim();
      if (line) {
        const parsed = JSON.parse(line);
        assert.equal(parsed.method, 'GET');
        assert.equal(parsed.path, '/api/test');
        assert.equal(parsed.status, undefined);
        assert.ok(parsed.durationMs >= 0);
      }
      resolve();
    });
  });
});
