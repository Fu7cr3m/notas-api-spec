import { useState, type FormEvent } from 'react';
import { Alert } from '../components/States';
import { useAuth } from './AuthProvider';
import { getSupabase } from './supabase';

export default function ResetPasswordPage() {
  const { finishRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await getSupabase().auth.updateUser({ password });
      if (authError) {
        setError('Não foi possível definir a nova senha. Use ao menos 6 caracteres ou solicite um novo link.');
      } else {
        finishRecovery();
      }
    } catch {
      setError('Não foi possível definir a nova senha agora. Tente novamente em instantes.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Definir nova senha</h2>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit}>
        <label>
          Nova senha
          <input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Salvar nova senha
        </button>
      </form>
    </section>
  );
}
