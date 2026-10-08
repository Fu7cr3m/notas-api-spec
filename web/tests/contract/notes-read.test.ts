import { http, HttpResponse } from 'msw';
import { createNotesClient } from '../../src/api/client';
import { server } from '../setup';
import { makeNote } from '../notes';
import { validateNote, validateNotePage } from './schemas';

const client = createNotesClient({ baseUrl: '/api', getToken: () => 'token-123' });

describe('contrato: leitura', () => {
  it('listNotes envia bearer, limit e offset e aceita NotePage', async () => {
    let seen: URL | undefined;
    let auth: string | null = null;
    const page = { data: [makeNote()], total: 1, limit: 50, offset: 0 };
    expect(validateNotePage(page)).toBe(true);
    server.use(
      http.get('/api/notes', ({ request }) => {
        seen = new URL(request.url);
        auth = request.headers.get('authorization');
        return HttpResponse.json(page);
      }),
    );
    await expect(client.listNotes(50, 0)).resolves.toEqual(page);
    expect(seen?.searchParams.get('limit')).toBe('50');
    expect(seen?.searchParams.get('offset')).toBe('0');
    expect(auth).toBe('Bearer token-123');
  });

  it('getNote devolve Note válida', async () => {
    const note = makeNote();
    expect(validateNote(note)).toBe(true);
    server.use(http.get('/api/notes/note-1', () => HttpResponse.json(note)));
    await expect(client.getNote('note-1')).resolves.toEqual(note);
  });

  it('classifica 404, 401, 500 e rede', async () => {
    const onUnauthorized = vi.fn();
    const c = createNotesClient({ baseUrl: '/api', getToken: () => 't', onUnauthorized });
    server.use(
      http.get('/api/notes/missing', () => new HttpResponse(null, { status: 404 })),
      http.get('/api/notes/expired', () => new HttpResponse(null, { status: 401 })),
      http.get('/api/notes/boom', () => new HttpResponse(null, { status: 500 })),
      http.get('/api/notes/offline', () => HttpResponse.error()),
    );
    await expect(c.getNote('missing')).rejects.toMatchObject({ kind: 'not-found' });
    await expect(c.getNote('expired')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    await expect(c.getNote('boom')).rejects.toMatchObject({ kind: 'unavailable', status: 500 });
    await expect(c.getNote('offline')).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('rejeita resposta de sucesso com formato inesperado', async () => {
    server.use(
      http.get('/api/notes', () => HttpResponse.json({ data: 'x' })),
      http.get('/api/notes/note-1', () => HttpResponse.json({ id: 1 })),
    );
    await expect(client.listNotes(50, 0)).rejects.toMatchObject({ kind: 'invalid-response' });
    await expect(client.getNote('note-1')).rejects.toMatchObject({ kind: 'invalid-response' });
  });
});
