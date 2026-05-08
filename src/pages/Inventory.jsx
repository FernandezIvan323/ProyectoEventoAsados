import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Pencil, Check } from 'lucide-react';
import './Inventory.css';

export default function Inventory() {
  const [items, setItems] = useState([]);
  
  // Estado para nuevo insumo
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newPrice, setNewPrice] = useState('');

  // Estado para edición
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', unit: '', price: '' });

  const UNITS = ['kg', 'bolsa', 'botella', 'porción', 'platos', 'vasos', 'unidad'];

  useEffect(() => {
    const saved = localStorage.getItem('asado_inventory');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems([]);
    }
  }, []);

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, unit: item.unit, price: item.price });
  };

  const handleEditSave = (id) => {
    setItems(items.map(item => item.id === id ? { 
      ...item, 
      name: editForm.name, 
      unit: editForm.unit, 
      price: Number(editForm.price) 
    } : item));
    setEditingId(null);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    const newItem = {
      id: 'item_' + Date.now(),
      name: newName,
      unit: newUnit,
      price: Number(newPrice)
    };
    
    setItems([...items, newItem]);
    setNewName('');
    setNewPrice('');
  };

  const handleSave = () => {
    localStorage.setItem('asado_inventory', JSON.stringify(items));
    alert('¡Precios actualizados correctamente!');
  };

  return (
    <div className="inventory">
      <div className="inventory-header">
        <div>
          <h1>Catálogo de Insumos</h1>
          <p>Configura los precios base para tus cotizaciones.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={18} />
          Guardar Cambios
        </button>
      </div>

      <div className="card add-insumo-form" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Añadir Nuevo Insumo</h2>
        <form onSubmit={handleAddItem} className="insumo-form-grid">
          <div className="form-group">
            <label className="form-label">Nombre del Insumo</label>
            <input type="text" className="form-input" placeholder="Ej. Platos Descartables" value={newName} onChange={e => setNewName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Unidad</label>
            <select className="form-input" value={newUnit} onChange={e => setNewUnit(e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Precio ($)</label>
            <input type="number" className="form-input" placeholder="Ej. 1500" value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', height: '42px' }}>
              <Plus size={18} /> Agregar
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Unidad</th>
              <th>Precio ($)</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No hay insumos registrados. Añade uno arriba.
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id}>
                  {editingId === item.id ? (
                    <>
                      <td>
                        <input type="text" className="form-input" style={{ padding: '0.4rem', fontSize: '0.9rem' }} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      </td>
                      <td>
                        <select className="form-input" style={{ padding: '0.4rem', fontSize: '0.9rem' }} value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="price-input-wrapper">
                          <span>$</span>
                          <input type="number" className="form-input" style={{ padding: '0.4rem', fontSize: '0.9rem' }} value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="btn-icon-success" onClick={() => handleEditSave(item.id)} title="Guardar cambios">
                          <Check size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="unit-badge">{item.unit}</span></td>
                      <td>
                        <strong>${Number(item.price).toLocaleString('es-AR')}</strong>
                      </td>
                      <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          className="btn-icon-edit" 
                          onClick={() => handleEditStart(item)}
                          title="Editar insumo"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          className="btn-icon-danger" 
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar insumo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
