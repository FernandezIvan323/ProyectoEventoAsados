import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Beef, Calculator as CalcIcon, Calendar, ReceiptText, Save, Users } from 'lucide-react';

import { AlertDialog } from '@/components/feedback/ConfirmDialog';
import { ErrorState, LoadingState } from '@/components/feedback/ResourceState';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { getAllowedStatuses } from '@/lib/eventStatus';
import { applyRecipeToForm, insumosToSelectedQuantities } from '@/lib/eventQuote';
import { currency } from '@/lib/finance';
import { calculateQuote, getSelectedQuoteItems, toEventInsumos } from '@/lib/quote';
import { getEvent, updateEvent } from '@/services/eventsApi';
import { getRecipes } from '@/services/recipesApi';
import { getClients } from '@/services/clientsApi';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: inventory, isLoading: isInventoryLoading, error: inventoryError, refresh: refreshInventory } = useInventory();
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [eventStatus, setEventStatus] = useState('Pendiente');
  const [originalPrice, setOriginalPrice] = useState(null);
  const [originalStatus, setOriginalStatus] = useState('Pendiente');
  const [saveError, setSaveError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');

  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState([]);
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
  const [initialized, setInitialized] = useState(false);

  const triggerAlert = (title, desc) => {
    setAlertTitle(title);
    setAlertDescription(desc);
    setAlertOpen(true);
  };

  useEffect(() => {
    getRecipes().then(data => setRecipes(Array.isArray(data) ? data : [])).catch(() => setRecipes([]));
    getClients().then(data => setClients(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setIsEventLoading(true);
    setLoadError(null);
    getEvent(id)
      .then(event => {
        setEventStatus(event.status);
        setOriginalStatus(event.status);
        setOriginalPrice(event.totalPrice);
        setEventName(event.title || '');
        setClientName(event.client || '');
        setClientId(event.clientRef?.id || '');
        setEventDate(event.date || '');
        setEventTime(event.time || '');
        setLocation(event.location || '');
        setMenuNotes(event.menuNotes || '');
        setRecipeName(event.recipeName || '');
        setAdults(String(event.guests || ''));
        setKids('');
        setProfitMargin(String(event.profitMargin ?? ''));
        setExtraCosts(String(event.extraCosts ?? ''));
        setInitialized(false);
      })
      .catch(setLoadError)
      .finally(() => setIsEventLoading(false));
  }, [id]);

  useEffect(() => {
    if (initialized || isEventLoading || isInventoryLoading || inventory.length === 0) return;
    getEvent(id).then(event => {
      setSelectedQuantities(insumosToSelectedQuantities(event.insumos, inventory));
      const match = recipes.find(r => r.name === event.recipeName);
      if (match) setSelectedRecipeId(match.id);
      setInitialized(true);
    });
  }, [id, initialized, isEventLoading, isInventoryLoading, inventory, recipes]);

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

  const handleQuantityChange = (itemId, value) => {
    setSelectedQuantities(prev => ({ ...prev, [itemId]: Number(value) }));
  };

  const guests = Number(adults) + Number(kids);
  const summaryItems = getSelectedQuoteItems(inventory, selectedQuantities);
  const quote = calculateQuote({ items: summaryItems, extraCosts, profitMargin, guests });

  const handleSave = () => {
    if (!eventName || !eventDate) {
      triggerAlert('Información requerida', 'Nombre del evento y fecha son obligatorios.');
      return;
    }

    const LOCKED_STATUSES = ['Realizado', 'Cobrado'];
    const priceIsLocked = LOCKED_STATUSES.includes(originalStatus);

    setSaveError(null);
    updateEvent(id, {
      title: eventName,
      client: clientName,
      clientId: clientId || null,
      date: eventDate,
      time: eventTime,
      location,
      menuNotes,
      recipeName,
      guests,
      status: eventStatus,
      totalPrice: priceIsLocked ? originalPrice : quote.finalPrice,
      insumos: toEventInsumos(summaryItems),
      extraCosts: Number(extraCosts),
      profitMargin: Number(profitMargin),
    })
      .then(() => navigate(`/history/${id}`))
      .catch(err => {
        setSaveError(err);
        triggerAlert('Error al guardar', err.message || 'No se pudo actualizar el presupuesto.');
      });
  };

  if (isEventLoading || (isInventoryLoading && !initialized)) {
    return <LoadingState title="Cargando presupuesto" description="Preparando datos para editar." />;
  }
  if (loadError) {
    return <ErrorState description={loadError.message} onRetry={() => window.location.reload()} />;
  }
  if (inventoryError) {
    return <ErrorState description={inventoryError.message} onRetry={refreshInventory} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link to={`/history/${id}`}><ArrowLeft className="size-4" /> Volver al evento</Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Editar presupuesto</h1>
          <p className="text-sm text-muted-foreground">Modifica cantidades, costos y datos del evento. Los pagos registrados se conservan.</p>
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-6 items-start lg:grid-cols-1">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="size-4.5 text-accent" /> Información general
            </h2>
            <div className="space-y-4">
              <FormField label="Nombre del evento *">
                <Input value={eventName} onChange={e => setEventName(e.target.value)} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cliente">
                  <div>
                    <Input
                      value={clientName}
                      onChange={e => { setClientName(e.target.value); setClientId(''); }}
                      onSelect={e => {
                        const selected = clients.find(c => c.name === e.target.value);
                        if (selected) setClientId(selected.id);
                      }}
                      list="edit-client-list"
                    />
                    <datalist id="edit-client-list">
                      {clients.map(c => <option key={c.id} value={c.name} data-id={c.id} />)}
                    </datalist>
                  </div>
                </FormField>
                <FormField label="Lugar">
                  <Input value={location} onChange={e => setLocation(e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Fecha *">
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </FormField>
                <FormField label="Hora">
                  <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                </FormField>
                <FormField label="Estado">
                  <Select value={eventStatus} onChange={e => setEventStatus(e.target.value)}>
                    {getAllowedStatuses(originalStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Users className="size-4.5 text-accent" /> Invitados
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total invitados">
                <Input type="number" min="0" value={adults} onChange={e => setAdults(e.target.value)} />
              </FormField>
              <FormField label="Niños (opcional)">
                <Input type="number" min="0" value={kids} onChange={e => setKids(e.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Beef className="size-4.5 text-accent" /> Menú
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Receta / combo">
                <Select value={selectedRecipeId} onChange={e => handleRecipeSelect(e.target.value)}>
                  <option value="">Sin combo</option>
                  {recipes.map(recipe => (
                    <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Notas de menú">
                <Input value={menuNotes} onChange={e => setMenuNotes(e.target.value)} />
              </FormField>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Beef className="size-4.5 text-accent" /> Cantidades de insumos
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {inventory.map(item => (
                <FormField key={item.id} label={`${item.name} (${item.unit})`}>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={selectedQuantities[item.id] || ''}
                    placeholder="0"
                    onChange={e => handleQuantityChange(item.id, e.target.value)}
                  />
                </FormField>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <CalcIcon className="size-4.5 text-accent" /> Finanzas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Costos extra ($)">
                <Input type="number" value={extraCosts} onChange={e => setExtraCosts(e.target.value)} />
              </FormField>
              <FormField label="Margen (%)">
                <Input type="number" value={profitMargin} onChange={e => setProfitMargin(e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-4">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <ReceiptText className="size-4.5 text-accent" /> Resumen
            </h2>
            <div className="space-y-2">
              {summaryItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium text-foreground">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-4">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Total:</span>
                <span className="text-foreground">${currency(quote.finalPrice)}</span>
              </div>
            </div>
            <Button onClick={handleSave} className="mt-6 w-full">
              <Save className="size-4" /> Guardar cambios
            </Button>
            {saveError && <p className="mt-2 text-center text-sm text-destructive">{saveError.message}</p>}
          </div>
        </div>
      </div>

      <AlertDialog isOpen={alertOpen} title={alertTitle} description={alertDescription} buttonText="Entendido" onClose={() => setAlertOpen(false)} />
    </div>
  );
}
