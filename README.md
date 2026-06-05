# Proyecto Asados (AsamApp)

Aplicación web full-stack para gestionar eventos gastronómicos: cotización, presupuestos, inventario, compras de mercado, finanzas, checklist operativo, notas, multi-usuario con roles y notificaciones. Enfocada en catering, asadores y emprendedores gastronómicos.

> **Estado:** v1.0.0 — production-ready local.
> Ver [`CHANGELOG.md`](./CHANGELOG.md) para historial completo de versiones.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Recharts, i18next, framer-motion |
| Backend | Node.js, Express 5, Prisma 5, JWT-like HMAC tokens, scrypt |
| Base de datos | SQLite (local) con FTS5 (full-text search) |
| Landing page | HTML + CSS + JS vanilla (sin framework) |
| Documentación API | OpenAPI 3.0 + Swagger UI (`/api/docs`) |
| CI/CD | GitHub Actions |
| Tests | Vitest (frontend) + node:test (backend) + Playwright (E2E) |
| PWA | manifest.json + service worker (offline) |

## Estructura

```text
ProyectoAsado/
├── backend/                  # API REST + Prisma + SQLite
│   ├── prisma/               # Schema y 14 migraciones versionadas
│   ├── scripts/              # Utilidades (backup, reset-password)
│   ├── auth.js               # Login, registro, tokens HMAC
│   ├── permissions.js        # Sistema de roles (admin/editor/viewer)
│   ├── alerts.js             # Generador de alertas in-app
│   ├── search.js             # Busqueda FTS5 con fallback a LIKE
│   ├── logger.js             # Logging estructurado JSON + handlers
│   ├── validation.js         # Validadores de payloads
│   ├── shoppingList.js       # Lista de compras consolidada
│   ├── exportData.js         # Exportadores CSV
│   └── server.js             # Servidor Express (1392 lineas)
├── frontend/                 # SPA React
│   ├── src/
│   │   ├── pages/            # 17 paginas con lazy loading
│   │   ├── components/       # Layout, AuthGate, CommandPalette, etc.
│   │   ├── hooks/            # useEvents, useInventory, useMarketPurchases
│   │   ├── services/         # 10 modulos API
│   │   └── lib/              # utils, finance, quote, i18n, locales
│   ├── e2e/                  # Tests E2E con Playwright
│   ├── public/               # PWA manifest + service worker
│   └── vite.config.js
├── landing/                  # Landing page estatica
│   ├── index.html            # Hero, nicho, features, workflow, FAQ
│   ├── features.html         # Detalle completo de las 18 funciones
│   └── styles.css
├── docs/                     # Documentacion tecnica
│   └── openapi.yaml          # Especificacion OpenAPI 3.0
├── .github/workflows/        # CI/CD (backend + frontend)
├── CHANGELOG.md              # Historial versionado
├── LICENSE                   # ISC
└── README.md
```

## Inicio rapido

```bash
# 1. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# 2. Aplicar migraciones
cd ../backend && npx prisma migrate deploy

# 3. Iniciar aplicacion (Windows)
cd .. && INICIAR.bat

# O manualmente:
# Terminal 1: cd backend && node server.js
# Terminal 2: cd frontend && npm run dev
```

URLs:
- Landing: http://localhost:5173/
- App: http://localhost:5173/app/
- API: http://localhost:3000/
- Docs: http://localhost:3000/api/docs

## Funcionalidades

### Gestion de eventos
- **Cotizador** — calcula precio automatico con insumos del catalogo, margen y costos extra
- **Cotizador rapido** — calcula precio al instante sin crear evento, convertible despues
- **Historial de eventos** — workflow completo: Cotizado → Aprobado → Compras → Preparacion → Cobrado
- **Plantillas de cotizacion** — menus predefinidos con precios y margenes
- **Calendario** — vista mensual de todos los eventos
- **Fotos del evento** — sube hasta 5MB por imagen (JPEG/PNG/WebP/GIF) con captions

### Compras e inventario
- **Lista de compras** — consolida insumos de todos los eventos aprobados
- **Gastos de mercado** — registra compras con items, proveedor, metodo de pago y fotos
- **Inventario con stock** — movimientos de entrada, salida y ajuste con stock minimo
- **Proveedores** — agenda con historial de compras
- **Recetas y combos** — combinaciones reutilizables de insumos
- **Gastos fijos** — costos recurrentes (mensual/anual/por evento)

