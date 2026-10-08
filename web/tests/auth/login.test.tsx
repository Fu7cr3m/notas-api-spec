import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { renderApp } from '../helpers';
import { createFakeSupabase, fakeSession } from '../state';

beforeEach(() => {
  server.use(
    http.get('/api/notes', () => HttpResponse.json({ data: [], total: 0, limit: 50, offset: 0 })),
  );
});

describe('login', () => {
  it('entra com credenciais válidas e abre a área de notas', async () => {
    const fake = createFakeSupabase();
    fake.auth.signInWithPassword.mockImplementation(async () => {
      fake.emit('SIGNED_IN', fakeSession);
      return { data: { session: fakeSession }, error: null };
    });
    renderApp('/login');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Minhas notas' })).toBeInTheDocument();
    expect(fake.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'segredo123',
    });
  });

  it('mostra mensagem genérica para credenciais inválidas', async () => {
    const fake = createFakeSupabase();
    fake.auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });
    renderApp('/login');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('E-mail ou senha incorretos.');
    expect(alert).not.toHaveTextContent('Invalid');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled());
  });
});
