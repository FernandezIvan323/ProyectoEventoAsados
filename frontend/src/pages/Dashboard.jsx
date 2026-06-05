import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  Calendar as CalendarIcon,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Flame,
  ListChecks,
  MapPin,
  Plus,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Wallet,
  StickyNote,
  AlertOctagon,
  ShoppingCart,
} from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { useEvents } from '@/hooks/useEvents';
import { getStatusVariant } from '@/lib/eventStatus';
import { currency, getDashboardSummary, getEventRealFinancials } from '@/lib/finance';
import { getOperationsSummary } from '@/services/operationsApi';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getUserName() {
  const user = JSON.parse(localStorage.getItem('asamapp_user') || 'null');
  return user?.username || 'Usuario';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { events, isLoading, error, refresh } = useEvents();
  const [ops, setOps] = useState(null);
  const { totalEvents, totalGuests, pendingEvents, closedEvents } = getDashboardSummary(events);

  useEffect(() => {
    getOperationsSummary().then(setOps).catch(() => setOps(null));
  }, []);

  const todayEvents = useMemo(
    () => events.filter(e => e.date && isToday(parseISO(e.date)) && e.status !== 'Cancelado'),
    [events],
  );

  const pendingPayments = useMemo(
    () => events.filter(e => {
      const r = getEventRealFinancials(e);
      return r.pending > 0 && !['Cancelado', 'Cobrado'].includes(e.status);
    }),
    [events],
  );

  const totalPendingRevenue = useMemo(
    () => pendingPayments.reduce((sum, e) => sum + getEventRealFinancials(e).pending, 0),
    [pendingPayments],
  );

  const upcoming = useMemo(
    () => events
      .filter(e => e.date && e.status !== 'Cancelado')
      .slice(0, 6),
    [events],
  );

  const pendingActionEvents = useMemo(() => {
    const actionableStatuses = ['Pendiente', 'Cotizado', 'Compras pendientes', 'Aprobado'];
    return events
      .filter(e => actionableStatuses.includes(e.status) && e.date)
      .sort((a, b) => parseISO(a.date) - parseISO(b.date))
      .slice(0, 5);
  }, [events]);

  const alerts = useMemo(() => {
    const today = new Date();
    const result = [];
    for (const e of events) {
      if (!e.date || e.status === 'Cancelado' || e.status === 'Cobrado') continue;
      const days = differenceInDays(parseISO(e.date), today);
      if (days >= 0 && days <= 3 && ['Cotizado', 'Pendiente'].includes(e.status)) {
        result.push({ id: e.id, eventId: e.id, title: e.title, msg: `En ${days === 0 ? 'hoy' : `${days} dia${days > 1 ? 's' : ''}`} y sin confirmar`, level: 'error' });
      }
      if (days >= 0 && days <= 7 && e.tasks?.some(t => !t.done)) {
        const pending = e.tasks.filter(t => !t.done).length;
        result.push({ id: `${e.id}-tasks`, eventId: e.id, title: e.title, msg: `${pending} tarea${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''}`, level: 'warning' });
      }
      if (e.status === 'Realizado') {
        result.push({ id: `${e.id}-cobro`, eventId: e.id, title: e.title, msg: 'Realizado sin cobrar', level: 'warning' });
      }
    }
    return result;
  }, [events]);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {getGreeting()}, <span className="text-primary">{getUserName()}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              {totalEvents === 0
                ? 'Creá tu primer presupuesto para comenzar.'
                : `${pendingEvents} evento${pendingEvents !== 1 ? 's' : ''} pendiente${pendingEvents !== 1 ? 's' : ''} · ${closedEvents} cerrado${closedEvents !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <Button onClick={() => navigate('/new-event')} size="lg" className="w-full sm:w-auto">
            <Plus className="size-4" /> Nuevo presupuesto
          </Button>
        </div>
      </FadeIn>

      {/* ── Note Alerts ── */}
      {ops?.noteAlerts && (ops.noteAlerts.overdue > 0 || ops.noteAlerts.today > 0 || ops.noteAlerts.pending > 0) && (
        <FadeIn delay={0.04}>
          <button
            type="button"
            onClick={() => navigate('/notes')}
            className="group flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/10"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <StickyNote className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {ops.noteAlerts.pending} nota{ops.noteAlerts.pending !== 1 ? 's' : ''} pendiente{ops.noteAlerts.pending !== 1 ? 's' : ''}
              </p>
              <p className="truncate text-xs text-primary/70">
                {ops.noteAlerts.overdue > 0 && `${ops.noteAlerts.overdue} vencida${ops.noteAlerts.overdue > 1 ? 's' : ''}`}
                {ops.noteAlerts.overdue > 0 && ops.noteAlerts.today > 0 && ' · '}
                {ops.noteAlerts.today > 0 && `${ops.noteAlerts.today} para hoy`}
                {ops.noteAlerts.overdue === 0 && ops.noteAlerts.today === 0 && 'Revisá la bandeja de notas'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {ops.noteAlerts.overdue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 px-2.5 py-1.5 text-xs font-bold text-red-300">
                  <AlertOctagon className="size-3" /> {ops.noteAlerts.overdue}
                </span>
              )}
              {ops.noteAlerts.today > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-bold text-primary">
                  <Clock className="size-3" /> {ops.noteAlerts.today}
                </span>
              )}
              <ArrowRight className="size-4 shrink-0 text-primary/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        </FadeIn>
      )}

      {/* ── Alert Banner ── */}
      {alerts.length > 0 && (
        <FadeIn delay={0.05}>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <Bell className="size-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-300">
                  {alerts.length} alerta{alerts.length > 1 ? 's' : ''} activa{alerts.length > 1 ? 's' : ''}
                </p>
                <p className="truncate text-xs text-amber-400/70">
                  {alerts.filter(a => a.level === 'error').length > 0 && `${alerts.filter(a => a.level === 'error').length} critica${alerts.filter(a => a.level === 'error').length > 1 ? 's' : ''}`}
                  {alerts.filter(a => a.level === 'error').length > 0 && alerts.filter(a => a.level === 'warning').length > 0 && ' · '}
                  {alerts.filter(a => a.level === 'warning').length > 0 && `${alerts.filter(a => a.level === 'warning').length} advertencia${alerts.filter(a => a.level === 'warning').length > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="hidden flex-wrap gap-1.5 sm:flex">
                {alerts.slice(0, 3).map(a => (
                  <Link
                    key={a.id}
                    to={`/history/${a.eventId}`}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:brightness-110 ${
                      a.level === 'error'
                        ? 'bg-destructive/15 text-red-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {a.level === 'error' ? <CircleAlert className="size-3" /> : <CircleCheck className="size-3" />}
                    {a.title}
                  </Link>
                ))}
                {alerts.length > 3 && (
                  <span className="flex items-center rounded-lg bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
                    +{alerts.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Metrics ── */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <Card className="relative overflow-hidden border-l-4 border-l-primary">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Eventos</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">{totalEvents}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{closedEvents} cerrados</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Flame className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Invitados</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">{totalGuests}</p>
                  <p className="mt-1 text-xs text-muted-foreground">en total</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Users className="size-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Por cobrar</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">${currency(totalPendingRevenue)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{pendingPayments.length} evento{pendingPayments.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <Wallet className="size-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hoy</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">{todayEvents.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">evento{todayEvents.length !== 1 ? 's' : ''} programado{todayEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Clock className="size-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* ── Quick Actions ── */}
      <FadeIn delay={0.1}>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Accesos rapidos</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Calendario', desc: 'Ver eventos del mes', icon: CalendarIcon, path: '/calendar', color: 'text-primary' },
              { label: 'Cotizador', desc: 'Crear presupuesto rapido', icon: TrendingUp, path: '/quick-quote', color: 'text-blue-400' },
              { label: 'Lista compras', desc: 'Consolidar insumos', icon: ListChecks, path: '/shopping-list', color: 'text-amber-400' },
              { label: 'Inventario', desc: 'Stock y proveedores', icon: ClipboardList, path: '/inventory', color: 'text-violet-400' },
            ].map(action => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary ${action.color}`}>
                  <action.icon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Pending Action Events ── */}
      {pendingActionEvents.length > 0 && (
        <FadeIn delay={0.12}>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Eventos que necesitan tu atencion</h2>
            <Card>
              <CardContent className="pt-5">
                <div className="space-y-2">
                  {pendingActionEvents.map(event => {
                    const dateObj = parseISO(event.date);
                    const daysUntil = differenceInDays(dateObj, new Date());
                    const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                    return (
                      <div
                        key={event.id}
                        className={`group flex flex-col gap-3 rounded-xl border p-3 transition-all sm:flex-row sm:items-center sm:gap-4 ${
                          isUrgent
                            ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                            : 'border-border/40 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border ${
                          isUrgent ? 'border-amber-500/40 bg-amber-500/10' : 'border-border/60 bg-secondary/40'
                        }`}>
                          <span className={`text-lg font-bold ${isUrgent ? 'text-amber-300' : 'text-foreground'}`}>
                            {format(dateObj, 'dd', { locale: es })}
                          </span>
                          <span className="text-[9px] uppercase text-muted-foreground">
                            {format(dateObj, 'MMM', { locale: es })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-foreground">{event.title}</h3>
                            <Badge variant={getStatusVariant(event.status)} className="shrink-0 text-[10px]">{event.status}</Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" /> {event.guests || 0}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" /> {event.location}
                              </span>
                            )}
                            {daysUntil >= 0 && (
                              <span className={isUrgent ? 'text-amber-300' : 'text-muted-foreground/60'}>
                                en {daysUntil === 0 ? 'hoy' : `${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                          {event.status === 'Compras pendientes' && (
                            <Button
                              size="sm"
                              onClick={() => navigate('/weekly-expenses/new', { state: { purchaseDraft: { eventId: event.id } } })}
                              className="w-full sm:w-auto"
                            >
                              <ShoppingCart className="size-3.5" /> Agregar compra
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                            <Link to={`/history/${event.id}`}>
                              <ArrowRight className="size-3.5" /> Ver detalle
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}

      {/* ── Main Content ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Upcoming Events */}
        <div className="lg:col-span-3">
          <FadeIn delay={0.15}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base">Proximos eventos</CardTitle>
                  <CardDescription>Los mas proximos en tu agenda.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/calendar" className="text-xs">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingState title="Cargando eventos" />
                ) : error ? (
                  <ErrorState description={error.message} onRetry={refresh} />
                ) : upcoming.length === 0 ? (
                  <EmptyState
                    title="Sin eventos"
                    description="Crea tu primer presupuesto para verlo aqui."
                    action={<Button size="sm" onClick={() => navigate('/new-event')}>Crear presupuesto</Button>}
                  />
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((event) => {
                      const dateObj = event.date ? parseISO(event.date) : new Date();
                      const daysUntil = differenceInDays(dateObj, new Date());
                      const isTodayEvent = isToday(dateObj);
                      return (
                        <Link
                          key={event.id}
                          to={`/history/${event.id}`}
                          className="group flex items-center gap-4 rounded-xl border border-border/40 p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border ${
                            isTodayEvent
                              ? 'border-primary/40 bg-primary/10'
                              : 'border-border/60 bg-secondary/40'
                          }`}>
                            <span className={`text-lg font-bold ${isTodayEvent ? 'text-primary' : 'text-foreground'}`}>
                              {format(dateObj, 'dd', { locale: es })}
                            </span>
                            <span className="text-[9px] uppercase text-muted-foreground">
                              {format(dateObj, 'MMM', { locale: es })}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-sm font-semibold text-foreground">{event.title}</h3>
                              {isTodayEvent && <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">Hoy</Badge>}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              {event.guests > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="size-3" /> {event.guests}
                                </span>
                              )}
                              {event.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="size-3" /> {event.location}
                                </span>
                              )}
                              {daysUntil >= 0 && !isTodayEvent && (
                                <span className="text-muted-foreground/60">en {daysUntil} dia{daysUntil !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={getStatusVariant(event.status)} className="shrink-0 text-[10px]">
                            {event.status}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Right: Pending + Tasks */}
        <div className="space-y-6 lg:col-span-2">
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="size-4 text-amber-400" /> Cobros pendientes
                </CardTitle>
                {pendingPayments.length > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    {pendingPayments.length}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {pendingPayments.length === 0 ? (
                  <div className="py-6 text-center">
                    <CircleCheck className="mx-auto size-8 text-emerald-500/40" />
                    <p className="mt-2 text-sm text-muted-foreground">Todo al dia</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.slice(0, 4).map(event => {
                      const r = getEventRealFinancials(event);
                      return (
                        <Link
                          key={event.id}
                          to={`/history/${event.id}`}
                          className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
                        >
                          <span className="truncate text-sm text-foreground">{event.title}</span>
                          <span className="ml-3 shrink-0 text-sm font-bold text-amber-400">${currency(r.pending)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {ops?.openTasks?.length > 0 && (
            <FadeIn delay={0.25}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="size-4 text-blue-400" /> Tareas abiertas
                  </CardTitle>
                  <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                    {ops.openTasks.length}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {ops.openTasks.slice(0, 4).map(task => (
                      <Link
                        key={task.id}
                        to={`/history/${task.eventId}`}
                        className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-blue-400" />
                        <span className="truncate text-foreground">{task.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{task.eventTitle}</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
