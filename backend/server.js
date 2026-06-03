import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, handleAuthConfig, handleAuthLogin, handleAuthRegister } from './auth.js';
import {
  validateCatalogPayload,
  validateEventPayload,
  validateMarketPurchasePayload,
  validatePaymentPayload,
  validateProviderPayload,
  validateQuoteTemplatePayload,
  validateRecipePayload,
  validateStatusPayload,
  validateStockMovementPayload,
  validateTaskPayload,
} from './validation.js';
import { buildShoppingList, getEventFinancialSummary, DEFAULT_SHOPPING_STATUSES } from './shoppingList.js';
import { eventsToCsv, purchasesToCsv } from './exportData.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map(origin => origin.trim()) } : undefined));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('/api/auth/config', handleAuthConfig);
app.post('/api/auth/login', handleAuthLogin);
app.post('/api/auth/register', handleAuthRegister);
app.use(authMiddleware);

function sendValidationError(res, errors) {
  return res.status(400).json({ error: errors.join('. ') });
}

function handlePrismaError(res, error, fallbackMessage) {
  console.error(error);
  if (error?.code === 'P2025') {
    return res.status(404).json({ error: 'Recurso no encontrado' });
  }
  return res.status(500).json({ error: fallbackMessage });
}

function serializeMarketPurchase(purchase) {
  if (!purchase) return purchase;

  let receiptPhotos = [];
  try {
    receiptPhotos = JSON.parse(purchase.receiptPhotos || '[]');
  } catch {
    receiptPhotos = [];
  }

  return {
    ...purchase,
    receiptPhotos,
  };
}

function serializeRecipe(recipe) {
  if (!recipe) return recipe;
  let items = [];
  try {
    items = JSON.parse(recipe.itemsJson || '[]');
  } catch {
    items = [];
  }
  return { ...recipe, items };
}

function serializeQuoteTemplate(template) {
  if (!template) return template;
  let items = [];
  try {
    items = JSON.parse(template.itemsJson || '[]');
  } catch {
    items = [];
  }
  return { ...template, items };
}

function getEventInclude() {
  return {
    insumos: true,
    tasks: true,
    payments: true,
    purchases: { include: { items: true, provider: true } },
    changelog: { orderBy: { createdAt: 'desc' }, take: 50 },
  };
}

function serializeEvent(event) {
  if (!event) return event;
  return {
    ...event,
    purchases: event.purchases?.map(serializeMarketPurchase) ?? [],
  };
}

app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: getEventInclude(),
      orderBy: { createdAt: 'desc' },
    });
    res.json(events.map(serializeEvent));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener eventos');
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: getEventInclude(),
    });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(serializeEvent(event));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener evento');
  }
});

app.post('/api/events', async (req, res) => {
  const { errors, data } = validateEventPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        client: data.client,
        date: data.date,
        time: data.time,
        location: data.location,
        guests: data.guests,
        status: data.status,
        menuNotes: data.menuNotes,
        recipeName: data.recipeName,
        extraCosts: data.extraCosts,
        profitMargin: data.profitMargin,
        amountPaid: data.amountPaid,
        totalPrice: data.totalPrice,
        insumos: {
          create: data.insumos,
        },
      },
      include: getEventInclude(),
    });
    res.status(201).json(event);
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear evento');
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    if (req.body?.title !== undefined) {
      const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
      if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

      const { errors, data } = validateEventPayload({
        ...req.body,
        amountPaid: existing.amountPaid,
        status: req.body.status !== undefined ? req.body.status : existing.status,
      });
      if (errors.length) return sendValidationError(res, errors);

      const event = await prisma.event.update({
        where: { id: req.params.id },
        data: {
          title: data.title,
          client: data.client,
          date: data.date,
          time: data.time,
          location: data.location,
          guests: data.guests,
          status: data.status,
          menuNotes: data.menuNotes,
          recipeName: data.recipeName,
          extraCosts: data.extraCosts,
          profitMargin: data.profitMargin,
          totalPrice: data.totalPrice,
          insumos: {
            deleteMany: {},
            create: data.insumos,
          },
        },
        include: getEventInclude(),
      });

      // Log cambios de precio y status
      const logs = [];
      if (String(existing.status) !== String(data.status)) {
        logs.push({ field: 'status', oldValue: String(existing.status), newValue: String(data.status), eventId: req.params.id });
      }
      if (Math.round(Number(existing.totalPrice)) !== Math.round(Number(data.totalPrice))) {
        logs.push({ field: 'totalPrice', oldValue: String(existing.totalPrice), newValue: String(data.totalPrice), eventId: req.params.id });
      }
      if (logs.length) {
        await prisma.eventChangeLog.createMany({ data: logs });
      }

      return res.json(serializeEvent(event));
    }

    const { errors, data } = validateStatusPayload(req.body);
    if (errors.length) return sendValidationError(res, errors);

    const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data,
      include: getEventInclude(),
    });

    if (existing.status !== data.status) {
      await prisma.eventChangeLog.create({
        data: { field: 'status', oldValue: existing.status, newValue: data.status, eventId: req.params.id },
      });
    }

    res.json(serializeEvent(event));
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar evento');
  }
});

