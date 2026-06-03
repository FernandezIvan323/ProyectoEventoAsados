import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/feedback/ResourceState';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { getStoredToken } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function AuthGate({ children }) {
  const [checked, setChecked] = useState(false);
  const [hasUsers, setHasUsers] = useState(false);
  const [token, setToken] = useState(getStoredToken());

  useEffect(() => {
    if (token) return;
    apiRequest('/api/auth/config')
      .then(config => {
        setHasUsers(Boolean(config.hasUsers));
        setChecked(true);
      })
      .catch(() => {
        setHasUsers(false);
        setChecked(true);
      });
  }, [token]);

  const handleAuth = (newToken) => {
    setToken(newToken);
  };

  if (token) {
    return children;
  }

  if (!checked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0A0E1A]">
        <LoadingState title="Iniciando AsamApp" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onAuthSuccess={handleAuth} />} />
      <Route path="/register" element={<Register onAuthSuccess={handleAuth} />} />
      <Route path="*" element={<Navigate to={hasUsers ? '/login' : '/register'} replace />} />
    </Routes>
  );
}
