import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/feedback/ResourceState';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Landing from '@/pages/Landing';
import { clearStoredToken, getStoredToken } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function AuthGate({ children }) {
  const location = useLocation();
  const isAuthPath = location.pathname === '/login' || location.pathname === '/register';
  const [checked, setChecked] = useState(false);
  const [hasUsers, setHasUsers] = useState(false);
  const [token, setToken] = useState(isAuthPath ? null : getStoredToken());

  useEffect(() => {
    if (isAuthPath) {
      clearStoredToken();
      setChecked(true);
      return;
    }
    apiRequest('/api/auth/config')
      .then(config => {
        setHasUsers(Boolean(config.hasUsers));
        setChecked(true);
      })
      .catch(() => {
        setHasUsers(false);
        setChecked(true);
      });
  }, [isAuthPath]);

  const handleAuth = (newToken) => {
    setToken(newToken);
  };

  if (token) {
    return children;
  }

  if (!checked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0A1428]">
        <LoadingState title="Iniciando AsamApp" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onAuthSuccess={handleAuth} />} />
      <Route path="/register" element={<Register onAuthSuccess={handleAuth} />} />
      <Route path="*" element={<Navigate to={hasUsers ? '/login' : '/register'} replace />} />
    </Routes>
  );
}
