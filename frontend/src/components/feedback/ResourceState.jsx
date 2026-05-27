import { AlertCircle, LoaderCircle, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function ResourceState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center', className)}>
      <Icon className="mb-3 size-8 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ title = 'Cargando datos', description = 'Estamos consultando la información del sistema.', skeletonRows }) {
  if (skeletonRows || skeletonRows === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          {title}
        </div>
        <LoadingSkeleton rows={skeletonRows ?? 4} />
      </div>
    );
  }

  return (
    <ResourceState
      icon={(props) => <LoaderCircle {...props} className={cn(props.className, 'animate-spin')} />}
      title={title}
      description={description}
    />
  );
}

export function ErrorState({ title = 'No se pudieron cargar los datos', description, onRetry }) {
  return (
    <ResourceState
      icon={AlertCircle}
      title={title}
      description={description || 'Revisa que el backend esté corriendo y vuelve a intentar.'}
      className="border-destructive/40 bg-destructive/5"
      action={onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    />
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <ResourceState
      icon={SearchX}
      title={title}
      description={description}
      action={action}
    />
  );
}
