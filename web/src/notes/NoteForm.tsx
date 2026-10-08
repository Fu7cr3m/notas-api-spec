import { useId, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { NoteInput } from '../api/types';
import { Alert } from '../components/States';

interface Props {
  initial?: NoteInput;
  onSubmit: (input: NoteInput) => Promise<void>;
  onCancel: () => void;
}

type FieldErrors = Partial<Record<'title' | 'content', string>>;

const hasText = (value: string) => value.trim().length > 0;

export default function NoteForm({ initial = { title: '', content: '' }, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const titleErrorId = useId();
  const contentErrorId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const errors: FieldErrors = {};
    if (!hasText(title)) errors.title = 'Informe o título.';
    if (!hasText(content)) errors.content = 'Informe o conteúdo.';
    setFieldErrors(errors);
    if (errors.title || errors.content) return;

    setBusy(true);
    try {
      await onSubmit({ title, content });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError('A alteração não foi confirmada. Atualize a lista para conferir antes de tentar novamente.');
      } else if (error.kind === 'validation') {
        const next: FieldErrors = {};
        for (const item of error.errors) {
          const field = typeof item.pointer === 'string' ? item.pointer.replace(/^#?\//, '') : '';
          if (field === 'title' || field === 'content') next[field] = item.detail ?? 'Valor inválido.';
        }
        setFieldErrors(next);
        if (!next.title && !next.content) setFormError('Revise os dados informados e tente novamente.');
      } else if (error.kind !== 'unauthorized') {
        setFormError(
          'A alteração não foi confirmada. Seu texto foi mantido; confira a lista de notas antes de tentar novamente para evitar duplicidade.',
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <Alert>{formError}</Alert>}
      <div className="field">
      <label>
        Título
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={fieldErrors.title ? true : undefined}
          aria-describedby={fieldErrors.title ? titleErrorId : undefined}
        />
      </label>
        {fieldErrors.title && (
          <span id={titleErrorId} className="field-error">
            {fieldErrors.title}
          </span>
        )}
      </div>
      <div className="field">
      <label>
        Conteúdo
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-invalid={fieldErrors.content ? true : undefined}
          aria-describedby={fieldErrors.content ? contentErrorId : undefined}
        />
      </label>
        {fieldErrors.content && (
          <span id={contentErrorId} className="field-error">
            {fieldErrors.content}
          </span>
        )}
      </div>
      <div className="actions">
        <button type="submit" disabled={busy}>
          Salvar
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

