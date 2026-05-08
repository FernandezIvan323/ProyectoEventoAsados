import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewEvent from './pages/NewEvent';
import History from './pages/History';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="new-event" element={<NewEvent />} />
        <Route path="history" element={<History />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="finance" element={<Finance />} />
      </Route>
    </Routes>
  );
}

export default App;
