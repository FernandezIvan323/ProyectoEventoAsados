import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALERT_TYPES = {
  EVENT_UNCONFIRMED: 'event_unconfirmed',
  PAYMENT_OVERDUE: 'payment_overdue',
  LOW_STOCK: 'low_stock',
  NOTE_DUE: 'note_due',
  NOTE_OVERDUE: 'note_overdue',
  TASK_PENDING: 'task_pending',
};

const SEVERITY = { info: 'info', warn: 'warn', error: 'error' };

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function generateAlerts() {
  const today = getToday();
  const alerts = [];

  const events = await prisma.event.findMany({
    include: { payments: true },
  });
  for (const event of events) {
    if (event.status === 'Cotizado' || event.status === 'Pendiente') {
      if (event.date && event.date < today) {
        alerts.push({
          type: ALERT_TYPES.EVENT_UNCONFIRMED,
          severity: SEVERITY.warn,
          title: `Evento sin confirmar: ${event.title}`,
          message: `Fecha ${event.date} ya vencida y sigue en estado ${event.status}.`,
          link: `/app/history/${event.id}`,
          eventId: event.id,
        });
      }
    }

    const pending = Number(event.totalPrice || 0) - Number(event.amountPaid || 0);
    if (pending > 0 && event.status !== 'Cancelado' && event.status !== 'Cobrado') {
      if (event.date && event.date < daysAgo(today, -7)) {
        alerts.push({
          type: ALERT_TYPES.PAYMENT_OVERDUE,
          severity: SEVERITY.error,
          title: `Cobro atrasado: ${event.title}`,
          message: `Saldo pendiente $${pending.toFixed(2)} desde ${event.date}.`,
          link: `/app/history/${event.id}`,
          eventId: event.id,
        });
      }
    }
  }

  const inventory = await prisma.catalogItem.findMany();
  for (const item of inventory) {
    if (Number(item.stock || 0) <= Number(item.minStock || 0)) {
      alerts.push({
        type: ALERT_TYPES.LOW_STOCK,
        severity: SEVERITY.warn,
        title: `Stock bajo: ${item.name}`,
        message: `Stock actual ${item.stock} ${item.unit}, minimo ${item.minStock} ${item.unit}.`,
        link: '/app/inventory',
        catalogItemId: item.id,
      });
    }
  }

  const notes = await prisma.note.findMany({ where: { archived: false, status: { not: 'Realizada' } } });
  for (const note of notes) {
    if (!note.dueDate) continue;
    if (note.dueDate < today) {
      alerts.push({
        type: ALERT_TYPES.NOTE_OVERDUE,
        severity: SEVERITY.error,
        title: `Nota vencida: ${note.title}`,
        message: `Vencio el ${note.dueDate}.`,
        link: '/app/notes',
        noteId: note.id,
      });
    } else if (note.dueDate === today) {
      alerts.push({
        type: ALERT_TYPES.NOTE_DUE,
        severity: SEVERITY.info,
        title: `Nota para hoy: ${note.title}`,
        message: `Vence hoy.`,
        link: '/app/notes',
        noteId: note.id,
      });
    }
  }

  const tasks = await prisma.eventTask.findMany({
    where: { done: false },
    include: { event: true },
  });
  for (const task of tasks) {
    if (task.dueDate && task.dueDate < today) {
      alerts.push({
        type: ALERT_TYPES.TASK_PENDING,
        severity: SEVERITY.warn,
        title: `Tarea atrasada: ${task.title}`,
        message: `Pendiente en evento ${task.event.title}.`,
        link: `/app/history/${task.eventId}`,
        eventId: task.eventId,
      });
    }
  }

  return alerts;
}

export { ALERT_TYPES, SEVERITY };
