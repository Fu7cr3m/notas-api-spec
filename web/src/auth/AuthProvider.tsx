import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createNotesClient, type NotesClient } from '../api/client';
import { getSupabase } from './supabase';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'recovery';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  notice: string | null;
  notes: NotesClient;
  signOut: () => Promise<void>;
  finishRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const { data } = getSupabase().auth.onAuthStateChange((event, next) => {
      tokenRef.current = next?.access_token ?? null;
      setSession(next);
      setStatus((current) => {
        if (event === 'PASSWORD_RECOVERY') return 'recovery';
        if (!next) return 'anonymous';
        if (current === 'recovery' && event !== 'USER_UPDATED') return 'recovery';
        return 'authenticated';
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    setNotice(null);
    await getSupabase().auth.signOut({ scope: 'local' });
    tokenRef.current = null;
    setSession(null);
    setStatus('anonymous');
  }, []);

  const handleUnauthorized = useCallback(() => {
    tokenRef.current = null;
    setSession(null);
    setStatus('anonymous');
    setNotice('Sua sessão expirou. Entre novamente para continuar.');
    void getSupabase().auth.signOut({ scope: 'local' }).catch(() => undefined);
  }, []);

  const finishRecovery = useCallback(() => {
    setStatus((current) => (current === 'recovery' ? 'authenticated' : current));
  }, []);

  const notes = useMemo(
    () =>
      createNotesClient({
        baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
        getToken: () => tokenRef.current,
        onUnauthorized: handleUnauthorized,
      }),
    [handleUnauthorized],
  );

  const value = useMemo(
    () => ({ status, session, notice, notes, signOut, finishRecovery }),
    [status, session, notice, notes, signOut, finishRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return value;
}
