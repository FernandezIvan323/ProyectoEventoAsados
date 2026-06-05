import test from 'node:test';
import assert from 'node:assert/strict';
import { ALERT_TYPES, SEVERITY, generateAlerts } from './alerts.js';

test('ALERT_TYPES incluye los 6 tipos de alerta', () => {
  assert.equal(ALERT_TYPES.EVENT_UNCONFIRMED, 'event_unconfirmed');
  assert.equal(ALERT_TYPES.PAYMENT_OVERDUE, 'payment_overdue');
  assert.equal(ALERT_TYPES.LOW_STOCK, 'low_stock');
  assert.equal(ALERT_TYPES.NOTE_DUE, 'note_due');
  assert.equal(ALERT_TYPES.NOTE_OVERDUE, 'note_overdue');
  assert.equal(ALERT_TYPES.TASK_PENDING, 'task_pending');
  assert.equal(Object.keys(ALERT_TYPES).length, 6);
});

test('SEVERITY tiene 3 niveles: info, warn, error', () => {
  assert.equal(SEVERITY.info, 'info');
  assert.equal(SEVERITY.warn, 'warn');
  assert.equal(SEVERITY.error, 'error');
  assert.equal(Object.keys(SEVERITY).length, 3);
});

test('generateAlerts retorna un array (puede ser vacio si la DB esta vacia)', async () => {
  const alerts = await generateAlerts();
  assert.ok(Array.isArray(alerts));
});

test('cada alerta generada tiene la forma esperada', async () => {
  const alerts = await generateAlerts();
  for (const alert of alerts) {
    assert.ok(typeof alert.type === 'string' && alert.type.length > 0, 'type requerido');
    assert.ok(['info', 'warn', 'error'].includes(alert.severity), 'severity debe ser info/warn/error');
    assert.ok(typeof alert.title === 'string' && alert.title.length > 0, 'title requerido');
    assert.ok(typeof alert.message === 'string' && alert.message.length > 0, 'message requerido');
  }
});

test('los tipos de alerta retornados son conocidos', async () => {
  const alerts = await generateAlerts();
  const knownTypes = new Set(Object.values(ALERT_TYPES));
  for (const alert of alerts) {
    assert.ok(knownTypes.has(alert.type), `Tipo desconocido: ${alert.type}`);
  }
});
