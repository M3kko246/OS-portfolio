import type { ReactNode } from 'react';
import { useT } from '@/os/lib/i18n';

/** Empty state: says what is missing and, when possible, what to do next. */
export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="app-state">
      <p className="text-read">{message}</p>
      {children}
    </div>
  );
}

/** Error state: what happened, a retry, and an alternative when there is one. */
export function ErrorState({
  message,
  retry,
  children,
}: {
  message: string;
  retry?: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="app-state" role="alert">
      <p className="text-read">{message}</p>
      <p className="flex flex-wrap gap-8">
        {retry && (
          <button type="button" className="px-btn px-btn-primary" onClick={retry}>
            {t('common.retry')}
          </button>
        )}
        {children}
      </p>
    </div>
  );
}
