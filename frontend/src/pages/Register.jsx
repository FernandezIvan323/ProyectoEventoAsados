import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setStoredToken } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

export default function Register({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, username: form.username, password: form.password }),
      });
      setStoredToken(data.token);
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
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #10B981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Crear cuenta</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Registrate para usar AsamApp</p>
        </div>

        <div className="rounded-xl border border-[rgba(148,163,184,0.10)] bg-[#111726] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#94A3B8] text-xs font-medium">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={handleChange('email')} autoComplete="email" required className="h-10 bg-[#0A0E1A] border-[rgba(148,163,184,0.10)] text-[#F8FAFC] text-sm focus-visible:ring-[#10B981] focus-visible:border-[#10B981]" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#94A3B8] text-xs font-medium">Usuario</Label>
              <Input id="username" value={form.username} onChange={handleChange('username')} autoComplete="username" required className="h-10 bg-[#0A0E1A] border-[rgba(148,163,184,0.10)] text-[#F8FAFC] text-sm focus-visible:ring-[#10B981] focus-visible:border-[#10B981]" placeholder="Tu nombre de usuario" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#94A3B8] text-xs font-medium">Contraseña</Label>
              <Input id="password" type="password" value={form.password} onChange={handleChange('password')} autoComplete="new-password" required className="h-10 bg-[#0A0E1A] border-[rgba(148,163,184,0.10)] text-[#F8FAFC] text-sm focus-visible:ring-[#10B981] focus-visible:border-[#10B981]" placeholder="Mínimo 4 caracteres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[#94A3B8] text-xs font-medium">Confirmar contraseña</Label>
              <Input id="confirm" type="password" value={form.confirm} onChange={handleChange('confirm')} autoComplete="new-password" required className="h-10 bg-[#0A0E1A] border-[rgba(148,163,184,0.10)] text-[#F8FAFC] text-sm focus-visible:ring-[#10B981] focus-visible:border-[#10B981]" placeholder="Repetí la contraseña" />
            </div>
            {error && <p className="text-sm text-red-400">{error.message || error}</p>}
            <Button type="submit" className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm transition-all" disabled={isLoading}>
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-[#64748B] text-sm">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-[#10B981] hover:text-[#059669] font-medium transition-colors">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
