# 🥩 Proyecto Asados - Cotizador de Eventos

Una aplicación web Full-Stack diseñada para gestionar, calcular y almacenar presupuestos para eventos de asados. Permite crear un catálogo de insumos con precios base y generar cotizaciones precisas calculando el costo total, costos extra y margen de ganancia.

## 🚀 Tecnologías Utilizadas

Este proyecto está dividido en dos partes principales (Frontend y Backend):

**Frontend:**
- [React](https://reactjs.org/) (Framework de interfaz de usuario)
- [Vite](https://vitejs.dev/) (Empaquetador y entorno de desarrollo)
- CSS Vanilla (Estilos personalizados sin frameworks externos)
- [Lucide React](https://lucide.dev/) (Iconografía)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (Servidor API REST)
- [Prisma ORM](https://www.prisma.io/) (Manejo de base de datos)
- [SQLite](https://www.sqlite.org/) (Motor de base de datos local)

## 📁 Estructura del Proyecto

```text
ProyectoAsado/
├── backend/          # Servidor de Node.js, API y Base de datos SQLite
│   ├── prisma/       # Esquema de Prisma y migraciones
│   └── server.js     # Código principal del servidor Express
└── frontend/         # Aplicación web de React
    ├── src/          # Componentes, vistas y hojas de estilo
    └── package.json  # Dependencias del frontend
```

## 🛠️ Instalación y Uso Local

Para correr este proyecto en tu máquina local, necesitas abrir **dos terminales separadas**, una para el Backend y otra para el Frontend.

### 1. Iniciar el Backend (Servidor y Base de datos)
Abre una terminal, navega a la carpeta del proyecto y ejecuta:
```bash
cd backend
npm install
npm run dev
```
*(El servidor backend estará corriendo en el puerto 3000)*

### 2. Iniciar el Frontend (Interfaz Visual)
Abre otra terminal, navega a la carpeta del proyecto y ejecuta:
```bash
cd frontend
npm install
npm run dev
```
*(La aplicación web estará disponible típicamente en el puerto 5173)*

### 3. Explorar la Base de Datos (Opcional)
Si deseas ver y modificar las tablas de la base de datos visualmente a través de **Prisma Studio**, abre una tercera terminal y ejecuta:
```bash
cd backend
npx prisma studio
```
*(Prisma Studio se abrirá en tu navegador en el puerto 5555)*

## ✨ Funcionalidades Principales

- **Catálogo de Insumos:** Gestiona una lista de insumos base con unidades dinámicas y costos predeterminados.
- **Cotizador de Eventos:** Selecciona los insumos deseados, ajusta las cantidades y la aplicación calculará el costo en tiempo real.
- **Márgenes y Costos Extra:** Incluye costos adicionales (como transporte) y define tu porcentaje de ganancia esperado.
- **Historial de Eventos:** Visualiza todos los presupuestos guardados, edita su estado (Pendiente, Confirmado, Cancelado) y elimina registros antiguos.
- **Dashboard Financiero:** *(Próximamente)* Estadísticas y resúmenes de ganancias.
