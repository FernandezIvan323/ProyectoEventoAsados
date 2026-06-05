import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(__dirname, 'test-integration.db');

let app;
let prisma;
let authModule;
let server;
let baseUrl;

test.before(async () => {
  process.env.DATABASE_URL = `file:${testDbPath}`;
  process.env.AUTH_ENABLED = 'false';

  if (existsSync(testDbPath)) rmSync(testDbPath);
  execSync('npx prisma migrate deploy', { cwd: __dirname, stdio: 'pipe', env: process.env });

  const mod = await import('./server.js');
  app = mod.app;
  prisma = mod.prisma;
  authModule = await import('./auth.js');

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  if (authModule?.prisma) await authModule.prisma.$disconnect();
});

test('GET /api/health responde ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
});

test('flujo crear evento, duplicar y lista de compras', async () => {
  const createRes = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Integration Test',
      date: '2026-07-01',
      guests: 20,
      status: 'Aprobado',
      extraCosts: 0,
      profitMargin: 10,
      insumos: [{ name: 'Carne', unit: 'kg', quantity: 5, costPerUnit: 1000 }],
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.title, 'Integration Test');

  const dupRes = await fetch(`${baseUrl}/api/events/${created.id}/duplicate`, { method: 'POST' });
  assert.equal(dupRes.status, 201);
  const copy = await dupRes.json();
  assert.ok(copy.title.includes('copia'));

  const listRes = await fetch(`${baseUrl}/api/shopping-list`);
  assert.equal(listRes.status, 200);
  const list = await listRes.json();
  assert.ok(list.items.some(item => item.name === 'Carne'));
});

test('auth rechaza API sin token cuando esta habilitada', async () => {
  process.env.AUTH_ENABLED = 'true';

  await prisma.user.deleteMany({ where: { username: 'integrationtest' } });
  await prisma.user.create({
    data: {
      email: 'itest@example.com',
      username: 'integrationtest',
      password: await import('crypto').then(({ scryptSync, randomBytes }) => {
        const salt = randomBytes(16).toString('hex');
        return `${salt}:${scryptSync('secret', salt, 64).toString('hex')}`;
      }),
      role: 'admin',
    },
  });

  const blocked = await fetch(`${baseUrl}/api/events`);
  assert.equal(blocked.status, 401);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'integrationtest', password: 'secret' }),
  });
  assert.equal(loginRes.status, 200);
  const { token } = await loginRes.json();
  assert.ok(token);

  const ok = await fetch(`${baseUrl}/api/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(ok.status, 200);

  await prisma.user.deleteMany({ where: { username: 'integrationtest' } });
  process.env.AUTH_ENABLED = 'false';
});
