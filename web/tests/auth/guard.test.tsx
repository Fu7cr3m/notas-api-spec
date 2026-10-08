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

describe('guarda de rota e logout', () => {
  it('redireciona anônimos ao login sem pedir notas', async () => {
    createFakeSupabase();
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Minhas notas' })).not.toBeInTheDocument();
  });

  it('mantém a sessão existente e encerra no logout', async () => {
    createFakeSupabase(fakeSession);
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Minhas notas' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Minhas notas' })).not.toBeInTheDocument();
  });
});
