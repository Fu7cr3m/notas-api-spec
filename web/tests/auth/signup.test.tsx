import { screen } from '@testing-library/react';
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

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('E-mail'), 'nova@example.com');
  await user.type(screen.getByLabelText('Senha'), 'segredo123');
  await user.click(screen.getByRole('button', { name: 'Criar conta' }));
}

describe('cadastro', () => {
  it('entra na área de notas quando o provedor devolve sessão', async () => {
    const fake = createFakeSupabase();
    fake.auth.signUp.mockImplementation(async () => {
      fake.emit('SIGNED_IN', fakeSession);
      return { data: { session: fakeSession, user: fakeSession.user }, error: null };
    });
    renderApp('/signup');
    await fillAndSubmit();
    expect(await screen.findByRole('heading', { name: 'Minhas notas' })).toBeInTheDocument();
  });

  it('orienta a confirmar o e-mail quando não há sessão', async () => {
    const fake = createFakeSupabase();
    fake.auth.signUp.mockResolvedValue({ data: { session: null, user: {} }, error: null });
    renderApp('/signup');
    await fillAndSubmit();
    expect(await screen.findByRole('status')).toHaveTextContent(/verifique seu e-mail/i);
  });

  it('mostra erro do provedor sem detalhes técnicos', async () => {
    const fake = createFakeSupabase();
    fake.auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Password should be at least 6 characters', status: 422 },
    });
    renderApp('/signup');
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível criar a conta');
  });
});
