# Changelog

Todos los cambios relevantes del proyecto se documentan aqui.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-06-04

### Agregado
- Backend API REST con Node.js, Express 5 y Prisma sobre SQLite.
- 13 modelos de datos: User, Event, Insumo, CatalogItem, MarketPurchase,
  MarketPurchaseItem, Provider, RecipeCombo, EventTask, EventPayment,
  StockMovement, Note, NoteChangeLog, QuoteTemplate, EventChangeLog, FixedCost.
- 17 paginas React (Dashboard, Calendario, Nuevo evento, Historial, Detalle,
  Edicion, Lista de compras, Insumos, Recetas, Proveedores, Gastos de mercado,
  Operaciones, Finanzas, Notas, Plantillas, Cotizador rapido, Gastos fijos,
  Exportar, Login, Register).
- Code splitting con React.lazy + Suspense (bundle principal: 399 kB).
- Autenticacion local con tokens HMAC-SHA256 y scrypt para hashing.
- Sistema de notas con recurrencia, etiquetas, archivado, prioridad y vinculacion.
- Sistema de busqueda global en /api/search.
- Exportacion de datos en JSON y CSV (eventos, compras, notas).
- Landing page estatica con secciones hero, nicho, funcionalidades,
  workflow, ventajas, stack, FAQ y CTA.
- Logging estructurado en backend con niveles y archivos rotados.
- Manejo global de errores HTTP (404 + 500 handler).
- Sistema de backup automatico del .db con rotacion configurable.
- Migraciones Prisma versionadas (13 migraciones).
- Tests unitarios (quote, finance, auth, logger) y de integracion del backend.
- Tests E2E con Playwright (smoke tests de la API y la landing).
- CI/CD con GitHub Actions (backend + frontend en cada push/PR).
- Internacionalizacion (i18n) con i18next y traducciones es/en.
- Interruptor de idioma en el sidebar.

### Seguridad
- Tokens firmados con HMAC-SHA256 y TTL de 7 dias.
- Passwords hasheados con scrypt + salt aleatorio de 16 bytes.
- Validacion de payloads en todos los endpoints.

## [0.9.0] - 2026-05-30

### Agregado
- Modulo de notas completo (cambio de status, prioridad, archivado).
- Recurrencia de notas (diaria, semanal, mensual).
- Changelog automatico para eventos y notas.

## [0.5.0] - 2026-05-20

### Agregado
- Sistema de cotizaciones con plantillas y cotizador rapido.
- Gestion de recetas y combos reutilizables.
- Modulo de finanzas con dashboard mensual y anual.

## [0.1.0] - 2026-05-19

### Agregado
- Version inicial del proyecto.
- Backend con Express, Prisma y modelos basicos (Event, Insumo, CatalogItem).
- Frontend con React, Vite y Tailwind.
