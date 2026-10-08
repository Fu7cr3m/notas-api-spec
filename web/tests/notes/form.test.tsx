import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { renderApp } from '../helpers';
import { makeNote } from '../notes';
import { createFakeSupabase, fakeSession } from '../state';

const emptyPage = { data: [], total: 0, limit: 50, offset: 0 };

beforeEach(() => {
  createFakeSupabase(fakeSession);
});

async function fill(title: string, content: string) {
  const user = userEvent.setup();
  const titleInput = await screen.findByLabelText('Título');
  await user.clear(titleInput);
  if (title) await user.type(titleInput, title);
  const contentInput = screen.getByLabelText('Conteúdo');
  await user.clear(contentInput);
  if (content) await user.type(contentInput, content);
  return user;
}

describe('formulário de nota', () => {
  it('bloqueia título e conteúdo vazios ou só com espaços sem enviar', async () => {
    const post = vi.fn();
    server.use(http.post('/api/notes', () => { post(); return HttpResponse.json(makeNote(), { status: 201 }); }));
    renderApp('/notes/new');
    const user = await fill('   ', '');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Informe o título.')).toBeInTheDocument();
    expect(screen.getByText('Informe o conteúdo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true');
    expect(post).not.toHaveBeenCalled();
  });

  it('cria a nota com o corpo do contrato e volta à lista atualizada', async () => {
    let body: unknown;
    server.use(
      http.post('/api/notes', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeNote({ title: 'Ideias' }), { status: 201 });
      }),
      http.get('/api/notes', () =>
        HttpResponse.json({ data: [makeNote({ title: 'Ideias' })], total: 1, limit: 50, offset: 0 }),
      ),
    );
    renderApp('/notes/new');
    const user = await fill('Ideias', 'texto com acentuação');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('link', { name: /Ideias/ })).toBeInTheDocument();
    expect(screen.getByText('Nota criada.')).toBeInTheDocument();
    expect(body).toEqual({ title: 'Ideias', content: 'texto com acentuação' });
  });

  it('mostra erros 400 por campo e preserva o rascunho', async () => {
    server.use(
      http.post('/api/notes', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Bad Request', status: 400, errors: [{ pointer: '#/title', detail: 'inválido' }] },
          { status: 400, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    renderApp('/notes/new');
    const user = await fill('Meu título', 'Meu texto');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Meu título');
    expect(screen.getByLabelText('Conteúdo')).toHaveValue('Meu texto');
  });

  it('em falha não confirmada preserva o rascunho e orienta a conferir a lista', async () => {
    server.use(http.post('/api/notes', () => new HttpResponse(null, { status: 500 })));
    renderApp('/notes/new');
    const user = await fill('Rascunho', 'Texto');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('não foi confirmada');
    expect(alert).toHaveTextContent('lista');
    expect(screen.getByLabelText('Título')).toHaveValue('Rascunho');
  });

  it('edita uma nota existente com PUT e mostra o conteúdo atualizado', async () => {
    let body: unknown;
    server.use(
      http.get('/api/notes/note-1', () => HttpResponse.json(makeNote())),
      http.put('/api/notes/note-1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeNote({ title: 'Novo título', content: 'Novo texto', updatedAt: '2026-10-02T10:00:00.000Z' }));
      }),
    );
    renderApp('/notes/note-1');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Título')).toHaveValue('Primeira nota');
    await fill('Novo título', 'Novo texto');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('heading', { name: 'Novo título' })).toBeInTheDocument();
    expect(screen.getByText('Nota atualizada.')).toBeInTheDocument();
    expect(body).toEqual({ title: 'Novo título', content: 'Novo texto' });
  });
});

describe('navegação', () => {
  it('mantém o formulário acessível por rótulos', async () => {
    server.use(http.get('/api/notes', () => HttpResponse.json(emptyPage)));
    renderApp('/notes/new');
    await waitFor(() => expect(screen.getByLabelText('Título')).toBeInTheDocument());
    expect(screen.getByLabelText('Conteúdo')).toBeInTheDocument();
  });
});
