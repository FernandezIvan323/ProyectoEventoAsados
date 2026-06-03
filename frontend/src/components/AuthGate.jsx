import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/feedback/ResourceState';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { getStoredToken } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function AuthGate({ children }) {
  const [checked, setChecked] = useState(false);
  const [hasUsers, setHasUsers] = useState(false);
  const token = getStoredToken();

  useEffect(() => {
    apiRequest('/api/auth/config')
      .then(config => {
        setHasUsers(Boolean(config.hasUsers));
        setChecked(true);
      })
      .catch(() => {
        setHasUsers(false);
        setChecked(true);
      });
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0A0E1A]">
        <LoadingState title="Iniciando AsamApp" />
      </div>
    );
  }

  if (token) {
    return children;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to={hasUsers ? '/login' : '/register'} replace />} />
    </Routes>
  );
}
