# Proyecto Asados (AsamApp)

Aplicación web full-stack para gestionar eventos gastronómicos: cotización, presupuestos, inventario, compras de mercado, finanzas, checklist operativo, notas, multi-usuario con roles y notificaciones. Enfocada en catering, asadores y emprendedores gastronómicos.

![License](https://img.shields.io/github/license/FernandezIvan323/ProyectoEventoAsados?style=flat-square)
![Version](https://img.shields.io/github/v/release/FernandezIvan323/ProyectoEventoAsados?style=flat-square)
![CI](https://img.shields.io/github/actions/workflow/status/FernandezIvan323/ProyectoEventoAsados/ci.yml?style=flat-square&label=CI)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Language](https://img.shields.io/github/languages/top/FernandezIvan323/ProyectoEventoAsados?style=flat-square)
![Issues](https://img.shields.io/github/issues/FernandezIvan323/ProyectoEventoAsados?style=flat-square)
![Stars](https://img.shields.io/github/stars/FernandezIvan323/ProyectoEventoAsados?style=flat-square)

> **Estado:** v2.1.0 — empleados, clientes, multi-tenant.
> Ver [`CHANGELOG.md`](./CHANGELOG.md) para historial completo de versiones.


## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Recharts, i18next, framer-motion, Lucide React |
| Backend | Node.js, Express 5, Prisma 5, JWT-like HMAC tokens, scrypt |
| Base de datos | SQLite (local) con FTS5 (full-text search) |
| Landing page | HTML + CSS + JS vanilla (sin framework) |
| Documentación API | OpenAPI 3.0 + Swagger UI (`/api/docs`) |
| CI/CD | GitHub Actions |
| Tests | node:test (backend, 67 tests) + Playwright (E2E) |
| PWA | manifest.json + service worker (offline, instalable) |

## Estructura

```text
ProyectoAsado/
├── backend/                  # API REST + Prisma + SQLite
│   ├── prisma/               # Schema y 17 migraciones versionadas
│   ├── scripts/              # Utilidades (backup, reset-password, migrate-to-mtr)
│   ├── auth.js               # Login, registro, tokens HMAC
│   ├── permissions.js        # Sistema de roles (admin/editor/viewer)
│   ├── alerts.js             # Generador de alertas in-app (6 tipos)
│   ├── search.js             # Busqueda FTS5 con fallback a LIKE
│   ├── logger.js             # Logging estructurado JSON + handlers
│   ├── validation.js         # Validadores de payloads
│   ├── shoppingList.js       # Lista de compras consolidada
│   ├── exportData.js         # Exportadores CSV
│   ├── isolation.test.js     # Tests de aislamiento multi-tenant
│   └── server.js             # Servidor Express (~1670 lineas)
├── frontend/                 # SPA React
│   ├── src/
│   │   ├── pages/            # 19 paginas con lazy loading
│   │   ├── components/       # Layout, AuthGate, CommandPalette, FormField, Select, Toast
│   │   ├── hooks/            # useEvents, useInventory, useMarketPurchases
│   │   ├── services/         # 12 modulos API (incl. clientsApi, employeesApi)
│   │   └── lib/              # utils, finance, quote, i18n, locales, validators
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
├── LICENSE                   # MIT
└── README.md
```

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

### Personas
- **Clientes** — agenda completa con nombre, teléfono, email y notas. Vista de eventos asociados a cada cliente. Búsqueda y vinculación desde los formularios de evento.
- **Empleados** — gestión de personal con rol (Cocinero, Ayudante, Mesero, Chofer, Otro), tarifa por hora, contacto. Registro de actividades con horas trabajadas, tipo de pago (Por hora / Por evento / Fijo) y cálculo automático de costo. Vinculación a eventos.

### Operaciones
- **Alertas inteligentes in-app** — 6 tipos de alerta (proveedores sin uso, stock bajo, eventos próximos, compras sin evento, presupuestos sin margen, eventos sin precio) con severidades info/warn/error
- **Notas y recordatorios** — checklist, prioridades, tipos, fechas, etiquetas, recurrencia
- **Busqueda global full-text (FTS5)** — indexa eventos por titulo/cliente/lugar/menu
- **Historial de cambios** — cada modificacion queda registrada con fecha y valor anterior
- **Exportar datos** — JSON o CSV para respaldo o analisis externo

### Multi-usuario y roles
- **Multi-tenant (v2.0.0)**: cada usuario ve solo sus propios datos (eventos, notas, inventario, compras, etc.); el admin ve todo
- **Aislamiento verificado**: tests de integración que confirman que el Usuario A no puede acceder, modificar ni eliminar datos del Usuario B
- **Roles**: `admin` (todo), `editor` (CRUD sin borrar usuarios), `viewer` (solo lectura)
- **JWT-like tokens** firmados con HMAC-SHA256, TTL 7 dias
- **Passwords** hasheados con scrypt + salt aleatorio de 16 bytes
- **Endpoints protegidos** con middleware `requirePermission()`
- **UI de gestion de usuarios** (solo admin): crear, cambiar rol, activar/desactivar, eliminar

## Caracteristicas tecnicas

### Code Splitting
La app React usa `React.lazy` + `Suspense` para carga diferida de las 19 paginas, reduciendo el bundle principal de 1,181 kB a 399 kB.

### PWA (Progressive Web App)
- `manifest.json` con iconos, shortcuts (Nuevo evento, Cotizador, Notas) y theme color naranja
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

### ⚠️ Importante: AUTH_SECRET en producción

Por seguridad, el backend **rechaza arrancar en producción** si `AUTH_SECRET` no está definido o sigue siendo el valor por defecto (`asamapp-dev-secret-change-me`). En desarrollo se permite con un warning en consola.

Generar un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Y exportarlo antes de iniciar el server:

```bash
export AUTH_SECRET=<el-secreto-generado>
export NODE_ENV=production
npm start
```

### Primer usuario
Al no haber usuarios, el primer registro se crea como `admin` automaticamente. Registros adicionales quedan deshabilitados (debe hacerlo un admin desde la UI o via API).

### Migración multi-tenant (v1.x → v2.0.0)
```bash
cd backend
node scripts/migrate-to-mtr.js
```
El script:
1. Crea un backup automático de la base de datos
2. Busca el primer admin activo como "dueño fundador"
3. Asigna todos los registros huérfanos (`ownerId IS NULL`) a ese admin
4. Es **idempotente**: si se ejecuta múltiples veces, solo procesa registros aún no asignados

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
| Employees | `GET/POST /api/employees` · `PUT/DELETE /api/employees/:id` · `GET/POST /api/employees/:id/activities` · `PUT/DELETE /api/activities/:activityId` |
| Clients | `GET/POST /api/clients` · `PUT/DELETE /api/clients/:id` (existente desde v1.x) |
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
# Backend - todos los tests (unitarios + integracion + aislamiento multi-tenant)
cd backend && npm test

# Backend - tests unitarios (validacion, auth, logger, quote, shoppingList, permisos, busqueda, alertas)
cd backend && npm run test:unit

# Backend - tests de integracion + aislamiento multi-tenant (con DB temporal)
cd backend && npm run test:integration

# E2E con Playwright (smoke tests de la API y la landing)
cd frontend && npm run test:e2e:install   # Solo la primera vez
cd frontend && npm run test:e2e
```

## CI/CD

GitHub Actions ejecuta en cada push/PR a `main`, `master` o `develop`:

- **Backend**: syntax check (parse only) de 11 archivos, prisma generate, tests unit + integration + aislamiento (67 tests)
- **Frontend**: lint (bloqueante), build

Ver `.github/workflows/ci.yml`.

## Variables de entorno

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Ruta del SQLite |
| `PORT` | `3000` | Puerto del API |
| `CORS_ORIGIN` | (vacio) | Origenes CORS permitidos (CSV) |
| `SERVE_FRONTEND` | `false` | Servir `frontend/dist` + landing desde el API |
| `AUTH_ENABLED` | `true` | Habilitar autenticacion |
| `AUTH_SECRET` | `asamapp-dev-secret-change-me` | Secreto para firmar tokens. ⚠️ **Requerido en producción** |
| `NODE_ENV` | (vacio) | `production` activa validación estricta de `AUTH_SECRET` |
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

MIT — ver [`LICENSE`](./LICENSE).

## Estadisticas del proyecto

- **Backend**: ~1670 líneas de código, 67 tests (todos pasando)
- **Frontend**: 19 páginas con lazy loading, 12 servicios API
- **Base de datos**: 17 modelos Prisma, 17 migraciones versionadas
- **Cobertura de tests**: validación, auth, logger, permisos (12 tests), búsqueda FTS5 (8 tests), alertas (5 tests), integración multi-tenant (10 tests)
