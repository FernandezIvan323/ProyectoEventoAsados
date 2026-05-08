import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Users, MapPin, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('asado_events');
    if (saved) {
      setEvents(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Resumen de Eventos</h1>
          <p>Tus próximos asados y cotizaciones.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/new-event')}>
          <Plus size={18} />
          Nuevo Presupuesto
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="card stat-card">
          <h3>Eventos Próximos</h3>
          <p className="stat-number">{events.length}</p>
        </div>
        <div className="card stat-card">
          <h3>Personas Totales</h3>
          <p className="stat-number">{events.reduce((acc, curr) => acc + curr.guests, 0)}</p>
        </div>
        <div className="card stat-card">
          <h3>Presupuestos Pendientes</h3>
          <p className="stat-number">{events.filter(e => e.status === 'Pendiente').length}</p>
        </div>
      </div>

      <div className="card events-section">
        <h2 className="section-title">
          <CalendarIcon size={24} /> 
          Calendario de Próximos Eventos
        </h2>
        
        <div className="events-list">
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hay eventos programados todavía. ¡Crea un nuevo presupuesto!</p>
          ) : (
            events.map(event => {
              // Manejo seguro de fechas para evitar errores si no hay fecha válida
              const dateObj = event.date ? parseISO(event.date) : new Date();
              return (
                <div key={event.id} className="event-item">
                  <div className="event-date">
                    <span className="event-day">{format(dateObj, 'dd', { locale: es })}</span>
                    <span className="event-month">{format(dateObj, 'MMM', { locale: es }).toUpperCase()}</span>
                  </div>
                  <div className="event-details">
                    <h3>{event.title}</h3>
                    <div className="event-meta">
                      <span><Users size={14} /> {event.guests} pers.</span>
                      <span><MapPin size={14} /> {event.location || 'Sin ubicación'}</span>
                      {event.time && <span><Clock size={14} /> {event.time}</span>}
                    </div>
                  </div>
                  <div className="event-status">
                    <span className={`status-badge ${event.status.toLowerCase()}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
