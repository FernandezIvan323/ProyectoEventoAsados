import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Bell,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  History,
  Lightbulb,
  Package,
  Phone,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  UserRound,
  X,
  LayoutGrid,
  KanbanSquare,
  RefreshCw,
  Type as TypeIcon2,
  Link2,
  ExternalLink,
  TrendingUp,
  AlertOctagon,
  Timer,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  restoreNote,
  exportNotes,
} from '@/services/notesApi';
import { getEvents } from '@/services/eventsApi';
import { getProviders } from '@/services/providersApi';
import { getMarketPurchases } from '@/services/marketPurchasesApi';
import { cn } from '@/lib/utils';

const PRIORITIES = ['Alta', 'Media', 'Baja'];
const TYPES = ['Recordatorio', 'Llamada', 'Cambio cliente', 'Compra', 'Idea', 'Problema'];
const RECURRENCE = [
  { value: 'none', label: 'No repetir' },
  { value: 'daily', label: 'Cada día' },
  { value: 'weekly', label: 'Cada semana' },
  { value: 'monthly', label: 'Cada mes' },
];

const LINKED_FILTERS = [
  { key: 'event', label: 'Evento' },
  { key: 'purchase', label: 'Compra' },
  { key: 'provider', label: 'Proveedor' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'general', label: 'General' },
];

const TYPE_COLORS = {
  Recordatorio: { bg: 'from-sky-500/30 via-sky-500/15 to-sky-500/5',     border: 'border-sky-400/60',    ring: 'hover:ring-sky-400/50',    text: 'text-sky-300',    icon: 'text-sky-300',    base: 'bg-sky-950/40' },
  Llamada:      { bg: 'from-emerald-500/30 via-emerald-500/15 to-emerald-500/5', border: 'border-emerald-400/60', ring: 'hover:ring-emerald-400/50', text: 'text-emerald-300', icon: 'text-emerald-300', base: 'bg-emerald-950/40' },
  'Cambio cliente': { bg: 'from-orange-500/30 via-orange-500/15 to-orange-500/5', border: 'border-orange-400/60', ring: 'hover:ring-orange-400/50', text: 'text-orange-300', icon: 'text-orange-300', base: 'bg-orange-950/40' },
  Compra:       { bg: 'from-fuchsia-500/30 via-fuchsia-500/15 to-fuchsia-500/5', border: 'border-fuchsia-400/60', ring: 'hover:ring-fuchsia-400/50', text: 'text-fuchsia-300', icon: 'text-fuchsia-300', base: 'bg-fuchsia-950/40' },
  Idea:         { bg: 'from-yellow-400/30 via-yellow-400/15 to-yellow-400/5', border: 'border-yellow-300/60', ring: 'hover:ring-yellow-300/50', text: 'text-yellow-200', icon: 'text-yellow-300', base: 'bg-yellow-950/40' },
  Problema:     { bg: 'from-rose-500/30 via-rose-500/15 to-rose-500/5', border: 'border-rose-400/60', ring: 'hover:ring-rose-400/50', text: 'text-rose-300', icon: 'text-rose-300', base: 'bg-rose-950/40' },
};

const STATUS_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'today', label: 'Hoy' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'done', label: 'Realizadas' },
  { key: 'pinned', label: 'Fijadas' },
];

