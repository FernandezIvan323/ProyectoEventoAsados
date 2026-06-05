import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setStoredToken, setStoredUser } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function Login({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setStoredToken(data.token);
      setStoredUser(data.user);
      onAuthSuccess(data.token);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-[#0A0E1A] p-4 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#10B981]/10 mb-4">
            <Flame className="w-6 h-6 text-[#10B981]" />
          </div>
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #10B981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AsamApp</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Iniciá sesión para acceder al sistema</p>
        </div>

        <div className="rounded-xl border border-[rgba(148,163,184,0.10)] bg-[#111726] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#94A3B8] text-xs font-medium">Usuario</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required className="h-10 bg-[#0A0E1A] border-[rgba(148,163,184,0.10)] text-[#F8FAFC] text-sm focus-visible:ring-[#10B981] focus-visible:border-[#10B981]" placeholder="Tu usuario" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#94A3B8] text-xs font-medium">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required className="h-10 bg-[#0A0E1A] border-[rgba(148,163,184,0.10)] text-[#F8FAFC] text-sm focus-visible:ring-[#10B981] focus-visible:border-[#10B981]" placeholder="Tu contraseña" />
            </div>
            {error && <p className="text-sm text-red-400">{error.message || error}</p>}
            <Button type="submit" className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm transition-all" disabled={isLoading}>
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-[#64748B] text-sm">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-[#10B981] hover:text-[#059669] font-medium transition-colors">Registrate</Link>
        </p>
        <div className="text-center mt-6 pt-4 border-t border-[rgba(148,163,184,0.06)]">
          <a href="/" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111726]/50 hover:bg-[#1A233A] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium transition-all duration-200 hover:border-[rgba(148,163,184,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
