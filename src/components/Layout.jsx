import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Flame, CalendarDays, Calculator, Beef, LineChart } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Flame size={32} color="var(--primary-color)" />
          <h2>ProyectoAsado</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <CalendarDays size={20} />
            Inicio
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Calculator size={20} />
            Historial
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Beef size={20} />
            Insumos
          </NavLink>
          <NavLink to="/finance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LineChart size={20} />
            Finanzas
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