app.get('/api/events/:id/financials', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: getEventInclude(),
    });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(getEventFinancialSummary({ ...event, purchases: event.purchases.map(serializeMarketPurchase) }));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener finanzas del evento');
  }
});

app.get('/api/shopping-list', async (req, res) => {
  try {
    const statuses = req.query.statuses
      ? req.query.statuses.split(',').map(status => status.trim()).filter(Boolean)
      : DEFAULT_SHOPPING_STATUSES;

    const events = await prisma.event.findMany({
      where: { status: { in: statuses } },
      include: { insumos: true },
      orderBy: { date: 'asc' },
    });

    res.json(buildShoppingList(events, statuses));
  } catch (error) {
    handlePrismaError(res, error, 'Error al generar lista de compras');
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar evento');
  }
});

app.post('/api/events/:id/duplicate', async (req, res) => {
  try {
    const source = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { insumos: true },
    });
    if (!source) return res.status(404).json({ error: 'Evento no encontrado' });

    const title = typeof req.body?.title === 'string' && req.body.title.trim()
      ? req.body.title.trim()
      : `${source.title} (copia)`;

    const event = await prisma.event.create({
      data: {
        title,
        client: req.body?.client !== undefined ? (req.body.client?.trim() || null) : source.client,
        date: req.body?.date !== undefined ? req.body.date : null,
        time: req.body?.time !== undefined ? req.body.time : source.time,
        location: source.location,
        guests: source.guests,
        status: 'Cotizado',
        menuNotes: source.menuNotes,
        recipeName: source.recipeName,
        extraCosts: source.extraCosts,
        profitMargin: source.profitMargin,
        amountPaid: 0,
        totalPrice: source.totalPrice,
        insumos: {
          create: source.insumos.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            costPerUnit: item.costPerUnit,
            totalCost: item.totalCost,
          })),
        },
      },
      include: getEventInclude(),
    });
    res.status(201).json(serializeEvent(event));
  } catch (error) {
    handlePrismaError(res, error, 'Error al duplicar evento');
  }
});

app.post('/api/events/:id/tasks', async (req, res) => {
  const { errors, data } = validateTaskPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const task = await prisma.eventTask.create({
      data: { ...data, eventId: req.params.id },
    });
    res.status(201).json(task);
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear tarea');
  }
});

app.put('/api/events/:eventId/tasks/:taskId', async (req, res) => {
  const { errors, data } = validateTaskPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const task = await prisma.eventTask.update({
      where: { id: req.params.taskId },
      data,
    });
    res.json(task);
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar tarea');
  }
});

app.post('/api/events/:id/payments', async (req, res) => {
  const { errors, data } = validatePaymentPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const payment = await prisma.eventPayment.create({
      data: { ...data, eventId: req.params.id },
    });
    const paidTotal = await prisma.eventPayment.aggregate({
      where: { eventId: req.params.id },
      _sum: { amount: true },
    });
    await prisma.event.update({
      where: { id: req.params.id },
      data: { amountPaid: paidTotal._sum.amount || 0 },
    });
    res.status(201).json(payment);
  } catch (error) {
    handlePrismaError(res, error, 'Error al registrar pago');
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const items = await prisma.catalogItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener inventario');
  }
});

