import { apiRequest } from '@/lib/api';

export const getNotes = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ).toString();
  return apiRequest(`/api/notes${query ? `?${query}` : ''}`);
};

export const getNote = (id) =>
  apiRequest(`/api/notes/${id}`);

export const createNote = (data) =>
  apiRequest('/api/notes', { method: 'POST', body: JSON.stringify(data) });

export const updateNote = (id, data) =>
  apiRequest(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteNote = (id) =>
  apiRequest(`/api/notes/${id}`, { method: 'DELETE' });

export const archiveNote = (id) =>
  apiRequest(`/api/notes/${id}/archive`, { method: 'POST' });

export const restoreNote = (id) =>
  apiRequest(`/api/notes/${id}/restore`, { method: 'POST' });

export const exportNotes = async (format = 'json') => {
  const token = localStorage.getItem('asamapp_token');
  const response = await fetch(`http://localhost:3000/api/notes-export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Error al exportar notas');
  return response.blob();
};
