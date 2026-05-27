import { NavLink, Outlet } from 'react-router-dom';
import { Beef, Building2, Calculator, Calendar, CalendarDays, ClipboardList, Command, Download, FileStack, LineChart, ListChecks, PanelLeftClose, ShoppingCart, StickyNote, Store, Utensils, Zap } from 'lucide-react';

import CommandPalette from '@/components/CommandPalette';
import GlobalSearch from '@/components/GlobalSearch';
import { clearStoredToken } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navGroups = [
  {
    label: 'GESTIÓN',
    items: [
      { to: '/', label: 'Inicio', icon: CalendarDays },
      { to: '/calendar', label: 'Calendario', icon: Calendar },
      { to: '/history', label: 'Historial', icon: Calculator },
    ],
  },
  {
    label: 'COTIZACIONES',
    items: [
      { to: '/quick-quote', label: 'Cotizador rápido', icon: Zap },
      { to: '/templates', label: 'Plantillas', icon: FileStack },
    ],
  },
  {
    label: 'INVENTARIO',
    items: [
      { to: '/inventory', label: 'Insumos', icon: Beef },
      { to: '/recipes', label: 'Recetas', icon: Utensils },
      { to: '/providers', label: 'Proveedores', icon: Store },
    ],
  },
  {
    label: 'FINANZAS',
    items: [
      { to: '/weekly-expenses', label: 'Gastos Mercado', icon: ShoppingCart },
      { to: '/shopping-list', label: 'Lista compras', icon: ListChecks },
      { to: '/operations', label: 'Operaciones', icon: ClipboardList },
      { to: '/finance', label: 'Finanzas', icon: LineChart },
      { to: '/fixed-costs', label: 'Gastos fijos', icon: Building2 },
    ],
  },
  {
    label: 'OTROS',
    items: [
      { to: '/notes', label: 'Notas', icon: StickyNote },
      { to: '/export', label: 'Exportar', icon: Download },
    ],
  },
];

export default function Layout() {
  const [authEnabled, setAuthEnabled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    apiRequest('/api/auth/config').then(c => setAuthEnabled(c.enabled)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    window.location.reload();
  };

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh" style={{ gridTemplateColumns: collapsed ? '4rem 1fr' : '17rem 1fr' }}>
        <aside className="lg:sticky lg:top-0 lg:h-svh lg:border-r transition-all duration-300 ease-out bg-card border-border">
          <div className="flex h-full flex-col">
            <div className={cn(
              "flex items-center border-b transition-all duration-300",
              collapsed ? "justify-center px-2 py-4" : "gap-3 px-5 py-5",
            )} style={{ borderColor: 'var(--border)' }}>
              <span className="flex size-8 shrink-0 items-center justify-center text-xl" style={{ color: 'var(--primary)' }}>
                🔥
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <h1 className="text-lg font-bold leading-none tracking-tight whitespace-nowrap text-foreground">AsamApp</h1>
                    <p className="mt-0.5 whitespace-nowrap text-muted-foreground text-[11px]">Eventos y presupuestos</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <nav className={cn(
              "flex-1 min-h-0 transition-all duration-300",
              collapsed
                ? "gap-1 px-2 py-3 flex-col items-center overflow-y-auto flex"
                : "overflow-y-auto py-2",
            )}>
              {collapsed ? (
                navGroups.flatMap(g => g.items).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => cn(
                      'relative flex size-10 items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 [&_svg]:text-[#A89880] hover:bg-[rgba(255,220,160,0.05)]',
                      isActive && '[&_svg]:!text-[#E8834A]',
                    )}
                    title={label}
                  >
                    <Icon className="size-4 shrink-0" />
                  </NavLink>
                ))
              ) : (
                navGroups.map(group => (
                  <div key={group.label}>
                    <p className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest select-none text-muted-foreground">
                      {group.label}
                    </p>
                    {group.items.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => cn(
                          'relative flex items-center text-sm font-medium transition-all duration-200 hover:bg-muted/10',
                        )}
                        style={({ isActive }) => ({
                          padding: '8px 16px',
                          gap: '10px',
                          background: isActive ? 'var(--primary-glow)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                          borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                          borderRadius: isActive ? '0 6px 6px 0' : '6px',
                          paddingLeft: isActive ? '14px' : '16px',
                        })}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </NavLink>
                    ))}
                  </div>
                ))
              )}
            </nav>

            <div className="mt-auto hidden border-t lg:block space-y-2 p-4 border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-muted-foreground"
                onClick={() => setPaletteOpen(true)}
              >
                <Command className="size-4" />
                {!collapsed && <span className="flex-1 text-left text-muted-foreground">Buscar…</span>}
                {!collapsed && <kbd className="rounded border px-1.5 py-0.5 text-[10px] border-border bg-muted text-muted-foreground">⌘K</kbd>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-muted-foreground"
                onClick={() => setCollapsed(!collapsed)}
              >
                <PanelLeftClose className="size-4" style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
                {!collapsed && <span className="text-muted-foreground">Colapsar menú</span>}
              </Button>
              {!collapsed && authEnabled && (
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="size-4" /> Cerrar sesión
                </Button>
              )}
            </div>
          </div>
        </aside>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        <main className="min-w-0 p-4 sm:p-6 lg:p-8 bg-background">
          <div className="mx-auto w-full max-w-7xl">
            <GlobalSearch />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
