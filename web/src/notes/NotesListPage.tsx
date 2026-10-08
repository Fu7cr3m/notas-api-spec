import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { NotePage } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Alert, EmptyState, ErrorState, LoadingState } from '../components/States';

export const PAGE_SIZE = 50;

type ListState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; page: NotePage };

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export default function NotesListPage() {
  const { notes } = useAuth();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ListState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    notes
      .listNotes(PAGE_SIZE, offset)
      .then((page) => {
        if (cancelled) return;
        // Uma página vazia após exclusões volta à página anterior.
        if (page.data.length === 0 && page.offset > 0) {
          setOffset(Math.max(0, page.offset - PAGE_SIZE));
        } else {
          setState({ kind: 'ready', page });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.kind === 'unauthorized') return;
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [notes, offset, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <section>
      <h2>Minhas notas</h2>
      {notice && <Alert kind="info">{notice}</Alert>}
      {state.kind === 'loading' && <LoadingState label="Carregando notas…" />}
      {state.kind === 'error' && (
        <ErrorState message="Não foi possível carregar suas notas. Verifique a conexão e tente novamente." onRetry={retry} />
      )}
      {state.kind === 'ready' && state.page.data.length === 0 && (
        <EmptyState title="Você ainda não tem notas">
          <Link className="button" to="/notes/new">
            Criar primeira nota
          </Link>
        </EmptyState>
      )}
      {state.kind === 'ready' && state.page.data.length > 0 && (
        <>
          <p>
            <Link className="button" to="/notes/new">
              Nova nota
            </Link>
          </p>
          <ul className="notes-list">
            {state.page.data.map((note) => (
              <li key={note.id}>
                <Link to={`/notes/${encodeURIComponent(note.id)}`}>{note.title}</Link>
                <div>
                  <small>Criada em {dateFormat.format(new Date(note.createdAt))}</small>
                </div>
              </li>
            ))}
          </ul>
          <div className="actions" role="navigation" aria-label="Paginação">
            <button type="button" className="secondary" disabled={state.page.offset === 0} onClick={() => setOffset(Math.max(0, state.page.offset - state.page.limit))}>
              Anterior
            </button>
            <span>
              {state.page.offset + 1}–{state.page.offset + state.page.data.length} de {state.page.total}
            </span>
            <button type="button" className="secondary" disabled={state.page.offset + state.page.limit >= state.page.total} onClick={() => setOffset(state.page.offset + state.page.limit)}>
              Próxima
            </button>
          </div>
        </>
      )}
    </section>
  );
}
