import { Component, Suspense, useState, type ReactNode } from 'react';
import { appComponents, manifests } from '@/os/apps/registry';
import { openApp } from '@/os/kernel/launcher';
import type { WindowState } from '@/os/kernel/windows';
import { useT } from '@/os/lib/i18n';
import { Skeleton } from '@/os/ui/Skeleton';

interface BoundaryProps {
  children: ReactNode;
  message: string;
  reopen: string;
  report: string;
  onReopen: () => void;
  onReport: (error: Error) => void;
}

/** Keeps a crashing app inside its window; the rest of the system keeps working. */
class AppErrorBoundary extends Component<BoundaryProps, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="app-error" role="alert">
        <p className="text-read">{this.props.message}</p>
        <p className="flex flex-wrap gap-8">
          <button type="button" className="px-btn px-btn-primary" onClick={this.props.onReopen}>
            {this.props.reopen}
          </button>
          <button
            type="button"
            className="px-btn"
            onClick={() => {
              this.props.onReport(error);
            }}
          >
            {this.props.report}
          </button>
        </p>
      </div>
    );
  }
}

export function AppFrame({ win }: { win: WindowState }) {
  const t = useT();
  const [attempt, setAttempt] = useState(0);
  const App = appComponents[win.appId];
  return (
    <AppErrorBoundary
      key={attempt}
      message={t('appError.message')}
      reopen={t('appError.reopen')}
      report={t('appError.report')}
      onReopen={() => {
        setAttempt((n) => n + 1);
      }}
      onReport={(error) => {
        openApp('mail', {
          subject: `${t('appError.report')}: ${win.title}`,
          body: `${error.name}: ${error.message}`,
        });
      }}
    >
      <Suspense
        fallback={
          <Skeleton
            shape={manifests[win.appId].skeleton}
            label={t('app.loading', { title: win.title })}
          />
        }
      >
        <App windowId={win.id} params={win.params} />
      </Suspense>
    </AppErrorBoundary>
  );
}
