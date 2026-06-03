import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

const NewEvent = lazy(() => import('./pages/NewEvent'));
const History = lazy(() => import('./pages/History'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EditEvent = lazy(() => import('./pages/EditEvent'));
const ShoppingList = lazy(() => import('./pages/ShoppingList'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Finance = lazy(() => import('./pages/Finance'));
const WeeklyExpenses = lazy(() => import('./pages/WeeklyExpenses'));
const NewMarketPurchase = lazy(() => import('./pages/NewMarketPurchase'));
const Operations = lazy(() => import('./pages/Operations'));
const Recipes = lazy(() => import('./pages/Recipes'));
const Providers = lazy(() => import('./pages/Providers'));
const Notes = lazy(() => import('./pages/Notes'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Templates = lazy(() => import('./pages/Templates'));
const ExportData = lazy(() => import('./pages/ExportData'));
const QuickQuote = lazy(() => import('./pages/QuickQuote'));
const FixedCosts = lazy(() => import('./pages/FixedCosts'));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="new-event" element={<Suspense fallback={<PageLoader />}><NewEvent /></Suspense>} />
        <Route path="history" element={<Suspense fallback={<PageLoader />}><History /></Suspense>} />
        <Route path="history/:id" element={<Suspense fallback={<PageLoader />}><EventDetail /></Suspense>} />
        <Route path="history/:id/edit" element={<Suspense fallback={<PageLoader />}><EditEvent /></Suspense>} />
        <Route path="shopping-list" element={<Suspense fallback={<PageLoader />}><ShoppingList /></Suspense>} />
        <Route path="inventory" element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
        <Route path="recipes" element={<Suspense fallback={<PageLoader />}><Recipes /></Suspense>} />
        <Route path="providers" element={<Suspense fallback={<PageLoader />}><Providers /></Suspense>} />
        <Route path="weekly-expenses" element={<Suspense fallback={<PageLoader />}><WeeklyExpenses /></Suspense>} />
        <Route path="weekly-expenses/new" element={<Suspense fallback={<PageLoader />}><NewMarketPurchase /></Suspense>} />
        <Route path="operations" element={<Suspense fallback={<PageLoader />}><Operations /></Suspense>} />
        <Route path="finance" element={<Suspense fallback={<PageLoader />}><Finance /></Suspense>} />
        <Route path="notes" element={<Suspense fallback={<PageLoader />}><Notes /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<PageLoader />}><Calendar /></Suspense>} />
        <Route path="templates" element={<Suspense fallback={<PageLoader />}><Templates /></Suspense>} />
        <Route path="quick-quote" element={<Suspense fallback={<PageLoader />}><QuickQuote /></Suspense>} />
        <Route path="fixed-costs" element={<Suspense fallback={<PageLoader />}><FixedCosts /></Suspense>} />
        <Route path="export" element={<Suspense fallback={<PageLoader />}><ExportData /></Suspense>} />
      </Route>
    </Routes>
  );
}

export default App;
