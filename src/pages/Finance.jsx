import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar as CalIcon, BarChart3, PieChart } from 'lucide-react';
import { parseISO, getMonth, getYear } from 'date-fns';
import './Finance.css';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Finance() {
  const [events, setEvents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const saved = localStorage.getItem('asado_events');
    if (saved) {
      setEvents(JSON.parse(saved));
    }
  }, []);

  // Extraer los años disponibles para el filtro
  const availableYears = [...new Set(events.map(e => e.date ? getYear(parseISO(e.date)) : new Date().getFullYear()))].sort((a,b) => b-a);
  if (!availableYears.includes(new Date().getFullYear())) {
    availableYears.unshift(new Date().getFullYear());
  }

  // Lógica matemática
  const getEventFinancials = (event) => {
    const final = event.totalPrice || 0;
    // Si no tiene profitMargin, asumimos un 30% histórico
    const margin = event.profitMargin !== undefined ? event.profitMargin : 30;
    const subtotal = final / (1 + (margin / 100));
    const profit = final - subtotal;
    return { final, profit, cost: subtotal };
  };

  // Filtrar eventos del año seleccionado
  const yearlyEvents = events.filter(e => {
    if (!e.date) return false;
    // Solo contamos eventos que no estén cancelados (opcional, por ahora contamos todos o aprobados)
    // Para no complicarlo, sumamos todos excepto si tiene status 'Cancelado'
    if (e.status === 'Cancelado') return false;
    return getYear(parseISO(e.date)) === selectedYear;
  });

  // Agrupar por mes
  const monthlyData = MONTHS.map((name, index) => {
    const mEvents = yearlyEvents.filter(e => getMonth(parseISO(e.date)) === index);
    let ingresos = 0;
    let ganancia = 0;
    mEvents.forEach(e => {
      const fin = getEventFinancials(e);
      ingresos += fin.final;
      ganancia += fin.profit;
    });
    return { name, ingresos, ganancia, count: mEvents.length };
  });

  // Estadísticas rápidas
  const currentMonthIndex = new Date().getMonth();
  const thisMonthData = monthlyData[currentMonthIndex];
  
  const totalYearProfit = monthlyData.reduce((acc, curr) => acc + curr.ganancia, 0);
  const totalYearRevenue = monthlyData.reduce((acc, curr) => acc + curr.ingresos, 0);
  const totalYearEvents = monthlyData.reduce((acc, curr) => acc + curr.count, 0);

  // Encontrar el mes más alto para la gráfica de barras CSS
  const maxRevenue = Math.max(...monthlyData.map(d => d.ingresos), 1); // Evitar división por 0

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div>
          <h1>Reporte Financiero</h1>
          <p>Control de ingresos, costos y ganancias netas.</p>
        </div>
        <select 
          className="form-input year-selector" 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {availableYears.map(y => <option key={y} value={y}>Año {y}</option>)}
        </select>
      </div>

      <div className="finance-stats-grid">
        <div className="card stat-card highlight">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-info">
            <h3>Ganancia del Mes ({MONTHS[currentMonthIndex]})</h3>
            <p className="stat-value text-success">${thisMonthData.ganancia.toLocaleString('es-AR', {maximumFractionDigits: 0})}</p>
            <span className="stat-subtitle">{thisMonthData.count} eventos realizados</span>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h3>Ingresos del Mes Brutos</h3>
            <p className="stat-value">${thisMonthData.ingresos.toLocaleString('es-AR', {maximumFractionDigits: 0})}</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><PieChart size={24} /></div>
          <div className="stat-info">
            <h3>Ganancia Anual ({selectedYear})</h3>
            <p className="stat-value text-success">${totalYearProfit.toLocaleString('es-AR', {maximumFractionDigits: 0})}</p>
            <span className="stat-subtitle">De un total de ${totalYearRevenue.toLocaleString('es-AR', {maximumFractionDigits: 0})} facturados</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon"><CalIcon size={24} /></div>
          <div className="stat-info">
            <h3>Total Eventos Anuales</h3>
            <p className="stat-value">{totalYearEvents}</p>
          </div>
        </div>
      </div>

      <div className="card chart-section">
        <h2 className="section-title"><BarChart3 size={20} /> Flujo de Ingresos Anual</h2>
        
        <div className="css-bar-chart">
          {monthlyData.map(month => {
            const heightPercentage = (month.ingresos / maxRevenue) * 100;
            return (
              <div key={month.name} className="bar-wrapper" title={`${month.name}: Ingresos $${month.ingresos.toLocaleString('es-AR', {maximumFractionDigits: 0})} | Ganancia $${month.ganancia.toLocaleString('es-AR', {maximumFractionDigits: 0})}`}>
                <div className="bar-container">
                  <div className="bar-fill" style={{ height: `${heightPercentage}%` }}>
                    {month.ingresos > 0 && <span className="bar-tooltip">${month.ganancia.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>}
                  </div>
                </div>
                <span className="bar-label">{month.name.substring(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card table-section">
        <h2 className="section-title">Desglose Mensual Detallado</h2>
        <div className="table-responsive">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Eventos</th>
                <th>Ingresos Brutos</th>
                <th>Costos Estimados</th>
                <th>Ganancia Neta</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.filter(m => m.count > 0).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay eventos registrados en este año.
                  </td>
                </tr>
              ) : (
                monthlyData.filter(m => m.count > 0).map(month => (
                  <tr key={month.name}>
                    <td><strong>{month.name}</strong></td>
                    <td>{month.count}</td>
                    <td>${month.ingresos.toLocaleString('es-AR', {maximumFractionDigits: 0})}</td>
                    <td>${(month.ingresos - month.ganancia).toLocaleString('es-AR', {maximumFractionDigits: 0})}</td>
                    <td className="text-success" style={{ fontWeight: 600 }}>
                      ${month.ganancia.toLocaleString('es-AR', {maximumFractionDigits: 0})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
