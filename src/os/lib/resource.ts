import { useEffect, useState } from 'react';

export type Resource<T> =
  { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; data: T };

const cache = new Map<string, unknown>();

/**
 * JSON from the static data endpoints, cached for the session. Every app that loads data shows
 * the three states: a skeleton while loading, an explained error with Riprova, the content.
 */
export function useResource<T>(url: string): Resource<T> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ url: string; resource: Resource<T> }>(() => ({
    url,
    resource: cache.has(url)
      ? { status: 'ready', data: cache.get(url) as T }
      : { status: 'loading' },
  }));

  // A new URL starts from its cached value or from loading, during render (no effect round trip).
  if (state.url !== url) {
    setState({
      url,
      resource: cache.has(url)
        ? { status: 'ready', data: cache.get(url) as T }
        : { status: 'loading' },
    });
  }

  useEffect(() => {
    if (cache.has(url)) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<T>;
      })
      .then((data) => {
        cache.set(url, data);
        setState({ url, resource: { status: 'ready', data } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn(`Could not load ${url}`, error);
        setState({
          url,
          resource: {
            status: 'error',
            retry: () => {
              setState({ url, resource: { status: 'loading' } });
              setAttempt((n) => n + 1);
            },
          },
        });
      });
    return () => {
      controller.abort();
    };
  }, [url, attempt]);

  return state.url === url ? state.resource : { status: 'loading' };
}
