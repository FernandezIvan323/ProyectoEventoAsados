import { getMonth, getYear, parseISO } from 'date-fns';

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function currency(value) {
  return Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

export function getEventSubtotal(event) {
  const itemsTotal = event.insumos?.reduce((total, item) => total + Number(item.totalCost || 0), 0) || 0;
  return itemsTotal + Number(event.extraCosts || 0);
}

export function getEventFinancials(event) {
  const final = Number(event.totalPrice || 0);
  const subtotal = getEventSubtotal(event);
  const cost = subtotal || final / (1 + (Number(event.profitMargin || 0) / 100));
  const profit = final - cost;

  return { final, profit, cost };
}

export function getEventPurchaseTotal(event) {
  return (event.purchases || []).reduce((sum, purchase) => sum + Number(purchase.totalAmount || 0), 0);
}

export function getEventRealFinancials(event) {
  const quotedCost = getEventSubtotal(event);
  const quotedPrice = Number(event.totalPrice || 0);
  const purchaseTotal = getEventPurchaseTotal(event);
  const amountPaid = Number(event.amountPaid || 0);
  const quotedProfit = quotedPrice - quotedCost;
  const realProfit = amountPaid - purchaseTotal;

  return {
    quotedCost,
    quotedPrice,
    quotedProfit,
    purchaseTotal,
    amountPaid,
    pending: Math.max(0, quotedPrice - amountPaid),
    realProfit,
    costVariance: purchaseTotal - quotedCost,
    isClosed: event.status === 'Cobrado',
  };
}

export function getAvailableYears(events, fallbackYear = new Date().getFullYear()) {
  const years = events
    .filter(event => event.date)
    .map(event => getYear(parseISO(event.date)));

  const uniqueYears = [...new Set(years)].sort((a, b) => b - a);

  if (!uniqueYears.includes(fallbackYear)) {
    uniqueYears.unshift(fallbackYear);
  }

  return uniqueYears;
}

export function getYearlyEvents(events, year) {
  return events.filter(event => {
    if (!event.date || event.status === 'Cancelado') return false;
    return getYear(parseISO(event.date)) === year;
  });
}

export function getMonthlyFinance(events, year) {
  const yearlyEvents = getYearlyEvents(events, year);

  return MONTHS.map((name, index) => {
    const monthEvents = yearlyEvents.filter(event => getMonth(parseISO(event.date)) === index);
    const totals = monthEvents.reduce((acc, event) => {
      const financials = getEventFinancials(event);
      const real = getEventRealFinancials(event);
      return {
        ingresos: acc.ingresos + financials.final,
        ganancia: acc.ganancia + financials.profit,
        costos: acc.costos + financials.cost,
        gastosReales: acc.gastosReales + real.purchaseTotal,
        cobrado: acc.cobrado + real.amountPaid,
        gananciaReal: acc.gananciaReal + real.realProfit,
      };
    }, { ingresos: 0, ganancia: 0, costos: 0, gastosReales: 0, cobrado: 0, gananciaReal: 0 });

    return {
      name,
      count: monthEvents.length,
      ...totals,
    };
  });
}

export function getDashboardSummary(events) {
  return {
    totalEvents: events.length,
    totalGuests: events.reduce((total, event) => total + Number(event.guests || 0), 0),
    pendingEvents: events.filter(event => event.status === 'Pendiente').length,
    closedEvents: events.filter(event => event.status === 'Aprobado' || event.status === 'Realizado').length,
  };
}
