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
  Store,
  Trash2,
  UserRound,
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
  const [form, setForm] = useState({
    purchasedAt: toDatetimeInputValue(),
    store: '',
    vendorName: '',
    vendorPhone: '',
    eventId: '',
    providerId: '',
    paymentMethod: 'Efectivo',
    notes: '',
    receiptPhotos: [],
    items: [],
  });

  useEffect(() => {
    getEvents().then(data => setEvents(Array.isArray(data) ? data : [])).catch(() => setEvents([]));
    getProviders().then(data => setProviders(Array.isArray(data) ? data : [])).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    const draft = routerLocation.state?.purchaseDraft;
    if (!draft) return;
    setForm(prev => ({
      ...prev,
      eventId: draft.eventId || prev.eventId,
      notes: draft.notes || prev.notes,
      items: (draft.items || []).map(item => ({
        localId: crypto.randomUUID(),
        name: item.name || '',
        quantity: String(item.quantity ?? '1'),
        unit: item.unit || 'unidad',
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
      })),
    }));
  }, [routerLocation.state]);
  const [productDraft, setProductDraft] = useState(createBlankItem);

  const totalAmount = useMemo(
    () => form.items.reduce((total, item) => total + itemSubtotal(item), 0),
    [form.items],
  );

  const triggerAlert = (title, description) => {
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertOpen(true);
  };

  const updateProductDraft = (field, value) => {
    setProductDraft(current => ({ ...current, [field]: value }));
  };

  const addItem = () => {
    if (!productDraft.name.trim() || Number(productDraft.quantity) <= 0) {
      triggerAlert('Producto incompleto', 'Ingresa el nombre del producto y una cantidad mayor a cero.');
      return;
    }

    setForm(current => ({
      ...current,
      items: [...current.items, { ...productDraft, localId: crypto.randomUUID() }],
    }));
    setProductDraft(createBlankItem());
  };

  const removeItem = (localId) => {
    setForm(current => ({
      ...current,
      items: current.items.filter(item => item.localId !== localId),
    }));
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;

    try {
      const remainingSlots = Math.max(0, 6 - form.receiptPhotos.length);
      const selectedFiles = files.slice(0, remainingSlots);
      const photos = await Promise.all(selectedFiles.map(readFileAsDataUrl));
      setForm(current => ({ ...current, receiptPhotos: [...current.receiptPhotos, ...photos] }));
    } catch {
      triggerAlert('Error al cargar fotos', 'No se pudieron leer una o mas imagenes de la factura.');
    } finally {
      event.target.value = '';
    }
  };

  const removePhoto = (index) => {
    setForm(current => ({
      ...current,
      receiptPhotos: current.receiptPhotos.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.store.trim()) {
      triggerAlert('Informacion requerida', 'Ingresa el establecimiento o tienda de la compra.');
      return;
    }

    const validItems = form.items.filter(item => item.name.trim() && Number(item.quantity) > 0);
    if (!validItems.length) {
      triggerAlert('Productos requeridos', 'Agrega al menos un producto con nombre y cantidad.');
      return;
    }

    const payload = {
      purchasedAt: new Date(form.purchasedAt).toISOString(),
      store: form.store,
      vendorName: form.vendorName,
      vendorPhone: form.vendorPhone,
      eventId: form.eventId || null,
      providerId: form.providerId || null,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      receiptPhotos: form.receiptPhotos,
      items: validItems.map(({ name, quantity, unit, unitPrice }) => ({
        name,
        quantity: Number(quantity),
        unit,
        unitPrice: Number(unitPrice || 0),
      })),
    };

    try {
      setIsSaving(true);
      setSaveError(null);
      await createMarketPurchase(payload);
      navigate('/weekly-expenses');
    } catch (err) {
      setSaveError(err);
      triggerAlert('Error de guardado', 'Hubo un error al guardar la compra. Revisa los datos e intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Nueva compra</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Registrar Compra de Mercado</h1>
          <p className="text-muted-foreground">Guarda productos, vendedor, contacto, metodo de pago y fotos de facturas.</p>
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
                Informacion general
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.purchasedAt}
                    onChange={event => setForm({ ...form, purchasedAt: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Metodo de pago</label>
                  <select
                    className={inputClass + ' appearance-none'}
                    value={form.paymentMethod}
                    onChange={event => setForm({ ...form, paymentMethod: event.target.value })}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Establecimiento / Tienda *</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ej. Supermercado, Carniceria, Tienda local"
                  value={form.store}
                  onChange={event => setForm({ ...form, store: event.target.value })}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Asociar a evento</label>
                  <select className={inputClass + ' appearance-none'} value={form.eventId} onChange={event => setForm({ ...form, eventId: event.target.value })}>
                    <option value="">Gasto general</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Proveedor registrado</label>
                  <select className={inputClass + ' appearance-none'} value={form.providerId} onChange={event => setForm({ ...form, providerId: event.target.value })}>
                    <option value="">Sin proveedor</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4.5 text-accent" />
                Datos del vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Nombre del vendedor</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Nombre de quien vendio"
                    value={form.vendorName}
                    onChange={event => setForm({ ...form, vendorName: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Numero de celular</label>
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="Ej. 300 123 4567"
                    value={form.vendorPhone}
                    onChange={event => setForm({ ...form, vendorPhone: event.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-4.5 text-accent" />
                Productos / Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
                  <div className="space-y-1.5 md:col-span-4">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Producto</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Ej. Carne, arroz, verduras"
                      value={productDraft.name}
                      onChange={event => updateProductDraft('name', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Cantidad</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClass}
                      value={productDraft.quantity}
                      onChange={event => updateProductDraft('quantity', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Unidad</label>
                    <select
                      className={inputClass + ' appearance-none'}
                      value={productDraft.unit}
                      onChange={event => updateProductDraft('unit', event.target.value)}
                    >
                      {COMMON_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Precio unitario</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={productDraft.unitPrice}
                      onChange={event => updateProductDraft('unitPrice', event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" onClick={addItem} className="w-full">
                      <Plus className="size-4" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="size-4.5 text-accent" />
                Facturas y notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Fotos de facturas</label>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5">
                  <Image className="mb-3 size-7 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Subir fotos de facturas</span>
                  <span className="mt-1 text-xs text-muted-foreground">Hasta 6 imagenes por compra</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              {form.receiptPhotos.length > 0 && (
                <div className="mb-5 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.receiptPhotos.map((photo, index) => (
                    <div key={photo.slice(0, 40)} className="relative overflow-hidden rounded-lg border border-border/60 bg-card">
                      <img src={photo} alt={`Factura ${index + 1}`} className="h-32 w-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 size-8"
                        onClick={() => removePhoto(index)}
                        title="Quitar foto"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-1.5">
                <label className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Notas u observaciones</label>
                <textarea
                  className={inputClass + ' min-h-28 resize-y'}
                  placeholder="Detalles opcionales de la compra"
                  value={form.notes}
                  onChange={event => setForm({ ...form, notes: event.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="ne-summary-container">
          <Card className="sticky top-6 space-y-4">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-4.5 text-accent" />
                Resumen de compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Productos registrados</p>
                {form.items.filter(item => item.name.trim()).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Agrega productos a la izquierda para ver el resumen.
                  </p>
                ) : (
                  form.items.filter(item => item.name.trim()).map(item => (
                    <div key={item.localId} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit} x ${currency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-foreground">${currency(itemSubtotal(item))}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.localId)}
                          className="shrink-0 rounded p-1 transition-colors hover:bg-destructive/20"
                          title="Quitar producto"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Establecimiento:</span>
                  <span className="font-medium text-foreground">{form.store || 'Sin definir'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-medium text-foreground">{form.vendorName || 'Sin definir'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Facturas:</span>
                  <span className="font-medium text-foreground">{form.receiptPhotos.length}</span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
                  <span className="text-base font-semibold text-foreground">Total compra:</span>
                  <span className="text-lg font-bold text-foreground">${currency(totalAmount)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="size-4" /> {isSaving ? 'Guardando...' : 'Guardar compra'}
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