app.post('/api/inventory', async (req, res) => {
  const { errors, data } = validateCatalogPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const item = await prisma.catalogItem.create({ data });
    res.status(201).json(item);
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear insumo');
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { errors, data } = validateCatalogPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const item = await prisma.catalogItem.update({
      where: { id: req.params.id },
      data,
    });
    res.json(item);
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar insumo');
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await prisma.catalogItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar insumo');
  }
});

app.get('/api/inventory/:id/stock-movements', async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { catalogItemId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(movements);
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener movimientos de stock');
  }
});

app.post('/api/inventory/:id/stock-movements', async (req, res) => {
  const { errors, data } = validateStockMovementPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const current = await prisma.catalogItem.findUniqueOrThrow({ where: { id: req.params.id } });
    const nextStock = data.type === 'Entrada'
      ? current.stock + data.quantity
      : data.type === 'Salida'
        ? Math.max(0, current.stock - data.quantity)
        : data.quantity;

    const movement = await prisma.stockMovement.create({
      data: { ...data, catalogItemId: req.params.id },
    });
    const item = await prisma.catalogItem.update({
      where: { id: req.params.id },
      data: { stock: nextStock },
    });
    res.status(201).json({ movement, item });
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar stock');
  }
});

app.get('/api/providers', async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      include: { purchases: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(providers);
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener proveedores');
  }
});

app.post('/api/providers', async (req, res) => {
  const { errors, data } = validateProviderPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const provider = await prisma.provider.create({ data });
    res.status(201).json(provider);
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear proveedor');
  }
});

app.put('/api/providers/:id', async (req, res) => {
  const { errors, data } = validateProviderPayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const provider = await prisma.provider.update({
      where: { id: req.params.id },
      data,
    });
    res.json(provider);
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar proveedor');
  }
});

app.delete('/api/providers/:id', async (req, res) => {
  try {
    await prisma.provider.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar proveedor');
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await prisma.recipeCombo.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(recipes.map(serializeRecipe));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener recetas');
  }
});

app.post('/api/recipes', async (req, res) => {
  const { errors, data } = validateRecipePayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const recipe = await prisma.recipeCombo.create({ data });
    res.status(201).json(serializeRecipe(recipe));
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear receta');
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  const { errors, data } = validateRecipePayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const recipe = await prisma.recipeCombo.update({
      where: { id: req.params.id },
      data,
    });
    res.json(serializeRecipe(recipe));
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar receta');
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await prisma.recipeCombo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar receta');
  }
});

app.get('/api/operations/summary', async (req, res) => {
  try {
    const [events, purchases, inventory, providers] = await Promise.all([
      prisma.event.findMany({ include: { purchases: true, payments: true, tasks: true } }),
      prisma.marketPurchase.findMany({ include: { items: true, provider: true, event: true } }),
      prisma.catalogItem.findMany(),
      prisma.provider.findMany(),
    ]);

    const totalRevenue = events.reduce((total, event) => total + Number(event.totalPrice || 0), 0);
    const totalPaid = events.reduce((total, event) => total + Number(event.amountPaid || 0), 0);
    const actualCosts = purchases.reduce((total, purchase) => total + Number(purchase.totalAmount || 0), 0);
    const lowStock = inventory.filter(item => Number(item.stock || 0) <= Number(item.minStock || 0));
    const openTasks = events.flatMap(event => event.tasks.map(task => ({ ...task, eventTitle: event.title, eventId: event.id }))).filter(task => !task.done);

    res.json({
      totalEvents: events.length,
      activeEvents: events.filter(event => !['Cancelado', 'Cobrado'].includes(event.status)).length,
      totalRevenue,
      totalPaid,
      pendingRevenue: Math.max(0, totalRevenue - totalPaid),
      actualCosts,
      realProfit: totalPaid - actualCosts,
      lowStock,
      openTasks,
      providersCount: providers.length,
      purchases: purchases.map(serializeMarketPurchase),
    });
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener resumen operativo');
  }
});

app.get('/api/market-purchases', async (req, res) => {
  const where = {};
  const start = req.query.start ? new Date(req.query.start) : null;
  const end = req.query.end ? new Date(req.query.end) : null;

  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
    return sendValidationError(res, ['start y end deben ser fechas validas']);
  }

  if (start || end) {
    where.purchasedAt = {};
    if (start) where.purchasedAt.gte = start;
    if (end) where.purchasedAt.lt = end;
  }

  try {
    const purchases = await prisma.marketPurchase.findMany({
      where,
      include: { items: true, event: true, provider: true },
      orderBy: { purchasedAt: 'desc' },
    });
    res.json(purchases.map(serializeMarketPurchase));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener compras de mercado');
  }
});

