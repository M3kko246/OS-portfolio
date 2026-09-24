import { useEffect } from 'react';
import { settingsStore } from '@/os/kernel/settings';
import { sessionFlag, setSessionFlag } from '@/os/kernel/storage';
import { t } from '@/i18n';
import { reducedMotionNow, STEP_MS } from '@/os/lib/motion';

/** First boot of the session stays at most this long after navigation start. */
const FIRST_BOOT_MS = 1200;

/**
 * Takes over the static boot screen rendered by index.astro: adds the last diagnostic line once
 * the desktop is really there, then fades out in steps. Any key, click or touch skips it; later
 * visits in the same tab only get the short fade; reduced motion gets no sequence at all.
 */
export function Boot({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const boot = document.getElementById('boot');
    if (!boot) {
      onDone();
      return;
    }
    const again = sessionFlag('os:booted');
    setSessionFlag('os:booted');
    const reduced = reducedMotionNow();

    const line = document.createElement('li');
    line.textContent = t('boot.starting', {}, settingsStore.getState().lang);
    document.getElementById('boot-log')?.append(line);

    let done = false;
    const hide = () => {
      // Keyboard users who tabbed into the boot screen land on the same link in the desktop.
      const hadFocus = boot.contains(document.activeElement);
      boot.hidden = true;
      if (hadFocus) document.querySelector<HTMLElement>('.os .skip-link')?.focus();
      onDone();
    };
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', skip, true);
      window.removeEventListener('pointerdown', skip, true);
      if (reduced) {
        hide();
        return;
      }
      const fade = boot.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: STEP_MS * 7,
        easing: 'steps(7, end)',
        fill: 'forwards',
      });
      void fade.finished.then(hide);
    };
    // Links on the boot screen (CV, contact, classic version) keep working.
    const skip = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('a')) return;
      finish();
    };
    window.addEventListener('keydown', skip, true);
    window.addEventListener('pointerdown', skip, true);
    const wait = reduced || again ? 0 : Math.max(0, FIRST_BOOT_MS - performance.now());
    const timer = window.setTimeout(finish, wait);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', skip, true);
      window.removeEventListener('pointerdown', skip, true);
    };
  }, [onDone]);
  return null;
}
