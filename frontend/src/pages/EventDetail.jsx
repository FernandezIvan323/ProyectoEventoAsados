import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  DollarSign,
  Copy,
  FileDown,
  History,
  Pencil,
  Plus,
  Printer,
  ShoppingCart,
  TrendingUp,
  Package,
  PiggyBank,
  CreditCard,
  AlertCircle,
  ListChecks,
  ReceiptText,
} from 'lucide-react';
import { generateEventPdf } from '@/lib/generatePdf';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { getAllowedStatuses, getStatusVariant } from '@/lib/eventStatus';
import { currency, getEventFinancials, getEventRealFinancials, getEventSubtotal } from '@/lib/finance';
import { PAYMENT_METHODS } from '@/lib/paymentMethods';
import {
  createEventPayment,
  createEventTask,
  duplicateEvent,
  getEvent,
  updateEventStatus,
  updateEventTask,
} from '@/services/eventsApi';

const inputClass = 'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

const selectClass = 'w-full appearance-none rounded-lg border border-border bg-card px-3.5 py-2.5 pr-8 text-sm text-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'Efectivo', notes: '' });

  const loadEvent = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getEvent(id)
      .then(setEvent)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  const handleStatusChange = async (newStatus) => {
    try {
      setMutationError(null);
      const updated = await updateEventStatus(id, newStatus);
      setEvent(updated);
    } catch (err) { setMutationError(err); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      setMutationError(null);
      await createEventTask(id, { title: taskForm.title.trim(), dueDate: taskForm.dueDate || null, done: false });
      setTaskForm({ title: '', dueDate: '' });
      loadEvent();
    } catch (err) { setMutationError(err); }
  };

  const handleToggleTask = async (task) => {
    try {
      setMutationError(null);
      await updateEventTask(id, task.id, { title: task.title, dueDate: task.dueDate, done: !task.done });
      loadEvent();
    } catch (err) { setMutationError(err); }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) return;
    try {
      setMutationError(null);
      await createEventPayment(id, { amount, paymentMethod: paymentForm.paymentMethod, notes: paymentForm.notes || null });
      setPaymentForm({ amount: '', paymentMethod: 'Efectivo', notes: '' });
      loadEvent();
    } catch (err) { setMutationError(err); }
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const name = event?.title ? `presupuesto-${event.title.replace(/\s+/g, '-').toLowerCase()}.pdf` : 'presupuesto.pdf';
      await generateEventPdf(name);
    } catch (err) { setMutationError(err); } finally { setPdfLoading(false); }
  };

  const handleDuplicate = async () => {
    try {
      setMutationError(null);
      const copy = await duplicateEvent(id);
      navigate(`/history/${copy.id}/edit`);
    } catch (err) { setMutationError(err); }
  };

  if (isLoading) return <LoadingState title="Cargando evento" description="Obteniendo tareas, pagos y compras." />;
  if (error) return <ErrorState description={error.message} onRetry={loadEvent} />;
  if (!event) return <EmptyState title="Evento no encontrado" description="El presupuesto puede haber sido eliminado." />;

  const financials = getEventFinancials(event);
  const real = getEventRealFinancials(event);
  const paidPercent = event.totalPrice > 0 ? Math.min(100, (event.amountPaid / event.totalPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="ghost" asChild>
          <Link to="/history"><ArrowLeft className="size-4" /> Volver</Link>
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="size-3.5" /> Imprimir
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
          <FileDown className="size-3.5" /> {pdfLoading ? 'Generando...' : 'PDF'}
        </Button>
        <Button size="sm" asChild>
          <Link to={`/history/${id}/edit`}><Pencil className="size-3.5" /> Editar</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleDuplicate}>
          <Copy className="size-3.5" /> Duplicar
        </Button>
      </div>

      <div className="print-area space-y-6">
        {/* Header + Status Selector */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant={getStatusVariant(event.status)} className="text-xs">{event.status}</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              {event.client || 'Sin cliente'}
              {event.date && ` · ${format(parseISO(event.date), 'dd MMM yyyy', { locale: es })}`}
              {event.time && ` ${event.time}`}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          <div className="no-print space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Estado del evento</label>
            <select
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                event.status === 'Cobrado' || event.status === 'Aprobado' || event.status === 'Realizado'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : event.status === 'Cotizado'
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                  : event.status === 'Pendiente'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : event.status === 'Cancelado'
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-border bg-card text-foreground'
              }`}
              value={event.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {getAllowedStatuses(event.status).map(status => (
                <option key={status} value={status} className="bg-card text-foreground">{status}</option>
              ))}
            </select>
          </div>
        </div>

        {mutationError && <p className="no-print text-sm text-destructive">{mutationError.message}</p>}

        {/* KPI Metrics Grid */}
        <StaggerContainer className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptText className="size-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cotizado</span>
                </div>
                <p className="text-lg font-bold text-foreground">${currency(real.quotedPrice)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="size-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Costo presup.</span>
                </div>
                <p className="text-lg font-bold text-foreground">${currency(real.quotedCost)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ganancia proy.</span>
                </div>
                <p className="text-lg font-bold text-foreground">${currency(real.quotedProfit)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="size-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gastado</span>
                </div>
                <p className="text-lg font-bold text-foreground">${currency(real.purchaseTotal)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="size-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cobrado</span>
                </div>
                <p className="text-lg font-bold text-emerald-400">${currency(real.amountPaid)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="size-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Margen real</span>
                  {real.isClosed && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">· Cerrado</span>}
                </div>
                <p className={`text-lg font-bold ${real.realProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${currency(real.realProfit)}
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Variance and pending text */}
        <div className="no-print flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {real.costVariance !== 0 && (
            <span className={`inline-flex items-center gap-1 ${real.costVariance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              <AlertCircle className="size-3" />
              Diferencia: {real.costVariance > 0 ? '+' : ''}${currency(real.costVariance)}
            </span>
          )}
          {real.pending > 0 && (
            <span className="inline-flex items-center gap-1 text-accent">
              <AlertCircle className="size-3" />
              Pendiente por cobrar: ${currency(real.pending)}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="no-print space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progreso de cobro</span>
            <span>{paidPercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>

        {/* Budget Breakdown */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4.5 text-accent" />
              Presupuesto — Insumos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Item</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cant.</th>
                    <th className="h-10 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(event.insumos || []).map(item => (
                    <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-muted/40">
                      <td className="p-3 text-sm text-foreground">{item.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right text-sm font-medium text-foreground">${currency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal + extras</span>
                <span className="font-medium text-foreground">${currency(getEventSubtotal(event))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ganancia ({event.profitMargin}%)</span>
                <span className="font-medium text-accent">${currency(financials.profit)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold text-foreground">
                <span>Total</span>
                <span>${currency(event.totalPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks & Payments */}
      <div className="no-print grid gap-6 xl:grid-cols-2">
        {/* Tasks */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4.5 text-accent" />
              Tareas
            </CardTitle>
            <CardDescription>Checklist operativo del evento.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <form onSubmit={handleAddTask} className="flex flex-wrap gap-2">
              <input className={`${inputClass} min-w-[12rem] flex-1`} placeholder="Nueva tarea" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              <input type="date" className={`${inputClass} w-36`} value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              <Button type="submit" size="default">
                <Plus className="size-4" /> Agregar
              </Button>
            </form>
            {(event.tasks || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10">
                <ListChecks className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Sin tareas</p>
                <p className="text-xs text-muted-foreground">Agrega tareas para el día del evento.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {event.tasks.map(task => (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-all ${
                        task.done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-transparent hover:border-primary/50'
                      }`}
                    >
                      {task.done && <Check className="size-3.5" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</p>
                      {task.dueDate && <p className="mt-0.5 text-[10px] text-muted-foreground">Vence: {format(parseISO(task.dueDate), 'dd/MM/yyyy')}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="size-4.5 text-accent" />
              Pagos
            </CardTitle>
            <CardDescription>Registra abonos del cliente.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <form onSubmit={handleAddPayment} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Monto</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Método</label>
                <select className={selectClass} value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Notas</label>
                <input className={inputClass} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Opcional" />
              </div>
              <Button type="submit" className="sm:col-span-2">
                <Plus className="size-4" /> Registrar pago
              </Button>
            </form>
            {(event.payments || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10">
                <DollarSign className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Sin pagos</p>
                <p className="text-xs text-muted-foreground">Los abonos aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fecha</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Método</th>
                      <th className="h-9 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.payments.map(p => (
                      <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-muted/40">
                        <td className="p-3 text-xs text-muted-foreground">{format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="p-3 text-sm text-foreground">{p.paymentMethod}</td>
                        <td className="p-3 text-right text-sm font-medium text-emerald-400">${currency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchases */}
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4.5 text-accent" />
              Compras de mercado
            </CardTitle>
            <CardDescription>Gastos reales vinculados a este evento.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {(event.purchases || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10">
                <ShoppingCart className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Sin compras vinculadas</p>
                <p className="text-xs text-muted-foreground">Asocia una compra al crear un gasto de mercado.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/weekly-expenses/new')} className="mt-2">
                  Registrar compra
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fecha</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tienda</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Items</th>
                      <th className="h-9 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.purchases.map(p => (
                      <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-muted/40">
                        <td className="p-3 text-xs text-muted-foreground">{format(new Date(p.purchasedAt), 'dd/MM/yyyy')}</td>
                        <td className="p-3 text-sm text-foreground">{p.store}</td>
                        <td className="p-3 text-sm text-muted-foreground">{p.items?.length || 0} productos</td>
                        <td className="p-3 text-right text-sm font-medium text-foreground">${currency(p.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Changelog */}
        {(event.changelog || []).length > 0 && (
          <Card className="xl:col-span-2">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4.5 text-accent" />
                Historial de cambios
              </CardTitle>
              <CardDescription>Cambios de precio y estado registrados automáticamente.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fecha</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Campo</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Antes</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Después</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.changelog.map(log => (
                      <tr key={log.id} className="border-b border-border/50 transition-colors hover:bg-muted/40">
                        <td className="p-3 text-xs text-muted-foreground">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="p-3 text-sm font-medium text-foreground capitalize">{log.field === 'totalPrice' ? 'Precio' : 'Estado'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{log.field === 'totalPrice' ? `$${currency(Number(log.oldValue))}` : log.oldValue}</td>
                        <td className="p-3 text-sm text-foreground">{log.field === 'totalPrice' ? `$${currency(Number(log.newValue))}` : log.newValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
