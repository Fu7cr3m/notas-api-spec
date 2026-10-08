import type { ReactNode } from 'react';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="state">
      {label}
    </p>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="state" aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="state error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function Alert({ children, kind = 'error' }: { children: ReactNode; kind?: 'error' | 'success' | 'info' }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`alert ${kind}`}>
      {children}
    </div>
  );
}
