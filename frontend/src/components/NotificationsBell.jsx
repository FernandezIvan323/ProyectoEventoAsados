import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { apiRequest } from '@/lib/api';

const SEVERITY = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10' },
};

const DISMISSED_KEY = 'asamapp_dismissed_alerts';

function getDismissed() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDismissed(ids) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

export default function NotificationsBell() {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(getDismissed);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiRequest('/api/alerts');
      setAlerts(data.alerts || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const visible = alerts.filter(a => !dismissed.includes(`${a.type}-${a.eventId || a.noteId || a.catalogItemId || a.title}`));
  const count = visible.length;

  const dismiss = (alert) => {
    const key = `${alert.type}-${alert.eventId || alert.noteId || alert.catalogItemId || alert.title}`;
    const next = [...dismissed, key];
    setDismissed(next);
    saveDismissed(next);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
        aria-label="Notificaciones"
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">Notificaciones</span>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-accent" aria-label="Cerrar">
              <X className="size-3.5" />
            </button>
          </div>
          {visible.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Sin notificaciones</div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((alert, i) => {
                const sev = SEVERITY[alert.severity] || SEVERITY.info;
                const Icon = sev.icon;
                return (
                  <li key={i} className="flex gap-2 p-3">
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${sev.bg}`}>
                      <Icon className={`size-3.5 ${sev.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                      {alert.link && (
                        <Link
                          to={alert.link}
                          onClick={() => setOpen(false)}
                          className="mt-1 inline-block text-xs text-primary hover:underline"
                        >
                          Ver
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(alert)}
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Descartar"
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
