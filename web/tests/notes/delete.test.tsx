import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { renderApp } from '../helpers';
import { makeNote } from '../notes';
import { createFakeSupabase, fakeSession } from '../state';

beforeEach(() => {
  createFakeSupabase(fakeSession);
  server.use(http.get('/api/notes/note-1', () => HttpResponse.json(makeNote())));
});

describe('exclusão de nota', () => {
  it('pede confirmação e permite cancelar sem chamar a API', async () => {
    const del = vi.fn();
    server.use(http.delete('/api/notes/note-1', () => { del(); return new HttpResponse(null, { status: 204 }); }));
    renderApp('/notes/note-1');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Excluir' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Excluir esta nota?');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
  });

  it('remove só após 204 e volta à lista atualizada', async () => {
    server.use(
      http.delete('/api/notes/note-1', () => new HttpResponse(null, { status: 204 })),
      http.get('/api/notes', () => HttpResponse.json({ data: [], total: 0, limit: 50, offset: 0 })),
    );
    renderApp('/notes/note-1');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await screen.findByText('Você ainda não tem notas')).toBeInTheDocument();
    expect(screen.getByText('Nota excluída.')).toBeInTheDocument();
  });

  it('em falha mantém a nota e informa que a exclusão não foi confirmada', async () => {
    server.use(http.delete('/api/notes/note-1', () => new HttpResponse(null, { status: 500 })));
    renderApp('/notes/note-1');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('não foi confirmada');
    expect(screen.getByRole('heading', { name: 'Primeira nota' })).toBeInTheDocument();
  });
});
