import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Image,
  Plus,
  ReceiptText,
  Save,
  Store,
  Trash2,
  X,
} from 'lucide-react';

import { AlertDialog } from '@/components/feedback/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { currency } from '@/lib/finance';
import { getEvents } from '@/services/eventsApi';
import { createMarketPurchase } from '@/services/marketPurchasesApi';
import { getProviders } from '@/services/providersApi';

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'];
const COMMON_UNITS = ['unidad', 'kg', 'g', 'lb', 'litro', 'paquete', 'bandeja', 'caja'];

function toDatetimeInputValue(date = new Date()) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function createBlankItem() {
  return {
    localId: crypto.randomUUID(),
    name: '',
    quantity: '1',
    unit: 'unidad',
    unitPrice: '',
  };
}

function createBlankPurchase() {
  return {
    localId: crypto.randomUUID(),
    store: '',
    providerId: '',
    paymentMethod: 'Efectivo',
    notes: '',
    receiptPhotos: [],
    items: [],
  };
}

function itemSubtotal(item) {
  return Number(item.quantity || 0) * Number(item.unitPrice || 0);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function PurchaseBlock({ purchase, providers, index, total, onChange, onRemove }) {
  const [productDraft, setProductDraft] = useState(createBlankItem);
  const [blockError, setBlockError] = useState(null);

  const totalAmount = useMemo(
    () => purchase.items.reduce((sum, item) => sum + itemSubtotal(item), 0),
    [purchase.items],
  );

  const selectedProvider = useMemo(
    () => providers.find(p => p.id === purchase.providerId),
    [providers, purchase.providerId],
  );

  const updateField = (field, value) => {
    onChange({ ...purchase, [field]: value });
  };

  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    onChange({
      ...purchase,
      providerId,
      store: provider ? provider.name : purchase.store,
    });
  };

  const addItem = () => {
    if (!productDraft.name.trim() || Number(productDraft.quantity) <= 0) {
      setBlockError('Ingresa el nombre del producto y una cantidad mayor a cero.');
      return;
    }
    setBlockError(null);
    onChange({ ...purchase, items: [...purchase.items, { ...productDraft, localId: crypto.randomUUID() }] });
    setProductDraft(createBlankItem());
  };

  const removeItem = (localId) => {
    onChange({ ...purchase, items: purchase.items.filter(item => item.localId !== localId) });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ReceiptText className="size-4.5 text-accent" />
          Compra #{index + 1} <span className="text-muted-foreground font-normal text-sm">de {total}</span>
        </CardTitle>
        {total > 1 && (
          <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive hover:text-destructive" title="Quitar compra">
            <X className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <FormField label="Establecimiento / Tienda *" className="md:col-span-4">
            <Input
              value={purchase.store}
              onChange={e => updateField('store', e.target.value)}
              placeholder="Ej. Supermercado, Carnicería"
              disabled={!!selectedProvider}
            />
          </FormField>
          <FormField label="Proveedor registrado" className="md:col-span-2">
            <Select value={purchase.providerId} onChange={e => handleProviderChange(e.target.value)}>
              <option value="">Sin proveedor</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormField label="Método de pago" className="md:col-span-2">
            <Select value={purchase.paymentMethod} onChange={e => updateField('paymentMethod', e.target.value)}>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </Select>
          </FormField>
          {selectedProvider && (
            <FormField label="Teléfono del proveedor" className="md:col-span-2">
              <Input value={selectedProvider.phone || '—'} disabled className="text-muted-foreground" />
            </FormField>
          )}
        </div>

        <div className="border-t border-border/40 pt-4">
          <h4 className="mb-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <Store className="mr-1 inline-block size-3.5" /> Productos
          </h4>
          <div className="rounded-xl border border-border/60 bg-black/20 p-4 shadow-inner">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <FormField label="Producto" className="md:col-span-5">
                <Input
                  value={productDraft.name}
                  onChange={e => setProductDraft({ ...productDraft, name: e.target.value })}
                  placeholder="Ej. Carne"
                  className="placeholder:text-muted-foreground/40"
                />
              </FormField>
              <FormField label="Cant." className="md:col-span-2">
                <Input
                  type="number" min="0.01" step="0.01"
                  value={productDraft.quantity}
                  onChange={e => setProductDraft({ ...productDraft, quantity: e.target.value })}
                />
              </FormField>
              <FormField label="Unidad" className="md:col-span-2">
                <Select value={productDraft.unit} onChange={e => setProductDraft({ ...productDraft, unit: e.target.value })}>
                  {COMMON_UNITS.map(unit => (<option key={unit} value={unit}>{unit}</option>))}
                </Select>
              </FormField>
              <FormField label="Precio unit." className="md:col-span-2">
                <Input
                  type="number" min="0" step="0.01"
                  value={productDraft.unitPrice}
                  onChange={e => setProductDraft({ ...productDraft, unitPrice: e.target.value })}
                />
              </FormField>
              <div className="md:col-span-1 flex items-end">
                <Button type="button" onClick={addItem} className="w-full h-9 px-2" size="sm" title="Agregar producto">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            {blockError && <p className="mt-2 text-sm text-destructive">{blockError}</p>}
          </div>

          {purchase.items.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1">
              <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                <span className="flex-1">Producto</span>
                <span className="w-16 text-right">Cant.</span>
                <span className="w-20 text-right">Precio</span>
                <span className="w-20 text-right">Subtotal</span>
                <span className="w-8" />
              </div>
              {purchase.items.map(item => (
                <div key={item.localId} className="flex items-center gap-3 rounded-lg border border-border/60 bg-black/25 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                  </div>
                  <span className="w-16 text-right text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
                  <span className="w-20 text-right text-xs text-muted-foreground">${currency(item.unitPrice)}</span>
                  <span className="w-20 text-right text-sm font-bold text-foreground">${currency(itemSubtotal(item))}</span>
                  <button type="button" onClick={() => removeItem(item.localId)} className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-destructive/20 text-destructive/80 hover:text-destructive" title="Quitar producto">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="text-sm font-semibold text-muted-foreground">Subtotal compra #{index + 1}</span>
          <span className="text-lg font-bold text-foreground">${currency(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NewMarketPurchase() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [saveError, setSaveError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [session, setSession] = useState({
    purchasedAt: toDatetimeInputValue(),
    eventId: '',
    purchases: [createBlankPurchase()],
  });

  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionPhotos, setSessionPhotos] = useState([]);

  useEffect(() => {
    getEvents().then(data => setEvents(Array.isArray(data) ? data : [])).catch(() => setEvents([]));
    getProviders().then(data => setProviders(Array.isArray(data) ? data : [])).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    const draft = routerLocation.state?.purchaseDraft;
    if (!draft) return;
    setSession(prev => {
      const next = { ...prev };
      if (draft.eventId) next.eventId = draft.eventId;
      if (draft.items?.length) {
        next.purchases = [{
          ...createBlankPurchase(),
          items: draft.items.map(item => ({
            localId: crypto.randomUUID(),
            name: item.name || '',
            quantity: String(item.quantity ?? '1'),
            unit: item.unit || 'unidad',
            unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
          })),
          notes: draft.notes || '',
        }];
      }
      return next;
    });
  }, [routerLocation.state]);

  const grandTotal = useMemo(
    () => session.purchases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + itemSubtotal(i), 0), 0),
    [session.purchases],
  );

  const updatePurchase = (index, updated) => {
    setSession(prev => ({
      ...prev,
      purchases: prev.purchases.map((p, i) => (i === index ? updated : p)),
    }));
  };

  const addPurchaseBlock = () => {
    setSession(prev => ({
      ...prev,
      purchases: [...prev.purchases, createBlankPurchase()],
    }));
  };

  const removePurchaseBlock = (index) => {
    setSession(prev => ({
      ...prev,
      purchases: prev.purchases.filter((_, i) => i !== index),
    }));
  };

  const triggerAlert = (title, description) => {
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertOpen(true);
  };

  const handleSessionPhotosUpload = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    try {
      const remainingSlots = Math.max(0, 6 - sessionPhotos.length);
      const selectedFiles = files.slice(0, remainingSlots);
      const photos = await Promise.all(selectedFiles.map(readFileAsDataUrl));
      setSessionPhotos(prev => [...prev, ...photos]);
    } catch {
      triggerAlert('Error', 'No se pudieron leer una o más imágenes.');
    } finally {
      event.target.value = '';
    }
  };

  const removeSessionPhoto = (index) => {
    setSessionPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (session.purchases.length === 0) {
      triggerAlert('Sin compras', 'Agrega al menos una compra para guardar.');
      return;
    }
    for (let i = 0; i < session.purchases.length; i++) {
      const p = session.purchases[i];
      if (!p.store.trim()) {
        triggerAlert('Información requerida', `Ingresa el establecimiento de la compra #${i + 1}.`);
        return;
      }
      const validItems = p.items.filter(item => item.name.trim() && Number(item.quantity) > 0);
      if (validItems.length === 0) {
        triggerAlert('Productos requeridos', `Agrega al menos un producto a la compra #${i + 1}.`);
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      for (let i = 0; i < session.purchases.length; i++) {
        const p = session.purchases[i];
        const validItems = p.items.filter(item => item.name.trim() && Number(item.quantity) > 0);
        const allPhotos = [...p.receiptPhotos, ...sessionPhotos];
        const payload = {
          purchasedAt: new Date(session.purchasedAt).toISOString(),
          store: p.store,
          eventId: session.eventId || null,
          providerId: p.providerId || null,
          paymentMethod: p.paymentMethod,
          notes: sessionNotes || p.notes,
          receiptPhotos: allPhotos,
          items: validItems.map(({ name, quantity, unit, unitPrice }) => ({
            name,
            quantity: Number(quantity),
            unit,
            unitPrice: Number(unitPrice || 0),
          })),
        };
        await createMarketPurchase(payload);
      }
      navigate('/weekly-expenses');
    } catch (err) {
      setSaveError(err);
      triggerAlert('Error de guardado', 'Hubo un error al guardar las compras. Revisa los datos e intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Nueva compra</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Registrar Compras de Mercado</h1>
          <p className="text-muted-foreground">Carga varias compras a distintos proveedores en una sola sesión.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/weekly-expenses')} className="w-full sm:w-auto">
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr] items-start">
        {/* Left Panel: Session metadata + Save button */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="size-4.5 text-accent" />
                Datos de la sesión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Fecha y hora *">
                <Input
                  type="datetime-local"
                  value={session.purchasedAt}
                  onChange={e => setSession({ ...session, purchasedAt: e.target.value })}
                />
              </FormField>
              <FormField label="Asociar a evento">
                <Select value={session.eventId} onChange={e => setSession({ ...session, eventId: e.target.value })}>
                  <option value="">Gasto general</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </Select>
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-4.5 text-accent" />
                Notas y fotos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Notas generales">
                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="Notas opcionales para toda la sesión"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground/40 flex min-h-20 w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs transition-all duration-200 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </FormField>

              <div>
                <label className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  Fotos de facturas
                </label>
                <label className="mt-1.5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-4 text-center transition-colors hover:border-primary/60 hover:bg-primary/5">
                  <Image className="mb-2 size-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Subir fotos</span>
                  <span className="mt-1 text-xs text-muted-foreground">Hasta 6 imágenes</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleSessionPhotosUpload} />
                </label>
                {sessionPhotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {sessionPhotos.map((photo, photoIndex) => (
                      <div key={photo.slice(0, 40)} className="relative overflow-hidden rounded-lg border border-border/60 bg-card">
                        <img src={photo} alt={`Factura ${photoIndex + 1}`} className="h-20 w-full object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 size-6" onClick={() => removeSessionPhoto(photoIndex)} title="Quitar foto">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between border-t border-dashed border-border pt-1">
                <span className="text-base font-semibold text-foreground">Total sesión</span>
                <span className="text-lg font-bold text-foreground">${currency(grandTotal)}</span>
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="size-4" /> {isSaving ? 'Guardando...' : `Guardar ${session.purchases.length} compra${session.purchases.length !== 1 ? 's' : ''}`}
              </Button>
              {saveError && (
                <p className="text-center text-sm text-destructive">{saveError.message}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Purchase blocks */}
        <div className="space-y-4">
          {session.purchases.map((purchase, index) => (
            <PurchaseBlock
              key={purchase.localId}
              purchase={purchase}
              providers={providers}
              index={index}
              total={session.purchases.length}
              onChange={(updated) => updatePurchase(index, updated)}
              onRemove={() => removePurchaseBlock(index)}
            />
          ))}

          <Button variant="outline" onClick={addPurchaseBlock} className="w-full">
            <Plus className="size-4" /> Agregar otra compra
          </Button>
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
