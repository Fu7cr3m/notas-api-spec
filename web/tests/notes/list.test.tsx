import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { renderApp } from '../helpers';
import { makeNote } from '../notes';
import { createFakeSupabase, fakeSession } from '../state';

beforeEach(() => {
  createFakeSupabase(fakeSession);
});

describe('lista de notas', () => {
  it('mostra carregando e depois os títulos', async () => {
    server.use(
      http.get('/api/notes', () =>
        HttpResponse.json({ data: [makeNote({ title: 'Compras' })], total: 1, limit: 50, offset: 0 }),
      ),
    );
    renderApp('/');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(await screen.findByRole('link', { name: /Compras/ })).toHaveAttribute('href', '/notes/note-1');
  });

  it('mostra estado vazio com ação para criar a primeira nota', async () => {
    server.use(http.get('/api/notes', () => HttpResponse.json({ data: [], total: 0, limit: 50, offset: 0 })));
    renderApp('/');
    expect(await screen.findByText('Você ainda não tem notas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar primeira nota' })).toHaveAttribute('href', '/notes/new');
  });

  it('mostra erro com nova tentativa e não finge lista vazia', async () => {
    let fail = true;
    server.use(
      http.get('/api/notes', () =>
        fail
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ data: [makeNote({ title: 'Voltou' })], total: 1, limit: 50, offset: 0 }),
      ),
    );
    renderApp('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    expect(screen.queryByText('Você ainda não tem notas')).not.toBeInTheDocument();
    fail = false;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('link', { name: /Voltou/ })).toBeInTheDocument();
  });

  it('pagina usando total, limit e offset', async () => {
    const offsets: string[] = [];
    server.use(
      http.get('/api/notes', ({ request }) => {
        const offset = Number(new URL(request.url).searchParams.get('offset'));
        offsets.push(String(offset));
        return HttpResponse.json({
          data: [makeNote({ id: `n${offset}`, title: `Nota ${offset}` })],
          total: 51,
          limit: 50,
          offset,
        });
      }),
    );
    renderApp('/');
    const user = userEvent.setup();
    await screen.findByRole('link', { name: /Nota 0/ });
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await screen.findByRole('link', { name: /Nota 50/ });
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    expect(offsets).toEqual(['0', '50']);
  });

  it('volta ao login quando a API responde 401', async () => {
    server.use(http.get('/api/notes', () => new HttpResponse(null, { status: 401 })));
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByText(/sessão expirou/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Minhas notas' })).not.toBeInTheDocument();
  });
});