const EMPTY_FORM = {
  title: '',
  content: '',
  priority: 'Media',
  type: 'Recordatorio',
  status: 'Pendiente',
  dueDate: '',
  linkedType: 'general',
  linkedId: '',
  tags: '',
  pinned: false,
  archived: false,
  recurrence: 'none',
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function isOverdue(note) {
  return note.dueDate && note.dueDate < todayString() && note.status !== 'Realizada';
}

function isDueToday(note) {
  return note.dueDate === todayString() && note.status !== 'Realizada';
}

function noteToDraft(note) {
  if (!note) return { ...EMPTY_FORM };
  return {
    title: note.title || '',
    content: note.content || '',
    priority: note.priority || 'Media',
    type: note.type || 'Recordatorio',
    status: note.status || (note.done ? 'Realizada' : 'Pendiente'),
    dueDate: note.dueDate || '',
    linkedType: note.linkedType || 'general',
    linkedId: note.linkedId || '',
    tags: (note.tags || []).join(', '),
    pinned: Boolean(note.pinned),
    archived: Boolean(note.archived),
    recurrence: note.recurrence || 'none',
  };
}

function tagsFromText(value) {
  return value.split(',').map(tag => tag.trim()).filter(Boolean);
}

function TypeIcon({ type, className }) {
  const icons = {
    Recordatorio: Bell,
    Llamada: Phone,
    'Cambio cliente': UserRound,
    Compra: ShoppingCart,
    Idea: Lightbulb,
    Problema: AlertTriangle,
  };
  const Icon = icons[type] || Bell;
  return <Icon className={className} />;
}

function FieldLabel({ children, hint }) {
  return (
    <label className="flex items-center justify-between text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      <span>{children}</span>
      {hint && <span className="text-[10px] normal-case tracking-normal text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

function SelectField({ value, onChange, children, className }) {
  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      className={cn(
        'h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        className,
      )}
    >
      {children}
    </select>
  );
}

function StatusPill({ note, size = 'sm' }) {
  const done = note.status === 'Realizada';
  const overdue = isOverdue(note);
  const today = isDueToday(note);

  if (done) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-300',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      )}>
        <CheckCircle2 className="size-3" />
        Realizada
      </span>
    );
  }
  if (overdue) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/15 font-semibold text-destructive',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      )}>
        <AlertTriangle className="size-3" />
        Vencida
      </span>
    );
  }
  if (today) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 font-semibold text-primary',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      )}>
        <Clock className="size-3" />
        Hoy
      </span>
    );
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 font-semibold text-muted-foreground',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
    )}>
      <Clock className="size-3" />
      Pendiente
    </span>
  );
}

function NoteColorCard({ note, onView, onDelete, onToggleDone, onPin }) {
  const done = note.status === 'Realizada';
  const overdue = isOverdue(note);
  const colors = TYPE_COLORS[note.type] || TYPE_COLORS.Recordatorio;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:ring-4',
        colors.base,
        colors.bg,
        colors.border,
        colors.ring,
        done && 'opacity-70',
        overdue && 'ring-2 ring-destructive/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-1.5">
            <TypeIcon type={note.type} className={cn('size-4', colors.icon)} />
            <span className={cn('text-[11px] font-bold uppercase tracking-wider', colors.text)}>
              {note.type}
            </span>
            {note.recurrence && note.recurrence !== 'none' && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                <RefreshCw className="size-3" />
              </span>
            )}
          </div>
          <h3
            className={cn(
              'line-clamp-2 text-lg font-extrabold leading-snug text-white drop-shadow-sm',
              done && 'line-through text-white/60',
            )}
          >
            {note.title}
          </h3>
          <div className="mt-3">
            <StatusPill note={note} />
          </div>
        </div>
        {note.pinned && <Pin className="size-5 shrink-0 text-primary" />}
      </div>

      <div className="mt-5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(note); }}
          className="inline-flex size-11 items-center justify-center rounded-lg bg-background/60 text-muted-foreground transition-all hover:scale-110 hover:bg-primary/25 hover:text-primary"
          title="Ver nota"
        >
          <Eye className="size-5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleDone(note); }}
          className={cn(
            'inline-flex size-11 items-center justify-center rounded-lg bg-background/60 transition-all hover:scale-110',
            done
              ? 'text-emerald-300 hover:bg-emerald-500/25'
              : 'text-muted-foreground hover:bg-emerald-500/25 hover:text-emerald-300',
          )}
          title={done ? 'Reabrir' : 'Marcar como realizada'}
        >
          {done ? <RotateCcw className="size-5" /> : <Check className="size-5" />}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPin(note); }}
          className={cn(
            'inline-flex size-11 items-center justify-center rounded-lg bg-background/60 transition-all hover:scale-110',
            note.pinned
              ? 'text-primary hover:bg-primary/25'
              : 'text-muted-foreground hover:bg-primary/25 hover:text-primary',
          )}
          title={note.pinned ? 'Desfijar' : 'Fijar'}
        >
          {note.pinned ? <PinOff className="size-5" /> : <Pin className="size-5" />}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(note); }}
          className="inline-flex size-11 items-center justify-center rounded-lg bg-background/60 text-muted-foreground transition-all hover:scale-110 hover:bg-destructive/25 hover:text-destructive"
          title="Eliminar"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
    </div>
  );
}

