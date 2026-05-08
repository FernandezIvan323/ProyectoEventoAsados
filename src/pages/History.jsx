import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, X, Printer, Flame } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import './History.css';

export default function History() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('asado_events');
    if (saved) {
      // Sort by date descending
      const parsed = JSON.parse(saved).sort((a, b) => {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
      setEvents(parsed);
    }
  }, []);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.client && e.client.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = (id, newStatus) => {
    const updated = events.map(e => e.id === id ? { ...e, status: newStatus } : e);
    setEvents(updated);
    localStorage.setItem('asado_events', JSON.stringify(updated));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1>Historial de Presupuestos</h1>
          <p>Visualiza todos los eventos y cotizaciones creadas.</p>
        </div>
      </div>

      <div className="card">
        <div className="history-toolbar">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de evento o cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Cliente</th>
                <th>Invitados</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No se encontraron presupuestos.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(event => {
                  const dateObj = event.date ? parseISO(event.date) : new Date();
                  return (
                    <tr key={event.id}>
                      <td>{format(dateObj, 'dd/MM/yyyy', { locale: es })}</td>
                      <td><strong>{event.title}</strong></td>
                      <td>{event.client || '-'}</td>
                      <td>{event.guests}</td>
                      <td><strong>${event.totalPrice?.toLocaleString('es-AR', {maximumFractionDigits: 0})}</strong></td>
                      <td>
                        <select 
                          className={`status-select ${event.status.toLowerCase()}`}
                          value={event.status}
                          onChange={(e) => handleStatusChange(event.id, e.target.value)}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Realizado">Realizado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" title="Ver Detalles" onClick={() => setSelectedEvent(event)}>
                          <Eye size={16} /> Ver
                        </button>
                        <button className="btn btn-primary btn-sm" title="Descargar PDF" onClick={() => { setSelectedEvent(event); setTimeout(handlePrint, 300); }}>
                          <Download size={16} /> PDF
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay no-print">
          <div className="modal-content print-area">
            
            {/* Cabecera del Ticket */}
            <div className="ticket-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Flame size={28} color="var(--primary-color)" />
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>ProyectoAsado</h2>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Presupuesto: {selectedEvent.title}</h3>
              <p><strong>Cliente:</strong> {selectedEvent.client || 'Consumidor Final'}</p>
              <p><strong>Fecha:</strong> {selectedEvent.date ? format(parseISO(selectedEvent.date), 'dd/MM/yyyy') : '-'} {selectedEvent.time && `a las ${selectedEvent.time}`}</p>
              <p><strong>Lugar:</strong> {selectedEvent.location || '-'}</p>
              <p><strong>Invitados Totales:</strong> {selectedEvent.guests}</p>
            </div>

            {/* Lista de Insumos */}
            <div className="ticket-section">
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Insumos Necesarios</h4>
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvent.insumos && selectedEvent.insumos.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                      <td style={{ textAlign: 'right' }}>${item.totalCost?.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen Financiero */}
            <div className="ticket-section ticket-financials">
              <div className="ticket-row">
                <span>Subtotal Insumos:</span>
                <span>${(selectedEvent.insumos?.reduce((acc, curr) => acc + curr.totalCost, 0) || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="ticket-row">
                <span>Costos Adicionales:</span>
                <span>${(selectedEvent.extraCosts || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="ticket-row">
                <span>Margen de Ganancia ({selectedEvent.profitMargin || 0}%):</span>
                <span>${((selectedEvent.totalPrice || 0) - ((selectedEvent.insumos?.reduce((acc, curr) => acc + curr.totalCost, 0) || 0) + (selectedEvent.extraCosts || 0))).toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="ticket-row ticket-total">
                <span>Total General:</span>
                <span>${selectedEvent.totalPrice?.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="ticket-row" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                <span>Costo Sugerido por Persona:</span>
                <span>${(selectedEvent.totalPrice / (selectedEvent.guests || 1)).toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
            </div>

            <div className="modal-actions no-print" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                <X size={18} /> Cerrar
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={18} /> Guardar como PDF / Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
