import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { Note, NoteInput } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Alert, ErrorState, LoadingState } from '../components/States';
import DeleteNoteDialog from './DeleteNoteDialog';
import NoteForm from './NoteForm';

type DetailState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; note: Note };

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export default function NoteDetailPage() {
  const { id = '' } = useParams();
  const { notes } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<DetailState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    notes
      .getNote(id)
      .then((note) => {
        if (!cancelled) setState({ kind: 'ready', note });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError) {
          if (error.kind === 'unauthorized') return;
          if (error.kind === 'not-found') {
            navigate('/', { replace: true, state: { notice: 'Esta nota não está disponível.' } });
            return;
          }
        }
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [notes, id, attempt, navigate]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.kind === 'loading') return <LoadingState label="Carregando nota…" />;
  if (state.kind === 'error') {
    return <ErrorState message="Não foi possível carregar esta nota." onRetry={retry} />;
  }

  const { note } = state;

  async function save(input: NoteInput) {
    const updated = await notes.replaceNote(note.id, input);
    setState({ kind: 'ready', note: updated });
    setEditing(false);
    setSaved(true);
  }

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await notes.deleteNote(note.id);
      navigate('/', { state: { notice: 'Nota excluída.' } });
    } catch (error) {
      if (!(error instanceof ApiError && error.kind === 'unauthorized')) {
        setDeleteError('A exclusão não foi confirmada. Atualize a lista para conferir antes de tentar novamente.');
      }
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <section>
        <h2>Editar nota</h2>
        <NoteForm initial={{ title: note.title, content: note.content }} onSubmit={save} onCancel={() => setEditing(false)} />
      </section>
    );
  }

  return (
    <article>
      {saved && <Alert kind="success">Nota atualizada.</Alert>}
      <h2>{note.title}</h2>
      <p>
        <small>
          Criada em {dateFormat.format(new Date(note.createdAt))} · Atualizada em{' '}
          {dateFormat.format(new Date(note.updatedAt))}
        </small>
      </p>
      <p className="note-content">{note.content}</p>
      <div className="actions">
        <Link className="button secondary" to="/">
          Voltar
        </Link>
        <button type="button" onClick={() => { setSaved(false); setEditing(true); }}>
          Editar
        </button>
        <button type="button" className="danger" onClick={() => setConfirmingDelete(true)}>
          Excluir
        </button>
      </div>
      {confirmingDelete && (
        <DeleteNoteDialog busy={deleting} error={deleteError} onConfirm={() => void remove()} onCancel={() => { setConfirmingDelete(false); setDeleteError(null); }} />
      )}
    </article>
  );
}

