import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { renderApp } from '../helpers';
import { makeNote } from '../notes';
import { createFakeSupabase, fakeSession } from '../state';

beforeEach(() => {
  createFakeSupabase(fakeSession);
  server.use(http.get('/api/notes', () => HttpResponse.json({ data: [], total: 0, limit: 50, offset: 0 })));
});

describe('detalhe da nota', () => {
  it('mostra título e conteúdo completos', async () => {
    server.use(
      http.get('/api/notes/note-1', () =>
        HttpResponse.json(makeNote({ title: 'Ação — título', content: 'linha 1\nlinha 2 çãé' })),
      ),
    );
    renderApp('/notes/note-1');
    expect(await screen.findByRole('heading', { name: 'Ação — título' })).toBeInTheDocument();
    expect(screen.getByText(/linha 1\s+linha 2 çãé/)).toBeInTheDocument();
  });

  it('em 404 avisa indisponibilidade e volta à lista', async () => {
    server.use(http.get('/api/notes/gone', () => new HttpResponse(null, { status: 404 })));
    renderApp('/notes/gone');
    expect(await screen.findByRole('heading', { name: 'Minhas notas' })).toBeInTheDocument();
    expect(screen.getByText('Esta nota não está disponível.')).toBeInTheDocument();
  });

  it('em 401 volta ao login', async () => {
    server.use(http.get('/api/notes/note-1', () => new HttpResponse(null, { status: 401 })));
    renderApp('/notes/note-1');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('em erro do servidor oferece nova tentativa', async () => {
    server.use(http.get('/api/notes/note-1', () => new HttpResponse(null, { status: 500 })));
    renderApp('/notes/note-1');
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});

