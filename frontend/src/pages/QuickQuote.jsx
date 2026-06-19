import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Minus, Plus, ShoppingCart, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { applyRecipeToForm, applyTemplateToForm } from '@/lib/eventQuote';
import { currency } from '@/lib/finance';
import { calculateQuote, getSelectedQuoteItems } from '@/lib/quote';
import { getRecipes } from '@/services/recipesApi';
import { getQuoteTemplates } from '@/services/quoteTemplatesApi';

export default function QuickQuote() {
  const navigate = useNavigate();
  const { items: inventory } = useInventory();
  const [recipes, setRecipes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [guests, setGuests] = useState('');
  const [extraCosts, setExtraCosts] = useState('0');
  const [profitMargin, setProfitMargin] = useState('30');
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [recipeName, setRecipeName] = useState('');
  const [menuNotes, setMenuNotes] = useState('');

  useEffect(() => {
    getRecipes().then(d => setRecipes(Array.isArray(d) ? d : [])).catch(() => {});
    getQuoteTemplates().then(d => setTemplates(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleRecipeSelect = (id) => {
    setSelectedRecipeId(id);
    setSelectedTemplateId('');
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    applyRecipeToForm(recipe, inventory, {
      setRecipeName,
      setMenuNotes,
      setSelectedQuantities,
      setServings: v => setGuests(v),
    });
  };

  const handleTemplateSelect = (id) => {
    setSelectedTemplateId(id);
    setSelectedRecipeId('');
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    applyTemplateToForm(tpl, inventory, {
      setRecipeName,
      setMenuNotes,
      setSelectedQuantities,
      setExtraCosts,
      setProfitMargin,
      setServings: v => setGuests(v),
    });
  };

  const hasSelection = selectedRecipeId || selectedTemplateId;
  const summaryItems = getSelectedQuoteItems(inventory, selectedQuantities);
  const quote = calculateQuote({ items: summaryItems, extraCosts, profitMargin, guests });

  const handleCreateEvent = () => {
    const params = new URLSearchParams({
      guests: guests || '',
      extraCosts: extraCosts || '0',
      profitMargin: profitMargin || '30',
      recipeName: recipeName || '',
      menuNotes: menuNotes || '',
    });
    navigate(`/new-event?${params}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Cotizador rápido</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Calculá sin crear evento</h1>
          <p className="text-muted-foreground">Estimá el precio de tu evento al instante. Si querés guardarlo, convertilo en evento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] items-start">
        {/* Left column — selectors, params, insumos */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-4.5 text-accent" />
                Cargar desde plantilla o receta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Plantilla">
                  <Select value={selectedTemplateId} onChange={e => handleTemplateSelect(e.target.value)}>
                    <option value="">Sin plantilla</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="Receta / combo">
                  <Select value={selectedRecipeId} onChange={e => handleRecipeSelect(e.target.value)}>
                    <option value="">Sin receta</option>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4.5 text-accent" />
                Parámetros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <FormField label="Invitados" className="w-36">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setGuests(v => Math.max(1, Number(v || 0) - 1).toString())}
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <Input
                      type="number" min="1"
                      value={guests}
                      onChange={e => setGuests(e.target.value)}
                      placeholder="30"
                      className="text-center [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setGuests(v => (Number(v || 0) + 1).toString())}
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </FormField>
                <FormField label="Costos extra ($)" className="w-36">
                  <Input type="number" min="0" value={extraCosts} onChange={e => setExtraCosts(e.target.value)} placeholder="0" />
                </FormField>
                <FormField label="Margen (%)" className="w-28">
                  <Input type="number" min="0" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} placeholder="30" />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <ShoppingCart className="size-4.5 text-accent" />
                Cantidades de insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasSelection ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 py-14 text-center">
                  <ShoppingCart className="mb-4 size-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Aquí aparecerán los insumos necesarios.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    Seleccioná una receta o plantilla arriba para comenzar.
                  </p>
                </div>
              ) : inventory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Primero debés agregar insumos en la sección "Insumos" del menú lateral.
                </p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                  {inventory.map(item => (
                    <FormField key={item.id} label={`${item.name} — $${currency(item.price)} / ${item.unit}`}>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={selectedQuantities[item.id] || ''}
                        placeholder="0"
                        onChange={e => setSelectedQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      />
                    </FormField>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — summary (sticky) */}
        <div className="flex flex-col gap-4">
          <Card className="sticky top-6">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4.5 text-accent" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryItems.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">
                  Seleccioná insumos para ver el cálculo.
                </p>
              ) : (
                <div className="space-y-1.5 text-sm">
                  {summaryItems.slice(0, 6).map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-[#D1D5DB] truncate mr-2">{item.name} × {item.quantity} {item.unit}</span>
                      <span className="font-semibold text-white whitespace-nowrap">${currency(item.totalCost)}</span>
                    </div>
                  ))}
                  {summaryItems.length > 6 && (
                    <p className="text-xs text-[#6B7280]">+{summaryItems.length - 6} insumos más</p>
                  )}
                </div>
              )}

              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#D1D5DB]">Costo total</span>
                  <span className="font-bold text-white">${currency(quote.costTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#D1D5DB]">Extras</span>
                  <span className="font-bold text-white">${currency(Number(extraCosts || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#D1D5DB]">Ganancia ({profitMargin}%)</span>
                  <span className="font-bold text-[#f97316]">${currency(quote.profit)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold text-white">
                  <span>Total</span>
                  <span>${currency(quote.finalPrice)}</span>
                </div>
                {Number(guests) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#D1D5DB]">Por persona</span>
                    <span className="font-semibold text-[#f97316]">${currency(quote.pricePerPerson)}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleCreateEvent}
                disabled={summaryItems.length === 0}
              >
                <Plus size={16} /> {summaryItems.length > 0 ? 'Convertilo en evento' : 'Convertir en evento'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
