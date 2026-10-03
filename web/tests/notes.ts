import type { Note } from '../src/api/types';

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Primeira nota',
    content: 'Conteúdo da nota\nsegunda linha',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}