function ModalShell({ children, onClose, maxWidth = 'max-w-3xl', maxHeight = 'h-[90vh]' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div
        className={cn('relative z-10 flex w-full flex-col overflow-hidden rounded-2xl shadow-2xl', maxWidth, maxHeight)}
        style={{ background: '#0F1B33', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ onClose, children, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] px-6 py-4">
      <div className="min-w-0">{children}</div>
      <div className="flex flex-wrap items-center gap-2">
        {action}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          title="Cerrar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function LinkedEntityField({ linkedType, linkedId, onChangeType, onChangeId, options }) {
  const linkedOptions = useMemo(() => {
    if (linkedType === 'event') return (options.events || []).map(e => ({ id: e.id, label: e.title, sub: e.client }));
    if (linkedType === 'provider') return (options.providers || []).map(p => ({ id: p.id, label: p.name, sub: p.category }));
    if (linkedType === 'purchase') return (options.purchases || []).map(p => ({ id: p.id, label: p.store || p.vendorName || 'Compra', sub: format(new Date(p.purchasedAt), 'd MMM yyyy', { locale: es }) }));
    return [];
  }, [linkedType, options]);

  const showEntitySelect = linkedType !== 'general' && linkedType !== 'inventory';

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <FieldLabel>Contexto</FieldLabel>
        <SelectField value={linkedType} onChange={(v) => { onChangeType(v); onChangeId(''); }}>
          {LINKED_FILTERS.map(item => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </SelectField>
      </div>
      {showEntitySelect && (
        <div className="space-y-2">
          <FieldLabel hint="Opcional">
            {linkedType === 'event' ? 'Evento' : linkedType === 'provider' ? 'Proveedor' : 'Compra'}
          </FieldLabel>
          <SelectField value={linkedId} onChange={onChangeId}>
            <option value="">— Sin vincular —</option>
            {linkedOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}{opt.sub ? ` (${opt.sub})` : ''}
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </div>
  );
}

function NoteViewModal({ note, onClose, onEdit, onDelete, onArchive, onRestore, onPin, onToggleDone, onPostpone, onOpenLinked, options }) {
  const linkedEntity = useMemo(() => {
    if (!note || !note.linkedId || !options) return null;
    if (note.linkedType === 'event') {
      const e = (options.events || []).find(x => x.id === note.linkedId);
      return e ? { label: e.title, sub: e.client, path: `/app/history/${e.id}` } : null;
    }
    if (note.linkedType === 'provider') {
      const p = (options.providers || []).find(x => x.id === note.linkedId);
      return p ? { label: p.name, sub: p.category, path: '/app/providers' } : null;
    }
    if (note.linkedType === 'purchase') {
      const p = (options.purchases || []).find(x => x.id === note.linkedId);
      return p ? { label: p.store || p.vendorName || 'Compra', sub: format(new Date(p.purchasedAt), 'd MMM yyyy', { locale: es }), path: '/app/weekly-expenses' } : null;
    }
    return null;
  }, [note, options]);

  if (!note) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl" maxHeight="h-[90vh]">
      <ModalHeader
        onClose={onClose}
        action={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => onPin(note)}>
              {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              {note.pinned ? 'Desfijar' : 'Fijar'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onToggleDone(note)}>
              {note.status === 'Realizada' ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
              {note.status === 'Realizada' ? 'Reabrir' : 'Marcar realizada'}
            </Button>
          </>
        }
      >
        <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Vista de nota
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-foreground">
          <TypeIcon type={note.type} className="size-6 text-primary" />
          {note.title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill note={note} size="md" />
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
            note.priority === 'Alta' ? 'border-primary/40 bg-primary/10 text-primary'
              : note.priority === 'Baja' ? 'border-border/60 bg-secondary/30 text-muted-foreground'
              : 'border-border/60 bg-secondary/40 text-muted-foreground',
          )}>
            {note.priority === 'Alta' && <TrendingUp className="size-3" />}
            {note.priority}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {note.type}
          </span>
          {note.recurrence && note.recurrence !== 'none' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <RefreshCw className="size-3" />
              {RECURRENCE.find(r => r.value === note.recurrence)?.label}
            </span>
          )}
        </div>
      </ModalHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {note.content ? (
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-secondary/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <TypeIcon2 className="size-3.5" /> Contenido
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{note.content}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[rgba(255,255,255,0.06)] p-4 text-center text-sm text-muted-foreground">
            Sin contenido
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-secondary/15 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Calendar className="size-3.5" /> Vencimiento
            </div>
            <p className="text-sm font-medium text-foreground">
              {note.dueDate ? format(new Date(`${note.dueDate}T00:00:00`), "EEEE d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha de vencimiento'}
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-secondary/15 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Link2 className="size-3.5" /> Contexto
            </div>
            <p className="text-sm font-medium text-foreground">
              {LINKED_FILTERS.find(l => l.key === note.linkedType)?.label || 'General'}
            </p>
            {linkedEntity && (
              <button
                type="button"
                onClick={() => onOpenLinked(linkedEntity.path)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <ExternalLink className="size-3" />
                {linkedEntity.label}
              </button>
            )}
            {note.linkedId && !linkedEntity && (
              <p className="mt-1 text-xs text-muted-foreground">ID: {note.linkedId}</p>
            )}
          </div>
        </div>

        {(note.tags || []).length > 0 && (
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-secondary/15 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Tag className="size-3.5" /> Etiquetas
            </div>
            <div className="flex flex-wrap gap-2">
              {note.tags.map(tag => (
                <span key={tag} className="inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {(note.changelog || []).length > 0 && (
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-secondary/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <History className="size-3.5" /> Historial de cambios
            </div>
            <div className="space-y-2">
              {note.changelog.slice(0, 8).map(entry => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground">•</span>
                  <div className="flex-1">
                    <span className="text-foreground">{entry.field}</span>{' '}
                    <span className="text-muted-foreground">cambió de</span>{' '}
                    <span className="text-muted-foreground line-through">{entry.oldValue || '—'}</span>{' '}
                    <span className="text-muted-foreground">a</span>{' '}
                    <span className="text-primary">{entry.newValue || '—'}</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground/70">
                    {format(new Date(entry.createdAt), 'd MMM HH:mm', { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-secondary/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <CalendarDays className="size-3.5" /> Tiempos
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <span>Creada: {format(new Date(note.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</span>
            <span>Actualizada: {format(new Date(note.updatedAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[rgba(255,255,255,0.06)] px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => onPostpone(note)}>
          <Clock className="size-4" /> Posponer
        </Button>
        {note.archived ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onRestore(note)}>
            <ArchiveRestore className="size-4" /> Restaurar
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => onArchive(note)}>
            <Archive className="size-4" /> Archivar
          </Button>
        )}
        <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(note)}>
          <Trash2 className="size-4" /> Eliminar
        </Button>
        <Button type="button" size="sm" onClick={() => onEdit(note)}>
          Editar nota
        </Button>
      </div>
    </ModalShell>
  );
}

function NoteFormModal({ note, draft, setDraft, onClose, onSave, onDelete, onPin, onToggleDone, onPostpone, saving, isCreating, options }) {
  if (!note && !isCreating) return null;

  const handleChange = (field) => (e) => setDraft(prev => ({ ...prev, [field]: e.target.value }));
  const handleSelect = (field) => (value) => setDraft(prev => ({ ...prev, [field]: value }));

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={onSave} className="flex h-full flex-col">
        <ModalHeader
          onClose={onClose}
          action={
            note && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onPin(note)}>
                  {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                  {note.pinned ? 'Desfijar' : 'Fijar'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onToggleDone(note)}>
                  {note.status === 'Realizada' ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                  {note.status === 'Realizada' ? 'Reabrir' : 'Realizada'}
                </Button>
              </>
            )
          }
        >
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {isCreating ? 'Nueva nota' : 'Detalle editable'}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-foreground">
            {isCreating ? <Plus className="size-5 text-primary" /> : <TypeIcon type={draft.type} className="size-5 text-primary" />}
            {isCreating ? 'Crear nota' : 'Editar nota'}
          </h2>
        </ModalHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <FieldLabel>Título</FieldLabel>
            <Input
              value={draft.title}
              onChange={handleChange('title')}
              placeholder="Título de la nota"
              required
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Contenido</FieldLabel>
            <Textarea
              value={draft.content}
              onChange={handleChange('content')}
              placeholder="Detalle del pendiente, acuerdo o llamada..."
              rows={5}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <FieldLabel>Estado</FieldLabel>
              <SelectField value={draft.status} onChange={handleSelect('status')}>
                <option>Pendiente</option>
                <option>Realizada</option>
              </SelectField>
            </div>
            <div className="space-y-2">
              <FieldLabel>Prioridad</FieldLabel>
              <SelectField value={draft.priority} onChange={handleSelect('priority')}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </SelectField>
            </div>
            <div className="space-y-2">
              <FieldLabel>Tipo</FieldLabel>
              <SelectField value={draft.type} onChange={handleSelect('type')}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </SelectField>
            </div>
            <div className="space-y-2">
              <FieldLabel>Vencimiento</FieldLabel>
              <Input type="date" value={draft.dueDate} onChange={handleChange('dueDate')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel hint="Se repite al completarla">Repetir</FieldLabel>
              <SelectField value={draft.recurrence} onChange={handleSelect('recurrence')}>
                {RECURRENCE.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </SelectField>
            </div>
            <div className="space-y-2">
              <FieldLabel>Etiquetas</FieldLabel>
              <Input value={draft.tags} onChange={handleChange('tags')} placeholder="Separadas por coma" />
            </div>
          </div>

          <LinkedEntityField
            linkedType={draft.linkedType}
            linkedId={draft.linkedId}
            onChangeType={handleSelect('linkedType')}
            onChangeId={handleSelect('linkedId')}
            options={options}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[rgba(255,255,255,0.06)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {note && isOverdue(note) && (
              <span className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                Vencida
              </span>
            )}
            {note && note.priority === 'Alta' && (
              <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                Prioridad alta
              </span>
            )}
            {note && note.status === 'Realizada' && (
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                Realizada
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {note && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onPostpone(note)}>
                  <Clock className="size-4" /> Posponer
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(note)}>
                  <Trash2 className="size-4" /> Eliminar
                </Button>
              </>
            )}
            <Button type="submit" size="sm" disabled={saving || !draft.title.trim()}>
              <Save className="size-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function KanbanColumn({ title, icon: Icon, color, notes, onView, onDelete, onToggleDone }) {
  return (
    <div className="flex h-full min-w-[280px] flex-1 flex-col rounded-2xl border border-[rgba(255,255,255,0.06)] bg-card/50">
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('size-4', color)} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span className="rounded-full border border-border/60 bg-secondary/30 px-2 py-0.5 text-xs font-bold text-muted-foreground">
          {notes.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {notes.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Sin notas
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className={cn(
                'group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:border-primary/40',
                TYPE_COLORS[note.type]?.border,
                note.pinned && 'ring-1 ring-primary/30',
              )}
              onClick={() => onView(note)}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <TypeIcon type={note.type} className="size-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {note.type}
                </span>
                {note.pinned && <Pin className="ml-auto size-3 text-primary" />}
              </div>
              <h4 className={cn(
                'line-clamp-2 text-xs font-semibold text-foreground',
                note.status === 'Realizada' && 'line-through text-muted-foreground',
              )}>
                {note.title}
              </h4>
              {note.dueDate && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="size-2.5" />
                  {format(new Date(`${note.dueDate}T00:00:00`), 'd MMM', { locale: es })}
                </div>
              )}
              <div className="mt-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleDone(note); }}
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded transition-colors',
                    note.status === 'Realizada' ? 'text-emerald-300' : 'text-muted-foreground hover:text-emerald-300',
                  )}
                  title={note.status === 'Realizada' ? 'Reabrir' : 'Realizada'}
                >
                  {note.status === 'Realizada' ? <RotateCcw className="size-3" /> : <Check className="size-3" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(note); }}
                  className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Toast({ message, variant = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = variant === 'success'
    ? { bg: 'rgba(232, 131, 74, 0.15)', border: 'rgba(232, 131, 74, 0.5)', icon: 'bg-primary' }
    : { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', icon: 'bg-destructive' };

  return (
    <div className="fixed top-6 left-1/2 z-[60] -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className="flex items-center gap-3 rounded-full px-5 py-3 shadow-2xl"
        style={{ background: colors.bg, border: `1px solid ${colors.border}`, backdropFilter: 'blur(12px)' }}
      >
        <div className={cn('flex size-7 items-center justify-center rounded-full text-white', colors.icon)}>
          {variant === 'success' ? <Check className="size-4" /> : <AlertOctagon className="size-4" />}
        </div>
        <span className="text-sm font-semibold text-foreground">{message}</span>
      </div>
    </div>
  );
}

export default function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [mode, setMode] = useState(null);
  const [draft, setDraft] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState({ events: [], providers: [], purchases: [] });
  const searchRef = useRef(null);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0) + (query.trim() ? 1 : 0);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const params = { archived: showArchived };
    getNotes(params)
      .then(setNotes)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [showArchived]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    Promise.allSettled([getEvents(), getProviders(), getMarketPurchases()])
      .then(([events, providers, purchases]) => {
        setOptions({
          events: events.status === 'fulfilled' ? events.value : [],
          providers: providers.status === 'fulfilled' ? providers.value : [],
          purchases: purchases.status === 'fulfilled' ? purchases.value : [],
        });
      });
  }, []);

  const handleCreate = () => {
    setDraft({ ...EMPTY_FORM });
    setActiveNote(null);
    setMode('create');
  };

  const handleView = (note) => {
    setActiveNote(note);
    setMode('view');
  };

  const handleEdit = (note) => {
    setDraft(noteToDraft(note));
    setActiveNote(note);
    setMode('edit');
  };

  const handleClose = () => {
    setMode(null);
    setActiveNote(null);
    setDraft({ ...EMPTY_FORM });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...draft,
        tags: tagsFromText(draft.tags),
        dueDate: draft.dueDate || null,
        linkedId: draft.linkedId || null,
      };
      if (mode === 'create') {
        const created = await createNote(payload);
        setNotes(prev => [created, ...prev]);
        setToast({ message: `Nota "${created.title}" creada con éxito`, variant: 'success' });
        handleClose();
      } else if (mode === 'edit' && activeNote) {
        const updated = await updateNote(activeNote.id, payload);
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        setActiveNote(updated);
        setDraft(noteToDraft(updated));
        setMode('view');
        setToast({ message: 'Cambios guardados', variant: 'success' });
      }
    } catch {
      setToast({ message: 'Error al guardar la nota', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async (note) => {
    try {
      const updated = await updateNote(note.id, { pinned: !note.pinned });
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      if (activeNote?.id === note.id) setActiveNote(updated);
      if (mode === 'edit') setDraft(noteToDraft(updated));
    } catch {
      setToast({ message: 'Error al fijar la nota', variant: 'error' });
    }
  };

  const handleToggleDone = async (note) => {
    try {
      const updated = await updateNote(note.id, { status: note.status === 'Realizada' ? 'Pendiente' : 'Realizada' });
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      if (activeNote?.id === note.id) setActiveNote(updated);
      if (mode === 'edit') setDraft(noteToDraft(updated));
      setToast({
        message: note.status === 'Realizada' ? 'Nota reabierta' : '¡Bien! Una menos en la lista',
        variant: 'success',
      });
    } catch {
      setToast({ message: 'Error al actualizar la nota', variant: 'error' });
    }
  };

  const handlePostpone = async (note) => {
    try {
      const updated = await updateNote(note.id, { dueDate: tomorrowString(), status: 'Pendiente' });
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      if (activeNote?.id === note.id) setActiveNote(updated);
      if (mode === 'edit') setDraft(noteToDraft(updated));
      setToast({ message: 'Pospuesto para mañana', variant: 'success' });
    } catch {
      setToast({ message: 'Error al posponer la nota', variant: 'error' });
    }
  };

  const handleArchive = async (note) => {
    try {
      const updated = await archiveNote(note.id);
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      if (activeNote?.id === note.id) handleClose();
      setToast({ message: 'Nota archivada', variant: 'success' });
    } catch {
      setToast({ message: 'Error al archivar la nota', variant: 'error' });
    }
  };

  const handleRestore = async (note) => {
    try {
      const updated = await restoreNote(note.id);
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      if (activeNote?.id === note.id) setActiveNote(updated);
      setToast({ message: 'Nota restaurada', variant: 'success' });
    } catch {
      setToast({ message: 'Error al restaurar la nota', variant: 'error' });
    }
  };

  const handleDelete = (note) => setConfirmDelete(note);

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await deleteNote(confirmDelete.id);
      setNotes(prev => prev.filter(n => n.id !== confirmDelete.id));
      if (activeNote?.id === confirmDelete.id) handleClose();
      setToast({ message: 'Nota eliminada', variant: 'success' });
    } catch {
      setToast({ message: 'Error al eliminar la nota', variant: 'error' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportNotes(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notas-${todayString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: `Notas exportadas a ${format.toUpperCase()}`, variant: 'success' });
    } catch {
      setToast({ message: 'Error al exportar', variant: 'error' });
    }
  };

  const handleOpenLinked = (path) => {
    if (path) navigate(path);
  };

  const filteredNotes = useMemo(() => {
    const text = query.trim().toLowerCase();
    return notes.filter(note => {
      const done = note.status === 'Realizada';
      const matchesText = !text || [
        note.title, note.content, note.type,
        ...(note.tags || []),
      ].filter(Boolean).join(' ').toLowerCase().includes(text);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'today' && isDueToday(note)) ||
        (statusFilter === 'pending' && !done) ||
        (statusFilter === 'overdue' && isOverdue(note)) ||
        (statusFilter === 'done' && done) ||
        (statusFilter === 'pinned' && note.pinned);
      const matchesType = typeFilter === 'all' || note.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || note.priority === priorityFilter;
      return matchesText && matchesStatus && matchesType && matchesPriority;
    });
  }, [notes, query, statusFilter, typeFilter, priorityFilter]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const overdueA = isOverdue(a) ? 0 : 1;
      const overdueB = isOverdue(b) ? 0 : 1;
      if (overdueA !== overdueB) return overdueA - overdueB;
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  }, [filteredNotes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (mode) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (mode === 'create' || mode === 'edit') {
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        }
        return;
      }
      if (e.key === 'Escape' && mode) {
        handleClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleCreate();
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (sortedNotes[idx]) handleView(sortedNotes[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, sortedNotes]);

  const stats = useMemo(() => {
    const all = notes.filter(n => !n.archived);
    return {
      total: all.length,
      pending: all.filter(n => n.status !== 'Realizada').length,
      overdue: all.filter(n => isOverdue(n)).length,
      today: all.filter(n => isDueToday(n)).length,
      done: all.filter(n => n.status === 'Realizada').length,
    };
  }, [notes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Bandeja operativa
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Notas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Seguimiento diario de pendientes, llamadas, compras, cambios de cliente y acuerdos importantes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('json')} title="Exportar JSON">
            <Download className="size-4" /> JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} title="Exportar CSV">
            <Download className="size-4" /> CSV
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="size-4" /> Agregar nota
          </Button>
        </div>
      </div>

      {/* Counter cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Package className="size-3.5" /> Total
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Timer className="size-3.5" /> Pendientes
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className={stats.today > 0 ? 'border-primary/40' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Clock className="size-3.5" /> Hoy
            </div>
            <p className={cn('mt-1 text-2xl font-bold', stats.today > 0 ? 'text-primary' : 'text-foreground')}>
              {stats.today}
            </p>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? 'border-destructive/40' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-destructive">
              <AlertOctagon className="size-3.5" /> Vencidas
            </div>
            <p className={cn('mt-1 text-2xl font-bold', stats.overdue > 0 ? 'text-destructive' : 'text-foreground')}>
              {stats.overdue}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="size-3.5" /> Realizadas
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{stats.done}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + filters + view toggle */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por título, contenido o etiqueta... (Ctrl+K)"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowArchived(prev => !prev)}
              >
                <Archive className="size-4" /> {showArchived ? 'Ver activas' : 'Ver archivadas'}
              </Button>
              <Button
                variant={activeFilterCount > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(prev => !prev)}
                title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                className="relative"
              >
                <SlidersHorizontal className="size-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold text-primary">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                title="Vista tarjetas"
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('kanban')}
                title="Vista Kanban"
              >
                <KanbanSquare className="size-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-3 border-t border-border/40 pt-3">
              <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado:</span>
            {STATUS_FILTERS.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  statusFilter === item.key
                    ? 'border-primary/40 bg-primary text-primary-foreground'
                    : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
                {item.key === 'overdue' && stats.overdue > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-destructive px-1.5 text-[9px] text-white">
                    {stats.overdue}
                  </span>
                )}
                {item.key === 'today' && stats.today > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary px-1.5 text-[9px] text-white">
                    {stats.today}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo:</span>
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                typeFilter === 'all'
                  ? 'border-primary/40 bg-primary text-primary-foreground'
                  : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
              )}
            >
              Todos
            </button>
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  typeFilter === t
                    ? 'border-primary/40 bg-primary text-primary-foreground'
                    : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridad:</span>
            <button
              type="button"
              onClick={() => setPriorityFilter('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                priorityFilter === 'all'
                  ? 'border-primary/40 bg-primary text-primary-foreground'
                  : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
              )}
            >
              Todas
            </button>
            {PRIORITIES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  priorityFilter === p
                    ? 'border-primary/40 bg-primary text-primary-foreground'
                    : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
            {(query || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setQuery(''); setStatusFilter('all'); setTypeFilter('all'); setPriorityFilter('all'); }}
                className="ml-auto"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes display */}
      {isLoading ? (
        <LoadingState title="Cargando notas" />
      ) : error ? (
        <ErrorState description={error.message} onRetry={load} />
      ) : sortedNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title={showArchived ? 'No hay notas archivadas' : 'Sin notas todavía'}
              description={showArchived ? 'Las notas archivadas aparecerán aquí.' : 'Hacé clic en "Agregar nota" para crear la primera.'}
            />
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedNotes.map(note => (
            <NoteColorCard
              key={note.id}
              note={note}
              onView={handleView}
              onDelete={handleDelete}
              onToggleDone={handleToggleDone}
              onPin={handlePin}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          <KanbanColumn
            title="Vencidas"
            icon={AlertOctagon}
            color="text-destructive"
            notes={sortedNotes.filter(n => isOverdue(n))}
            onView={handleView}
            onDelete={handleDelete}
            onToggleDone={handleToggleDone}
            onPin={handlePin}
          />
          <KanbanColumn
            title="Hoy"
            icon={Clock}
            color="text-primary"
            notes={sortedNotes.filter(n => isDueToday(n))}
            onView={handleView}
            onDelete={handleDelete}
            onToggleDone={handleToggleDone}
            onPin={handlePin}
          />
          <KanbanColumn
            title="Pendientes"
            icon={Timer}
            color="text-muted-foreground"
            notes={sortedNotes.filter(n => !isOverdue(n) && !isDueToday(n) && n.status !== 'Realizada')}
            onView={handleView}
            onDelete={handleDelete}
            onToggleDone={handleToggleDone}
            onPin={handlePin}
          />
          <KanbanColumn
            title="Realizadas"
            icon={CheckCircle2}
            color="text-emerald-300"
            notes={sortedNotes.filter(n => n.status === 'Realizada')}
            onView={handleView}
            onDelete={handleDelete}
            onToggleDone={handleToggleDone}
            onPin={handlePin}
          />
        </div>
      )}

      {/* Keyboard hints */}
      {!mode && sortedNotes.length > 0 && viewMode === 'grid' && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground/70">
          <span><kbd className="rounded border border-border/60 bg-secondary/30 px-1.5 py-0.5 font-mono text-[10px]">N</kbd> Nueva nota</span>
          <span><kbd className="rounded border border-border/60 bg-secondary/30 px-1.5 py-0.5 font-mono text-[10px]">1-9</kbd> Abrir nota</span>
          <span><kbd className="rounded border border-border/60 bg-secondary/30 px-1.5 py-0.5 font-mono text-[10px]">Ctrl+K</kbd> Buscar</span>
          <span><kbd className="rounded border border-border/60 bg-secondary/30 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> Cerrar</span>
        </div>
      )}

      {mode === 'view' && activeNote && (
        <NoteViewModal
          note={activeNote}
          onClose={handleClose}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onPin={handlePin}
          onToggleDone={handleToggleDone}
          onPostpone={handlePostpone}
          onOpenLinked={handleOpenLinked}
          options={options}
        />
      )}

      {(mode === 'create' || mode === 'edit') && (
        <NoteFormModal
          note={activeNote}
          draft={draft}
          setDraft={setDraft}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={handleDelete}
          onPin={handlePin}
          onToggleDone={handleToggleDone}
          onPostpone={handlePostpone}
          saving={saving}
          isCreating={mode === 'create'}
          options={options}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Eliminar nota"
        description={`¿Estás seguro de que querés eliminar "${confirmDelete?.title || 'esta nota'}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
}
