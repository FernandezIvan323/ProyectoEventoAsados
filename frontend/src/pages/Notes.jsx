import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
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
  Trash2,
  UserRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getNotes, createNote, updateNote, deleteNote } from '@/services/notesApi';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'done', label: 'Realizadas' },
];

const LINKED_FILTERS = [
  { key: 'all', label: 'Todo contexto' },
  { key: 'event', label: 'Evento' },
  { key: 'purchase', label: 'Compra' },
  { key: 'provider', label: 'Proveedor' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'general', label: 'General' },
];

const PRIORITIES = ['Alta', 'Media', 'Baja'];
const TYPES = ['Recordatorio', 'Llamada', 'Cambio cliente', 'Compra', 'Idea', 'Problema'];

const LINKED_LABELS = {
  event: 'Evento',
  purchase: 'Compra',
  provider: 'Proveedor',
  inventory: 'Inventario',
  general: 'General',
};

const QUICK_TEMPLATES = [
  {
    label: 'Confirmar asistencia',
    title: 'Confirmar asistencia con cliente',
    type: 'Llamada',
    priority: 'Alta',
    linkedType: 'event',
  },
  {
    label: 'Revisar compra',
    title: 'Revisar compra de mercado',
    type: 'Compra',
    priority: 'Media',
    linkedType: 'purchase',
  },
  {
    label: 'Llamar proveedor',
    title: 'Llamar proveedor',
    type: 'Llamada',
    priority: 'Alta',
    linkedType: 'provider',
  },
  {
    label: 'Cambio de menu',
    title: 'Cambio solicitado en menu',
    type: 'Cambio cliente',
    priority: 'Alta',
    linkedType: 'event',
  },
];

const EMPTY_FORM = {
  title: '',
  content: '',
  priority: 'Media',
  type: 'Recordatorio',
  dueDate: '',
  linkedType: 'general',
  linkedId: '',
  tags: '',
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

function priorityRank(priority) {
  return { Alta: 0, Media: 1, Baja: 2 }[priority] ?? 1;
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
    if (priorityRank(a.priority) !== priorityRank(b.priority)) return priorityRank(a.priority) - priorityRank(b.priority);
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });
}

function tagsFromText(value) {
  return value.split(',').map(tag => tag.trim()).filter(Boolean);
}

