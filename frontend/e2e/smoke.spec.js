import { test, expect, request as apiRequest } from '@playwright/test';

const API_URL = process.env.E2E_API_URL || 'http://localhost:3000';
const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:5173/app';

test.describe('Smoke E2E', () => {
  test('health check del backend responde ok', async () => {
    const ctx = await apiRequest.newContext();
    const res = await ctx.get(`${API_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('landing carga con el titulo de la app', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AsamApp/);
    await expect(page.locator('h1')).toContainText(/Gestion/);
  });

  test('flujo API: crear, leer, duplicar y eliminar evento', async () => {
    const ctx = await apiRequest.newContext();
    const auth = await ctx.get(`${API_URL}/api/auth/config`);
    expect(auth.ok()).toBeTruthy();

    const create = await ctx.post(`${API_URL}/api/events`, {
      data: {
        title: 'Evento E2E Test',
        client: 'Cliente E2E',
        date: '2026-12-01',
        time: '20:00',
        guests: 30,
        status: 'Cotizado',
        extraCosts: 0,
        profitMargin: 30,
        totalPrice: 0,
        insumos: [
          { name: 'Carne', quantity: 5, unit: 'kg', costPerUnit: 1000, totalCost: 5000 },
        ],
      },
    });
    expect(create.status()).toBe(201);
    const event = await create.json();
    expect(event.title).toBe('Evento E2E Test');

    const list = await ctx.get(`${API_URL}/api/events`);
    expect(list.ok()).toBeTruthy();
    const events = await list.json();
    const found = events.find(e => e.id === event.id);
    expect(found).toBeTruthy();

    const dup = await ctx.post(`${API_URL}/api/events/${event.id}/duplicate`, {
      data: {},
    });
    expect(dup.status()).toBe(201);
    const copy = await dup.json();
    expect(copy.title).toMatch(/copia/);
    expect(copy.status).toBe('Cotizado');

    const del1 = await ctx.delete(`${API_URL}/api/events/${event.id}`);
    expect(del1.status()).toBe(204);
    const del2 = await ctx.delete(`${API_URL}/api/events/${copy.id}`);
    expect(del2.status()).toBe(204);
  });

  test('búsqueda global devuelve resultados', async () => {
    const ctx = await apiRequest.newContext();
    const created = await ctx.post(`${API_URL}/api/events`, {
      data: {
        title: 'Búsqueda Exclusiva XYZ',
        client: 'Cliente Búsqueda',
        guests: 10,
        status: 'Cotizado',
        totalPrice: 0,
        insumos: [],
      },
    });
    const event = await created.json();

    const search = await ctx.get(`${API_URL}/api/search?q=Exclusiva`);
    expect(search.ok()).toBeTruthy();
    const results = await search.json();
    expect(results.events.length).toBeGreaterThan(0);
    expect(results.events.some(e => e.id === event.id)).toBeTruthy();

    await ctx.delete(`${API_URL}/api/events/${event.id}`);
  });

  test('inventario: crear item, registrar movimiento, eliminar', async () => {
    const ctx = await apiRequest.newContext();
    const create = await ctx.post(`${API_URL}/api/inventory`, {
      data: { name: 'Sal E2E', unit: 'kg', price: 100, stock: 5, minStock: 1 },
    });
    expect(create.status()).toBe(201);
    const item = await create.json();

    const move = await ctx.post(`${API_URL}/api/inventory/${item.id}/stock-movements`, {
      data: { type: 'Entrada', quantity: 10, notes: 'Reposición E2E' },
    });
    expect(move.status()).toBe(201);
    const moveBody = await move.json();
    expect(moveBody.item.stock).toBe(15);

    const del = await ctx.delete(`${API_URL}/api/inventory/${item.id}`);
    expect(del.status()).toBe(204);
  });

  test('exportacion CSV funciona', async () => {
    const ctx = await apiRequest.newContext();
    const res = await ctx.get(`${API_URL}/api/export?type=events&format=csv`);
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });
});
