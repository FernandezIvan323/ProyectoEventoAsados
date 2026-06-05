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
import '../pages/History.css';

const statusColors = {
  Pendiente: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Cotizado: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  Aprobado: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Realizado: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  Cobrado: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Cancelado: 'bg-red-500/15 text-red-300 border-red-500/20',
};

const selectClass = 'w-full appearance-none rounded-lg border border-[#f4f1ea1a] bg-[#141211] px-3.5 py-2.5 pr-8 text-sm text-[#f4f1ea] shadow-[inset_0_1px_0_0_#f4f1ea08] transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

const inputClass = 'w-full rounded-lg border border-[#f4f1ea1a] bg-[#141211] px-3.5 py-2.5 text-sm text-[#f4f1ea] placeholder:text-muted-foreground/40 shadow-[inset_0_1px_0_0_#f4f1ea08] transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

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
        <Button variant="ghost" asChild className="text-muted-foreground/70 hover:text-[#f4f1ea]">
          <Link to="/history"><ArrowLeft className="size-4" /> Volver</Link>
        </Button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={handlePrint} className="h-8 rounded-lg border border-[#f4f1ea1a] bg-transparent px-3 text-xs text-muted-foreground/80 transition-all duration-150 hover:bg-[#262422] hover:text-[#f4f1ea]">
          <Printer className="size-3.5 mr-1" /> Imprimir
        </Button>
        <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading} className="h-8 rounded-lg border border-[#f4f1ea1a] bg-transparent px-3 text-xs text-muted-foreground/80 transition-all duration-150 hover:bg-[#262422] hover:text-[#f4f1ea]">
          <FileDown className="size-3.5 mr-1" /> {pdfLoading ? 'Generando...' : 'PDF'}
        </Button>
        <Button variant="secondary" asChild className="h-8 rounded-lg bg-primary/85 px-3 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-110">
          <Link to={`/history/${id}/edit`}><Pencil className="size-3.5 mr-1" /> Editar</Link>
        </Button>
        <Button variant="secondary" onClick={handleDuplicate} className="h-8 rounded-lg border border-[#f4f1ea1a] bg-transparent px-3 text-xs text-muted-foreground/80 transition-all duration-150 hover:bg-[#262422] hover:text-[#f4f1ea]">
          <Copy className="size-3.5 mr-1" /> Duplicar
        </Button>
      </div>

      <div className="print-area space-y-6">
        {/* Header + Status Selector */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant={getStatusVariant(event.status)} className="text-xs">{event.status}</Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[#f4f1ea]">{event.title}</h1>
            <p className="text-sm text-muted-foreground/70">
              {event.client || 'Sin cliente'}
              {event.date && ` · ${format(parseISO(event.date), 'dd MMM yyyy', { locale: es })}`}
              {event.time && ` ${event.time}`}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          <div className="no-print space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Estado del evento</label>
            <div className="relative">
              <select className={`appearance-none rounded-lg border px-4 py-2.5 pr-8 text-sm font-medium capitalize shadow-[inset_0_1px_0_0_#f4f1ea08] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-primary/50 ${statusColors[event.status] || 'bg-muted/30 text-muted-foreground border-border'}`} value={event.status} onChange={(e) => handleStatusChange(e.target.value)}>
                {getAllowedStatuses(event.status).map(status => (
                  <option key={status} value={status} className="bg-[#1c1a18] text-[#f4f1ea]">{status}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50">▾</div>
            </div>
          </div>
        </div>

        {mutationError && <p className="no-print text-sm text-destructive">{mutationError.message}</p>}

        {/* KPI Metrics Grid */}
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-[#f4f1ea14] bg-gradient-to-b from-[#201d1b] to-[#1c1a18] p-4 shadow-[inset_0_1px_0_0_#f4f1ea08]">
            <div className="flex items-center gap-2 mb-2">
              <ReceiptText className="size-3.5 text-accent/70" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Cotizado</span>
            </div>
            <p className="text-lg font-bold text-[#f4f1ea]">${currency(real.quotedPrice)}</p>
          </div>
          <div className="rounded-xl border border-[#f4f1ea14] bg-gradient-to-b from-[#201d1b] to-[#1c1a18] p-4 shadow-[inset_0_1px_0_0_#f4f1ea08]">
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-3.5 text-accent/70" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Costo presup.</span>
            </div>
            <p className="text-lg font-bold text-[#f4f1ea]">${currency(real.quotedCost)}</p>
          </div>
          <div className="rounded-xl border border-[#f4f1ea14] bg-gradient-to-b from-[#201d1b] to-[#1c1a18] p-4 shadow-[inset_0_1px_0_0_#f4f1ea08]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-3.5 text-accent/70" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Ganancia proy.</span>
            </div>
            <p className="text-lg font-bold text-[#f4f1ea]">${currency(real.quotedProfit)}</p>
          </div>
          <div className="rounded-xl border border-[#f4f1ea14] bg-gradient-to-b from-[#201d1b] to-[#1c1a18] p-4 shadow-[inset_0_1px_0_0_#f4f1ea08]">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="size-3.5 text-accent/70" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Gastado</span>
            </div>
            <p className="text-lg font-bold text-[#f4f1ea]">${currency(real.purchaseTotal)}</p>
          </div>
          <div className="rounded-xl border border-[#f4f1ea14] bg-gradient-to-b from-[#201d1b] to-[#1c1a18] p-4 shadow-[inset_0_1px_0_0_#f4f1ea08]">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="size-3.5 text-accent/70" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Cobrado</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">${currency(real.amountPaid)}</p>
          </div>
          <div className="rounded-xl border border-[#f4f1ea14] bg-gradient-to-b from-[#201d1b] to-[#1c1a18] p-4 shadow-[inset_0_1px_0_0_#f4f1ea08]">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="size-3.5 text-accent/70" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Margen real</span>
              {real.isClosed && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">· Cerrado</span>}
            </div>
            <p className={`text-lg font-bold ${real.realProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${currency(real.realProfit)}
            </p>
          </div>
        </div>

        {/* Variance and pending text */}
        <div className="no-print flex flex-wrap items-center gap-4 text-xs text-muted-foreground/60">
          {real.costVariance !== 0 && (
            <span className={`inline-flex items-center gap-1 ${real.costVariance > 0 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
              <AlertCircle className="size-3" />
              Diferencia: {real.costVariance > 0 ? '+' : ''}${currency(real.costVariance)}
            </span>
          )}
          {real.pending > 0 && (
            <span className="inline-flex items-center gap-1 text-accent/70">
              <AlertCircle className="size-3" />
              Pendiente por cobrar: ${currency(real.pending)}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="no-print space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
            <span>Progreso de cobro</span>
            <span>{paidPercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#f4f1ea0d]">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>

        {/* Budget Breakdown */}
        <Card>
          <CardHeader className="border-b border-[#f4f1ea14] pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4.5 text-accent" />
              Presupuesto — Insumos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b border-[#f4f1ea0d]">
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Item</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Cant.</th>
                    <th className="h-10 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(event.insumos || []).map(item => (
                    <tr key={item.id} className="border-b border-[#f4f1ea08] transition-colors hover:bg-[#262422]/40">
                      <td className="p-3 text-sm text-[#f4f1ea]">{item.name}</td>
                      <td className="p-3 text-sm text-muted-foreground/70">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right text-sm font-medium text-[#f4f1ea]">${currency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-[#f4f1ea14] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/70">Subtotal + extras</span>
                <span className="font-medium text-[#f4f1ea]">${currency(getEventSubtotal(event))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/70">Ganancia ({event.profitMargin}%)</span>
                <span className="font-medium text-accent">${currency(financials.profit)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-[#f4f1ea1a] pt-3 text-lg font-bold text-[#f4f1ea]">
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
          <CardHeader className="border-b border-[#f4f1ea14] pb-4">
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
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:brightness-110">
                <Plus className="size-4" /> Agregar
              </button>
            </form>
            {(event.tasks || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#f4f1ea1a] py-10">
                <ListChecks className="size-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/50">Sin tareas</p>
                <p className="text-xs text-muted-foreground/40">Agrega tareas para el día del evento.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {event.tasks.map(task => (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg border border-[#f4f1ea0d] bg-[#151312] p-3 shadow-[inset_0_1px_0_0_#f4f1ea06]">
                    <button type="button" onClick={() => handleToggleTask(task)} className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-all ${task.done ? 'border-primary bg-primary text-primary-foreground' : 'border-[#f4f1ea1a] text-transparent hover:border-primary/50'}`}>
                      {task.done && <Check className="size-3.5" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${task.done ? 'text-muted-foreground/50 line-through' : 'text-[#f4f1ea]'}`}>{task.title}</p>
                      {task.dueDate && <p className="mt-0.5 text-[10px] text-muted-foreground/50">Vence: {format(parseISO(task.dueDate), 'dd/MM/yyyy')}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="border-b border-[#f4f1ea14] pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="size-4.5 text-accent" />
              Pagos
            </CardTitle>
            <CardDescription>Registra abonos del cliente.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <form onSubmit={handleAddPayment} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Monto</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Método</label>
                <div className="relative">
                  <select className={selectClass} value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m} className="bg-[#1c1a18] text-[#f4f1ea]">{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">▾</div>
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Notas</label>
                <input className={inputClass} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Opcional" />
              </div>
              <button type="submit" className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:brightness-110">
                <Plus className="size-4" /> Registrar pago
              </button>
            </form>
            {(event.payments || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#f4f1ea1a] py-10">
                <DollarSign className="size-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/50">Sin pagos</p>
                <p className="text-xs text-muted-foreground/40">Los abonos aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-[#f4f1ea0d]">
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Fecha</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Método</th>
                      <th className="h-9 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.payments.map(p => (
                      <tr key={p.id} className="border-b border-[#f4f1ea08] transition-colors hover:bg-[#262422]/40">
                        <td className="p-3 text-xs text-muted-foreground/70">{format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="p-3 text-sm text-[#f4f1ea]/80">{p.paymentMethod}</td>
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
          <CardHeader className="border-b border-[#f4f1ea14] pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4.5 text-accent" />
              Compras de mercado
            </CardTitle>
            <CardDescription>Gastos reales vinculados a este evento.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {(event.purchases || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#f4f1ea1a] py-10">
                <ShoppingCart className="size-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/50">Sin compras vinculadas</p>
                <p className="text-xs text-muted-foreground/40">Asocia una compra al crear un gasto de mercado.</p>
                <Button variant="outline" onClick={() => navigate('/weekly-expenses/new')} className="mt-2 rounded-lg border border-[#f4f1ea1a] bg-transparent px-4 py-2 text-xs text-muted-foreground/80 hover:bg-[#262422] hover:text-[#f4f1ea]">
                  Registrar compra
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-[#f4f1ea0d]">
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Fecha</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Tienda</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Items</th>
                      <th className="h-9 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.purchases.map(p => (
                      <tr key={p.id} className="border-b border-[#f4f1ea08] transition-colors hover:bg-[#262422]/40">
                        <td className="p-3 text-xs text-muted-foreground/70">{format(new Date(p.purchasedAt), 'dd/MM/yyyy')}</td>
                        <td className="p-3 text-sm text-[#f4f1ea]/80">{p.store}</td>
                        <td className="p-3 text-sm text-muted-foreground/70">{p.items?.length || 0} productos</td>
                        <td className="p-3 text-right text-sm font-medium text-[#f4f1ea]">${currency(p.totalAmount)}</td>
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
            <CardHeader className="border-b border-[#f4f1ea14] pb-4">
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
                    <tr className="border-b border-[#f4f1ea0d]">
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Fecha</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Campo</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Antes</th>
                      <th className="h-9 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Después</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.changelog.map(log => (
                      <tr key={log.id} className="border-b border-[#f4f1ea08] transition-colors hover:bg-[#262422]/40">
                        <td className="p-3 text-xs text-muted-foreground/70">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="p-3 text-sm font-medium text-[#f4f1ea]/80 capitalize">{log.field === 'totalPrice' ? 'Precio' : 'Estado'}</td>
                        <td className="p-3 text-sm text-muted-foreground/60">{log.field === 'totalPrice' ? `$${currency(Number(log.oldValue))}` : log.oldValue}</td>
                        <td className="p-3 text-sm text-[#f4f1ea]">{log.field === 'totalPrice' ? `$${currency(Number(log.newValue))}` : log.newValue}</td>
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