app.post('/api/market-purchases', async (req, res) => {
  const { errors, data } = validateMarketPurchasePayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const purchase = await prisma.marketPurchase.create({
      data: {
        purchasedAt: data.purchasedAt,
        store: data.store,
        vendorName: data.vendorName,
        vendorPhone: data.vendorPhone,
        eventId: data.eventId,
        providerId: data.providerId,
        paymentMethod: data.paymentMethod,
        totalAmount: data.totalAmount,
        notes: data.notes,
        receiptPhotos: data.receiptPhotos,
        items: {
          create: data.items,
        },
      },
      include: { items: true, event: true, provider: true },
    });
    res.status(201).json(serializeMarketPurchase(purchase));
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear compra de mercado');
  }
});

app.put('/api/market-purchases/:id', async (req, res) => {
  const { errors, data } = validateMarketPurchasePayload(req.body);
  if (errors.length) return sendValidationError(res, errors);

  try {
    const purchase = await prisma.marketPurchase.update({
      where: { id: req.params.id },
      data: {
        purchasedAt: data.purchasedAt,
        store: data.store,
        vendorName: data.vendorName,
        vendorPhone: data.vendorPhone,
        eventId: data.eventId,
        providerId: data.providerId,
        paymentMethod: data.paymentMethod,
        totalAmount: data.totalAmount,
        notes: data.notes,
        receiptPhotos: data.receiptPhotos,
        items: {
          deleteMany: {},
          create: data.items,
        },
      },
      include: { items: true, event: true, provider: true },
    });
    res.json(serializeMarketPurchase(purchase));
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar compra de mercado');
  }
});

app.delete('/api/market-purchases/:id', async (req, res) => {
  try {
    await prisma.marketPurchase.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar compra de mercado');
  }
});

// ── Notes ──────────────────────────────────────────────────────────────────
const NOTE_PRIORITIES = ['Alta', 'Media', 'Baja'];
const NOTE_TYPES = ['Recordatorio', 'Llamada', 'Cambio cliente', 'Compra', 'Idea', 'Problema'];
const NOTE_LINKED_TYPES = ['event', 'provider', 'purchase', 'inventory', 'general'];

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => String(tag).trim()).filter(Boolean);
}

