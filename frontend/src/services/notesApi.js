import { apiRequest } from '@/lib/api';

export const getNotes = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ).toString();
  return apiRequest(`/api/notes${query ? `?${query}` : ''}`);
};

export const createNote = (data) =>
  apiRequest('/api/notes', { method: 'POST', body: JSON.stringify(data) });

export const updateNote = (id, data) =>
  apiRequest(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteNote = (id) =>
  apiRequest(`/api/notes/${id}`, { method: 'DELETE' });
