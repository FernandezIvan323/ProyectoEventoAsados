import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Image,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import { AlertDialog } from '@/components/feedback/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { currency } from '@/lib/finance';
import { getEvents } from '@/services/eventsApi';
import { createMarketPurchase } from '@/services/marketPurchasesApi';
import { getProviders } from '@/services/providersApi';
import './NewEvent.css';

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

  const updateField = (field, value) => {
    onChange({ ...purchase, [field]: value });
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

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    try {
      const remainingSlots = Math.max(0, 6 - purchase.receiptPhotos.length);
      const selectedFiles = files.slice(0, remainingSlots);
      const photos = await Promise.all(selectedFiles.map(readFileAsDataUrl));
      onChange({ ...purchase, receiptPhotos: [...purchase.receiptPhotos, ...photos] });
    } catch {
      setBlockError('No se pudieron leer una o mas imagenes de la factura.');
    } finally {
      event.target.value = '';
    }
  };

  const removePhoto = (index) => {
    onChange({ ...purchase, receiptPhotos: purchase.receiptPhotos.filter((_, i) => i !== index) });
  };

  const inputClass = 'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Establecimiento / Tienda *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Ej. Supermercado, Carniceria"
              value={purchase.store}
              onChange={e => updateField('store', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Proveedor registrado</label>
            <select className={inputClass + ' appearance-none'} value={purchase.providerId} onChange={e => updateField('providerId', e.target.value)}>
              <option value="">Sin proveedor</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-border/40 pt-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Metodo de pago</label>
            <select className={inputClass + ' appearance-none'} value={purchase.paymentMethod} onChange={e => updateField('paymentMethod', e.target.value)}>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-border/40 pt-4 space-y-3">
          <h4 className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Productos</h4>
          <div className="rounded-xl border border-border/60 bg-black/20 p-4 shadow-inner">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="space-y-1.5 md:col-span-4">
                <label className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Producto</label>
                <input type="text" className={inputClass} placeholder="Ej. Carne" value={productDraft.name} onChange={e => setProductDraft({ ...productDraft, name: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Cantidad</label>
                <input type="number" min="0.01" step="0.01" className={inputClass} value={productDraft.quantity} onChange={e => setProductDraft({ ...productDraft, quantity: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Unidad</label>
                <select className={inputClass + ' appearance-none'} value={productDraft.unit} onChange={e => setProductDraft({ ...productDraft, unit: e.target.value })}>
                  {COMMON_UNITS.map(unit => (<option key={unit} value={unit}>{unit}</option>))}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Precio unit.</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={productDraft.unitPrice} onChange={e => setProductDraft({ ...productDraft, unitPrice: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="button" onClick={addItem} className="w-full" size="sm">
                  <Plus className="size-4" /> Agregar
                </Button>
              </div>
            </div>
          </div>

          {purchase.items.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {purchase.items.map(item => (
                <div key={item.localId} className="flex items-center justify-between gap-3 bg-black/25 border border-border/60 rounded-xl px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} x ${currency(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-foreground">${currency(itemSubtotal(item))}</span>
                    <button type="button" onClick={() => removeItem(item.localId)} className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-destructive/20 text-destructive/80 hover:text-destructive" title="Quitar producto">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/40 pt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Notas</label>
            <textarea className={inputClass + ' min-h-20 resize-y'} placeholder="Opcional" value={purchase.notes} onChange={e => updateField('notes', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-border/40 pt-4 space-y-3">
          <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Fotos de facturas</label>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-4 text-center transition-colors hover:border-primary/60 hover:bg-primary/5">
            <Image className="mb-2 size-6 text-primary" />
            <span className="text-sm font-semibold text-foreground">Subir fotos</span>
            <span className="mt-1 text-xs text-muted-foreground">Hasta 6 imagenes</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </label>
          {purchase.receiptPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {purchase.receiptPhotos.map((photo, photoIndex) => (
                <div key={photo.slice(0, 40)} className="relative overflow-hidden rounded-lg border border-border/60 bg-card">
                  <img src={photo} alt={`Factura ${photoIndex + 1}`} className="h-24 w-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 size-7" onClick={() => removePhoto(photoIndex)} title="Quitar foto">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="text-sm font-semibold text-muted-foreground">Subtotal compra #{index + 1}</span>
          <span className="text-lg font-bold text-foreground">${currency(totalAmount)}</span>
        </div>

        {blockError && <p className="text-sm text-destructive">{blockError}</p>}
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

  const handleSave = async () => {
    if (session.purchases.length === 0) {
      triggerAlert('Sin compras', 'Agrega al menos una compra para guardar.');
      return;
    }
    for (let i = 0; i < session.purchases.length; i++) {
      const p = session.purchases[i];
      if (!p.store.trim()) {
        triggerAlert('Informacion requerida', `Ingresa el establecimiento de la compra #${i + 1}.`);
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
        const payload = {
          purchasedAt: new Date(session.purchasedAt).toISOString(),
          store: p.store,
          eventId: session.eventId || null,
          providerId: p.providerId || null,
          paymentMethod: p.paymentMethod,
          notes: p.notes,
          receiptPhotos: p.receiptPhotos,
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
          <p className="text-muted-foreground">Carga varias compras a distintos proveedores en una sola sesion.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/weekly-expenses')} className="w-full sm:w-auto">
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </div>

      <div className="ne-grid">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="size-4.5 text-accent" />
                Sesion de compras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    value={session.purchasedAt}
                    onChange={e => setSession({ ...session, purchasedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Asociar a evento</label>
                  <select
                    className="w-full appearance-none rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    value={session.eventId}
                    onChange={e => setSession({ ...session, eventId: e.target.value })}
                  >
                    <option value="">Gasto general</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

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

        <div className="ne-summary-container">
          <Card className="sticky top-6 space-y-4">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-4.5 text-accent" />
                Resumen de sesion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Compras ({session.purchases.length})</p>
                {session.purchases.map((p, i) => {
                  const sub = p.items.reduce((s, it) => s + itemSubtotal(it), 0);
                  return (
                    <div key={p.localId} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">#{i + 1} {p.store || 'Sin tienda'}</p>
                        <p className="text-xs text-muted-foreground">{p.items.length} producto{p.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-sm font-medium text-foreground">${currency(sub)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
                <span className="text-base font-semibold text-foreground">Total sesion</span>
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
                <p className="text-center text-sm text-destructive">
                  {saveError.message}
                </p>
              )}
            </CardContent>
          </Card>
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
