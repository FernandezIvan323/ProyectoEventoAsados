import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Calendar, Search, Beef, Store, ShoppingCart, FileStack, StickyNote, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';

const staticActions = [
  { id: 'new-event', label: 'Nuevo presupuesto', path: '/new-event', icon: Calculator, keywords: 'crear evento cotizar' },
  { id: 'quick-quote', label: 'Cotizador rápido', path: '/quick-quote', icon: Zap, keywords: 'calcular rapido' },
  { id: 'calendar', label: 'Calendario', path: '/calendar', icon: Calendar, keywords: 'mes vista' },
  { id: 'inventory', label: 'Insumos / inventario', path: '/inventory', icon: Beef, keywords: 'stock catalogo' },
  { id: 'providers', label: 'Proveedores', path: '/providers', icon: Store, keywords: 'vendedores contacto' },
  { id: 'shopping-list', label: 'Lista de compras', path: '/shopping-list', icon: ShoppingCart, keywords: 'mercado' },
  { id: 'templates', label: 'Plantillas', path: '/templates', icon: FileStack, keywords: 'combo receta' },
  { id: 'notes', label: 'Notas', path: '/notes', icon: StickyNote, keywords: 'recordatorio' },
];

function fuzzyMatch(text, query) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSelectedIndex(0);
      return;
    }
    const timer = setTimeout(async () => {
      let searchResults = null;
      try {
        searchResults = await apiRequest(`/api/search?q=${encodeURIComponent(query.trim())}`);
      } catch { /* ignore */ }

      const filteredActions = staticActions.filter(a =>
        fuzzyMatch(a.label, query) || fuzzyMatch(a.keywords, query)
      );

      setResults({ actions: filteredActions, api: searchResults });
      setSelectedIndex(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const allItems = [];
  if (results?.actions?.length) {
    allItems.push(...results.actions.map(a => ({ ...a, _type: 'action' })));
  }
  if (results?.api?.events?.length) {
    allItems.push(...results.api.events.map(e => ({ id: e.id, label: e.title, path: `/history/${e.id}`, icon: Calendar, _type: 'evento', subtitle: e.client })));
  }
  if (results?.api?.inventory?.length) {
    allItems.push(...results.api.inventory.map(i => ({ id: i.id, label: i.name, path: '/inventory', icon: Beef, _type: 'insumo', subtitle: `${i.unit} · $${i.price}` })));
  }
  if (results?.api?.providers?.length) {
    allItems.push(...results.api.providers.map(p => ({ id: p.id, label: p.name, path: '/providers', icon: Store, _type: 'proveedor' })));
  }
  if (results?.api?.templates?.length) {
    allItems.push(...results.api.templates.map(t => ({ id: t.id, label: t.name, path: '/templates', icon: FileStack, _type: 'plantilla' })));
  }
  if (results?.api?.notes?.length) {
    allItems.push(...results.api.notes.map(n => ({ id: n.id, label: n.title, path: '/notes', icon: StickyNote, _type: 'nota' })));
  }

  const handleSelect = (item) => {
    onClose();
    if (item._type === 'action' || item.path) {
      if (item.id === 'new-event') navigate('/new-event');
      else if (item.path) navigate(item.path);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      handleSelect(allItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Buscar eventos, insumos, ir a una sección…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {!query.trim() ? (
                <div className="space-y-1">
                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Accesos rápidos</p>
                  {staticActions.map((action, i) => (
                    <button
                      key={action.id}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                        selectedIndex === i ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                      )}
                      onClick={() => handleSelect(action)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <action.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{action.label}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : allItems.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Sin resultados para <strong>"{query}"</strong>
                </p>
              ) : (
                <div className="space-y-1">
                  {allItems.map((item, i) => (
                    <button
                      key={`${item._type}-${item.id}`}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                        selectedIndex === i ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                      )}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                        )}
                      </div>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{item._type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden border-t border-border px-4 py-2 sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd> Navegar</span>
              <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd> Seleccionar</span>
              <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">Esc</kbd> Cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
