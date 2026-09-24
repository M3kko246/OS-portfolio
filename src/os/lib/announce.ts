/**
 * One polite live region for the whole system: window opened and closed, proximity prompts in the
 * game. The region clears itself so the same message can be announced twice in a row.
 */
let region: HTMLElement | null = null;
let timer: number | undefined;

export function registerAnnouncer(element: HTMLElement | null): void {
  region = element;
}

export function announce(message: string): void {
  if (!region) return;
  const target = region;
  window.clearTimeout(timer);
  target.textContent = '';
  timer = window.setTimeout(() => {
    target.textContent = message;
  }, 60);
}
