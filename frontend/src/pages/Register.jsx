import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { setStoredToken, setStoredUser } from '@/lib/auth';
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
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Crear cuenta</h1>
          <p className="text-muted-foreground text-sm mt-1">Registrate para usar AsamApp</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email">
              <Input id="email" type="email" value={form.email} onChange={handleChange('email')} autoComplete="email" required placeholder="tu@email.com" />
            </FormField>
            <FormField label="Usuario">
              <Input id="username" value={form.username} onChange={handleChange('username')} autoComplete="username" required placeholder="Tu nombre de usuario" />
            </FormField>
            <FormField label="Contraseña">
              <Input id="password" type="password" value={form.password} onChange={handleChange('password')} autoComplete="new-password" required placeholder="Mínimo 4 caracteres" />
            </FormField>
            <FormField label="Confirmar contraseña">
              <Input id="confirm" type="password" value={form.confirm} onChange={handleChange('confirm')} autoComplete="new-password" required placeholder="Repetí la contraseña" />
            </FormField>
            {error && <p className="text-sm text-destructive">{error.message || error}</p>}
            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              <UserPlus className="w-4 h-4" />
              {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-muted-foreground text-sm">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Iniciá sesión</Link>
        </p>
        <p className="text-center mt-4 text-[11px] text-[var(--text-hint)] leading-relaxed px-4">
          App familiar compartida: todos los usuarios ven y editan los mismos eventos, notas y compras.
        </p>
        <div className="text-center mt-6 pt-4 border-t border-border">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/50 hover:bg-[var(--surface2)] text-muted-foreground hover:text-foreground text-xs font-medium transition-all duration-200 hover:border-[var(--border2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
