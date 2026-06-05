import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator as CalcIcon, ReceiptText, Users, Save, Calendar, Beef, ChevronLeft, ChevronRight, PartyPopper, MapPin, Clock, ShoppingCart } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { AlertDialog } from '@/components/feedback/ConfirmDialog';
import { useInventory } from '@/hooks/useInventory';
import { currency } from '@/lib/finance';
import { applyRecipeToForm, applyTemplateToForm } from '@/lib/eventQuote';
import { calculateQuote, getSelectedQuoteItems, toEventInsumos } from '@/lib/quote';
import { createEvent } from '@/services/eventsApi';
import { getRecipes } from '@/services/recipesApi';
import { getQuoteTemplates } from '@/services/quoteTemplatesApi';
import './NewEvent.css';

const steps = [
  { num: 1, label: 'Información Base', icon: Calendar },
  { num: 2, label: 'Planificación Menú', icon: Beef },
  { num: 3, label: 'Finalización Evento', icon: PartyPopper },
];

const inputClass = 'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 pr-8 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

const selectClass = 'w-full appearance-none rounded-lg border border-border bg-card px-3.5 py-2.5 pr-8 text-sm text-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

export default function NewEvent() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { items: inventory, isLoading: isInventoryLoading, error: inventoryError, refresh: refreshInventory } = useInventory();
  const [saveError, setSaveError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [step, setStep] = useState(1);

  const triggerAlert = (title, desc) => {
    setAlertTitle(title);
    setAlertDescription(desc);
    setAlertOpen(true);
  };

  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [menuNotes, setMenuNotes] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [adults, setAdults] = useState('');
  const [kids, setKids] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [extraCosts, setExtraCosts] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState({});

  useEffect(() => {
    getRecipes()
      .then(data => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]));
  }, []);

  useEffect(() => {
    const recipeId = routerLocation.state?.recipeId;
    if (!recipeId || recipes.length === 0 || inventory.length === 0) return;
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setSelectedRecipeId(recipeId);
      applyRecipeToForm(recipe, inventory, {
        setRecipeName,
        setMenuNotes,
        setSelectedQuantities,
        setServings: (v) => setAdults(v),
      });
    }
  }, [routerLocation.state?.recipeId, recipes, inventory]);

  useEffect(() => {
    const templateId = routerLocation.state?.templateId;
    if (!templateId || inventory.length === 0) return;
    getQuoteTemplates()
      .then(all => {
        const template = (Array.isArray(all) ? all : []).find(t => t.id === templateId);
        if (template) {
          applyTemplateToForm(template, inventory, {
            setRecipeName,
            setMenuNotes,
            setSelectedQuantities,
            setExtraCosts,
            setProfitMargin,
            setServings: (v) => setAdults(v),
          });
        }
      })
      .catch(() => {});
  }, [routerLocation.state?.templateId, inventory]);

  const handleRecipeSelect = (recipeId) => {
    setSelectedRecipeId(recipeId);
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      setRecipeName('');
      return;
    }
    applyRecipeToForm(recipe, inventory, {
      setRecipeName,
      setMenuNotes,
      setSelectedQuantities,
      setServings: (v) => setAdults(v),
    });
  };

  const handleQuantityChange = (id, value) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [id]: Number(value)
    }));
  };

  const guests = Number(adults) + Number(kids);
  const summaryItems = getSelectedQuoteItems(inventory, selectedQuantities);
  const quote = calculateQuote({ items: summaryItems, extraCosts, profitMargin, guests });

  const handleSaveEvent = () => {
    if (!eventName || !eventDate) {
      triggerAlert(
        "Información requerida",
        "Por favor, ingresa al menos el Nombre del Evento y la Fecha para poder guardar el presupuesto."
      );
      return;
    }

    const formattedInsumos = toEventInsumos(summaryItems);

    const newEvent = {
      title: eventName,
      client: clientName,
      date: eventDate,
      time: eventTime,
      location: location,
      menuNotes,
      recipeName,
      guests,
      status: 'Pendiente',
      totalPrice: quote.finalPrice,
      insumos: formattedInsumos,
      extraCosts: Number(extraCosts),
      profitMargin: Number(profitMargin)
    };

    setSaveError(null);
    createEvent(newEvent)
    .then(() => navigate('/history'))
    .catch(err => {
      console.error("Error saving event:", err);
      setSaveError(err);
      triggerAlert("Error de guardado", "Hubo un error al intentar guardar el presupuesto.");
    });
  };

  const canGoNext = () => {
    if (step === 1) return eventName && eventDate && adults;
    if (step === 2) return true;
    return true;
  };

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                step === s.num
                  ? 'border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20'
                  : step > s.num
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-transparent text-muted-foreground'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-[11px] font-medium uppercase tracking-wider transition-colors duration-300 ${
                step === s.num ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-4 mb-6 h-px w-20 sm:w-32 transition-colors duration-300 ${
                step > s.num ? 'bg-primary/50' : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="ne-grid">
        <div className="space-y-4">
          {/* Step 1: Información Base */}
          {step === 1 && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Calendar className="size-4.5 text-accent" /> Información General
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Nombre del Evento *</label>
                    <input type="text" className={inputClass} placeholder="Ej. Cumpleaños Juan" value={eventName} onChange={e => setEventName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Contratante / Cliente</label>
                      <input type="text" className={inputClass} placeholder="Nombre del cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Lugar del Evento</label>
                      <input type="text" className={inputClass} placeholder="Ej. Salón Principal" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Fecha *</label>
                      <input type="date" className={inputClass} value={eventDate} onChange={e => setEventDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Hora</label>
                      <input type="time" className={inputClass} value={eventTime} onChange={e => setEventTime(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Users className="size-4.5 text-accent" /> Invitados
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Adultos</label>
                    <input type="number" className={inputClass} placeholder="Ej. 20" value={adults} onChange={e => setAdults(e.target.value)} min="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Niños (Comen mitad)</label>
                    <input type="number" className={inputClass} placeholder="Ej. 5" value={kids} onChange={e => setKids(e.target.value)} min="0" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Planificación Menú */}
          {step === 2 && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Beef className="size-4.5 text-accent" /> Menú y comidas especiales
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Receta / combo base</label>
                    <div className="relative">
                      <select className={selectClass} value={selectedRecipeId} onChange={e => handleRecipeSelect(e.target.value)}>
                        <option value="">Sin combo predefinido</option>
                        {recipes.map(recipe => (
                          <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">▾</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Solicitud especial del cliente</label>
                    <input type="text" className={inputClass} placeholder="Ej. sopa, arroz de cerdo, ensalada, yuca" value={menuNotes} onChange={e => setMenuNotes(e.target.value)} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground/60">Usa este campo para dejar claro que se cotizó: sopas, arroz de cerdo, guarniciones, bebidas u otras comidas fuera del asado base.</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
                  <ShoppingCart className="size-4.5 text-accent" /> Cantidades de Insumos
                </h2>
                <p className="mb-5 text-xs text-muted-foreground/60">Ingresa las cantidades para el evento basado en tu catálogo.</p>
                <div className="insumos-grid">
                  {isInventoryLoading ? (
                    <LoadingState title="Cargando insumos" />
                  ) : inventoryError ? (
                    <ErrorState description={inventoryError.message} onRetry={refreshInventory} />
                  ) : inventory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Primero debes agregar insumos en la sección "Insumos" del menú lateral.</p>
                  ) : (
                    inventory.map(item => (
                      <div key={item.id} className="flex flex-col gap-1.5 rounded-lg border border-[rgba(255,210,140,0.16)] bg-secondary p-3">
                        <label className="flex justify-between text-[11px] font-medium text-muted-foreground">
                          <span>{item.name}</span>
                          <span className="capitalize">({item.unit})</span>
                        </label>
                        <input
                          type="number" min="0" step="0.1"
                          value={selectedQuantities[item.id] || ''}
                          placeholder="0"
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Finalización Evento */}
          {step === 3 && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <CalcIcon className="size-4.5 text-accent" /> Finanzas Adicionales
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Costos Extra ($)</label>
                    <input type="number" className={inputClass} placeholder="Ej. 15000" value={extraCosts} onChange={e => setExtraCosts(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground/50">Mozos, traslado, etc.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Margen de Ganancia (%)</label>
                    <input type="number" className={inputClass} placeholder="Ej. 30" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                  <MapPin className="size-4.5 text-accent" /> Confirmar datos del evento
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between rounded-lg bg-secondary px-4 py-3">
                    <span className="text-muted-foreground/70">Evento</span>
                    <span className="font-medium text-foreground">{eventName || '—'}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-secondary px-4 py-3">
                    <span className="text-muted-foreground/70">Cliente</span>
                    <span className="font-medium text-foreground">{clientName || '—'}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-secondary px-4 py-3">
                    <span className="text-muted-foreground/70">Fecha</span>
                    <span className="font-medium text-foreground">{eventDate || '—'}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-secondary px-4 py-3">
                    <span className="text-muted-foreground/70">Invitados</span>
                    <span className="font-medium text-foreground">{guests || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground/80 transition-all duration-150 hover:border-[rgba(255,210,140,0.35)] hover:text-foreground">
                  <ChevronLeft className="size-4" /> Anterior
                </button>
              )}
            </div>
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canGoNext()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveEvent}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:brightness-110 active:brightness-95"
              >
                <Save className="size-4" /> Guardar Presupuesto
              </button>
            )}
          </div>
        </div>

        {/* Summary Panel */}
        <div className="ne-summary-container">
          <div className="sticky top-6 rounded-xl border border-border bg-card">
            <div className="border-b border-[rgba(255,210,140,0.16)] px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ReceiptText className="size-4.5 text-accent" /> Resumen en Vivo
              </h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="space-y-1">
                {summaryItems.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground/60">Añade insumos a la izquierda para ver el resumen.</p>
                ) : (
                  summaryItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground/70 truncate mr-2">{item.name}</span>
                      <span className="font-medium text-foreground/80 whitespace-nowrap">{item.quantity} {item.unit}</span>
                    </div>
                  ))
                )}
                {summaryItems.length > 5 && (
                  <p className="text-[10px] text-muted-foreground/50">+{summaryItems.length - 5} insumos más</p>
                )}
              </div>

              <div className="border-t border-[rgba(255,210,140,0.16)] pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingCart className="size-3.5 text-accent/70" /> Insumos
                  </div>
                  <span className="text-sm font-semibold text-foreground">${currency(quote.costTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalcIcon className="size-3.5 text-accent/70" /> Extras
                  </div>
                  <span className="text-sm font-semibold text-foreground">${currency(Number(extraCosts || 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5 text-accent/70" /> Ganancia ({profitMargin || 0}%)
                  </div>
                  <span className="text-sm font-semibold text-accent">${currency(quote.profit)}</span>
                </div>
              </div>

              <div className="rounded-lg bg-secondary border border-[rgba(255,210,140,0.16)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">Precio Sugerido</span>
                  <span className="text-xl font-bold text-foreground">${currency(quote.finalPrice)}</span>
                </div>
                {guests > 0 && (
                  <div className="flex items-center justify-between border-t border-[rgba(255,210,140,0.16)] pt-2">
                    <span className="text-[10px] text-muted-foreground/50">Por persona</span>
                    <span className="text-xs font-semibold text-primary">${currency(quote.pricePerPerson)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveEvent}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:brightness-110 active:brightness-95"
              >
                <Save className="mr-1.5 inline-block size-4" /> Guardar Presupuesto
              </button>
              {saveError && (
                <p className="text-center text-xs text-destructive">{saveError.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={alertOpen}
        title={alertTitle}
        description={alertDescription}
        buttonText="Entendido"
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