function parseNoteTags(tags) {
  try {
    const parsed = JSON.parse(tags || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeNote(note) {
  const status = note.status || (note.done ? 'Realizada' : 'Pendiente');
  return {
    ...note,
    status,
    done: status === 'Realizada',
    priority: NOTE_PRIORITIES.includes(note.priority) ? note.priority : 'Media',
    type: NOTE_TYPES.includes(note.type) ? note.type : 'Recordatorio',
    linkedType: NOTE_LINKED_TYPES.includes(note.linkedType) ? note.linkedType : 'general',
    tags: parseNoteTags(note.tags),
  };
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function sortOperationalNotes(a, b) {
  const today = getTodayString();
  const priorityRank = { Alta: 0, Media: 1, Baja: 2 };
  const aOverdue = a.dueDate && a.dueDate < today && a.status !== 'Realizada';
  const bOverdue = b.dueDate && b.dueDate < today && b.status !== 'Realizada';
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
  if ((priorityRank[a.priority] ?? 1) !== (priorityRank[b.priority] ?? 1)) {
    return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
  }
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
}

function buildNoteData(payload, partial = false) {
  const data = {};
  const has = key => Object.prototype.hasOwnProperty.call(payload, key);

  if (has('title')) data.title = String(payload.title || '').trim();
  if (has('content')) data.content = payload.content ? String(payload.content).trim() : null;
  if (has('tags')) data.tags = JSON.stringify(normalizeTags(payload.tags));
  if (has('priority')) data.priority = NOTE_PRIORITIES.includes(payload.priority) ? payload.priority : 'Media';
  if (has('type')) data.type = NOTE_TYPES.includes(payload.type) ? payload.type : 'Recordatorio';
  if (has('dueDate')) data.dueDate = payload.dueDate ? String(payload.dueDate).slice(0, 10) : null;
  if (has('pinned')) data.pinned = Boolean(payload.pinned);
  if (has('linkedType')) data.linkedType = NOTE_LINKED_TYPES.includes(payload.linkedType) ? payload.linkedType : 'general';
  if (has('linkedId')) data.linkedId = payload.linkedId ? String(payload.linkedId).trim() : null;

  if (has('status')) {
    data.status = payload.status === 'Realizada' ? 'Realizada' : 'Pendiente';
    data.done = data.status === 'Realizada';
  } else if (has('done')) {
    data.done = Boolean(payload.done);
    data.status = data.done ? 'Realizada' : 'Pendiente';
  } else if (!partial) {
    data.status = 'Pendiente';
    data.done = false;
  }

  if (!partial) {
    if (!has('priority')) data.priority = 'Media';
    if (!has('type')) data.type = 'Recordatorio';
    if (!has('pinned')) data.pinned = false;
    if (!has('linkedType')) data.linkedType = 'general';
    if (!has('tags')) data.tags = '[]';
  }

  return data;
}

app.get('/api/notes', async (req, res) => {
  try {
    const { status, priority, type, linkedType, due } = req.query;
    const today = getTodayString();
    const where = {};

    if (status) where.status = status === 'Realizada' ? 'Realizada' : 'Pendiente';
    if (priority && NOTE_PRIORITIES.includes(priority)) where.priority = priority;
    if (type && NOTE_TYPES.includes(type)) where.type = type;
    if (linkedType && NOTE_LINKED_TYPES.includes(linkedType)) where.linkedType = linkedType;
    if (due === 'today') where.dueDate = today;
    if (due === 'overdue') {
      where.dueDate = { lt: today };
      where.status = 'Pendiente';
    }

    const notes = await prisma.note.findMany({ where, orderBy: { updatedAt: 'desc' } });
    res.json(notes.map(serializeNote).sort(sortOperationalNotes));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener notas');
  }
});

app.post('/api/notes', async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ error: 'El título es requerido' });
  try {
    const note = await prisma.note.create({
      data: buildNoteData(req.body),
    });
    res.status(201).json(serializeNote(note));
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear nota');
  }
});

app.patch('/api/notes/:id', async (req, res) => {
  const data = buildNoteData(req.body, true);
  if (data.title !== undefined && !data.title) {
    return res.status(400).json({ error: 'El título es requerido' });
  }
  try {
    const note = await prisma.note.update({ where: { id: req.params.id }, data });
    res.json(serializeNote(note));
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar nota');
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await prisma.note.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar nota');
  }
});

// ── Quote templates ─────────────────────────────────────────────────────────
app.get('/api/quote-templates', async (req, res) => {
  try {
    const templates = await prisma.quoteTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(templates.map(serializeQuoteTemplate));
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener plantillas');
  }
});

app.post('/api/quote-templates', async (req, res) => {
  const { errors, data } = validateQuoteTemplatePayload(req.body);
  if (errors.length) return sendValidationError(res, errors);
  try {
    const template = await prisma.quoteTemplate.create({ data });
    res.status(201).json(serializeQuoteTemplate(template));
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear plantilla');
  }
});

app.put('/api/quote-templates/:id', async (req, res) => {
  const { errors, data } = validateQuoteTemplatePayload(req.body);
  if (errors.length) return sendValidationError(res, errors);
  try {
    const template = await prisma.quoteTemplate.update({ where: { id: req.params.id }, data });
    res.json(serializeQuoteTemplate(template));
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar plantilla');
  }
});

app.delete('/api/quote-templates/:id', async (req, res) => {
  try {
    await prisma.quoteTemplate.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar plantilla');
  }
});

// ── Fixed costs ─────────────────────────────────────────────────────────────
const FIXED_COST_FREQUENCIES = ['Mensual', 'Anual', 'Por evento'];

app.get('/api/fixed-costs', async (req, res) => {
  try {
    const costs = await prisma.fixedCost.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(costs);
  } catch (error) {
    handlePrismaError(res, error, 'Error al obtener gastos fijos');
  }
});

app.post('/api/fixed-costs', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const amount = Number(req.body?.amount);
  const frequency = typeof req.body?.frequency === 'string' ? req.body.frequency.trim() : 'Mensual';
  if (!name) return res.status(400).json({ error: 'name es requerido' });
  if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: 'amount debe ser un número mayor o igual a 0' });
  if (!FIXED_COST_FREQUENCIES.includes(frequency)) return res.status(400).json({ error: `frequency debe ser: ${FIXED_COST_FREQUENCIES.join(', ')}` });
  try {
    const cost = await prisma.fixedCost.create({
      data: { name, amount, frequency, category: req.body?.category?.trim() || null, notes: req.body?.notes?.trim() || null },
    });
    res.status(201).json(cost);
  } catch (error) {
    handlePrismaError(res, error, 'Error al crear gasto fijo');
  }
});

