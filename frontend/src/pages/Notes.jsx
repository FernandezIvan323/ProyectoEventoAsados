import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Grid3X3,
  LayoutPanelLeft,
  MoreVertical,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getNotes, createNote, updateNote, deleteNote } from '@/services/notesApi';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  { card: 'bg-amber-500/25 border-amber-400/30 hover:border-amber-400/60', dot: 'bg-amber-400' },
  { card: 'bg-sky-500/25 border-sky-400/30 hover:border-sky-400/60', dot: 'bg-sky-400' },
  { card: 'bg-rose-500/25 border-rose-400/30 hover:border-rose-400/60', dot: 'bg-rose-400' },
  { card: 'bg-emerald-500/25 border-emerald-400/30 hover:border-emerald-400/60', dot: 'bg-emerald-400' },
  { card: 'bg-violet-500/25 border-violet-400/30 hover:border-violet-400/60', dot: 'bg-violet-400' },
];

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'realizado', label: 'Realizado' },
];

const CONTEXT_TAGS = [
  { key: 'cotizaciones', label: 'Cotizaciones' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'proveedores', label: 'Proveedores' },
];

const menuVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

function ContextMenu({ note, onClose, onEdit, onToggle, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { label: 'Editar nota', icon: Edit3, action: () => onEdit(note) },
    { label: note.done ? 'Marcar pendiente' : 'Marcar realizado', icon: note.done ? XCircle : CheckCircle2, action: () => onToggle(note) },
    { separator: true },
    { label: 'Eliminar', icon: Trash2, action: () => onDelete(note.id), danger: true },
  ];

  return (
    <motion.div
      ref={menuRef}
      key="context-menu"
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-8 z-50 min-w-[190px] origin-top-right overflow-hidden rounded-xl border border-border bg-card py-1 shadow-2xl"
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="my-1 border-t border-border/60" />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              item.danger
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-foreground hover:bg-accent',
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </button>
        ),
      )}
    </motion.div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewNote, setViewNote] = useState(null);

  const [filter, setFilter] = useState('todas');
  const [viewMode, setViewMode] = useState('grid');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('notes-view');
    return () => document.documentElement.classList.remove('notes-view');
  }, []);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getNotes()
      .then(data => setNotes(data.sort((a, b) => a.done - b.done)))
      .catch(setError)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredNotes = useMemo(() => {
    if (filter === 'pendiente') return notes.filter(n => !n.done);
    if (filter === 'realizado') return notes.filter(n => n.done);
    return notes;
  }, [notes, filter]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTagInput('');
    setShowForm(false);
    setEditingNote(null);
  };

  const openEditForm = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setTagInput((note.tags || []).join(', '));
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (editingNote) {
        const updated = await updateNote(editingNote.id, { title, content, tags, done: editingNote.done });
        setNotes(prev => prev.map(n => n.id === editingNote.id ? updated : n));
        if (viewNote?.id === editingNote.id) setViewNote(updated);
      } else {
        const note = await createNote({ title, content, tags, done: false });
        setNotes(prev => [note, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (note) => {
    try {
      const updated = await updateNote(note.id, { done: !note.done });
      setNotes(prev => prev.map(n => n.id === note.id ? updated : n).sort((a, b) => a.done - b.done));
      if (viewNote?.id === note.id) setViewNote(updated);
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (viewNote?.id === id) setViewNote(null);
    } catch (err) {
      setError(err);
    }
  };

  const activeContextTags = CONTEXT_TAGS.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Notas</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="size-4" /> Agregar nota
        </Button>
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Titulo de la nota..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={saving}
                autoFocus
              />
              <Textarea
                placeholder="Descripcion (opcional)..."
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={saving}
                rows={2}
              />
              <Input
                placeholder="Etiquetas: separadas por coma (ej. Cotizaciones, Inventario)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                disabled={saving}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={saving || !title.trim()}>
                  {saving ? 'Guardando...' : editingNote ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button variant="ghost" type="button" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
        {/* Status pills */}
        <div className="flex items-center gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150',
                filter === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Context tag pills */}
        <div className="flex items-center gap-1.5">
          {activeContextTags.map(tag => (
            <span
              key={tag.key}
              className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground tracking-wide uppercase"
            >
              {tag.label}
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/60 bg-secondary p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'grid' ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            title="Vista de cuadricula"
          >
            <Grid3X3 className="size-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'kanban' ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            title="Vista de tablero"
          >
            <LayoutPanelLeft className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState title="Cargando notas" />
      ) : error ? (
        <ErrorState description={error.message} onRetry={load} />
      ) : filteredNotes.length === 0 ? (
        <EmptyState title="Sin notas" description={filter === 'todas' ? 'Agrega tu primera nota.' : `No hay notas con estado "${filter}".`} />
      ) : viewMode === 'kanban' ? (
        /* Kanban view */
        <div className="grid grid-cols-2 gap-6">
          {[
            { key: 'pendiente', label: 'POR HACER', done: false },
            { key: 'realizado', label: 'COMPLETADO', done: true },
          ].map(column => {
            const colNotes = filteredNotes.filter(n => n.done === column.done);
            return (
              <div key={column.key}>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className={cn(
                    'h-1 w-8 rounded-full',
                    column.done ? 'bg-emerald-500' : 'bg-red-500',
                  )} />
                  <h3 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    {column.label}
                  </h3>
                  <span className="ml-auto text-[11px] text-muted-foreground/60">{colNotes.length}</span>
                </div>
                <div className="space-y-3">
                  {colNotes.map((note, i) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      colorIndex={notes.indexOf(note) % COLORS.length}
                      openMenuId={openMenuId}
                      onOpenMenu={setOpenMenuId}
                      onEdit={openEditForm}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onClick={setViewNote}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filteredNotes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              colorIndex={i % COLORS.length}
              openMenuId={openMenuId}
              onOpenMenu={setOpenMenuId}
              onEdit={openEditForm}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onClick={setViewNote}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {viewNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setViewNote(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                      viewNote.done ? 'bg-emerald-500/25 text-emerald-200' : 'bg-red-500/25 text-red-200',
                    )}>
                      <span className={cn('size-1.5 rounded-full', viewNote.done ? 'bg-emerald-200' : 'bg-red-200')} />
                      {viewNote.done ? 'Realizado' : 'Pendiente'}
                    </span>
                    {(viewNote.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className="rounded-full border border-border/60 bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className={cn(
                    'text-2xl font-bold',
                    viewNote.done ? 'text-muted-foreground/70 line-through' : 'text-foreground',
                  )}>
                    {viewNote.title}
                  </h2>
                </div>
                <button onClick={() => setViewNote(null)} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>
              {viewNote.content && (
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground/85">{viewNote.content}</p>
              )}
              <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground/80">
                <CalendarDays className="size-3.5" />
                {format(new Date(viewNote.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewNote(null)}>Cerrar</Button>
                <Button variant="outline" size="sm" onClick={() => { setViewNote(null); openEditForm(viewNote); }}>
                  <Edit3 className="size-3" /> Editar
                </Button>
                <Button
                  variant={viewNote.done ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => handleToggle(viewNote)}
                >
                  {viewNote.done ? '↩ Marcar pendiente' : '✓ Marcar realizado'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { handleDelete(viewNote.id); setViewNote(null); }}
                >
                  <Trash2 className="size-3" /> Eliminar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteCard({ note, colorIndex, openMenuId, onOpenMenu, onEdit, onToggle, onDelete, onClick }) {
  const isMenuOpen = openMenuId === note.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-xl border p-4 transition-all duration-200 hover:shadow-md',
        COLORS[colorIndex % COLORS.length].card,
      )}
      onClick={() => onClick(note)}
    >
      {/* Three-dot menu trigger */}
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onOpenMenu(isMenuOpen ? null : note.id); }}
          className={cn(
            'flex size-7 items-center justify-center rounded-lg transition-colors',
            isMenuOpen
              ? 'bg-black/20 text-foreground'
              : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-black/10',
          )}
          aria-label="Opciones de nota"
        >
          <MoreVertical className="size-4" />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <ContextMenu
              note={note}
              onClose={() => onOpenMenu(null)}
              onEdit={(n) => { onOpenMenu(null); onEdit(n); }}
              onToggle={(n) => { onOpenMenu(null); onToggle(n); }}
              onDelete={(id) => { onOpenMenu(null); onDelete(id); }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Title */}
      <p className={cn(
        'text-sm font-semibold leading-snug line-clamp-3',
        note.done ? 'text-muted-foreground line-through' : 'text-foreground',
      )}>
        {note.title}
      </p>

      {/* Content */}
      {note.content && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
      )}

      {/* Tags */}
      {(note.tags || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(note.tags || []).slice(0, 3).map(tag => (
            <span
              key={tag}
              className="rounded-full bg-black/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <CalendarDays className="size-3" />
          {format(new Date(note.createdAt), "d MMM", { locale: es })}
        </span>
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          note.done ? 'bg-emerald-500/25 text-emerald-200' : 'bg-red-500/25 text-red-200',
        )}>
          <span className={cn('size-1.5 rounded-full', note.done ? 'bg-emerald-200' : 'bg-red-200')} />
          {note.done ? 'Realizado' : 'Pendiente'}
        </span>
      </div>
    </motion.div>
  );
}
