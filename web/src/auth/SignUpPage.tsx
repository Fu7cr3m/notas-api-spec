import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/States';
import { getSupabase } from './supabase';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data, error: authError } = await getSupabase().auth.signUp({ email, password });
      if (authError) {
        setError('Não foi possível criar a conta. Verifique os dados (senha com ao menos 6 caracteres) e tente novamente.');
      } else if (!data.session) {
        setNeedsConfirmation(true);
      }
    } catch {
      setError('Não foi possível criar a conta agora. Tente novamente em instantes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Criar conta</h2>
      {needsConfirmation && (
        <Alert kind="info">
          Verifique seu e-mail: enviamos um link para confirmar a conta. Depois da confirmação, entre normalmente.
        </Alert>
      )}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <label>
          E-mail
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Criar conta
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </section>
  );
}
