import type { Note, NoteInput, NotePage, ProblemError } from './types';

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'not-found'
  | 'unavailable'
  | 'invalid-response';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly errors: ProblemError[];

  constructor(kind: ApiErrorKind, status?: number, errors: ProblemError[] = []) {
    super(kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.errors = errors;
  }
}

export interface ClientOptions {
  baseUrl?: string;
  getToken: () => string | null | undefined;
  onUnauthorized?: () => void;
}

export interface NotesClient {
  listNotes(limit: number, offset: number): Promise<NotePage>;
  getNote(id: string): Promise<Note>;
  createNote(input: NoteInput): Promise<Note>;
  replaceNote(id: string, input: NoteInput): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function isNote(value: unknown): value is Note {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function isNotePage(value: unknown): value is NotePage {
  return (
    isObject(value) &&
    Array.isArray(value.data) &&
    value.data.every(isNote) &&
    typeof value.total === 'number' &&
    typeof value.limit === 'number' &&
    typeof value.offset === 'number'
  );
}

async function readProblemErrors(response: Response): Promise<ProblemError[]> {
  try {
    const body: unknown = await response.json();
    if (isObject(body) && Array.isArray(body.errors)) {
      return body.errors.filter(isObject) as ProblemError[];
    }
  } catch {
    // corpo ausente ou inválido: sem erros por campo
  }
  return [];
}

export function createNotesClient(options: ClientOptions): NotesClient {
  const baseUrl = (options.baseUrl ?? '/api').replace(/\/$/, '');

  async function request(
    path: string,
    init: { method: string; body?: unknown } = { method: 'GET' },
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = options.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const init2: RequestInit = { method: init.method, headers };
    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init2.body = JSON.stringify(init.body);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, init2);
    } catch {
      throw new ApiError('unavailable');
    }

    if (response.ok) return response;
    if (response.status === 401) {
      options.onUnauthorized?.();
      throw new ApiError('unauthorized', 401);
    }
    if (response.status === 404) throw new ApiError('not-found', 404);
    if (response.status === 400) {
      throw new ApiError('validation', 400, await readProblemErrors(response));
    }
    throw new ApiError('unavailable', response.status);
  }

  async function readJson<T>(response: Response, guard: (v: unknown) => v is T): Promise<T> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ApiError('invalid-response', response.status);
    }
    if (!guard(body)) throw new ApiError('invalid-response', response.status);
    return body;
  }

  const notePath = (id: string) => `/notes/${encodeURIComponent(id)}`;

  return {
    async listNotes(limit, offset) {
      const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      return readJson(await request(`/notes?${query}`), isNotePage);
    },
    async getNote(id) {
      return readJson(await request(notePath(id)), isNote);
    },
    async createNote(input) {
      return readJson(await request('/notes', { method: 'POST', body: input }), isNote);
    },
    async replaceNote(id, input) {
      return readJson(await request(notePath(id), { method: 'PUT', body: input }), isNote);
    },
    async deleteNote(id) {
      await request(notePath(id), { method: 'DELETE' });
    },
  };
}
