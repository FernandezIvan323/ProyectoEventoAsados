import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Plus, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventory } from '@/hooks/useInventory';
import { applyRecipeToForm, applyTemplateToForm } from '@/lib/eventQuote';
import { currency } from '@/lib/finance';
import { calculateQuote, getSelectedQuoteItems } from '@/lib/quote';
import { getRecipes } from '@/services/recipesApi';
import { getQuoteTemplates } from '@/services/quoteTemplatesApi';
import './NewEvent.css';

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
          <p className="text-muted-foreground">Estimá el precio de un asado al instante. Si querés guardarlo, convertilo en evento.</p>
        </div>
      </div>

      <div className="ne-grid">
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
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Plantilla</label>
                  <div className="relative">
                    <select
                      value={selectedTemplateId}
                      onChange={e => handleTemplateSelect(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-card px-3.5 py-2.5 pr-8 text-sm text-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Sin plantilla</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">▾</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Receta / combo</label>
                  <div className="relative">
                    <select
                      value={selectedRecipeId}
                      onChange={e => handleRecipeSelect(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-card px-3.5 py-2.5 pr-8 text-sm text-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Sin receta</option>
                      {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">▾</div>
                  </div>
                </div>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Invitados</label>
                  <input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={e => setGuests(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Costos extra ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={extraCosts}
                    onChange={e => setExtraCosts(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Margen (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={profitMargin}
                    onChange={e => setProfitMargin(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                Cantidades de insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="insumos-grid">
                {inventory.map(item => (
                  <div key={item.id} className="flex flex-col gap-1.5 rounded-lg border border-border bg-secondary p-3">
                    <label className="flex justify-between text-[11px] font-medium text-muted-foreground">
                      <span>{item.name}</span>
                      <span>${currency(item.price)} / {item.unit}</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={selectedQuantities[item.id] || ''}
                      placeholder="0"
                      onChange={e => setSelectedQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="ne-summary-container">
          <Card className="sticky top-6 space-y-4">
            <CardHeader className="border-b border-[rgba(255,210,140,0.16)] pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4.5 text-accent" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Seleccioná insumos para ver el cálculo.</p>
              ) : (
                <div className="space-y-1.5 text-sm">
                  {summaryItems.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-muted-foreground">{item.name} × {item.quantity} {item.unit}</span>
                      <span className="font-medium text-foreground">${currency(item.totalCost)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo total</span>
                  <span className="font-medium text-foreground">${currency(quote.costTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extras</span>
                  <span className="font-medium text-foreground">${currency(Number(extraCosts || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ganancia ({profitMargin}%)</span>
                  <span className="font-medium text-accent">${currency(quote.profit)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>${currency(quote.finalPrice)}</span>
                </div>
                {Number(guests) > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Por persona</span>
                    <span className="font-semibold text-primary">${currency(quote.pricePerPerson)}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:brightness-110 active:brightness-95"
                onClick={handleCreateEvent}
                disabled={summaryItems.length === 0}
              >
                <Plus size={16} /> Convertir en evento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
