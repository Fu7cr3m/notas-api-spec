import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/States';
import { useAuth } from './AuthProvider';
import { getSupabase } from './supabase';

export default function LoginPage() {
  const { notice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await getSupabase().auth.signInWithPassword({ email, password });
      if (authError) {
        const status = authError.status ?? 0;
        setError(
          status >= 400 && status < 500
            ? 'E-mail ou senha incorretos.'
            : 'Não foi possível entrar agora. Tente novamente em instantes.',
        );
      }
    } catch {
      setError('Não foi possível entrar agora. Tente novamente em instantes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Entrar</h2>
      {notice && <Alert kind="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <label>
          E-mail
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Entrar
        </button>
      </form>
      <p>
        <Link to="/signup">Criar conta</Link> · <Link to="/forgot-password">Esqueci minha senha</Link>
      </p>
    </section>
  );
}
