import { Info, Trash2, TriangleAlert } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  note,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const getIconContainer = () => {
    switch (variant) {
      case 'destructive':
        return (
          <div className="rounded-full bg-red-500/10 p-3 text-red-500 shrink-0">
            <Trash2 className="h-6 w-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="rounded-full bg-amber-500/10 p-3 text-amber-500 shrink-0">
            <TriangleAlert className="h-6 w-6" />
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-blue-500/10 p-3 text-blue-400 shrink-0">
            <Info className="h-6 w-6" />
          </div>
        );
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-[#F8FAFC] transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer';
      case 'warning':
        return 'h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-[#F8FAFC] transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer';
      default:
        return 'h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-[#F8FAFC] transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer';
    }
  };

  const getConfirmButtonIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-4 w-4" />;
      case 'warning':
        return <TriangleAlert className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={onCancel}
      />
      
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: '#111726', border: '1px solid rgba(148,163,184,0.10)' }}>
        
        <div className="flex items-start gap-4">
          {getIconContainer()}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#F8FAFC' }}>
              {title}
            </h2>
            <p className="text-sm leading-relaxed font-normal" style={{ color: '#94A3B8' }}>
              {description}
            </p>
          </div>
        </div>

        {note && (
          <div className="mt-4 rounded-lg p-3 text-xs" style={{ background: '#1A233A', border: '1px solid rgba(148,163,184,0.10)', color: '#64748B' }}>
            {note}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button 
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-[#1A233A] focus:outline-none focus:ring-2 focus:ring-[#94A3B8] cursor-pointer"
            style={{ borderColor: 'rgba(148,163,184,0.10)', color: '#94A3B8' }}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className={getConfirmButtonStyles()}
          >
            {getConfirmButtonIcon()}
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}

export function AlertDialog({
  isOpen,
  title,
  description,
  buttonText = 'Entendido',
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150" style={{ background: '#111726', border: '1px solid rgba(148,163,184,0.10)' }}>
        
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-500/10 p-3 text-blue-400 shrink-0">
            <Info className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: '#F8FAFC' }}>
              {title}
            </h2>
            <p className="text-lg leading-relaxed font-normal" style={{ color: '#94A3B8' }}>
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg bg-primary px-6 py-2 text-base font-medium text-[#F8FAFC] transition-colors hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {buttonText}
          </button>
        </div>

      </div>
    </div>
  );
}