app.put('/api/fixed-costs/:id', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const amount = Number(req.body?.amount);
  const frequency = typeof req.body?.frequency === 'string' ? req.body.frequency.trim() : 'Mensual';
  if (!name) return res.status(400).json({ error: 'name es requerido' });
  if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: 'amount debe ser un número mayor o igual a 0' });
  if (!FIXED_COST_FREQUENCIES.includes(frequency)) return res.status(400).json({ error: `frequency debe ser: ${FIXED_COST_FREQUENCIES.join(', ')}` });
  try {
    const cost = await prisma.fixedCost.update({
      where: { id: req.params.id },
      data: { name, amount, frequency, category: req.body?.category?.trim() || null, notes: req.body?.notes?.trim() || null },
    });
    res.json(cost);
  } catch (error) {
    handlePrismaError(res, error, 'Error al actualizar gasto fijo');
  }
});

app.delete('/api/fixed-costs/:id', async (req, res) => {
  try {
    await prisma.fixedCost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handlePrismaError(res, error, 'Error al eliminar gasto fijo');
  }
});

// ── Search & export ─────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2) {
    return res.json({ events: [], providers: [], inventory: [], notes: [], templates: [] });
  }

  try {
    const [events, providers, inventory, notes, templates] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { client: { contains: query } },
            { location: { contains: query } },
          ],
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.provider.findMany({
        where: { OR: [{ name: { contains: query } }, { category: { contains: query } }] },
        take: 5,
      }),
      prisma.catalogItem.findMany({
        where: { name: { contains: query } },
        take: 5,
      }),
      prisma.note.findMany({
        where: { OR: [{ title: { contains: query } }, { content: { contains: query } }] },
        take: 5,
      }),
      prisma.quoteTemplate.findMany({
        where: { name: { contains: query } },
        take: 5,
      }),
    ]);

    res.json({
      events: events.map(e => ({ id: e.id, title: e.title, client: e.client, status: e.status, date: e.date })),
      providers,
      inventory,
      notes: notes.map(serializeNote),
      templates: templates.map(serializeQuoteTemplate),
    });
  } catch (error) {
    handlePrismaError(res, error, 'Error en busqueda');
  }
});

app.get('/api/export', async (req, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const type = req.query.type || 'all';

  try {
    const payload = {};
    if (type === 'events' || type === 'all') {
      payload.events = await prisma.event.findMany({
        include: { insumos: true, payments: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (type === 'purchases' || type === 'all') {
      payload.purchases = await prisma.marketPurchase.findMany({
        include: { items: true },
        orderBy: { purchasedAt: 'desc' },
      });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="asamapp-${type}.json"`);
      return res.send(JSON.stringify(payload, null, 2));
    }

    let csv = '';
    if (payload.events) csv += eventsToCsv(payload.events);
    if (payload.purchases) {
      if (csv) csv += '\n\n';
      csv += purchasesToCsv(payload.purchases);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="asamapp-${type}.csv"`);
    res.send(csv);
  } catch (error) {
    handlePrismaError(res, error, 'Error al exportar datos');
  }
});

if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.join(__dirname, '../frontend/dist');
  const landingPath = path.join(__dirname, '../landing');

  // Landing en /
  app.use(express.static(landingPath));

  // App React en /app
  app.use('/app', express.static(distPath));
  app.get(/^\/app(\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  app.listen(PORT, () => {
    const mode = process.env.SERVE_FRONTEND === 'true' ? ' + frontend estatico' : '';
    console.log(`Servidor backend corriendo en http://localhost:${PORT}${mode}`);
  });
}

export { app, prisma };
