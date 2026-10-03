import { useEffect, useRef } from 'react';
import { Alert } from '../components/States';

interface Props {
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteNoteDialog({ busy, error, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      className="alert info"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <h3 id="delete-title">Excluir esta nota?</h3>
      <p id="delete-description">Esta ação remove a nota da sua lista.</p>
      {error && <Alert>{error}</Alert>}
      <div className="actions">
        <button type="button" className="danger" onClick={onConfirm} disabled={busy}>
          Confirmar exclusão
        </button>
        <button type="button" className="secondary" ref={cancelRef} onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