### Finanzas
- **Registro de pagos** — señas y pagos finales con calculo automatico de saldo
- **Dashboard financiero** — cotizado vs gastado vs cobrado por evento y global
- **Rentabilidad real** — ganancia neta por evento considerando todos los gastos
- **Reportes mensuales/anuales** — graficos con Recharts

### Operaciones
- **Alertas inteligentes in-app** — bell icon en la topbar con badge, popover, descarte
- **Notas y recordatorios** — checklist, prioridades, tipos, fechas, etiquetas, recurrencia
- **Busqueda global full-text (FTS5)** — indexa eventos por titulo/cliente/lugar/menu
- **Historial de cambios** — cada modificacion queda registrada con fecha y valor anterior
- **Exportar datos** — JSON o CSV para respaldo o analisis externo

### Multi-usuario y roles
- **Roles**: `admin` (todo), `editor` (CRUD sin borrar usuarios), `viewer` (solo lectura)
- **JWT-like tokens** firmados con HMAC-SHA256, TTL 7 dias
- **Passwords** hasheados con scrypt + salt aleatorio de 16 bytes
- **Endpoints protegidos** con middleware `requirePermission()`
- **UI de gestion de usuarios** (solo admin): crear, cambiar rol, activar/desactivar, eliminar

## Caracteristicas tecnicas

### Code Splitting
La app React usa `React.lazy` + `Suspense` para carga diferida de las 17 paginas, reduciendo el bundle principal de 1,181 kB a 399 kB.

### PWA (Progressive Web App)
- `manifest.json` con iconos, shortcuts (Nuevo evento, Cotizador, Notas) y theme color verde
- Service worker (`sw.js`) con estrategia network-first para API y stale-while-revalidate para assets
- Instalable en mobile y desktop, soporta uso offline
- Solo se registra en produccion (`import.meta.env.PROD`)

### Internacionalizacion (i18n)
- `i18next` con auto-deteccion del idioma del navegador
- Persistencia en `localStorage` (`asamapp_locale`)
- Idiomas incluidos: Español (default) y English
- Switcher visible en la topbar (boton ES/EN)
- Claves estructuradas: `nav.*`, `common.*`, `auth.*`, `event.*`, `finance.*`, `inventory.*`

### Logging estructurado
- JSON en stdout + archivos en `backend/logs/{app,error}.log`
- Niveles: `debug | info | warn | error` (configurable con `LOG_LEVEL`)
- Cada request HTTP se loguea con method, path, status, duracion, IP
- Manejo global de errores: 404 handler + 500 handler con sanitizacion

### Sistema de backup
- Script standalone: `npm run backup` → copia el `.db` a `backups/database/`
- Rotacion automatica: conserva los ultimos 30 (configurable con `BACKUP_KEEP`)
- Scheduler opcional: `npm run backup:schedule` ejecuta cada 24h
- Formato: `asamapp-YYYYMMDD-HHMMSS.db`

### Busqueda full-text (FTS5)
- Tabla virtual SQLite FTS5 sincronizada por triggers
- Busca en eventos (titulo, cliente, lugar, menu)
- Fallback automatico a `LIKE` si FTS5 no esta disponible
- Tokenizacion con wildcards para busqueda incremental

### Documentacion OpenAPI
- Especificacion completa en `docs/openapi.yaml` (OpenAPI 3.0)
- Swagger UI interactivo en `http://localhost:3000/api/docs`
- Schemas: Event, User, Alert, Error
- 30+ endpoints documentados con parametros, request bodies y responses

## Autenticacion y gestion de usuarios

### Primer usuario
Al no haber usuarios, el primer registro se crea como `admin` automaticamente. Registros adicionales quedan deshabilitados (debe hacerlo un admin desde la UI o via API).

### Endpoints de auth
```bash
# Registrar primer usuario (solo si no hay usuarios)
POST /api/auth/register  { email, username, password }

# Login
POST /api/auth/login     { username, password }  -> { token, user }

# Datos del usuario actual
GET  /api/auth/me        (Authorization: Bearer <token>)
```

