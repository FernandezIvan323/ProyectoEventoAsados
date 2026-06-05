import { describe, expect, it } from 'vitest';
import es from './locales/es.json';
import en from './locales/en.json';

const KEYS_TO_CHECK = [
  'app.name',
  'nav.home',
  'nav.history',
  'common.save',
  'common.cancel',
  'auth.login',
  'event.title',
  'event.status.Cotizado',
  'finance.revenue',
  'inventory.stock',
];

describe('i18n locales', () => {
  it('es.json tiene las claves criticas', () => {
    for (const key of KEYS_TO_CHECK) {
      const value = key.split('.').reduce((acc, k) => acc?.[k], es);
      expect(value, `falta es.json:${key}`).toBeTruthy();
    }
  });

  it('en.json tiene las mismas claves criticas que es.json', () => {
    for (const key of KEYS_TO_CHECK) {
      const enValue = key.split('.').reduce((acc, k) => acc?.[k], en);
      expect(enValue, `falta en.json:${key}`).toBeTruthy();
    }
  });

  it('es.json y en.json tienen la misma estructura de claves', () => {
    function collect(obj, prefix = '') {
      const keys = [];
      for (const k of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
          keys.push(...collect(obj[k], path));
        } else {
          keys.push(path);
        }
      }
      return keys.sort();
    }
    expect(collect(en)).toEqual(collect(es));
  });
});
