import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Calendar as CalIcon, DollarSign, PieChart, TrendingUp } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEvents } from '@/hooks/useEvents';
import {
  MONTHS,
  currency,
  getAvailableYears,
  getEventRealFinancials,
  getMonthlyFinance,
  getYearlyEvents,
} from '@/lib/finance';

export default function Finance() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { events, isLoading, error, refresh } = useEvents();

  const availableYears = getAvailableYears(events);
  const monthlyData = getMonthlyFinance(events, selectedYear);
  const currentMonthIndex = new Date().getMonth();
  const thisMonthData = monthlyData[currentMonthIndex];
  const totalYearProfit = monthlyData.reduce((acc, curr) => acc + curr.ganancia, 0);
  const totalYearEvents = monthlyData.reduce((acc, curr) => acc + curr.count, 0);
  const maxRevenue = Math.max(...monthlyData.map(d => d.ingresos), 1);
  const monthsWithEvents = monthlyData.filter(month => month.count > 0);
  const yearlyEvents = getYearlyEvents(events, selectedYear);
  const totalRealProfit = monthlyData.reduce((acc, m) => acc + m.gananciaReal, 0);
  const totalRealSpent = monthlyData.reduce((acc, m) => acc + m.gastosReales, 0);
  const totalCollected = monthlyData.reduce((acc, m) => acc + m.cobrado, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Finanzas
          </Badge>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Reporte Financiero</h1>
            <p className="mt-2 text-muted-foreground">Control de ingresos, costos y ganancias netas.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {availableYears.map(year => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(year)}
              className="rounded-full px-4"
            >
              Año {year}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState title="Cargando reporte" description="Estamos preparando los datos financieros." />
      ) : error ? (
        <ErrorState description={error.message} onRetry={refresh} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><DollarSign className="size-4 text-primary" /> Ganancia del mes</CardDescription>
                <CardTitle className="text-2xl text-emerald-300">${currency(thisMonthData.ganancia)}</CardTitle>
                <p className="text-xs text-muted-foreground">{MONTHS[currentMonthIndex]} · {thisMonthData.count} eventos</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Ingresos del mes</CardDescription>
                <CardTitle className="text-2xl">${currency(thisMonthData.ingresos)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><PieChart className="size-4 text-primary" /> Ganancia anual (cotizada)</CardDescription>
                <CardTitle className="text-2xl text-emerald-300">${currency(totalYearProfit)}</CardTitle>
                <p className="text-xs text-muted-foreground">Real: ${currency(totalRealProfit)} · Compras: ${currency(totalRealSpent)} · Cobrado: ${currency(totalCollected)}</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><CalIcon className="size-4 text-primary" /> Eventos anuales</CardDescription>
                <CardTitle className="text-2xl">{totalYearEvents}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /> Flujo de Ingresos Anual</CardTitle>
              <CardDescription>Comparación mensual de ingresos brutos y ganancias.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-72 items-end gap-3 overflow-x-auto pb-2">
                {monthlyData.map(month => {
                  const heightPercentage = (month.ingresos / maxRevenue) * 100;
                  return (
                    <div key={month.name} className="flex min-w-14 flex-1 flex-col items-center gap-2">
                      <div className="flex h-56 w-full items-end rounded-md bg-muted/40 p-1">
                        <div
                          className="w-full rounded-sm bg-primary"
                          title={`${month.name}: Ingresos $${currency(month.ingresos)} | Ganancia $${currency(month.ganancia)}`}
                          style={{ height: `${Math.max(heightPercentage, month.ingresos > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{month.name.substring(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rentabilidad real por evento</CardTitle>
              <CardDescription>Compara lo cotizado, lo gastado en mercado y lo cobrado al cliente.</CardDescription>
            </CardHeader>
            <CardContent>
              {yearlyEvents.length === 0 ? (
                <EmptyState title="Sin eventos en este año" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Cotizado</TableHead>
                      <TableHead>Costo presup.</TableHead>
                      <TableHead>Compras reales</TableHead>
                      <TableHead>Cobrado</TableHead>
                      <TableHead>Margen real</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyEvents.map(event => {
                      const r = getEventRealFinancials(event);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            <Link to={`/history/${event.id}`} className="text-primary hover:underline">{event.title}</Link>
                          </TableCell>
                          <TableCell>${currency(r.quotedPrice)}</TableCell>
                          <TableCell>${currency(r.quotedCost)}</TableCell>
                          <TableCell>${currency(r.purchaseTotal)}</TableCell>
                          <TableCell>${currency(r.amountPaid)}</TableCell>
                          <TableCell className={r.realProfit >= 0 ? 'font-semibold text-emerald-300' : 'font-semibold text-destructive'}>
                            ${currency(r.realProfit)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desglose Mensual Detallado</CardTitle>
              <CardDescription>Resumen por mes de eventos, ingresos, costos y utilidad.</CardDescription>
            </CardHeader>
            <CardContent>
              {monthsWithEvents.length === 0 ? (
                <EmptyState title="No hay eventos para este año" description="Los meses con actividad aparecerán en esta tabla." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead>Eventos</TableHead>
                      <TableHead>Ingresos Brutos</TableHead>
                      <TableHead>Costos Estimados</TableHead>
                      <TableHead>Ganancia cotizada</TableHead>
                      <TableHead>Gastos reales</TableHead>
                      <TableHead>Margen real</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthsWithEvents.map(month => (
                      <TableRow key={month.name}>
                        <TableCell className="font-medium">{month.name}</TableCell>
                        <TableCell>{month.count}</TableCell>
                        <TableCell>${currency(month.ingresos)}</TableCell>
                        <TableCell>${currency(month.costos)}</TableCell>
                        <TableCell className="font-semibold text-emerald-300">${currency(month.ganancia)}</TableCell>
                        <TableCell>${currency(month.gastosReales)}</TableCell>
                        <TableCell className={month.gananciaReal >= 0 ? 'font-semibold text-emerald-300' : 'font-semibold text-destructive'}>${currency(month.gananciaReal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
