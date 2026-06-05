import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Printer, ShoppingCart } from 'lucide-react';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EVENT_STATUSES } from '@/lib/eventStatus';
import { getShoppingList } from '@/services/shoppingListApi';

const DEFAULT_STATUSES = ['Aprobado', 'Compras pendientes'];

export default function ShoppingList() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState(DEFAULT_STATUSES);

  const loadList = () => {
    setIsLoading(true);
    setError(null);
    getShoppingList(selectedStatuses)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatuses]);

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status],
    );
  };

  const handlePrint = () => window.print();

  const handleCreatePurchase = () => {
    if (!data?.items?.length) return;
    const eventId = data.events.length === 1 ? data.events[0].id : '';
    navigate('/weekly-expenses/new', {
      state: {
        purchaseDraft: {
          eventId,
          notes: `Lista consolidada: ${data.events.map(e => e.title).join(', ')}`,
          items: data.items.map(item => ({
            name: item.name,
            quantity: String(item.quantity),
            unit: item.unit,
            unitPrice: '',
          })),
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="no-print space-y-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Operaciones</Badge>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Lista de compras</h1>
            <p className="mt-2 text-muted-foreground">Insumos consolidados de eventos aprobados o con compras pendientes.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}><Printer className="size-4" /> Imprimir</Button>
            <Button onClick={handleCreatePurchase} disabled={!data?.items?.length}>
              <ShoppingCart className="size-4" /> Crear compra en mercado
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_STATUSES.filter(s => !['Cancelado', 'Cobrado'].includes(s)).map(status => (
            <Button
              key={status}
              size="sm"
              variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
              onClick={() => toggleStatus(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState title="Generando lista" description="Consolidando insumos de eventos." />
      ) : error ? (
        <ErrorState description={error.message} onRetry={loadList} />
      ) : (
        <div className="print-area space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="size-5 text-primary" /> Eventos incluidos ({data.events.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ningún evento con los estados seleccionados.</p>
              ) : (
                data.events.map(event => (
                  <Link key={event.id} to={`/history/${event.id}`} className="inline-flex rounded-md border border-border px-2.5 py-0.5 text-xs hover:bg-muted">
                    {event.title}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos a comprar</CardTitle>
              <CardDescription>{data.items.length} insumos agrupados por nombre y unidad.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.items.length === 0 ? (
                <EmptyState title="Lista vacía" description="Aprueba eventos o agrega insumos a las cotizaciones." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Eventos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map(item => (
                      <TableRow key={`${item.name}-${item.unit}`}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.eventTitles.join(', ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
