import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/States';
import { getSupabase } from './supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // resposta sempre neutra para não revelar se o e-mail existe
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <section>
      <h2>Recuperar senha</h2>
      {sent && (
        <Alert kind="info">
          Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha. Verifique sua caixa de entrada.
        </Alert>
      )}
      <form onSubmit={onSubmit}>
        <label>
          E-mail
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Enviar instruções
        </button>
      </form>
      <p>
        <Link to="/login">Voltar ao login</Link>
      </p>
    </section>
  );
}