function noteToDraft(note) {
  return {
    title: note?.title || '',
    content: note?.content || '',
    priority: note?.priority || 'Media',
    type: note?.type || 'Recordatorio',
    status: note?.status || (note?.done ? 'Realizada' : 'Pendiente'),
    dueDate: note?.dueDate || '',
    linkedType: note?.linkedType || 'general',
    linkedId: note?.linkedId || '',
    tags: (note?.tags || []).join(', '),
  };
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

function FieldLabel({ children }) {
  return (
    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      {children}
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

function NoteBadge({ children, tone = 'default' }) {
  const tones = {
    default: 'border-border/60 bg-secondary/40 text-muted-foreground',
    high: 'border-primary/40 bg-primary/10 text-primary',
    danger: 'border-destructive/40 bg-destructive/10 text-destructive',
    done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold', tones[tone])}>
      {children}
    </span>
  );
}

function NoteListItem({ note, selected, onSelect, onToggleDone, onPin, onPostpone, onDelete }) {
  const overdue = isOverdue(note);
  const done = note.status === 'Realizada';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(note.id)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') onSelect(note.id);
      }}
      className={cn(
        'group rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-secondary/30',
        selected ? 'border-primary/50 bg-primary/10 shadow-sm' : 'border-border/60',
        done && 'opacity-70',
        overdue && !selected && 'border-destructive/35',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border',
            overdue
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : note.priority === 'Alta'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/60 bg-secondary/40 text-muted-foreground',
          )}
        >
          <TypeIcon type={note.type} className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {note.pinned && <Pin className="size-3.5 shrink-0 text-primary" />}
            <p className={cn('truncate text-sm font-semibold text-foreground', done && 'line-through text-muted-foreground')}>
              {note.title}
            </p>
          </div>
          {note.content && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{note.content}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {note.dueDate ? format(new Date(`${note.dueDate}T00:00:00`), 'd MMM', { locale: es }) : 'Sin fecha'}
            </span>
            <span>{LINKED_LABELS[note.linkedType] || 'General'}</span>
            <span>{note.priority}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {overdue ? <NoteBadge tone="danger">Vencida</NoteBadge> : null}
        {isDueToday(note) ? <NoteBadge tone="high">Hoy</NoteBadge> : null}
        {done ? <NoteBadge tone="done">Realizada</NoteBadge> : <NoteBadge>{note.type}</NoteBadge>}
        <div className="ml-auto flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            title={done ? 'Reabrir' : 'Marcar realizada'}
            onClick={event => {
              event.stopPropagation();
              onToggleDone(note);
            }}
          >
            {done ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            title={note.pinned ? 'Desfijar' : 'Fijar'}
            onClick={event => {
              event.stopPropagation();
              onPin(note);
            }}
          >
            {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            title="Posponer para mañana"
            onClick={event => {
              event.stopPropagation();
              onPostpone(note);
            }}
          >
            <Clock className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Eliminar"
            onClick={event => {
              event.stopPropagation();
              onDelete(note.id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [linkedFilter, setLinkedFilter] = useState('all');
  const [quickForm, setQuickForm] = useState(EMPTY_FORM);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [detailDraft, setDetailDraft] = useState(noteToDraft(null));
  const [savingQuick, setSavingQuick] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getNotes()
      .then(data => {
        const ordered = sortNotes(data);
        setNotes(ordered);
        setSelectedId(current => current || ordered[0]?.id || null);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filteredNotes = useMemo(() => {
    const today = todayString();
    const text = query.trim().toLowerCase();
    return sortNotes(notes.filter(note => {
      const done = note.status === 'Realizada';
      const matchesText = !text || [
        note.title,
        note.content,
        note.type,
        LINKED_LABELS[note.linkedType],
        ...(note.tags || []),
      ].filter(Boolean).join(' ').toLowerCase().includes(text);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'today' && note.dueDate === today && !done) ||
        (statusFilter === 'pending' && !done) ||
        (statusFilter === 'overdue' && isOverdue(note)) ||
        (statusFilter === 'done' && done);
      const matchesContext = linkedFilter === 'all' || note.linkedType === linkedFilter;
      return matchesText && matchesStatus && matchesContext;
    }));
  }, [linkedFilter, notes, query, statusFilter]);

  const selectedNote = useMemo(
    () => notes.find(note => note.id === selectedId) || filteredNotes[0] || null,
    [filteredNotes, notes, selectedId],
  );

  const reminders = useMemo(
    () => sortNotes(notes.filter(note => isOverdue(note) || isDueToday(note))).slice(0, 4),
    [notes],
  );

  useEffect(() => {
    if (!selectedNote) return;
    const timer = setTimeout(() => setDetailDraft(noteToDraft(selectedNote)), 0);
    return () => clearTimeout(timer);
  }, [selectedNote]);

  useEffect(() => {
    if (!selectedNote || selectedNote.id === selectedId) return;
    const timer = setTimeout(() => setSelectedId(selectedNote.id), 0);
    return () => clearTimeout(timer);
  }, [selectedId, selectedNote]);

  const mergeUpdatedNote = (updated) => {
    setNotes(prev => sortNotes(prev.map(note => note.id === updated.id ? updated : note)));
    setSelectedId(updated.id);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!quickForm.title.trim()) return;
    setSavingQuick(true);
    try {
      const note = await createNote({
        ...quickForm,
        tags: tagsFromText(quickForm.tags),
        dueDate: quickForm.dueDate || null,
        linkedId: quickForm.linkedId || null,
      });
      setNotes(prev => sortNotes([note, ...prev]));
      setSelectedId(note.id);
      setQuickForm(EMPTY_FORM);
      setAdvancedOpen(false);
    } catch (err) {
      setError(err);
    } finally {
      setSavingQuick(false);
    }
  };

  const handleSaveDetail = async (event) => {
    event.preventDefault();
    if (!selectedNote || !detailDraft.title.trim()) return;
    setSavingDetail(true);
    try {
      const updated = await updateNote(selectedNote.id, {
        ...detailDraft,
        tags: tagsFromText(detailDraft.tags),
        dueDate: detailDraft.dueDate || null,
        linkedId: detailDraft.linkedId || null,
      });
      mergeUpdatedNote(updated);
    } catch (err) {
      setError(err);
    } finally {
      setSavingDetail(false);
    }
  };

  const handleToggleDone = async (note) => {
    const updated = await updateNote(note.id, { status: note.status === 'Realizada' ? 'Pendiente' : 'Realizada' });
    mergeUpdatedNote(updated);
  };

  const handlePin = async (note) => {
    const updated = await updateNote(note.id, { pinned: !note.pinned });
    mergeUpdatedNote(updated);
  };

  const handlePostpone = async (note) => {
    const updated = await updateNote(note.id, { dueDate: tomorrowString(), status: 'Pendiente' });
    mergeUpdatedNote(updated);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    setNotes(prev => {
      const next = prev.filter(note => note.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id || null);
      return next;
    });
  };

  const applyTemplate = (template) => {
    setQuickForm(prev => ({
      ...prev,
      title: template.title,
      type: template.type,
      priority: template.priority,
      linkedType: template.linkedType,
    }));
    setAdvancedOpen(true);
  };

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
        <Button onClick={() => document.getElementById('quick-note-title')?.focus()}>
          <Plus className="size-4" /> Nueva nota rapida
        </Button>
      </div>

      <Card className="hover:translate-y-0">
        <CardHeader className="pt-6">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Bell className="size-5 text-primary" />
            Captura rapida
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Input
                id="quick-note-title"
                value={quickForm.title}
                onChange={event => setQuickForm(prev => ({ ...prev, title: event.target.value }))}
                placeholder="Ej. Llamar al cliente, revisar compra, confirmar proveedor..."
                disabled={savingQuick}
                className="lg:flex-1"
              />
              <Button type="submit" disabled={savingQuick || !quickForm.title.trim()} className="lg:w-[180px]">
                {savingQuick ? 'Guardando...' : 'Crear nota'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdvancedOpen(prev => !prev)}
                className="lg:w-[150px]"
              >
                Avanzado <ChevronDown className={cn('size-4 transition-transform', advancedOpen && 'rotate-180')} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map(template => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-full border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {template.label}
                </button>
              ))}
            </div>

            {advancedOpen && (
              <div className="grid gap-4 rounded-xl border border-border/60 bg-secondary/20 p-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <FieldLabel>Prioridad</FieldLabel>
                  <SelectField value={quickForm.priority} onChange={value => setQuickForm(prev => ({ ...prev, priority: value }))}>
                    {PRIORITIES.map(priority => <option key={priority}>{priority}</option>)}
                  </SelectField>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Tipo</FieldLabel>
                  <SelectField value={quickForm.type} onChange={value => setQuickForm(prev => ({ ...prev, type: value }))}>
                    {TYPES.map(type => <option key={type}>{type}</option>)}
                  </SelectField>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Vencimiento</FieldLabel>
                  <Input
                    type="date"
                    value={quickForm.dueDate}
                    onChange={event => setQuickForm(prev => ({ ...prev, dueDate: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Contexto</FieldLabel>
                  <SelectField value={quickForm.linkedType} onChange={value => setQuickForm(prev => ({ ...prev, linkedType: value }))}>
                    {LINKED_FILTERS.filter(item => item.key !== 'all').map(item => (
                      <option key={item.key} value={item.key}>{item.label}</option>
                    ))}
                  </SelectField>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel>Detalle</FieldLabel>
                  <Textarea
                    rows={3}
                    value={quickForm.content}
                    onChange={event => setQuickForm(prev => ({ ...prev, content: event.target.value }))}
                    placeholder="Notas del acuerdo, telefono hablado, precio o cambio solicitado..."
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>ID vinculado</FieldLabel>
                  <Input
                    value={quickForm.linkedId}
                    onChange={event => setQuickForm(prev => ({ ...prev, linkedId: event.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Etiquetas</FieldLabel>
                  <Input
                    value={quickForm.tags}
                    onChange={event => setQuickForm(prev => ({ ...prev, tags: event.target.value }))}
                    placeholder="cliente, compra, arroz"
                  />
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {reminders.length > 0 && (
        <Card className="border-primary/25 bg-primary/5 hover:translate-y-0">
          <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <Clock className="size-5 text-primary" />
              Recordatorios del dia
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              {reminders.map(note => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {isOverdue(note) ? 'Vencida: ' : 'Hoy: '}
                  {note.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="min-h-[620px] hover:translate-y-0">
          <CardHeader className="gap-4 pt-6">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg text-foreground">Bandeja</CardTitle>
              <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                {filteredNotes.length} notas
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar por titulo, contenido, etiqueta o contexto..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    statusFilter === item.key
                      ? 'border-primary/40 bg-primary text-primary-foreground'
                      : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectField value={linkedFilter} onChange={setLinkedFilter}>
                {LINKED_FILTERS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </SelectField>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                  setLinkedFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pb-6">
            {isLoading ? (
              <LoadingState title="Cargando notas" />
            ) : error ? (
              <ErrorState description={error.message} onRetry={load} />
            ) : filteredNotes.length === 0 ? (
              <EmptyState title="Sin notas" description="No hay notas para los filtros seleccionados." />
            ) : (
              filteredNotes.map(note => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  selected={selectedNote?.id === note.id}
                  onSelect={setSelectedId}
                  onToggleDone={handleToggleDone}
                  onPin={handlePin}
                  onPostpone={handlePostpone}
                  onDelete={handleDelete}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[620px] hover:translate-y-0 xl:sticky xl:top-6">
          {selectedNote ? (
            <form onSubmit={handleSaveDetail} className="flex h-full flex-col">
              <CardHeader className="gap-4 pt-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                      Detalle editable
                    </p>
                    <CardTitle className="mt-2 flex items-center gap-2 text-xl text-foreground">
                      <TypeIcon type={detailDraft.type} className="size-5 text-primary" />
                      Nota seleccionada
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => handlePin(selectedNote)}>
                      {selectedNote.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                      {selectedNote.pinned ? 'Desfijar' : 'Fijar'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handleToggleDone(selectedNote)}>
                      {selectedNote.status === 'Realizada' ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                      {selectedNote.status === 'Realizada' ? 'Reabrir' : 'Realizada'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-5 pb-6">
                <div className="space-y-2">
                  <FieldLabel>Titulo</FieldLabel>
                  <Input
                    value={detailDraft.title}
                    onChange={event => setDetailDraft(prev => ({ ...prev, title: event.target.value }))}
                    placeholder="Titulo de la nota"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>Contenido</FieldLabel>
                  <Textarea
                    value={detailDraft.content}
                    onChange={event => setDetailDraft(prev => ({ ...prev, content: event.target.value }))}
                    placeholder="Detalle del pendiente, acuerdo o llamada..."
                    rows={7}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <FieldLabel>Estado</FieldLabel>
                    <SelectField value={detailDraft.status} onChange={value => setDetailDraft(prev => ({ ...prev, status: value }))}>
                      <option>Pendiente</option>
                      <option>Realizada</option>
                    </SelectField>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Prioridad</FieldLabel>
                    <SelectField value={detailDraft.priority} onChange={value => setDetailDraft(prev => ({ ...prev, priority: value }))}>
                      {PRIORITIES.map(priority => <option key={priority}>{priority}</option>)}
                    </SelectField>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Tipo</FieldLabel>
                    <SelectField value={detailDraft.type} onChange={value => setDetailDraft(prev => ({ ...prev, type: value }))}>
                      {TYPES.map(type => <option key={type}>{type}</option>)}
                    </SelectField>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Vencimiento</FieldLabel>
                    <Input
                      type="date"
                      value={detailDraft.dueDate}
                      onChange={event => setDetailDraft(prev => ({ ...prev, dueDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <FieldLabel>Contexto</FieldLabel>
                    <SelectField value={detailDraft.linkedType} onChange={value => setDetailDraft(prev => ({ ...prev, linkedType: value }))}>
                      {LINKED_FILTERS.filter(item => item.key !== 'all').map(item => (
                        <option key={item.key} value={item.key}>{item.label}</option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>ID vinculado</FieldLabel>
                    <Input
                      value={detailDraft.linkedId}
                      onChange={event => setDetailDraft(prev => ({ ...prev, linkedId: event.target.value }))}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Etiquetas</FieldLabel>
                    <Input
                      value={detailDraft.tags}
                      onChange={event => setDetailDraft(prev => ({ ...prev, tags: event.target.value }))}
                      placeholder="Separadas por coma"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <span>Creada: {format(new Date(selectedNote.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                    <span>Actualizada: {format(new Date(selectedNote.updatedAt), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                    <span>Estado: {selectedNote.status}</span>
                    <span>Contexto: {LINKED_LABELS[selectedNote.linkedType] || 'General'}</span>
                  </div>
                  {(selectedNote.tags || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedNote.tags.map(tag => <NoteBadge key={tag}>{tag}</NoteBadge>)}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {isOverdue(selectedNote) && <NoteBadge tone="danger">Vencida</NoteBadge>}
                    {selectedNote.priority === 'Alta' && <NoteBadge tone="high">Prioridad alta</NoteBadge>}
                    {selectedNote.status === 'Realizada' && <NoteBadge tone="done">Realizada</NoteBadge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => handlePostpone(selectedNote)}>
                      <Clock className="size-4" /> Posponer
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(selectedNote.id)}
                    >
                      <Trash2 className="size-4" /> Eliminar
                    </Button>
                    <Button type="submit" disabled={savingDetail || !detailDraft.title.trim()}>
                      <Save className="size-4" />
                      {savingDetail ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </form>
          ) : (
            <CardContent className="flex min-h-[620px] items-center justify-center py-10">
              <div className="max-w-sm text-center">
                <Package className="mx-auto size-10 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Selecciona una nota</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Al elegir una nota de la bandeja, aqui podras editarla, fijarla, posponerla o marcarla como realizada.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
