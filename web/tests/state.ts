import type { Session } from '@supabase/supabase-js';

type Listener = (event: string, session: Session | null) => void;

export const testState: { supabase: unknown } = { supabase: null };

export const fakeSession = {
  access_token: 'token-123',
  refresh_token: 'refresh',
  token_type: 'bearer',
  expires_in: 3600,
  user: { id: 'user-1', email: 'ana@example.com' },
} as unknown as Session;

export function createFakeSupabase(initialSession: Session | null = null) {
  let listener: Listener | undefined;
  const emit = (event: string, session: Session | null) => listener?.(event, session);
  const auth = {
    onAuthStateChange: vi.fn((cb: Listener) => {
      listener = cb;
      queueMicrotask(() => cb('INITIAL_SESSION', initialSession));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(),
    signOut: vi.fn(async () => {
      emit('SIGNED_OUT', null);
      return { error: null };
    }),
  };
  const fake = { auth, emit };
  testState.supabase = fake;
  return fake;
}
