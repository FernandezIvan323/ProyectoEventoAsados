# Migraciones Prisma

Este proyecto usa Prisma Migrate con SQLite. La carpeta `migrations/` contiene
**13 migraciones versionadas** que recrean la base de datos desde cero.

## Comandos utiles

```bash
# Crear nueva migracion (desarrollo)
npx prisma migrate dev --name <nombre-descriptivo>

# Aplicar migraciones pendientes (produccion / tests)
npx prisma migrate deploy

# Resetear la base de datos (solo desarrollo, borra datos)
npx prisma migrate reset

# Regenerar Prisma Client
npx prisma generate
```

## Estructura

```
prisma/
├── schema.prisma              # Modelo de datos actual
├── migrations/                # Historial versionado
│   ├── 20260519223741_init/                 # Modelos iniciales
│   ├── 20260519235208_add_catalog/          # Catalogo de insumos
│   ├── 20260522000000_add_market_purchases/ # Compras de mercado
│   ├── 20260522001000_add_market_purchase_vendor_receipts/  # Proveedor y fotos
│   ├── 20260522002000_operations_platform/  # Operaciones globales
│   ├── 20260522221505_add_notes/            # Sistema de notas
│   ├── 20260523000000_add_quote_templates/  # Plantillas de cotizacion
│   ├── 20260525163153_add_event_changelog/  # Historial de cambios de evento
│   ├── 60525164146_add_fixed_costs/         # Gastos fijos
│   ├── 20260527020052_add_notes_tags/       # Etiquetas de notas
│   ├── 20260602000000_operational_notes/    # Vinculacion y archivado
│   ├── 20260603164210_add_user_model/       # Modelo de usuario
│   ├── 20260603234724_add_note_recurrence_archive_changelog/  # Recurrencia
│   └── migration_lock.toml
└── dev.db                     # Base de datos local (NO se commitea)
```

## Reglas para nuevas migraciones

1. **Nunca edites una migracion que ya este aplicada** a una base de datos compartida.
   En su lugar, crea una nueva migracion que modifique el esquema.
2. **Probala en limpio** con `npx prisma migrate reset` antes de commitearla.
3. **Manten `schema.prisma` sincronizado** con la ultima migracion.
4. El archivo `dev.db` esta en `.gitignore` y nunca debe commitearse.
