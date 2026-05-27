import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  Bell,
  Calendar as CalendarIcon,
  ClipboardList,
  DollarSign,
  ListChecks,
  MapPin,
  Plus,
  Users,
  Clock,
  PartyPopper,
  TrendingUp,
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

  const upcoming = useMemo(
    () => events
      .filter(e => e.date && e.status !== 'Cancelado')
      .slice(0, 8),
    [events],
  );

  // Alertas: eventos próximos con problemas
  const alerts = useMemo(() => {
    const today = new Date();
    const result = [];

    for (const e of events) {
      if (!e.date || e.status === 'Cancelado' || e.status === 'Cobrado') continue;
      const days = differenceInDays(parseISO(e.date), today);

      // Evento en ≤3 días y aún no confirmado
      if (days >= 0 && days <= 3 && ['Cotizado', 'Pendiente'].includes(e.status)) {
        result.push({ id: e.id, eventId: e.id, title: e.title, msg: `En ${days === 0 ? 'hoy' : `${days} día${days > 1 ? 's' : ''}`} y aún sin confirmar`, level: 'error' });
      }

      // Evento en ≤7 días con tareas sin completar
      if (days >= 0 && days <= 7 && e.tasks?.some(t => !t.done)) {
        const pending = e.tasks.filter(t => !t.done).length;
        result.push({ id: `${e.id}-tasks`, eventId: e.id, title: e.title, msg: `${pending} tarea${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''} (faltan ${days} días)`, level: 'warning' });
      }

      // Evento realizado sin cobrar
      if (e.status === 'Realizado') {
        result.push({ id: `${e.id}-cobro`, eventId: e.id, title: e.title, msg: 'Realizado pero sin cobrar', level: 'warning' });
      }
    }

    return result;
  }, [events]);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Inicio</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-bold">Panel de control</h1>
              <p className="mt-2 text-muted-foreground">Accesos rápidos a lo que necesitas hoy.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/new-event')} className="w-full sm:w-auto">
            <Plus className="size-4" /> Nuevo presupuesto
          </Button>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-4 md:grid-cols-4">
        <StaggerItem>
          <Card className="relative overflow-hidden">
            <PartyPopper className="absolute right-4 top-4 size-8 text-primary/20" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-[11px]">Eventos</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground text-[38px]">{totalEvents}</CardTitle>
            </CardHeader>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="relative overflow-hidden">
            <Users className="absolute right-4 top-4 size-8 text-primary/20" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-[11px]">Invitados</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground text-[38px]">{totalGuests}</CardTitle>
            </CardHeader>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="relative overflow-hidden">
            <Clock className="absolute right-4 top-4 size-8 text-primary/20" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-[11px]">Hoy</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground text-[38px]">{todayEvents.length}</CardTitle>
            </CardHeader>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="relative overflow-hidden">
            <TrendingUp className="absolute right-4 top-4 size-8 text-primary/20" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-[11px]">Pendientes / cerrados</CardDescription>
              <CardTitle className="text-4xl font-bold text-foreground text-[38px]">{pendingEvents} <span className="text-2xl text-muted-foreground">/</span> {closedEvents}</CardTitle>
            </CardHeader>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {alerts.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <Bell className="size-5" /> Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(a => (
              <Link key={a.id} to={`/history/${a.eventId}`} className="flex items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/40">
                <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${a.level === 'error' ? 'text-destructive' : 'text-amber-400'}`} />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.msg}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">        <Card className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => navigate('/calendar')}>
          <CardHeader className="p-4">
            <CardDescription className="flex gap-2"><CalendarIcon className="size-4 text-primary" /> Calendario</CardDescription>
            <CardTitle className="text-lg">Ver mes completo</CardTitle>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => navigate('/shopping-list')}>
          <CardHeader className="p-4">
            <CardDescription className="flex gap-2"><ListChecks className="size-4 text-primary" /> Lista de compras</CardDescription>
            <CardTitle className="text-lg">{ops ? 'Consolidar insumos' : '…'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => navigate('/operations')}>
          <CardHeader className="p-4">
            <CardDescription className="flex gap-2"><AlertTriangle className="size-4 text-primary" /> Stock bajo</CardDescription>
            <CardTitle className="text-lg">{ops?.lowStock?.length ?? 0} alertas</CardTitle>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => navigate('/finance')}>
          <CardHeader className="p-4">
            <CardDescription className="flex gap-2"><DollarSign className="size-4 text-primary" /> Por cobrar</CardDescription>
            <CardTitle className="text-lg">${currency(ops?.pendingRevenue ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarIcon className="size-5 text-primary" /> Eventos de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos programados para hoy.</p>
            ) : (
              <ul className="space-y-2">
                {todayEvents.map(event => (
                  <li key={event.id}>
                    <Link to={`/history/${event.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                      <span className="font-medium">{event.title}</span>
                      <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="size-5 text-primary" /> Cobros pendientes</CardTitle>
            <CardDescription>Eventos con saldo por cobrar.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todo al día en cobros.</p>
            ) : (
              <ul className="space-y-2">
                {pendingPayments.slice(0, 5).map(event => {
                  const r = getEventRealFinancials(event);
                  return (
                    <li key={event.id}>
                      <Link to={`/history/${event.id}`} className="flex justify-between rounded-md border p-3 hover:bg-muted/50">
                        <span>{event.title}</span>
                        <span className="font-semibold text-primary">${currency(r.pending)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {ops?.openTasks?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="size-5 text-primary" /> Tareas abiertas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ops.openTasks.slice(0, 6).map(task => (
              <Link key={task.id} to={`/history/${task.eventId}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                {task.title} · {task.eventTitle}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximos eventos</CardTitle>
            <CardDescription>Los más recientes en tu historial.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/calendar">Calendario</Link></Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState title="Cargando eventos" />
          ) : error ? (
            <ErrorState description={error.message} onRetry={refresh} />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Sin eventos" action={<Button size="sm" onClick={() => navigate('/new-event')}>Crear presupuesto</Button>} />
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map(event => {
                const dateObj = event.date ? parseISO(event.date) : new Date();
                return (
                  <Link key={event.id} to={`/history/${event.id}`} className="grid gap-4 py-4 sm:grid-cols-[4rem_1fr_auto] sm:items-center hover:bg-muted/30">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border bg-muted/40">
                      <span className="text-xl font-bold">{format(dateObj, 'dd', { locale: es })}</span>
                      <span className="text-xs uppercase text-muted-foreground">{format(dateObj, 'MMM', { locale: es })}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {event.guests}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {event.location || '—'}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
