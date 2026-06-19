import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2, Utensils, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { currency } from '@/lib/finance';
import { createRecipe, deleteRecipe, getRecipes, updateRecipe } from '@/services/recipesApi';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', servings: '', basePrice: '', description: '' });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const loadRecipes = () => {
    setIsLoading(true);
    setError(null);
    getRecipes()
      .then(data => setRecipes(Array.isArray(data) ? data : []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadRecipes(); }, []);

  const resetForm = () => {
    setForm({ name: '', category: '', servings: '', basePrice: '', description: '' });
    setTags([]);
    setTagInput('');
    setSelectedId(null);
    setIsEditing(false);
    setMutationError(null);
  };

  const openNew = () => {
    resetForm();
    setSelectedId('new');
  };

  const openEdit = (recipe) => {
    setForm({
      name: recipe.name,
      category: recipe.category || '',
      servings: String(recipe.servings || ''),
      basePrice: String(recipe.basePrice || ''),
      description: recipe.description || '',
    });
    setTags((recipe.items || []).map(i => i.name));
    setSelectedId(recipe.id);
    setIsEditing(true);
    setMutationError(null);
  };

  const addTag = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setMutationError(null);
      const created = await createRecipe({
        ...form,
        servings: Number(form.servings || 0),
        basePrice: Number(form.basePrice || 0),
        items: tags.map(name => ({ name, quantity: 0, unit: 'unidad' })),
      });
      setRecipes(prev => [created, ...prev]);
      resetForm();
    } catch (err) {
      setMutationError(err);
    }
  };

  const handleEditSave = async () => {
    if (!selectedId) return;
    try {
      setMutationError(null);
      const updated = await updateRecipe(selectedId, {
        ...form,
        servings: Number(form.servings || 0),
        basePrice: Number(form.basePrice || 0),
        items: tags.map(name => ({ name, quantity: 0, unit: 'unidad' })),
      });
      setRecipes(prev => prev.map(r => (r.id === selectedId ? updated : r)));
      resetForm();
    } catch (err) {
      setMutationError(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;
    try {
      setMutationError(null);
      await deleteRecipe(recipeToDelete.id);
      setRecipes(prev => prev.filter(r => r.id !== recipeToDelete.id));
      if (selectedId === recipeToDelete.id) resetForm();
      setDeleteConfirmOpen(false);
      setRecipeToDelete(null);
    } catch (err) {
      setMutationError(err);
    }
  };

  const selectedRecipe = selectedId && selectedId !== 'new'
    ? recipes.find(r => r.id === selectedId)
    : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Recetas y combos</Badge>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Menús, recetas y combos</h1>
          <p className="mt-2 text-muted-foreground">Registrá combos reutilizables y aplicalos al crear un presupuesto.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[35%_65%] items-start">
        {/* Left panel — list */}
        <div className="space-y-3">
          <Button onClick={openNew} className="w-full" variant={selectedId === 'new' ? 'default' : 'outline'}>
            <Plus className="size-4" /> Nueva receta
          </Button>

          {isLoading ? (
            <LoadingState title="Cargando recetas" />
          ) : error ? (
            <ErrorState description={error.message} onRetry={loadRecipes} />
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 py-12 text-center">
              <Utensils className="mb-3 size-9 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Sin recetas registradas</p>
              <p className="mt-1 text-xs text-muted-foreground/50">Crea la primera para empezar.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recipes.map(recipe => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => openEdit(recipe)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                    selectedId === recipe.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${selectedId === recipe.id ? 'text-foreground' : 'text-foreground/90'}`}>
                        {recipe.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {recipe.category && <span className="capitalize">{recipe.category}</span>}
                        {recipe.category && recipe.servings ? ' · ' : ''}
                        {recipe.servings ? `${recipe.servings} porc.` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-foreground/80">${currency(recipe.basePrice)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — form */}
        <div>
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 py-20 text-center">
              <Utensils className="mb-4 size-12 text-muted-foreground/20" />
              <p className="text-base font-medium text-muted-foreground">Seleccioná una receta o creá una nueva</p>
              <p className="mt-1 text-sm text-muted-foreground/50">Usá el botón de la izquierda para comenzar.</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Utensils className="size-4.5 text-accent" />
                  {isEditing ? 'Editar receta' : 'Nueva receta'}
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? 'Modificá los datos de la receta seleccionada.'
                    : 'Definí qué incluye y usalo en Nuevo Presupuesto.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {/* Row 1: Name + Category */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[65%_35%]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">Nombre *</label>
                      <Input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Ej. Asado familiar + sopa"
                        className="placeholder:text-muted-foreground/40 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">Categoría</label>
                      <Input
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        placeholder="Premium, almuerzo..."
                        className="placeholder:text-muted-foreground/40 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Row 2: Servings + Price + air */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[20%_30%_1fr]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">Porciones</label>
                      <Input
                        type="number" min="0"
                        value={form.servings}
                        onChange={e => setForm({ ...form, servings: e.target.value })}
                        className="transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">Precio base</label>
                      <Input
                        type="number" min="0"
                        value={form.basePrice}
                        onChange={e => setForm({ ...form, basePrice: e.target.value })}
                        className="transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Ej. Ideal para 10 personas, incluye bebida"
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground/40 flex min-h-16 w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs transition-all duration-200 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    />
                  </div>

                  {/* Tags section */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                      ¿Qué incluye este menú?
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Ej. Arroz de cerdo"
                        className="placeholder:text-muted-foreground/40 transition-all duration-200"
                      />
                      <Button type="button" size="sm" variant="outline" onClick={() => addTag(tagInput)} className="shrink-0 h-9">
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    {tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors">
                            {tag}
                            <button type="button" onClick={() => removeTag(i)} className="ml-0.5 rounded p-0.5 text-muted-foreground/50 hover:text-destructive transition-colors">
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 mt-1">Presioná Enter después de cada ítem.</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleEditSave} disabled={!form.name.trim()}>
                          <Check className="size-4" /> Guardar cambios
                        </Button>
                        <Button variant="ghost" onClick={resetForm}>
                          <X className="size-4" /> Cancelar
                        </Button>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" className="text-destructive/70 hover:text-destructive" onClick={() => { setRecipeToDelete(selectedRecipe); setDeleteConfirmOpen(true); }}>
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleCreate} disabled={!form.name.trim()}>
                        <Plus className="size-4" /> Guardar receta
                      </Button>
                    )}
                  </div>

                  {mutationError && (
                    <p className="text-sm text-destructive">{mutationError.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Eliminar receta"
        description={recipeToDelete ? `Se eliminará "${recipeToDelete.name}".` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteConfirmOpen(false); setRecipeToDelete(null); }}
      />
    </div>
  );
}
