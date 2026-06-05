import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, PERMISSIONS, getRolePermissions, hasPermission, requirePermission, isValidRole } from './permissions.js';

test('ROLES incluye admin, editor y viewer', () => {
  assert.deepEqual(ROLES, ['admin', 'editor', 'viewer']);
});

test('admin tiene todos los permisos de lectura, escritura y borrado', () => {
  const perms = getRolePermissions('admin');
  assert.ok(perms.includes('events:read'));
  assert.ok(perms.includes('events:write'));
  assert.ok(perms.includes('events:delete'));
  assert.ok(perms.includes('users:write'));
  assert.ok(perms.includes('settings:write'));
});

test('editor puede escribir eventos, inventario, proveedores, compras y notas', () => {
  const perms = getRolePermissions('editor');
  assert.ok(perms.includes('events:write'));
  assert.ok(perms.includes('inventory:write'));
  assert.ok(perms.includes('providers:write'));
  assert.ok(perms.includes('purchases:write'));
  assert.ok(perms.includes('notes:write'));
});

test('editor NO puede borrar ni gestionar usuarios', () => {
  const perms = getRolePermissions('editor');
  assert.equal(perms.includes('events:delete'), false);
  assert.equal(perms.includes('inventory:delete'), false);
  assert.equal(perms.includes('users:read'), false);
  assert.equal(perms.includes('users:write'), false);
  assert.equal(perms.includes('settings:write'), false);
});

test('viewer solo tiene permisos de lectura', () => {
  const perms = getRolePermissions('viewer');
  const writePerms = perms.filter(p => p.endsWith(':write') || p.endsWith(':delete'));
  assert.equal(writePerms.length, 0);
  assert.ok(perms.includes('events:read'));
  assert.ok(perms.includes('inventory:read'));
  assert.ok(perms.includes('providers:read'));
  assert.ok(perms.includes('purchases:read'));
  assert.ok(perms.includes('notes:read'));
});

test('getRolePermissions devuelve permisos de viewer para roles desconocidos', () => {
  const perms = getRolePermissions('unknown-role');
  assert.deepEqual(perms, PERMISSIONS.viewer);
});

test('hasPermission devuelve true solo si el permiso esta en la lista del rol', () => {
  assert.equal(hasPermission('admin', 'events:delete'), true);
  assert.equal(hasPermission('editor', 'events:delete'), false);
  assert.equal(hasPermission('viewer', 'events:write'), false);
  assert.equal(hasPermission('viewer', 'events:read'), true);
});

test('hasPermission devuelve false para permisos inexistentes', () => {
  assert.equal(hasPermission('admin', 'inventado:read'), false);
});

test('requirePermission lanza error 403 si el rol no tiene el permiso', () => {
  try {
    requirePermission('viewer', 'events:write');
    assert.fail('Deberia haber lanzado error');
  } catch (err) {
    assert.equal(err.status, 403);
    assert.match(err.message, /No tenés permiso para: events:write/);
  }
});

test('requirePermission no lanza si el rol tiene el permiso', () => {
  assert.doesNotThrow(() => requirePermission('admin', 'users:delete'));
  assert.doesNotThrow(() => requirePermission('editor', 'events:write'));
  assert.doesNotThrow(() => requirePermission('viewer', 'events:read'));
});

test('isValidRole valida contra la lista ROLES', () => {
  assert.equal(isValidRole('admin'), true);
  assert.equal(isValidRole('editor'), true);
  assert.equal(isValidRole('viewer'), true);
  assert.equal(isValidRole('super-admin'), false);
  assert.equal(isValidRole(''), false);
  assert.equal(isValidRole(null), false);
  assert.equal(isValidRole(undefined), false);
});

test('admin tiene estrictamente mas o igual permisos que editor y viewer', () => {
  const adminPerms = new Set(getRolePermissions('admin'));
  const editorPerms = new Set(getRolePermissions('editor'));
  const viewerPerms = new Set(getRolePermissions('viewer'));
  for (const p of editorPerms) assert.ok(adminPerms.has(p), `admin deberia tener ${p}`);
  for (const p of viewerPerms) assert.ok(editorPerms.has(p) || adminPerms.has(p), `editor o admin deberia tener ${p}`);
});
