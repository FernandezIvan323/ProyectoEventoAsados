import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { setLocale } from '@/lib/i18n';

export default function LocaleSwitcher() {
  const { i18n } = useTranslation();
  const next = i18n.language?.startsWith('en') ? 'es' : 'en';
  const label = next.toUpperCase();

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      aria-label="Cambiar idioma"
      title="Cambiar idioma"
    >
      <Languages className="size-3.5" />
      {label}
    </button>
  );
}
