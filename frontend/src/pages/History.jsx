import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Flame, Printer, Search, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';
import { EVENT_STATUSES, getStatusVariant } from '@/lib/eventStatus';
import { currency, getEventFinancials, getEventSubtotal } from '@/lib/finance';
import './History.css';

const statusColors = {
  Pendiente: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Cotizado: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  Aprobado: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Realizado: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  Cobrado: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Cancelado: 'bg-red-500/15 text-red-300 border-red-500/20',
};

const selectClass = 'w-full appearance-none rounded-lg border border-[#f4f1ea1a] bg-[#141211] px-3.5 py-2.5 pr-8 text-sm text-[#f4f1ea] shadow-[inset_0_1px_0_0_#f4f1ea08] transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

const inputClass = 'w-full rounded-lg border border-[#f4f1ea1a] bg-[#141211] px-3.5 py-2.5 pl-9 text-sm text-[#f4f1ea] placeholder:text-muted-foreground/40 shadow-[inset_0_1px_0_0_#f4f1ea08] transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

export default function History() {
  const { events, isLoading, error, refresh, setEventStatus, removeEvent } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const filteredEvents = events.filter(event => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(term) ||
      (event.client && event.client.toLowerCase().includes(term));
    const matchesStatus = !statusFilter || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      setMutationError(null);
      await setEventStatus(id, newStatus);
    } catch (err) {
      setMutationError(err);
    }
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      setMutationError(null);
      await removeEvent(eventToDelete.id);
      if (selectedEvent?.id === eventToDelete.id) setSelectedEvent(null);
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    } catch (err) {
      setMutationError(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Historial
        </Badge>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Historial de Presupuestos</h1>
          <p className="mt-2 text-muted-foreground">Visualiza todos los eventos y cotizaciones creadas.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-[#f4f1ea14] pb-4">
          <CardTitle>Presupuestos</CardTitle>
          <CardDescription>Busca, revisa, cambia estados o elimina registros antiguos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[16rem] flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                className={inputClass}
                type="text"
                placeholder="Buscar por nombre de evento o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-48">
              <select
                className={selectClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {EVENT_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">▾</div>
            </div>
          </div>

          {mutationError && <p className="text-sm text-destructive">{mutationError.message}</p>}

          {isLoading ? (
            <LoadingState title="Cargando historial" description="Estamos consultando tus presupuestos." />
          ) : error ? (
            <ErrorState description={error.message} onRetry={refresh} />
          ) : filteredEvents.length === 0 ? (
            <EmptyState title="No se encontraron presupuestos" description="Ajusta la búsqueda o crea un nuevo evento." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b border-[#f4f1ea0d]">
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Fecha</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Evento</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap hidden sm:table-cell">Cliente</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap hidden md:table-cell">Invitados</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Total</th>
                    <th className="h-10 px-3 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Estado</th>
                    <th className="h-10 px-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => {
                    const dateObj = event.date ? parseISO(event.date) : new Date();
                    return (
                      <tr key={event.id} className="border-b border-[#f4f1ea08] transition-colors hover:bg-[#262422]/60">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground/80">{format(dateObj, 'dd/MM/yyyy', { locale: es })}</td>
                        <td className="p-3 whitespace-nowrap font-medium text-[#f4f1ea]">{event.title}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-muted-foreground/70 hidden sm:table-cell">{event.client || '-'}</td>
                        <td className="p-3 whitespace-nowrap text-sm text-muted-foreground/70 hidden md:table-cell">{event.guests}</td>
                        <td className="p-3 whitespace-nowrap font-semibold text-[#f4f1ea]">${currency(event.totalPrice)}</td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              className={`appearance-none rounded-full border px-3 py-1 text-[11px] font-medium capitalize tracking-wide transition-all duration-150 focus:outline-none ${statusColors[event.status] || 'bg-muted/30 text-muted-foreground border-border'}`}
                              value={event.status}
                              onChange={(e) => handleStatusChange(event.id, e.target.value)}
                            >
                              {EVENT_STATUSES.map(status => (
                                <option key={status} value={status} className="bg-[#1c1a18] text-[#f4f1ea]">{status}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="secondary" asChild className="h-8 rounded-md border border-[#f4f1ea1a] bg-transparent px-2.5 text-xs text-muted-foreground/80 transition-all duration-150 hover:bg-[#262422] hover:text-[#f4f1ea]">
                              <Link to={`/history/${event.id}`}>
                                <Eye className="size-3.5 mr-1" />
                                Gestionar
                              </Link>
                            </Button>
                            <Button size="sm" onClick={() => { setSelectedEvent(event); setTimeout(handlePrint, 300); }} className="h-8 rounded-md bg-primary/85 px-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-110">
                              <Download className="size-3.5 mr-1" />
                              PDF
                            </Button>
                            <button onClick={() => handleDeleteClick(event)} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground/50 transition-colors duration-150 hover:bg-red-500/15 hover:text-red-400" title="Eliminar presupuesto">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {selectedEvent && (
        <div className="modal-overlay no-print">
          <div className="modal-content print-area">
            <div className="ticket-header">
              <div className="mb-4 flex items-center gap-2">
                <Flame className="size-7 text-primary" />
                <h2 className="text-xl font-semibold text-primary">ProyectoAsado</h2>
                <Badge variant={getStatusVariant(selectedEvent.status)} className="ml-auto">{selectedEvent.status}</Badge>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Presupuesto: {selectedEvent.title}</h3>
              <p><strong>Cliente:</strong> {selectedEvent.client || 'Consumidor Final'}</p>
              <p><strong>Fecha:</strong> {selectedEvent.date ? format(parseISO(selectedEvent.date), 'dd/MM/yyyy') : '-'} {selectedEvent.time && `a las ${selectedEvent.time}`}</p>
              <p><strong>Lugar:</strong> {selectedEvent.location || '-'}</p>
              <p><strong>Invitados Totales:</strong> {selectedEvent.guests}</p>
            </div>

            <div className="ticket-section">
              <h4 className="mb-4 border-b border-border pb-2 font-semibold">Insumos Necesarios</h4>
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvent.insumos?.map((item) => (
                    <tr key={item.id || `${item.name}-${item.quantity}`}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                      <td style={{ textAlign: 'right' }}>${currency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ticket-section ticket-financials">
              <div className="ticket-row">
                <span>Subtotal Insumos:</span>
                <span>${currency((selectedEvent.insumos?.reduce((acc, curr) => acc + Number(curr.totalCost || 0), 0) || 0))}</span>
              </div>
              <div className="ticket-row">
                <span>Costos Adicionales:</span>
                <span>${currency(selectedEvent.extraCosts)}</span>
              </div>
              <div className="ticket-row">
                <span>Margen de Ganancia ({selectedEvent.profitMargin || 0}%):</span>
                <span>${currency(getEventFinancials(selectedEvent).profit)}</span>
              </div>
              <div className="ticket-row ticket-total">
                <span>Total General:</span>
                <span>${currency(selectedEvent.totalPrice)}</span>
              </div>
              <div className="ticket-row mt-2 text-sm text-muted-foreground">
                <span>Costo base por persona:</span>
                <span>${currency(getEventSubtotal(selectedEvent) / (selectedEvent.guests || 1))}</span>
              </div>
            </div>

            <div className="modal-actions no-print mt-8 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                <X className="size-4" /> Cerrar
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="size-4" /> Guardar como PDF / Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="¿Eliminar presupuesto del historial?"
        description={eventToDelete ? `Estás a punto de eliminar el presupuesto de "${eventToDelete.title}". Esta acción es irreversible.` : ''}
        confirmText="Eliminar presupuesto"
        cancelText="Cancelar"
        variant="destructive"
        note="Nota: Esta acción eliminará permanentemente la cotización y todos sus registros financieros del historial."
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setEventToDelete(null);
        }}
      />
    </div>
  );
}
