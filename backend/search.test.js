import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeFts, tokenize, ftsSearchEvents } from './search.js';

test('escapeFts escapa comillas dobles duplicandolas', () => {
  assert.equal(escapeFts('hello "world"'), 'hello ""world""');
});

test('escapeFts reemplaza operadores FTS5 (* ( )) por espacios', () => {
  assert.equal(escapeFts('a*b'), 'a b');
  assert.equal(escapeFts('a(b)c'), 'a b c');
  assert.equal(escapeFts('(a*b)'), ' a b ');
});

test('escapeFts preserva el resto de los caracteres', () => {
  assert.equal(escapeFts('asado 2026'), 'asado 2026');
  assert.equal(escapeFts('café'), 'café');
});

test('tokenize devuelve string vacio para entrada vacia o solo espacios', () => {
  assert.equal(tokenize(''), '');
  assert.equal(tokenize('   '), '');
});

test('tokenize convierte tokens simples a prefijo con comillas y asterisco', () => {
  assert.equal(tokenize('asado'), '"asado"*');
  assert.equal(tokenize('coca cola'), '"coca"* "cola"*');
});

test('tokenize lowercase antes de tokenizar', () => {
  assert.equal(tokenize('ASADO'), '"asado"*');
  assert.equal(tokenize('Coca Cola'), '"coca"* "cola"*');
});

test('tokenize escapa comillas y operadores dentro de los tokens', () => {
  assert.equal(tokenize('hola"mundo'), '"hola""mundo"*');
  assert.equal(tokenize('foo*bar'), '"foo bar"*');
});

test('ftsSearchEvents devuelve array vacio para query de menos de 2 chars', async () => {
  const result = await ftsSearchEvents('a');
  assert.deepEqual(result, []);
});

test('ftsSearchEvents devuelve array vacio para query vacia o whitespace', async () => {
  assert.deepEqual(await ftsSearchEvents(''), []);
  assert.deepEqual(await ftsSearchEvents('   '), []);
});
