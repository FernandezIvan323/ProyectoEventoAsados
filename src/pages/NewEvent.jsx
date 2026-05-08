import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator as CalcIcon, ReceiptText, Users, Save, Calendar, MapPin, Beef } from 'lucide-react';
import './NewEvent.css';

export default function NewEvent() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  
  // Event Details State
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');

  // Form State
  const [adults, setAdults] = useState(20);
  const [kids, setKids] = useState(5);
  const [profitMargin, setProfitMargin] = useState(30);
  const [extraCosts, setExtraCosts] = useState(15000);

  // Insumos seleccionados (cantidades) - Diccionario: { id_insumo: cantidad }
  const [selectedQuantities, setSelectedQuantities] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('asado_inventory');
    const inv = saved ? JSON.parse(saved) : [];
    setInventory(inv);
  }, []);

  const handleQuantityChange = (id, value) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [id]: Number(value)
    }));
  };

  // Resumen Calculado
  const getSummaryItems = () => {
    return inventory.filter(item => selectedQuantities[item.id] > 0).map(item => ({
      ...item,
      quantity: selectedQuantities[item.id],
      totalCost: selectedQuantities[item.id] * item.price
    }));
  };

  const summaryItems = getSummaryItems();
  const costTotal = summaryItems.reduce((acc, curr) => acc + curr.totalCost, 0);
  const subtotal = costTotal + Number(extraCosts);
  const ganancia = subtotal * (Number(profitMargin) / 100);
  const finalPrice = subtotal + ganancia;

  const handleSaveEvent = () => {
    if (!eventName || !eventDate) {
      alert("Por favor, ingresa al menos el Nombre del Evento y la Fecha.");
      return;
    }
    
    const newEvent = {
      id: Date.now(),
      title: eventName,
      client: clientName,
      date: eventDate,
      time: eventTime,
      location: location,
      guests: Number(adults) + Number(kids),
      status: 'Pendiente',
      totalPrice: finalPrice,
      insumos: summaryItems,
      extraCosts: Number(extraCosts),
      profitMargin: Number(profitMargin)
    };

    const savedEvents = JSON.parse(localStorage.getItem('asado_events') || '[]');
    savedEvents.push(newEvent);
    localStorage.setItem('asado_events', JSON.stringify(savedEvents));
    navigate('/history');
  };

  return (
    <div className="new-event-page">
      <div className="ne-header">
        <div>
          <h1>Nuevo Presupuesto / Evento</h1>
          <p>Configura las cantidades exactas y calcula la cotización del evento.</p>
        </div>
      </div>

      <div className="ne-grid">
        {/* Lado Izquierdo: Formulario */}
        <div className="ne-form-container">
          
          <div className="card ne-section">
            <h2 className="section-title"><Calendar size={20} /> Información General</h2>
            <div className="form-group">
              <label className="form-label">Nombre del Evento *</label>
              <input type="text" className="form-input" placeholder="Ej. Cumpleaños Juan" value={eventName} onChange={e => setEventName(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contratante / Cliente</label>
                <input type="text" className="form-input" placeholder="Nombre del cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Lugar del Evento</label>
                <input type="text" className="form-input" placeholder="Ej. Salón Principal" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input type="date" className="form-input" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Hora</label>
                <input type="time" className="form-input" value={eventTime} onChange={e => setEventTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card ne-section">
            <h2 className="section-title"><Users size={20} /> Invitados</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Adultos</label>
                <input type="number" className="form-input" value={adults} onChange={e => setAdults(e.target.value)} min="1"/>
              </div>
              <div className="form-group">
                <label className="form-label">Niños (Comen mitad)</label>
                <input type="number" className="form-input" value={kids} onChange={e => setKids(e.target.value)} min="0"/>
              </div>
            </div>
          </div>

          <div className="card ne-section">
            <div className="section-header-flex">
              <h2 className="section-title" style={{ borderBottom: 'none', padding: 0, margin: 0 }}>
                <Beef size={20} /> Cantidades de Insumos
              </h2>
            </div>
            <p className="section-desc">Ingresa las cantidades para el evento basado en tu catálogo.</p>
            
            <div className="insumos-grid">
              {inventory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Primero debes agregar insumos en la sección "Insumos" del menú lateral.</p>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className="insumo-input-group">
                    <label className="insumo-label">{item.name} <span style={{ textTransform: 'capitalize' }}>({item.unit})</span></label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0" step="0.1"
                      value={selectedQuantities[item.id] || ''}
                      placeholder="0"
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card ne-section">
            <h2 className="section-title"><CalcIcon size={20} /> Finanzas Adicionales</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Costos Extra ($) (Mozos, Traslado)</label>
                <input type="number" className="form-input" value={extraCosts} onChange={e => setExtraCosts(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Margen de Ganancia (%)</label>
                <input type="number" className="form-input" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} />
              </div>
            </div>
          </div>

        </div>

        {/* Lado Derecho: Resumen Dinámico */}
        <div className="ne-summary-container">
          <div className="card summary-sticky">
            <h2 className="section-title"><ReceiptText size={20} /> Resumen en Vivo</h2>
            
            <div className="summary-list">
              <h3>Cantidades a Comprar</h3>
              {summaryItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Añade insumos a la izquierda para ver el resumen.
                </p>
              ) : (
                summaryItems.map(item => (
                  <div key={item.id} className="summary-item">
                    <span>{item.name}</span> 
                    <span>{item.quantity} {item.unit}</span>
                  </div>
                ))
              )}
            </div>

            <div className="summary-financials">
              <div className="fin-row">
                <span>Costo Insumos:</span>
                <span>${costTotal.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="fin-row">
                <span>Costos Extra:</span>
                <span>${Number(extraCosts).toLocaleString('es-AR')}</span>
              </div>
              <div className="fin-row margin-row">
                <span>Ganancia ({profitMargin}%):</span>
                <span>${ganancia.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="fin-row total-row">
                <span>Presupuesto Total:</span>
                <span>${finalPrice.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="fin-row total-per-person">
                <span>Precio Sugerido por Persona:</span>
                <span>${(finalPrice / (Number(adults) + Number(kids) || 1)).toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
              </div>
            </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary btn-full" onClick={handleSaveEvent} style={{ marginTop: '1.5rem' }}>
              <Save size={18} /> Guardar Presupuesto
            </button>
            <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            </p>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