### Gestion de usuarios (solo admin)
```bash
GET    /api/users          # Listar usuarios
POST   /api/users          # Crear usuario (rol opcional, default: viewer)
PUT    /api/users/:id      # Cambiar rol o activar/desactivar
DELETE /api/users/:id      # Eliminar usuario (no a si mismo)
```

### Reset de contraseña (CLI)
```bash
cd backend
npm run reset-password -- <username> <nueva-password> [rol]
# Ejemplo:
npm run reset-password -- Ivanferpe MiPass123 admin
```

## API Endpoints principales

| Recurso | Endpoints |
|---------|-----------|
| Auth | `POST /api/auth/{login,register}` · `GET /api/auth/{config,me}` |
| Events | `GET/POST /api/events` · `GET/PUT/DELETE /api/events/:id` · `POST /api/events/:id/duplicate` · `GET /api/events/:id/financials` · `POST /api/events/:id/payments` · `GET/POST /api/events/:id/photos` · `DELETE /api/events/:eventId/photos/:photoId` |
| Tasks | `POST /api/events/:id/tasks` · `PUT /api/events/:eventId/tasks/:taskId` |
| Inventory | `GET/POST /api/inventory` · `PUT/DELETE /api/inventory/:id` · `GET/POST /api/inventory/:id/stock-movements` |
| Providers | `GET/POST /api/providers` · `PUT/DELETE /api/providers/:id` |
| Recipes | `GET/POST /api/recipes` · `PUT/DELETE /api/recipes/:id` |
| Templates | `GET/POST /api/quote-templates` · `PUT/DELETE /api/quote-templates/:id` |
| Purchases | `GET/POST /api/market-purchases` · `PUT/DELETE /api/market-purchases/:id` |
| Notes | `GET/POST /api/notes` · `GET/PATCH/DELETE /api/notes/:id` · `POST /api/notes/:id/archive` · `POST /api/notes/:id/restore` · `GET /api/notes-export` |
| Fixed costs | `GET/POST /api/fixed-costs` · `PUT/DELETE /api/fixed-costs/:id` |
| Operations | `GET /api/operations/summary` · `GET /api/alerts` |
| Other | `GET /api/shopping-list` · `GET /api/search` · `GET /api/export` · `GET /api/docs` |

## Tests

```bash
# Backend - tests unitarios (validacion, auth, logger, quote, shoppingList)
cd backend && npm run test:unit

# Backend - tests de integracion (con DB temporal)
cd backend && npm run test:integration

# Frontend - tests unitarios (quote, finance, i18n)
cd frontend && npm test

# E2E con Playwright (smoke tests de la API y la landing)
cd frontend && npm run test:e2e:install   # Solo la primera vez
cd frontend && npm run test:e2e
```

## CI/CD

GitHub Actions ejecuta en cada push/PR a `main`, `master` o `develop`:

- **Backend**: syntax check, prisma generate, tests unit + integration
- **Frontend**: lint, build, tests

Ver `.github/workflows/ci.yml`.

## Variables de entorno

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Ruta del SQLite |
| `PORT` | `3000` | Puerto del API |
| `CORS_ORIGIN` | (vacio) | Origenes CORS permitidos (CSV) |
| `SERVE_FRONTEND` | `false` | Servir `frontend/dist` + landing desde el API |
| `AUTH_ENABLED` | `true` | Habilitar autenticacion |
| `AUTH_SECRET` | `asamapp-dev-secret-change-me` | Secreto para firmar tokens |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |
| `LOG_TO_FILE` | `true` | Escribir logs a `backend/logs/` |
| `BACKUP_DIR` | `../backups/database` | Carpeta de backups |
| `BACKUP_KEEP` | `30` | Cantidad maxima de backups a conservar |
| `BACKUP_INTERVAL_HOURS` | `24` | Intervalo del scheduler |

## Scripts utiles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia backend con nodemon (auto-reload) |
| `npm start` | Inicia backend en modo produccion |
| `npm test` | Corre todos los tests del backend |
| `npm run backup` | Hace un backup del .db |
| `npm run reset-password -- <user> <pass> [rol]` | Resetea la contraseña de un usuario |

## Licencia

ISC — ver [`LICENSE`](./LICENSE).
