import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, isLoading, error, refresh } = useEvents();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      if (!event.date || event.status === 'Cancelado') continue;
      const key = event.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [events]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Calendario</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendario de eventos</h1>
        <p className="text-muted-foreground">Vista mensual de todos los asados programados.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="capitalize">{monthLabel}</CardTitle>
            <CardDescription>Haz clic en un evento para ver el detalle.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState title="Cargando calendario" />
          ) : error ? (
            <ErrorState description={error.message} onRetry={refresh} />
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate.get(key) || [];
                  const inMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={key}
                      className={`min-h-24 rounded-md border p-1.5 text-xs ${inMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'} ${isToday ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
                    >
                      <span className={`font-semibold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <Link
                            key={event.id}
                            to={`/history/${event.id}`}
                            className="block truncate rounded bg-primary/15 px-1 py-0.5 text-[10px] hover:bg-primary/25"
                            title={event.title}
                          >
                            {event.time ? `${event.time} ` : ''}{event.title}
                          </Link>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} más</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
