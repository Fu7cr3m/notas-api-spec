import { http, HttpResponse } from 'msw';
import { createNotesClient } from '../../src/api/client';
import { server } from '../setup';
import { makeNote } from '../notes';
import { validateNote, validateNoteInput } from './schemas';

const client = createNotesClient({ baseUrl: '/api', getToken: () => 'token-123' });

describe('contrato: escrita', () => {
  it('createNote envia apenas NoteInput e aceita Note', async () => {
    let body: unknown;
    let auth: string | null = null;
    server.use(
      http.post('/api/notes', async ({ request }) => {
        body = await request.json();
        auth = request.headers.get('authorization');
        return HttpResponse.json(makeNote(), { status: 201 });
      }),
    );
    const note = await client.createNote({ title: 'T', content: 'C' });
    expect(validateNote(note)).toBe(true);
    expect(validateNoteInput(body)).toBe(true);
    expect(Object.keys(body as object).sort()).toEqual(['content', 'title']);
    expect(auth).toBe('Bearer token-123');
  });

  it('replaceNote usa PUT com NoteInput', async () => {
    let method = '';
    let body: unknown;
    server.use(
      http.put('/api/notes/note-1', async ({ request }) => {
        method = request.method;
        body = await request.json();
        return HttpResponse.json(makeNote({ title: 'N' }));
      }),
    );
    await client.replaceNote('note-1', { title: 'N', content: 'C' });
    expect(method).toBe('PUT');
    expect(validateNoteInput(body)).toBe(true);
    expect(Object.keys(body as object).sort()).toEqual(['content', 'title']);
  });

  it('deleteNote trata 204 sem corpo', async () => {
    server.use(http.delete('/api/notes/note-1', () => new HttpResponse(null, { status: 204 })));
    await expect(client.deleteNote('note-1')).resolves.toBeUndefined();
  });

  it('classifica 400 com errors e rejeita sucesso inválido', async () => {
    server.use(
      http.post('/api/notes', () =>
        HttpResponse.json(
          { type: 'x', title: 'Bad', status: 400, errors: [{ pointer: '#/title', detail: 'd' }] },
          { status: 400 },
        ),
      ),
      http.put('/api/notes/note-1', () => HttpResponse.json({ foo: 'bar' })),
    );
    await expect(client.createNote({ title: ' ', content: ' ' })).rejects.toMatchObject({
      kind: 'validation',
      errors: [{ pointer: '#/title', detail: 'd' }],
    });
    await expect(client.replaceNote('note-1', { title: 'a', content: 'b' })).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });
});
